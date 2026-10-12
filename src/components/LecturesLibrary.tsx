import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  BookOpen,
  Sparkles,
  Clock,
  Calendar,
  User,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  FileText,
  Music,
  Plus,
  Radio
} from 'lucide-react';
import { Lecture } from '../types';
import { formatDuration } from '../utils/exportUtils';

interface LecturesLibraryProps {
  onSelectLecture: (lectureId: string) => void;
  onNavigateToRecord: () => void;
  onRefreshStats: () => void;
}

export const LecturesLibrary: React.FC<LecturesLibraryProps> = ({
  onSelectLecture,
  onNavigateToRecord,
  onRefreshStats,
}) => {
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration'>('newest');

  // Edit metadata modal
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editTeacher, setEditTeacher] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Delete modal
  const [lectureToDelete, setLectureToDelete] = useState<Lecture | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (sortBy) params.append('sort', sortBy);

      const res = await fetch(`/api/lectures?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch lectures');
      const data = await res.json();
      setLectures(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLectures();
  }, [searchQuery, selectedSubject, selectedStatus, sortBy]);

  // Unique subjects
  const subjects = Array.from(new Set(lectures.map((l) => l.subject).filter(Boolean)));

  // Save metadata
  const handleSaveMetadata = async () => {
    if (!editingLecture) return;
    try {
      setIsUpdating(true);
      const res = await fetch(`/api/lectures/${editingLecture.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          subject: editSubject.trim(),
          teacher_name: editTeacher.trim(),
        }),
      });
      if (!res.ok) throw new Error('Failed to update lecture.');
      setEditingLecture(null);
      fetchLectures();
      onRefreshStats();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete lecture
  const handleDeleteLecture = async () => {
    if (!lectureToDelete) return;
    try {
      setIsDeleting(true);
      const res = await fetch(`/api/lectures/${lectureToDelete.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete lecture.');
      setLectureToDelete(null);
      fetchLectures();
      onRefreshStats();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Lecture Archive</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Lectures Library
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Search, manage, review, and export all recorded and processed classroom sessions.
          </p>
        </div>

        <button
          onClick={onNavigateToRecord}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-md shadow-indigo-600/30 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Lecture</span>
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by title, subject, or professor..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Subject Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-44"
          >
            <option value="all">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub} value={sub}>
                {sub}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-44"
          >
            <option value="all">All Statuses</option>
            <option value="approved">Approved for Students</option>
            <option value="awaiting_review">Awaiting Review</option>
            <option value="transcript_ready">Transcript Ready</option>
            <option value="draft">Draft</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 w-full md:w-36"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="duration">Longest First</option>
          </select>
        </div>
      </div>

      {/* Lectures Grid / List */}
      {loading ? (
        <div className="py-20 text-center space-y-2">
          <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
          <p className="text-slate-400 text-xs">Loading lecture library...</p>
        </div>
      ) : lectures.length === 0 ? (
        <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white">No Lectures Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery || selectedSubject !== 'all' || selectedStatus !== 'all'
              ? 'Try modifying your search or filter criteria.'
              : 'Record or upload your first lecture to start building your library.'}
          </p>
          <button
            onClick={onNavigateToRecord}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md"
          >
            Record Lecture
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lectures.map((lec) => {
            const isApproved = lec.approval_status === 'approved';
            const isAwaiting = lec.approval_status === 'awaiting_review';
            const hasNotes = !!lec.has_notes;

            return (
              <div
                key={lec.id}
                className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/30 transition-all flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {lec.subject}
                    </span>

                    {isApproved ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Approved
                      </span>
                    ) : isAwaiting ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3 text-amber-400" />
                        Review Pending
                      </span>
                    ) : hasNotes ? (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                        Notes Ready
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        Transcript Only
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-2">
                    {lec.title}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {lec.teacher_name}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDuration(lec.duration_seconds)}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {lec.lecture_date}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingLecture(lec);
                        setEditTitle(lec.title);
                        setEditSubject(lec.subject);
                        setEditTeacher(lec.teacher_name);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Edit Metadata"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setLectureToDelete(lec)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                      title="Delete Lecture"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => onSelectLecture(lec.id)}
                    className="px-4 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-bold border border-indigo-500/30 transition-all flex items-center gap-1.5 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{hasNotes ? 'Open Notes & Studio' : 'Open Transcript'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* EDIT METADATA MODAL */}
      {editingLecture && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Edit Lecture Metadata</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  value={editSubject}
                  onChange={(e) => setEditSubject(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Instructor Name
                </label>
                <input
                  type="text"
                  value={editTeacher}
                  onChange={(e) => setEditTeacher(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setEditingLecture(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMetadata}
                disabled={isUpdating}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
              >
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {lectureToDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-rose-500/30 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-rose-300">
              Confirm Delete Lecture
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete <strong>"{lectureToDelete.title}"</strong>? This will permanently remove its audio recording, transcript, and all AI-generated notes from local SQLite storage.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setLectureToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteLecture}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
