import React from 'react';
import {
  Mic,
  Upload,
  BookOpen,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  GraduationCap
} from 'lucide-react';
import { DashboardStats, Lecture } from '../types';
import { formatDuration } from '../utils/exportUtils';

interface DashboardProps {
  stats: DashboardStats;
  recentLectures: Lecture[];
  onNavigate: (tab: string, lectureId?: string) => void;
  onSeedDemo: () => void;
  loading: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  stats,
  recentLectures,
  onNavigate,
  onSeedDemo,
  loading,
}) => {
  const formatHours = (seconds: number) => {
    if (!seconds) return '0h 0m';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Hero Welcome & Quick Action Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-[#0F172A] border border-indigo-500/20 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-72 h-72 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>AI-Powered Classroom Intelligence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              One lecture recording → Structured transcript → Organised notes.
            </h1>
            <p className="text-slate-400 text-sm sm:text-base mt-2 leading-relaxed">
              Capture or upload college lectures, transcribe speech accurately, and generate high-yield study guides, topic summaries, questions, and student study portals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate('record')}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-semibold text-sm shadow-xl shadow-rose-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>Record Lecture</span>
            </button>
            <button
              onClick={() => onNavigate('record')}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white font-semibold text-sm border border-slate-700 transition-all shadow-md"
            >
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Upload Audio</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Real Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Lectures */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Lectures
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalLectures}
            </span>
            <span className="text-xs text-slate-400 font-medium">saved in SQLite</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            <span>Persistent local storage</span>
          </div>
        </div>

        {/* Card 2: Total Duration */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-violet-500/30 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Audio Captured
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {formatHours(stats.totalDurationSeconds)}
            </span>
            <span className="text-xs text-slate-400 font-medium">
              ({formatDuration(stats.totalDurationSeconds)})
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
            <span>Supports up to 60-min sessions</span>
          </div>
        </div>

        {/* Card 3: Notes Generated */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/30 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              AI Notes Generated
            </span>
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.totalNotesGenerated}
            </span>
            <span className="text-xs text-slate-400 font-medium">comprehensive guides</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Structured & topic breakdown</span>
          </div>
        </div>

        {/* Card 4: Awaiting Review */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/30 transition-all shadow-md group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Awaiting Review
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">
              {stats.awaitingReviewCount}
            </span>
            <span className="text-xs text-slate-400 font-medium">lectures</span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
            <span>Teacher approval required</span>
          </div>
        </div>
      </div>

      {/* Empty State Onboarding if no lectures yet */}
      {stats.totalLectures === 0 && !loading && (
        <div className="p-8 rounded-3xl bg-gradient-to-b from-slate-900/90 to-slate-950 border border-indigo-500/20 text-center max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mx-auto">
            <Mic className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">
            Welcome to Lectra! Your Library is Empty
          </h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Record a lecture using your microphone, upload an audio file, or seed a sample lecture on Computational Neuroscience to test the AI note generation engine immediately.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('record')}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-indigo-600/25"
            >
              Start Recording
            </button>
            <button
              onClick={onSeedDemo}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 font-medium text-sm border border-indigo-500/30 transition-all"
            >
              Load Sample Lecture & Notes
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Recent Lectures & Activity */}
      {stats.totalLectures > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Recent Lectures (Span 2) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Lectures</h2>
                <p className="text-xs text-slate-400">
                  Latest recorded and uploaded lectures
                </p>
              </div>
              <button
                onClick={() => onNavigate('lectures')}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
              >
                <span>View Library ({stats.totalLectures})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {recentLectures.slice(0, 5).map((lec) => {
                const isApproved = lec.approval_status === 'approved';
                const isAwaiting = lec.approval_status === 'awaiting_review';
                const hasTranscript = !!lec.transcript;

                return (
                  <div
                    key={lec.id}
                    className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-900/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1 max-w-md">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          {lec.subject}
                        </span>
                        {isApproved ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Approved for Students
                          </span>
                        ) : isAwaiting ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Awaiting Teacher Review
                          </span>
                        ) : hasTranscript ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/20">
                            Transcript Ready
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Draft
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                        {lec.title}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span>{lec.teacher_name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {lec.lecture_date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDuration(lec.duration_seconds)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      {lec.has_notes ? (
                        <button
                          onClick={() => onNavigate('notes', lec.id)}
                          className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold border border-indigo-500/30 transition-all flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Open Notes</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onNavigate('notes', lec.id)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Transcript</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Workflow Steps & Quick Access */}
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white">Lecture Lifecycle</h2>
              <p className="text-xs text-slate-400">
                End-to-end pedagogical process
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 text-xs font-bold">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Audio Capture
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Record live via built-in microphone (up to 60m) or upload MP3/WAV/M4A.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 text-xs font-bold">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Accurate Transcription
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Gemini 3.5 transcribe converts audio into timestamped paragraphs.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center shrink-0 text-xs font-bold">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    AI Note Synthesis
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Generates 11 structured learning assets (MCQs, formulas, revision points).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold">
                  4
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-200">
                    Teacher Review & Publishing
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Review and approve notes to make them instantly accessible in Student View.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => onNavigate('student')}
                  className="w-full py-2.5 px-3 rounded-xl bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-300 font-semibold text-xs border border-cyan-500/30 transition-all flex items-center justify-center gap-1.5"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Launch Student Portal ({stats.approvedCount} Approved)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
