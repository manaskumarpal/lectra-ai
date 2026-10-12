import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Pause,
  Play,
  RotateCcw,
  Upload,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  FileAudio,
  Radio,
  Trash2,
  ArrowRight,
  Info
} from 'lucide-react';
import { formatDuration } from '../utils/exportUtils';

interface RecordLectureProps {
  onLectureCreated: (lectureId: string) => void;
}

export const RecordLecture: React.FC<RecordLectureProps> = ({ onLectureCreated }) => {
  // Form fields
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherName, setTeacherName] = useState('');
  const [language, setLanguage] = useState('auto');
  const [activeSource, setActiveSource] = useState<'mic' | 'upload'>('mic');

  // Microphone recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micError, setMicError] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Uploaded file state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedAudioUrl, setUploadedAudioUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Processing pipeline
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Audio refs & Canvas visualizer
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Visualizer loop
  const drawWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.9;

        // Gradient color: violet to cyan
        const gradient = ctx.createLinearGradient(0, canvas.height - barHeight, 0, canvas.height);
        gradient.addColorStop(0, '#06B6D4'); // cyan
        gradient.addColorStop(0.5, '#6366F1'); // indigo
        gradient.addColorStop(1, '#8B5CF6'); // violet

        ctx.fillStyle = gradient;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight);

        x += barWidth + 1;
        if (x > canvas.width) break;
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();
  };

  // Start Mic Recording
  const startRecording = async () => {
    setMicError(null);
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    audioChunksRef.current = [];
    setRecordingSeconds(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });

      streamRef.current = stream;

      // AudioContext for visualizer
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;

      drawWaveform();

      // MediaRecorder
      let mimeType = 'audio/webm;codecs=opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'audio/webm';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = ''; // fallback default
        }
      }

      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || 'audio/webm',
        });
        setRecordedBlob(finalBlob);
        const url = URL.createObjectURL(finalBlob);
        setRecordedAudioUrl(url);

        if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start(1000); // chunk every 1s
      setIsRecording(true);
      setIsPaused(false);
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Microphone permission was denied by your browser. Please allow microphone permissions in browser site settings, or use the "Upload Audio File" option.');
      } else {
        setMicError(`Unable to start microphone recording: ${err.message || 'Device error'}. You can upload an audio file instead.`);
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isPaused) {
      mediaRecorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isPaused) {
      mediaRecorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  const resetRecording = () => {
    if (isRecording) {
      stopRecording();
    }
    setRecordedBlob(null);
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
    setMicError(null);
  };

  // Upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate format
    const validExtensions = ['.wav', '.mp3', '.m4a', '.webm', '.ogg', '.aac'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext)) || file.type.startsWith('audio/');

    if (!isValid) {
      setUploadError('Unsupported audio format. Please upload a WAV, MP3, M4A, WEBM, or OGG file.');
      return;
    }

    // Max 100MB check
    if (file.size > 100 * 1024 * 1024) {
      setUploadError('Audio file exceeds 100MB limit. For longer lectures, please compress to MP3 or M4A.');
      return;
    }

    setUploadedFile(file);
    const url = URL.createObjectURL(file);
    setUploadedAudioUrl(url);

    // Auto-fill title if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }
  };

  // Convert Blob/File to Base64
  const fileToBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  // Save & Process Pipeline
  const handleSaveAndProcess = async () => {
    if (!title.trim()) {
      alert('Please enter a lecture title.');
      return;
    }
    if (!subject.trim()) {
      alert('Please enter a subject name (e.g. Physics, History, AI).');
      return;
    }

    const activeBlob = activeSource === 'mic' ? recordedBlob : uploadedFile;
    if (!activeBlob) {
      alert('No audio recording or uploaded file found.');
      return;
    }

    setIsProcessing(true);
    setProcessingError(null);

    try {
      // Step 1: Validating & Converting audio
      setProcessingStage('Step 1/3: Encoding audio for secure persistent storage...');
      const audioBase64 = await fileToBase64(activeBlob);
      const mimeType = activeBlob.type || (activeSource === 'mic' ? 'audio/webm' : 'audio/mp3');
      const duration = activeSource === 'mic' ? recordingSeconds : 0;

      // Step 2: Saving Lecture to SQLite Database
      setProcessingStage('Step 2/3: Creating lecture entry in SQLite database...');
      const createRes = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subject: subject.trim(),
          teacher_name: (teacherName || 'Instructor').trim(),
          duration_seconds: duration,
          audio_base64: audioBase64,
          audio_mime: mimeType,
          lecture_date: new Date().toISOString().split('T')[0],
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        throw new Error(err.error || 'Failed to create lecture record.');
      }

      const createdLecture = await createRes.json();

      // Step 3: Triggering Speech-to-Text Transcription via Gemini
      setProcessingStage('Step 3/3: Transcribing lecture audio using Gemini STT...');
      const transcribeRes = await fetch(`/api/lectures/${createdLecture.id}/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          custom_audio_base64: audioBase64,
          audio_mime: mimeType,
        }),
      });

      if (!transcribeRes.ok) {
        const err = await transcribeRes.json();
        throw new Error(err.error || 'Transcription failed.');
      }

      // Navigate to Transcript Review / Notes Editor
      onLectureCreated(createdLecture.id);
    } catch (err: any) {
      console.error('Processing error:', err);
      setProcessingError(err.message || 'Processing failed.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Lecture Studio</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Record or Upload Lecture
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Capture classroom audio through your device microphone or upload existing recordings for AI transcription and notes generation.
        </p>
      </div>

      {/* Main Card */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-xl">
        {/* Form Inputs: Metadata */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Lecture Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chapter 4: Thermodynamics and Entropy"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              disabled={isRecording || isProcessing}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Subject Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Physics, Neuroscience, Calculus"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              disabled={isRecording || isProcessing}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Instructor / Teacher Name
            </label>
            <input
              type="text"
              value={teacherName}
              onChange={(e) => setTeacherName(e.target.value)}
              placeholder="e.g. Dr. Robert Langdon"
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              disabled={isRecording || isProcessing}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Primary Spoken Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500 transition-colors text-sm"
              disabled={isRecording || isProcessing}
            >
              <option value="auto">Auto-Detect Language</option>
              <option value="English">English</option>
              <option value="Hindi">Hindi</option>
              <option value="Hinglish">Hinglish (Mixed Hindi + English)</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Audio Source
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveSource('mic')}
                disabled={isRecording || isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all border ${
                  activeSource === 'mic'
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>Microphone</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSource('upload')}
                disabled={isRecording || isProcessing}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs font-bold transition-all border ${
                  activeSource === 'upload'
                    ? 'bg-cyan-600/20 text-cyan-300 border-cyan-500/50 shadow-md'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload File</span>
              </button>
            </div>
          </div>
        </div>

        {/* SOURCE 1: MICROPHONE RECORDING INTERFACE */}
        {activeSource === 'mic' && (
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-rose-400" />
                Live Microphone Capture
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Duration: <strong className="text-white">{formatDuration(recordingSeconds)}</strong>
              </span>
            </div>

            {/* Visualizer Canvas & Status Box */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden flex flex-col items-center justify-center p-6 min-h-[160px]">
              <canvas
                ref={canvasRef}
                width={500}
                height={90}
                className={`w-full max-w-md h-20 transition-opacity ${
                  isRecording && !isPaused ? 'opacity-100' : 'opacity-20'
                }`}
              />

              {!isRecording && !recordedBlob && (
                <div className="text-center space-y-1">
                  <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-2">
                    <Mic className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-300">
                    Ready to Record
                  </p>
                  <p className="text-xs text-slate-400">
                    Supports up to 60-minute uninterrupted classroom lectures
                  </p>
                </div>
              )}

              {isRecording && (
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-record-pulse" />
                  <span className="text-xs font-bold text-rose-400 tracking-wider uppercase">
                    {isPaused ? 'Paused' : 'Recording Live'}
                  </span>
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {!isRecording && !recordedBlob && (
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isProcessing}
                  className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-bold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-105 active:scale-95"
                >
                  <Mic className="w-4 h-4" />
                  <span>Start Recording</span>
                </button>
              )}

              {isRecording && (
                <>
                  {!isPaused ? (
                    <button
                      type="button"
                      onClick={pauseRecording}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all"
                    >
                      <Pause className="w-4 h-4 text-amber-400" />
                      <span>Pause</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={resumeRecording}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                    >
                      <Play className="w-4 h-4" />
                      <span>Resume</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={stopRecording}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Stop Recording</span>
                  </button>
                </>
              )}

              {recordedBlob && !isRecording && (
                <div className="w-full space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">
                          Recording Completed
                        </p>
                        <p className="text-xs text-slate-400">
                          Duration: {formatDuration(recordingSeconds)} • Size: {(recordedBlob.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    {recordedAudioUrl && (
                      <audio controls src={recordedAudioUrl} className="h-9 w-full sm:w-64" />
                    )}

                    <button
                      type="button"
                      onClick={resetRecording}
                      className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete & Re-record</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mic Permission / Device Error */}
            {micError && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold">Microphone Access Error</p>
                  <p className="text-rose-300 leading-relaxed">{micError}</p>
                  <button
                    type="button"
                    onClick={() => setActiveSource('upload')}
                    className="underline font-semibold hover:text-white pt-1 block"
                  >
                    Switch to Audio File Upload →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SOURCE 2: AUDIO FILE UPLOAD */}
        {activeSource === 'upload' && (
          <div className="space-y-4 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                Upload Lecture Audio File
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Formats: WAV, MP3, M4A, WEBM, OGG (Max 100MB)
              </span>
            </div>

            <label className="relative border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-950/50 hover:bg-slate-950 transition-all group">
              <input
                type="file"
                accept="audio/*,.wav,.mp3,.m4a,.webm,.ogg,.aac"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-3">
                <FileAudio className="w-7 h-7 text-cyan-400" />
              </div>
              <p className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                {uploadedFile ? uploadedFile.name : 'Click to select or drag audio file here'}
              </p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports real university and classroom lecture audio files.
              </p>
            </label>

            {uploadedFile && uploadedAudioUrl && (
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white truncate max-w-xs">
                      {uploadedFile.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      Size: {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <audio controls src={uploadedAudioUrl} className="h-9 w-full sm:w-64" />

                <button
                  type="button"
                  onClick={() => {
                    setUploadedFile(null);
                    setUploadedAudioUrl(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 font-semibold"
                >
                  Remove
                </button>
              </div>
            )}

            {uploadError && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 flex items-start gap-3 text-rose-200 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p>{uploadError}</p>
              </div>
            )}
          </div>
        )}

        {/* PROCESSING PROGRESS & PIPELINE */}
        {isProcessing && (
          <div className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                <span>Processing Pipeline Active</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">Please keep tab open</span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-violet-500 h-2 rounded-full w-3/4 animate-pulse" />
            </div>
            <p className="text-xs text-slate-300 font-mono">
              {processingStage}
            </p>
          </div>
        )}

        {/* Processing Error Notice */}
        {processingError && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/40 space-y-2 text-rose-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-rose-300">
              <AlertCircle className="w-4 h-4" />
              <span>Pipeline Error</span>
            </div>
            <p className="leading-relaxed">{processingError}</p>
          </div>
        )}

        {/* Action Button: Save & Transcribe */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-4 h-4 text-slate-400" />
            <span>Audio is saved locally in SQLite storage</span>
          </div>

          <button
            type="button"
            onClick={handleSaveAndProcess}
            disabled={
              isProcessing ||
              isRecording ||
              (activeSource === 'mic' ? !recordedBlob : !uploadedFile)
            }
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-cyan-300" />
            <span>Save & Transcribe Audio</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
