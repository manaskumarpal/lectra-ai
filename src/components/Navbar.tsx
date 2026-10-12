import React from 'react';
import { Mic, GraduationCap, Sparkles, Radio, Cpu, Layers } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  awaitingReviewCount: number;
  onOpenWearableModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  awaitingReviewCount,
  onOpenWearableModal,
}) => {
  const isStudent = currentTab === 'student';

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-indigo-950/60 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className="flex items-center gap-2.5 text-left group transition-all"
          >
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-cyan-400 p-[1.5px] shadow-lg shadow-indigo-600/20 group-hover:shadow-indigo-500/40 transition-shadow">
              <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-indigo-400 group-hover:text-cyan-300 transition-colors" />
              </div>
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  Lectra
                </span>
                <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  AI v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Every Lecture. Clearly Understood.
              </p>
            </div>
          </button>
        </div>

        {/* Center / Right actions */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Wearable Mic Concept Badge */}
          <button
            onClick={onOpenWearableModal}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/50 border border-indigo-500/20 text-xs font-medium text-indigo-300 hover:text-white transition-all shadow-sm"
            title="Preview Lectra Wearable Hardware Concept"
          >
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            <span>Wearable Mic</span>
            <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1 rounded font-mono">ROADMAP</span>
          </button>

          {/* Teacher / Student Mode Toggle Pill */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isStudent
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Teacher Studio</span>
              {awaitingReviewCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-black font-bold text-[10px] rounded-full">
                  {awaitingReviewCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setCurrentTab('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                isStudent
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Student View</span>
            </button>
          </div>

          {/* Record Quick Action */}
          <button
            onClick={() => setCurrentTab('record')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white font-medium text-xs sm:text-sm shadow-md shadow-rose-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Mic className="w-4 h-4 animate-pulse" />
            <span className="hidden sm:inline">Record Lecture</span>
            <span className="sm:hidden">Record</span>
          </button>
        </div>
      </div>
    </header>
  );
};
