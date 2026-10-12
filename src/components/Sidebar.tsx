import React from 'react';
import {
  LayoutDashboard,
  Mic,
  BookOpen,
  Sparkles,
  GraduationCap,
  Settings,
  Cpu,
  ShieldCheck,
  FileText
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  awaitingReviewCount: number;
  approvedCount: number;
  selectedLectureId: string | null;
  onOpenWearableModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  awaitingReviewCount,
  approvedCount,
  selectedLectureId,
  onOpenWearableModal,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'record',
      label: 'Record Lecture',
      icon: Mic,
      badge: null,
      highlight: true,
    },
    {
      id: 'lectures',
      label: 'My Lectures',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'notes',
      label: 'AI Notes Studio',
      icon: Sparkles,
      badge: awaitingReviewCount > 0 ? `${awaitingReviewCount} review` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      disabled: !selectedLectureId,
      subtext: selectedLectureId ? 'Active Lecture' : 'Select a lecture',
    },
    {
      id: 'student',
      label: 'Student View',
      icon: GraduationCap,
      badge: approvedCount > 0 ? `${approvedCount} approved` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'settings',
      label: 'Settings & Status',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#0B0F19]/95 border-r border-indigo-950/40 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-65px)]">
      {/* Navigation Links */}
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase mb-2">
            Workspace
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (!item.disabled) {
                      setCurrentTab(item.id);
                    }
                  }}
                  disabled={item.disabled}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-indigo-600/90 to-violet-600/90 text-white shadow-lg shadow-indigo-600/20'
                      : item.disabled
                      ? 'text-slate-600 cursor-not-allowed'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${
                        isActive
                          ? 'text-white'
                          : item.highlight
                          ? 'text-rose-400'
                          : 'text-slate-400 group-hover:text-white'
                      }`}
                    />
                    <div className="text-left">
                      <span>{item.label}</span>
                      {item.subtext && (
                        <p className="text-[10px] text-slate-400 leading-tight">
                          {item.subtext}
                        </p>
                      )}
                    </div>
                  </div>

                  {item.badge && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Future Hardware Teaser Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-purple-950/40 border border-indigo-500/20 relative overflow-hidden">
          <div className="flex items-center gap-2 mb-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">
              Lectra Wearable Mic
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed mb-2.5">
            Future collar-clip microphone with directional beamforming & direct cloud sync.
          </p>
          <button
            onClick={onOpenWearableModal}
            className="w-full text-center py-1.5 px-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 hover:text-white rounded-lg text-xs font-medium border border-indigo-500/30 transition-all"
          >
            Explore Hardware Vision →
          </button>
        </div>
      </div>

      {/* Footer Info & Privacy Tag */}
      <div className="pt-4 border-t border-indigo-950/40 space-y-2">
        <div className="flex items-center gap-2 px-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Local SQLite Persistence & Grounded AI</span>
        </div>
        <p className="px-2 text-[10px] text-slate-400">
          Lectra Educational AI • Version 1.0
        </p>
      </div>
    </aside>
  );
};
