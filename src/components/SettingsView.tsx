import React, { useState, useEffect } from 'react';
import {
  Settings,
  ShieldCheck,
  Cpu,
  Database,
  Radio,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  Globe,
  Info,
  Lock,
  ExternalLink
} from 'lucide-react';
import { SystemSettings } from '../types';

export const SettingsView: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/settings')
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
          <Settings className="w-3.5 h-3.5" />
          <span>System & Architecture</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Settings & Environment Status
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Diagnostics, persistent SQLite database status, model configuration, and classroom recording privacy compliance.
        </p>
      </div>

      {/* Grid of Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: AI Provider Status */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>AI & Model Services</span>
            </h3>
            {settings?.geminiKeyConfigured ? (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Active
              </span>
            ) : (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-rose-400" />
                Unconfigured
              </span>
            )}
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Speech-to-Text Model:</span>
              <strong className="text-slate-200">Gemini 3.5 Transcribe</strong>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Notes & Reasoning Model:</span>
              <strong className="text-slate-200">Gemini 3.8 Flash</strong>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">API Key Injection:</span>
              <span className="text-emerald-400 font-mono">Server-Side Protected</span>
            </div>
          </div>
        </div>

        {/* Card 2: Storage Status */}
        <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Persistent Storage Engine</span>
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
              SQLite 3
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Database Engine:</span>
              <strong className="text-slate-200">{settings?.storageType || 'SQLite'}</strong>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">File Location:</span>
              <span className="text-slate-300 font-mono">{settings?.storageLocation || 'data/lectra.sqlite'}</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-400">Stored Audio Recordings:</span>
              <strong className="text-slate-200">{settings?.totalAudioRecordings || 0} files</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Formats & Languages */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <FileAudio className="w-4 h-4 text-violet-400" />
          <span>Supported Audio Capabilities</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-2">
            <p className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
              Audio File Encodings:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {settings?.supportedAudioFormats.map((fmt) => (
                <span
                  key={fmt}
                  className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 font-mono text-slate-300"
                >
                  .{fmt.toLowerCase()}
                </span>
              ))}
            </div>
            <p className="text-slate-400 text-[11px] pt-1">
              Max recording duration: ~60 minutes per session.
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
              Supported Spoken Languages:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {settings?.supportedLanguages.map((lang) => (
                <span
                  key={lang.code}
                  className="px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium"
                >
                  {lang.name}
                </span>
              ))}
            </div>
            <p className="text-slate-400 text-[11px] pt-1">
              Optimized for technical STEM jargon and bilingual Hinglish classroom dialogue.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy, Ethics & Responsible Classroom Recording Policy */}
      <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <span>Privacy & Responsible Classroom Recording Notice</span>
        </div>
        <div className="text-xs text-slate-300 leading-relaxed space-y-2">
          <p>
            <strong>Instructor & Institutional Consent:</strong> Lectra is designed to record academic lectures and instructional discussions. Users must obtain explicit consent from the course professor, guest speakers, and their academic institution before initiating any audio recording.
          </p>
          <p>
            <strong>Data Security & Third-Party AI Processing:</strong> Recorded lecture audio and transcribed text are processed through Google's Gemini API endpoints strictly for generating learning materials. No audio is uploaded automatically without direct user confirmation.
          </p>
          <p>
            <strong>Prototype Scope:</strong> This application is a collegiate portfolio prototype. The student view acts as an open local classroom demonstration and should not be used as a legally binding access-control or grading system without enterprise authentication.
          </p>
        </div>
      </div>

      {/* Hardware Roadmap Section */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/20 space-y-3">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white">
            Future Hardware Vision: The Lectra Wearable Mic
          </h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          The long-term vision of Lectra is a physical, lightweight wearable microphone that a professor clips to their lapel. It features directional beamforming noise suppression to isolate the instructor's voice from ambient classroom reverberation, long battery life, and automatic low-latency WiFi/Bluetooth upload to Lectra's processing pipeline.
        </p>
      </div>
    </div>
  );
};
