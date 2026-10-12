export interface Lecture {
  id: string;
  title: string;
  subject: string;
  teacher_name: string;
  lecture_date: string;
  duration_seconds: number;
  audio_path: string;
  audio_mime: string;
  transcript: string;
  processing_status: 'draft' | 'ready_to_transcribe' | 'transcribing' | 'transcript_ready' | 'generating_notes' | 'awaiting_review' | 'approved' | 'failed';
  approval_status?: 'awaiting_review' | 'approved';
  has_notes?: number;
  created_at: string;
  updated_at: string;
}

export interface TopicWiseNote {
  topic: string;
  subtopics: string[];
  summary: string;
}

export interface QuestionAnswer {
  question: string;
  answer: string;
  transcript_reference?: string;
}

export interface MCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface KeyTerm {
  term: string;
  definition: string;
  context?: string;
}

export interface FormulaOrExample {
  type: 'formula' | 'example' | 'calculation';
  title: string;
  content: string;
}

export interface Notes {
  id: string;
  lecture_id: string;
  summary: string;
  topic_wise_notes: TopicWiseNote[];
  detailed_notes: string;
  beginner_explanation: string;
  revision_notes: string[];
  important_questions: string[];
  question_answers: QuestionAnswer[];
  mcqs: MCQ[];
  key_terms: KeyTerm[];
  action_items: string[];
  formulas_and_examples: FormulaOrExample[];
  approval_status: 'awaiting_review' | 'approved';
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalLectures: number;
  totalDurationSeconds: number;
  totalNotesGenerated: number;
  awaitingReviewCount: number;
  approvedCount: number;
}

export interface SystemSettings {
  appName: string;
  version: string;
  geminiKeyConfigured: boolean;
  transcriptionProvider: string;
  notesProvider: string;
  storageType: string;
  storageLocation: string;
  totalAudioRecordings: number;
  supportedAudioFormats: string[];
  maxRecordingDurationMinutes: number;
  supportedLanguages: Array<{ code: string; name: string }>;
}
