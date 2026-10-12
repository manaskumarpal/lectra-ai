import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { RecordLecture } from './components/RecordLecture';
import { LecturesLibrary } from './components/LecturesLibrary';
import { NotesEditor } from './components/NotesEditor';
import { StudentView } from './components/StudentView';
import { SettingsView } from './components/SettingsView';
import { WearableDeviceModal } from './components/WearableDeviceModal';
import { DashboardStats, Lecture } from './types';
import {
  LayoutDashboard,
  Mic,
  BookOpen,
  Sparkles,
  GraduationCap,
  Settings as SettingsIcon
} from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedLectureId, setSelectedLectureId] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalLectures: 0,
    totalDurationSeconds: 0,
    totalNotesGenerated: 0,
    awaitingReviewCount: 0,
    approvedCount: 0,
  });
  const [recentLectures, setRecentLectures] = useState<Lecture[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isWearableModalOpen, setIsWearableModalOpen] = useState(false);

  const fetchStatsAndRecent = async () => {
    try {
      setLoadingStats(true);
      const [statsRes, lecturesRes] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/lectures?sort=newest'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (lecturesRes.ok) {
        const lecturesData = await lecturesRes.json();
        setRecentLectures(lecturesData);
        // If no lecture currently selected and lectures exist, select the first one for notes view
        if (!selectedLectureId && lecturesData.length > 0) {
          setSelectedLectureId(lecturesData[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStatsAndRecent();
  }, []);

  // When a lecture is selected from Dashboard or Library
  const handleSelectLecture = (lectureId: string) => {
    setSelectedLectureId(lectureId);
    setCurrentTab('notes');
  };

  // When a lecture is newly created and transcribed
  const handleLectureCreated = (lectureId: string) => {
    setSelectedLectureId(lectureId);
    setCurrentTab('notes');
    fetchStatsAndRecent();
  };

  // Seed demo lecture if DB is empty
  const handleSeedDemo = async () => {
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (res.ok) {
        await fetchStatsAndRecent();
        setCurrentTab('dashboard');
      }
    } catch (err) {
      console.error('Seed demo error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        awaitingReviewCount={stats.awaitingReviewCount}
        onOpenWearableModal={() => setIsWearableModalOpen(true)}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-[1600px] w-full mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          awaitingReviewCount={stats.awaitingReviewCount}
          approvedCount={stats.approvedCount}
          selectedLectureId={selectedLectureId}
          onOpenWearableModal={() => setIsWearableModalOpen(true)}
        />

        {/* Content Area */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              recentLectures={recentLectures}
              onNavigate={(tab, lectureId) => {
                if (lectureId) setSelectedLectureId(lectureId);
                setCurrentTab(tab);
              }}
              onSeedDemo={handleSeedDemo}
              loading={loadingStats}
            />
          )}

          {currentTab === 'record' && (
            <RecordLecture onLectureCreated={handleLectureCreated} />
          )}

          {currentTab === 'lectures' && (
            <LecturesLibrary
              onSelectLecture={handleSelectLecture}
              onNavigateToRecord={() => setCurrentTab('record')}
              onRefreshStats={fetchStatsAndRecent}
            />
          )}

          {currentTab === 'notes' && selectedLectureId && (
            <NotesEditor
              lectureId={selectedLectureId}
              onNavigateToStudent={() => setCurrentTab('student')}
              onRefreshLecture={fetchStatsAndRecent}
            />
          )}

          {currentTab === 'student' && <StudentView />}

          {currentTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F19]/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around text-xs">
        <button
          onClick={() => setCurrentTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            currentTab === 'dashboard' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </button>

        <button
          onClick={() => setCurrentTab('record')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            currentTab === 'record' ? 'text-rose-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Record</span>
        </button>

        <button
          onClick={() => setCurrentTab('lectures')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            currentTab === 'lectures' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Library</span>
        </button>

        <button
          onClick={() => {
            if (selectedLectureId) setCurrentTab('notes');
          }}
          disabled={!selectedLectureId}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            currentTab === 'notes'
              ? 'text-indigo-400 font-bold'
              : selectedLectureId
              ? 'text-slate-400'
              : 'text-slate-600 opacity-40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Notes</span>
        </button>

        <button
          onClick={() => setCurrentTab('student')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            currentTab === 'student' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Student</span>
        </button>

        <button
          onClick={() => setCurrentTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-2 rounded-lg ${
            currentTab === 'settings' ? 'text-indigo-400 font-bold' : 'text-slate-400'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </div>

      {/* Hardware Concept Modal */}
      <WearableDeviceModal
        isOpen={isWearableModalOpen}
        onClose={() => setIsWearableModalOpen(false)}
      />
    </div>
  );
}
