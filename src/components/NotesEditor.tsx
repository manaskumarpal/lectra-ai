import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  Share2,
  RefreshCw,
  Save,
  GraduationCap,
  BookOpen,
  HelpCircle,
  ListChecks,
  Code,
  Lightbulb,
  Edit3,
  Eye,
  Check,
  ChevronRight,
  Clock,
  User,
  Music,
  ExternalLink,
  Plus,
  Trash2
} from 'lucide-react';
import { Lecture, Notes, TopicWiseNote, MCQ, KeyTerm, QuestionAnswer, FormulaOrExample } from '../types';
import {
  exportMarkdownNotes,
  exportSummaryText,
  exportTranscriptText,
  exportQuestionBankText,
  exportMCQsJSON,
  formatDuration,
} from '../utils/exportUtils';

interface NotesEditorProps {
  lectureId: string;
  onNavigateToStudent: () => void;
  onRefreshLecture: () => void;
}

export const NotesEditor: React.FC<NotesEditorProps> = ({
  lectureId,
  onNavigateToStudent,
  onRefreshLecture,
}) => {
  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [notes, setNotes] = useState<Notes | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active section tab
  const [activeTab, setActiveTab] = useState<string>('summary');

  // Edit mode vs Preview mode
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  const [isApproving, setIsApproving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Editable state buffers
  const [editedTranscript, setEditedTranscript] = useState('');
  const [editedSummary, setEditedSummary] = useState('');
  const [editedDetailedNotes, setEditedDetailedNotes] = useState('');
  const [editedBeginner, setEditedBeginner] = useState('');
  const [editedRevisionPoints, setEditedRevisionPoints] = useState<string[]>([]);
  const [editedTopics, setEditedTopics] = useState<TopicWiseNote[]>([]);
  const [editedQAs, setEditedQAs] = useState<QuestionAnswer[]>([]);
  const [editedMCQs, setEditedMCQs] = useState<MCQ[]>([]);
  const [editedKeyTerms, setEditedKeyTerms] = useState<KeyTerm[]>([]);
  const [editedActionItems, setEditedActionItems] = useState<string[]>([]);
  const [editedFormulas, setEditedFormulas] = useState<FormulaOrExample[]>([]);

  // Regenerate modal state
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [regenSection, setRegenSection] = useState('summary');
  const [customRegenPrompt, setCustomRegenPrompt] = useState('');
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);

  // Fetch lecture + notes
  const fetchLectureData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/lectures/${lectureId}`);
      if (!res.ok) throw new Error('Failed to load lecture details.');
      const data = await res.json();
      setLecture(data.lecture);
      setEditedTranscript(data.lecture.transcript || '');

      if (data.notes) {
        setNotes(data.notes);
        setEditedSummary(data.notes.summary || '');
        setEditedDetailedNotes(data.notes.detailed_notes || '');
        setEditedBeginner(data.notes.beginner_explanation || '');
        setEditedRevisionPoints(data.notes.revision_notes || []);
        setEditedTopics(data.notes.topic_wise_notes || []);
        setEditedQAs(data.notes.question_answers || []);
        setEditedMCQs(data.notes.mcqs || []);
        setEditedKeyTerms(data.notes.key_terms || []);
        setEditedActionItems(data.notes.action_items || []);
        setEditedFormulas(data.notes.formulas_and_examples || []);
      } else {
        setNotes(null);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (lectureId) fetchLectureData();
  }, [lectureId]);

  const showNotification = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  // Generate Notes with Gemini
  const handleGenerateNotes = async () => {
    if (!lecture) return;
    if (!editedTranscript.trim()) {
      alert('Transcript is empty. Please enter or transcribe the lecture first.');
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationStep('Analyzing transcript & extracting topics...');
      
      const res = await fetch(`/api/lectures/${lecture.id}/generate-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transcript: editedTranscript }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate AI notes.');
      }

      await fetchLectureData();
      onRefreshLecture();
      showNotification('AI notes generated successfully! Review below before student approval.');
    } catch (err: any) {
      alert(`Note generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  // Save changes to SQLite
  const handleSaveChanges = async () => {
    if (!lecture) return;
    try {
      setIsSaving(true);
      // Save transcript updates if modified
      if (editedTranscript !== lecture.transcript) {
        await fetch(`/api/lectures/${lecture.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript: editedTranscript }),
        });
      }

      // Save notes if exists
      if (notes) {
        const res = await fetch(`/api/lectures/${lecture.id}/notes`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            summary: editedSummary,
            topic_wise_notes: editedTopics,
            detailed_notes: editedDetailedNotes,
            beginner_explanation: editedBeginner,
            revision_notes: editedRevisionPoints,
            question_answers: editedQAs,
            mcqs: editedMCQs,
            key_terms: editedKeyTerms,
            action_items: editedActionItems,
            formulas_and_examples: editedFormulas,
          }),
        });

        if (!res.ok) throw new Error('Failed to save notes.');
      }

      await fetchLectureData();
      setIsEditing(false);
      showNotification('All edits saved to database successfully.');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Approve / Revoke Notes
  const handleToggleApproval = async () => {
    if (!lecture || !notes) return;
    const isApproved = notes.approval_status === 'approved';
    try {
      setIsApproving(true);
      const endpoint = isApproved ? `/api/lectures/${lecture.id}/unapprove` : `/api/lectures/${lecture.id}/approve`;
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to change approval status.');

      await fetchLectureData();
      onRefreshLecture();
      showNotification(
        isApproved
          ? 'Lecture marked as Awaiting Review (hidden from students).'
          : 'Lecture approved! Now live in the Student View.'
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsApproving(false);
    }
  };

  // Regenerate Section
  const handleRegenerateSectionSubmit = async () => {
    if (!lecture) return;
    try {
      setIsRegeneratingSection(true);
      const res = await fetch(`/api/lectures/${lecture.id}/regenerate-section`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sectionName: regenSection,
          customInstructions: customRegenPrompt,
        }),
      });

      if (!res.ok) throw new Error('Failed to regenerate section.');
      const data = await res.json();

      if (regenSection === 'summary') setEditedSummary(data.data || '');
      if (regenSection === 'beginner_explanation') setEditedBeginner(data.data || '');
      if (regenSection === 'revision_notes') setEditedRevisionPoints(data.data || []);
      if (regenSection === 'mcqs') setEditedMCQs(data.data || []);
      if (regenSection === 'key_terms') setEditedKeyTerms(data.data || []);

      setShowRegenModal(false);
      setCustomRegenPrompt('');
      showNotification(`Section "${regenSection}" regenerated. Save when ready.`);
    } catch (err: any) {
      alert(`Regeneration failed: ${err.message}`);
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center space-y-3">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Loading lecture notes studio...</p>
      </div>
    );
  }

  if (error || !lecture) {
    return (
      <div className="p-8 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-rose-200 text-center space-y-3 max-w-lg mx-auto">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
        <p className="font-bold text-base">Error Loading Lecture</p>
        <p className="text-xs text-rose-300">{error || 'Lecture record not found.'}</p>
      </div>
    );
  }

  const isApproved = notes?.approval_status === 'approved';

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-semibold shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Banner: Lecture Meta & Status */}
      <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                {lecture.subject}
              </span>
              {isApproved ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  Approved for Students
                </span>
              ) : notes ? (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                  Awaiting Teacher Review
                </span>
              ) : (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  Transcript Ready
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              {lecture.title}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" />
                {lecture.teacher_name}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {formatDuration(lecture.duration_seconds)}
              </span>
              <span>•</span>
              <span>Recorded: {lecture.lecture_date}</span>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            {notes && (
              <>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                    isEditing
                      ? 'bg-amber-600/20 text-amber-300 border-amber-500/40'
                      : 'bg-slate-800 text-slate-300 hover:text-white border-slate-700'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditing ? 'Exit Edit Mode' : 'Edit Notes'}</span>
                </button>

                {isEditing && (
                  <button
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/30"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                  </button>
                )}

                <button
                  onClick={handleToggleApproval}
                  disabled={isApproving}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md ${
                    isApproved
                      ? 'bg-slate-800 hover:bg-rose-950/60 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-500/40'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-600/25'
                  }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>{isApproved ? 'Revoke Student Approval' : 'Approve for Students'}</span>
                </button>
              </>
            )}

            {/* Export Dropdown */}
            {notes && (
              <div className="relative group">
                <button className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Export</span>
                </button>
                <div className="absolute right-0 top-full mt-1.5 hidden group-hover:block z-30 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 text-xs">
                  <button
                    onClick={() => exportMarkdownNotes(lecture, notes)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    Markdown Notes (.md)
                  </button>
                  <button
                    onClick={() => exportSummaryText(lecture, notes)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    Lecture Summary (.txt)
                  </button>
                  <button
                    onClick={() => exportTranscriptText(lecture)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    Full Transcript (.txt)
                  </button>
                  <button
                    onClick={() => exportQuestionBankText(lecture, notes)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    Question Bank (.txt)
                  </button>
                  <button
                    onClick={() => exportMCQsJSON(lecture, notes)}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-800 text-slate-200 transition-colors"
                  >
                    MCQs Dataset (.json)
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Audio Player bar if recording exists */}
        {lecture.audio_path && (
          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Music className="w-3.5 h-3.5 text-indigo-400" />
              <span>Lecture Audio Recording:</span>
            </div>
            <audio controls src={lecture.audio_path} className="h-8 w-full sm:w-80" />
          </div>
        )}
      </div>

      {/* Prominent "Generate Notes" Callout if no notes yet */}
      {!notes && (
        <div className="p-8 rounded-3xl bg-gradient-to-r from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/30 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-cyan-400 mx-auto">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white">
            Transcript is Ready. Generate Structured AI Notes!
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
            Lectra will analyze the transcript and generate 11 comprehensive educational sections: executive summary, topic breakdown, detailed notes, simple explanations, flashcards, MCQs, and question bank.
          </p>

          <div className="pt-2">
            <button
              onClick={handleGenerateNotes}
              disabled={isGenerating}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <div className="flex items-center gap-2">
                <Sparkles className={`w-4 h-4 text-cyan-200 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? generationStep || 'Generating AI Notes...' : 'Generate AI Notes Now'}</span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs font-semibold scrollbar-none">
        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'transcript'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Transcript</span>
        </button>

        {notes && (
          <>
            <button
              onClick={() => setActiveTab('summary')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'summary'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Summary</span>
            </button>

            <button
              onClick={() => setActiveTab('topics')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'topics'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Topic Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('detailed')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'detailed'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Detailed Notes</span>
            </button>

            <button
              onClick={() => setActiveTab('beginner')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'beginner'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>Beginner View</span>
            </button>

            <button
              onClick={() => setActiveTab('revision')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'revision'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Quick Revision</span>
            </button>

            <button
              onClick={() => setActiveTab('questions')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'questions'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Questions & Q&A</span>
            </button>

            <button
              onClick={() => setActiveTab('mcqs')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'mcqs'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>MCQs Quiz ({notes.mcqs?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('terms')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'terms'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Key Terms</span>
            </button>

            <button
              onClick={() => setActiveTab('formulas')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'formulas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Formulas & Examples</span>
            </button>

            <button
              onClick={() => setActiveTab('homework')}
              className={`px-3.5 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'homework'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Homework & Actions</span>
            </button>
          </>
        )}
      </div>

      {/* TAB CONTENT PANELS */}
      <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-6 sm:p-8 min-h-[400px]">
        {/* TAB 1: TRANSCRIPT */}
        {activeTab === 'transcript' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Lecture Transcript</h3>
                <p className="text-xs text-slate-400">
                  {isEditing ? 'Edit the raw transcribed text below before saving.' : 'Grounded transcript captured from lecture recording.'}
                </p>
              </div>

              {!notes && (
                <button
                  onClick={handleGenerateNotes}
                  disabled={isGenerating}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Generate Notes</span>
                </button>
              )}
            </div>

            {isEditing ? (
              <textarea
                value={editedTranscript}
                onChange={(e) => setEditedTranscript(e.target.value)}
                rows={18}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800/80 text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {editedTranscript || 'No transcript generated yet.'}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SUMMARY */}
        {activeTab === 'summary' && notes && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Executive Summary</h3>
                <p className="text-xs text-slate-400">
                  Concise pedagogical summary of core takeaways
                </p>
              </div>
              <button
                onClick={() => {
                  setRegenSection('summary');
                  setShowRegenModal(true);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate Summary</span>
              </button>
            </div>

            {isEditing ? (
              <textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                rows={10}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {editedSummary}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: TOPIC-WISE NOTES */}
        {activeTab === 'topics' && notes && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Topic Hierarchy</h3>
            <div className="space-y-4">
              {editedTopics.map((topic, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center">
                      {i + 1}
                    </span>
                    <h4 className="text-sm font-bold text-white">{topic.topic}</h4>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pl-8">
                    {topic.subtopics.map((sub, sIdx) => (
                      <span
                        key={sIdx}
                        className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-400 pl-8 leading-relaxed">
                    {topic.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DETAILED NOTES */}
        {activeTab === 'detailed' && notes && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Comprehensive Notes</h3>
                <p className="text-xs text-slate-400">Structured markdown study document</p>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedDetailedNotes}
                onChange={(e) => setEditedDetailedNotes(e.target.value)}
                rows={18}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm font-mono leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <div className="p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                {editedDetailedNotes}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: BEGINNER EXPLANATION */}
        {activeTab === 'beginner' && notes && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Beginner-Friendly Explanation</h3>
                <p className="text-xs text-slate-400">
                  "Explain Like I'm 12" simplified analogies for intuitive understanding
                </p>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={editedBeginner}
                onChange={(e) => setEditedBeginner(e.target.value)}
                rows={10}
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-200 text-sm leading-relaxed focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-950 border border-indigo-500/20 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                {editedBeginner}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: QUICK REVISION POINTS */}
        {activeTab === 'revision' && notes && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">High-Yield Revision Points</h3>
            <div className="space-y-2">
              {editedRevisionPoints.map((pt, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-300">{pt}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 7: QUESTIONS & Q&A */}
        {activeTab === 'questions' && notes && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-white">Grounded Questions & Answers</h3>
              <p className="text-xs text-slate-400">
                Exam-oriented questions with answers cited directly from the teacher's lecture
              </p>
            </div>

            <div className="space-y-4">
              {editedQAs.map((qa, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <h4 className="text-sm font-bold text-indigo-300">
                    Q{i + 1}: {qa.question}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                    {qa.answer}
                  </p>
                  {qa.transcript_reference && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 italic">
                      Transcript reference: "{qa.transcript_reference}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: MCQS */}
        {activeTab === 'mcqs' && notes && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Multiple Choice Practice Questions</h3>
                <p className="text-xs text-slate-400">
                  Concept-check questions available for student practice mode
                </p>
              </div>
              <button
                onClick={() => {
                  setRegenSection('mcqs');
                  setShowRegenModal(true);
                }}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate MCQs</span>
              </button>
            </div>

            <div className="space-y-4">
              {editedMCQs.map((mcq, i) => (
                <div key={i} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <h4 className="text-sm font-bold text-white">
                    {i + 1}. {mcq.question}
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {mcq.options.map((opt, oIdx) => {
                      const isCorrect = opt === mcq.correctAnswer;
                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl text-xs font-medium border flex items-center justify-between ${
                            isCorrect
                              ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/40 font-semibold'
                              : 'bg-slate-900 text-slate-300 border-slate-800'
                          }`}
                        >
                          <span>{opt}</span>
                          {isCorrect && (
                            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
                              CORRECT
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 text-[11px] text-slate-400">
                    <strong className="text-slate-300">Explanation:</strong> {mcq.explanation}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 9: KEY TERMS */}
        {activeTab === 'terms' && notes && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Key Terms Glossary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {editedKeyTerms.map((term, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-cyan-300">{term.term}</h4>
                    {term.context && (
                      <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full">
                        {term.context}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{term.definition}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 10: FORMULAS & EXAMPLES */}
        {activeTab === 'formulas' && notes && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Formulas, Calculations & Case Examples</h3>
            <div className="space-y-3">
              {editedFormulas.map((item, i) => (
                <div key={i} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                      {item.type}
                    </span>
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 font-mono text-xs text-slate-200">
                    {item.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 11: HOMEWORK & ACTIONS */}
        {activeTab === 'homework' && notes && (
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">Assignments & Homework Identified</h3>
            <div className="space-y-2">
              {editedActionItems.map((item, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                  <ListChecks className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <p className="text-xs sm:text-sm text-slate-300">{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* REGENERATE SECTION MODAL */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">
              Regenerate Section: <span className="text-indigo-400">{regenSection}</span>
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Gemini will re-analyze the lecture transcript specifically for this section. You can provide optional teacher guidance below.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Teacher Guidance (Optional)
              </label>
              <input
                type="text"
                value={customRegenPrompt}
                onChange={(e) => setCustomRegenPrompt(e.target.value)}
                placeholder="e.g. Focus more on the mathematical derivation"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowRegenModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerateSectionSubmit}
                disabled={isRegeneratingSection}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingSection ? 'animate-spin' : ''}`} />
                <span>{isRegeneratingSection ? 'Regenerating...' : 'Confirm Regeneration'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
