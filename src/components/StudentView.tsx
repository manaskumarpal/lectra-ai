import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  BookOpen,
  CheckCircle2,
  Clock,
  Download,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Award,
  Calendar,
  User,
  ListChecks,
  Lightbulb,
  FileText,
  ShieldAlert,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MCQ, KeyTerm } from '../types';
import { downloadFile, formatDuration } from '../utils/exportUtils';

interface StudentLectureSummary {
  id: string;
  title: string;
  subject: string;
  teacher_name: string;
  lecture_date: string;
  duration_seconds: number;
  summary: string;
  notes_updated_at: string;
}

interface StudentLectureDetail {
  id: string;
  title: string;
  subject: string;
  teacher_name: string;
  lecture_date: string;
  duration_seconds: number;
  summary: string;
  topic_wise_notes: any[];
  detailed_notes: string;
  beginner_explanation: string;
  revision_notes: string[];
  important_questions: string[];
  question_answers: any[];
  mcqs: MCQ[];
  key_terms: KeyTerm[];
  action_items: string[];
  formulas_and_examples: any[];
  updated_at: string;
}

export const StudentView: React.FC = () => {
  const [approvedLectures, setApprovedLectures] = useState<StudentLectureSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');

  // Currently opened lecture
  const [activeLecture, setActiveLecture] = useState<StudentLectureDetail | null>(null);
  const [activeTab, setActiveTab] = useState<'study' | 'quiz' | 'flashcards' | 'revision'>('study');

  // Quiz state
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [showQuizResults, setShowQuizResults] = useState(false);

  // Flashcards state
  const [currentCardIdx, setCurrentCardIdx] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Fetch approved lectures
  const fetchApproved = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (selectedSubject !== 'all') params.append('subject', selectedSubject);

      const res = await fetch(`/api/student/lectures?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load approved lectures');
      const data = await res.json();
      setApprovedLectures(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApproved();
  }, [searchQuery, selectedSubject]);

  const loadLectureDetail = async (id: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/student/lectures/${id}`);
      if (!res.ok) throw new Error('Failed to load lecture study material');
      const data = await res.json();
      setActiveLecture(data);
      setActiveTab('study');
      setUserAnswers({});
      setShowQuizResults(false);
      setCurrentCardIdx(0);
      setIsFlipped(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuizAnswer = (qIdx: number, option: string) => {
    if (showQuizResults) return;
    setUserAnswers((prev) => ({ ...prev, [qIdx]: option }));
  };

  const handleFinishQuiz = () => {
    setShowQuizResults(true);
    // Fire celebratory confetti!
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const subjects = Array.from(new Set(approvedLectures.map((l) => l.subject).filter(Boolean)));

  // Calculate Quiz Score
  const calculateScore = () => {
    if (!activeLecture || !activeLecture.mcqs) return { correct: 0, total: 0 };
    let correct = 0;
    activeLecture.mcqs.forEach((mcq, idx) => {
      if (userAnswers[idx] === mcq.correctAnswer) correct++;
    });
    return { correct, total: activeLecture.mcqs.length };
  };

  // Download Student Guide
  const handleDownloadStudentGuide = () => {
    if (!activeLecture) return;
    const content = `# STUDY GUIDE: ${activeLecture.title}
Subject: ${activeLecture.subject} | Instructor: ${activeLecture.teacher_name}
Date: ${activeLecture.lecture_date}

## 1. SUMMARY
${activeLecture.summary}

## 2. BEGINNER-FRIENDLY EXPLANATION
${activeLecture.beginner_explanation}

## 3. QUICK REVISION CHEAT SHEET
${activeLecture.revision_notes?.map((pt, i) => `${i + 1}. ${pt}`).join('\n')}

## 4. KEY DEFINITIONS
${activeLecture.key_terms?.map((k) => `- **${k.term}**: ${k.definition}`).join('\n')}

## 5. HOMEWORK & NEXT STEPS
${activeLecture.action_items?.map((item) => `[ ] ${item}`).join('\n')}

---
Prepared by ${activeLecture.teacher_name} via Lectra Platform
`;
    downloadFile(`StudyGuide-${activeLecture.title.replace(/\s+/g, '_')}.md`, content, 'text/markdown');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16">
      {/* Honest Prototype Notice */}
      <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3 text-cyan-200 text-xs">
        <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <p className="font-bold text-cyan-300">
            Student Learning Portal (Verified Content Only)
          </p>
          <p className="text-cyan-200/80 leading-relaxed">
            This portal only displays lecture notes that have been thoroughly reviewed and officially approved by the course instructor. Draft notes and raw recordings remain private.
          </p>
        </div>
      </div>

      {/* DETAIL VIEW: OPENED APPROVED LECTURE */}
      {activeLecture ? (
        <div className="space-y-6">
          {/* Back button and lecture banner */}
          <div className="p-6 rounded-3xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <button
                onClick={() => setActiveLecture(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Approved Courses</span>
              </button>

              <button
                onClick={handleDownloadStudentGuide}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white text-xs font-bold border border-cyan-500/30 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Study Guide (.md)</span>
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                {activeLecture.subject}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {activeLecture.title}
              </h1>
              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                <span>Instructor: <strong>{activeLecture.teacher_name}</strong></span>
                <span>•</span>
                <span>Date: {activeLecture.lecture_date}</span>
                <span>•</span>
                <span>Duration: {formatDuration(activeLecture.duration_seconds)}</span>
              </div>
            </div>

            {/* Sub-nav Tabs */}
            <div className="flex items-center gap-2 pt-2 border-t border-slate-800 text-xs font-semibold overflow-x-auto">
              <button
                onClick={() => setActiveTab('study')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'study'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Study Notes</span>
              </button>

              <button
                onClick={() => setActiveTab('quiz')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'quiz'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>MCQ Practice Quiz ({activeLecture.mcqs?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('flashcards')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'flashcards'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Flashcards ({activeLecture.key_terms?.length || 0})</span>
              </button>

              <button
                onClick={() => setActiveTab('revision')}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
                  activeTab === 'revision'
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/25'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Revision Points</span>
              </button>
            </div>
          </div>

          {/* TAB 1: STUDY NOTES */}
          {activeTab === 'study' && (
            <div className="space-y-6">
              {/* Executive Summary Card */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span>Lecture Summary</span>
                </h3>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {activeLecture.summary}
                </p>
              </div>

              {/* Beginner Friendly Card */}
              {activeLecture.beginner_explanation && (
                <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900/60 to-purple-950/40 border border-indigo-500/20 space-y-2">
                  <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-cyan-400" />
                    <span>Intuitive Beginner Explanation</span>
                  </h3>
                  <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                    {activeLecture.beginner_explanation}
                  </p>
                </div>
              )}

              {/* Topic Breakdown */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-white">Course Topics & Core Concepts</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeLecture.topic_wise_notes?.map((t: any, i: number) => (
                    <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-cyan-500/20 text-cyan-300 flex items-center justify-center text-xs">
                          {i + 1}
                        </span>
                        <span>{t.topic}</span>
                      </h4>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        {t.summary}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {t.subtopics?.map((sub: string, sIdx: number) => (
                          <span key={sIdx} className="text-[10px] bg-slate-950 text-slate-400 px-2 py-0.5 rounded">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detailed Markdown Notes */}
              <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Detailed Notes & Formulas
                </h3>
                <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {activeLecture.detailed_notes}
                </div>
              </div>

              {/* Homework / Action Items */}
              {activeLecture.action_items?.length > 0 && (
                <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-500/30 space-y-2">
                  <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ListChecks className="w-4 h-4 text-amber-400" />
                    <span>Homework & Reading Assigned in Lecture</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-200">
                    {activeLecture.action_items.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-amber-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INTERACTIVE MCQ QUIZ */}
          {activeTab === 'quiz' && (
            <div className="space-y-6">
              {/* Quiz Header */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
                <div>
                  <h3 className="text-sm font-bold text-white">Interactive Concept Check</h3>
                  <p className="text-xs text-slate-400">
                    Answer questions to test your comprehension of this lecture.
                  </p>
                </div>

                {showQuizResults ? (
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1.5 rounded-xl bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      Score: {calculateScore().correct} / {calculateScore().total}
                    </div>
                    <button
                      onClick={() => {
                        setUserAnswers({});
                        setShowQuizResults(false);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Retake Quiz</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleFinishQuiz}
                    disabled={Object.keys(userAnswers).length === 0}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition-all shadow-md"
                  >
                    Submit Answers
                  </button>
                )}
              </div>

              {/* MCQs List */}
              <div className="space-y-4">
                {activeLecture.mcqs?.map((mcq, qIdx) => {
                  const selectedAnswer = userAnswers[qIdx];
                  const isCorrect = selectedAnswer === mcq.correctAnswer;

                  return (
                    <div
                      key={qIdx}
                      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                    >
                      <h4 className="text-sm font-bold text-white flex items-start gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-800 text-cyan-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                          {qIdx + 1}
                        </span>
                        <span>{mcq.question}</span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-7">
                        {mcq.options.map((opt, oIdx) => {
                          const isChosen = selectedAnswer === opt;
                          const isOptionCorrect = opt === mcq.correctAnswer;

                          let btnStyle = 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700';

                          if (showQuizResults) {
                            if (isOptionCorrect) {
                              btnStyle = 'bg-emerald-950/60 text-emerald-200 border-emerald-500 font-bold';
                            } else if (isChosen && !isOptionCorrect) {
                              btnStyle = 'bg-rose-950/60 text-rose-200 border-rose-500 font-bold';
                            }
                          } else if (isChosen) {
                            btnStyle = 'bg-cyan-950/60 text-cyan-200 border-cyan-500 font-bold';
                          }

                          return (
                            <button
                              key={oIdx}
                              onClick={() => handleSelectQuizAnswer(qIdx, opt)}
                              disabled={showQuizResults}
                              className={`p-3 rounded-xl text-xs text-left border transition-all flex items-center justify-between ${btnStyle}`}
                            >
                              <span>{opt}</span>
                              {showQuizResults && isOptionCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {showQuizResults && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-950 text-xs text-slate-400 pl-7 space-y-1">
                          <p className="font-semibold text-slate-200">
                            {isCorrect ? '✅ Excellent! Correct answer.' : `❌ Incorrect. Correct: ${mcq.correctAnswer}`}
                          </p>
                          <p>{mcq.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: FLASHCARDS */}
          {activeTab === 'flashcards' && activeLecture.key_terms && (
            <div className="space-y-6 max-w-xl mx-auto">
              <div className="text-center space-y-1">
                <h3 className="text-base font-bold text-white">Interactive Key Term Flashcards</h3>
                <p className="text-xs text-slate-400">
                  Click the card to flip between term and definition.
                </p>
              </div>

              {activeLecture.key_terms.length > 0 ? (
                <div className="space-y-4">
                  {/* Card Container */}
                  <div
                    onClick={() => setIsFlipped(!isFlipped)}
                    className="cursor-pointer min-h-[220px] rounded-3xl p-8 bg-gradient-to-br from-slate-900 to-indigo-950/80 border border-indigo-500/30 hover:border-indigo-500/60 shadow-2xl flex flex-col items-center justify-center text-center transition-all select-none group"
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 mb-2">
                      {isFlipped ? 'Definition' : 'Term'} (Click to Flip)
                    </span>

                    {!isFlipped ? (
                      <h4 className="text-2xl font-black text-white group-hover:text-cyan-300 transition-colors">
                        {activeLecture.key_terms[currentCardIdx]?.term}
                      </h4>
                    ) : (
                      <p className="text-sm text-slate-200 leading-relaxed max-w-md">
                        {activeLecture.key_terms[currentCardIdx]?.definition}
                      </p>
                    )}

                    {activeLecture.key_terms[currentCardIdx]?.context && (
                      <span className="text-[10px] text-slate-400 bg-slate-950 px-2.5 py-0.5 rounded-full mt-4">
                        {activeLecture.key_terms[currentCardIdx]?.context}
                      </span>
                    )}
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIdx((prev) => Math.max(0, prev - 1));
                      }}
                      disabled={currentCardIdx === 0}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Previous</span>
                    </button>

                    <span className="text-xs text-slate-400 font-mono">
                      {currentCardIdx + 1} / {activeLecture.key_terms.length}
                    </span>

                    <button
                      onClick={() => {
                        setIsFlipped(false);
                        setCurrentCardIdx((prev) => Math.min(activeLecture.key_terms.length - 1, prev + 1));
                      }}
                      disabled={currentCardIdx === activeLecture.key_terms.length - 1}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-xs font-semibold text-slate-300 flex items-center gap-1"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-center text-xs text-slate-400">No key terms defined for this lecture.</p>
              )}
            </div>
          )}

          {/* TAB 4: REVISION POINTS */}
          {activeTab === 'revision' && (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Exam Revision Points</span>
              </h3>
              <div className="space-y-2.5">
                {activeLecture.revision_notes?.map((pt, i) => (
                  <div key={i} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
                      ✓
                    </span>
                    <p className="text-xs sm:text-sm text-slate-200">{pt}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* LIST OF APPROVED LECTURES */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Student Hub</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Approved Lecture Notes
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Official notes approved by your instructors for self-paced study, revision, and practice.
              </p>
            </div>
          </div>

          {/* Search & Subject filter */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search approved lectures by title or topic..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-full sm:w-48"
            >
              <option value="all">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* List */}
          {loading ? (
            <div className="py-20 text-center space-y-2">
              <Sparkles className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-slate-400 text-xs">Loading approved course material...</p>
            </div>
          ) : approvedLectures.length === 0 ? (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                <GraduationCap className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-base font-bold text-white">No Approved Notes Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Your teacher has not approved any lectures for student viewing yet. Once reviewed and approved in the Teacher Studio, they will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvedLectures.map((lec) => (
                <div
                  key={lec.id}
                  className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                        {lec.subject}
                      </span>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Teacher Approved
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                      {lec.title}
                    </h3>

                    <p className="text-xs text-slate-400 line-clamp-2">
                      {lec.summary}
                    </p>

                    <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                      <span>{lec.teacher_name}</span>
                      <span>•</span>
                      <span>{lec.lecture_date}</span>
                      <span>•</span>
                      <span>{formatDuration(lec.duration_seconds)}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end">
                    <button
                      onClick={() => loadLectureDetail(lec.id)}
                      className="px-4 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600 text-cyan-300 hover:text-white text-xs font-bold border border-cyan-500/30 transition-all flex items-center gap-1.5"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Start Learning</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
