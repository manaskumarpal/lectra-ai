import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { getDb, saveDb } from './src/server/database.ts';
import { transcribeAudio } from './src/server/transcription.ts';
import { generateLectureNotes, regenerateSection } from './src/server/aiNotes.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

// High body limits for audio data
app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

const DATA_DIR = path.resolve(process.cwd(), 'data');
const AUDIO_DIR = path.join(DATA_DIR, 'audio');
if (!fs.existsSync(AUDIO_DIR)) {
  fs.mkdirSync(AUDIO_DIR, { recursive: true });
}

// Helper: Query DB
async function runQuery(sql: string, params: any[] = []): Promise<any[]> {
  const db = await getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: any[] = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

async function runExec(sql: string, params: any[] = []): Promise<void> {
  const db = await getDb();
  db.run(sql, params);
  saveDb();
}

// ---------------- API ROUTES ----------------

// Stats Endpoint
app.get('/api/stats', async (_req, res) => {
  try {
    const lectureRows = await runQuery('SELECT COUNT(*) as count, SUM(duration_seconds) as total_duration FROM lectures');
    const notesRows = await runQuery('SELECT COUNT(*) as count FROM notes');
    const awaitingRows = await runQuery("SELECT COUNT(*) as count FROM notes WHERE approval_status = 'awaiting_review'");
    const approvedRows = await runQuery("SELECT COUNT(*) as count FROM notes WHERE approval_status = 'approved'");

    const totalLectures = lectureRows[0]?.count || 0;
    const totalDurationSeconds = lectureRows[0]?.total_duration || 0;
    const totalNotesGenerated = notesRows[0]?.count || 0;
    const awaitingReviewCount = awaitingRows[0]?.count || 0;
    const approvedCount = approvedRows[0]?.count || 0;

    res.json({
      totalLectures,
      totalDurationSeconds,
      totalNotesGenerated,
      awaitingReviewCount,
      approvedCount,
    });
  } catch (err: any) {
    console.error('Stats error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List Lectures
app.get('/api/lectures', async (req, res) => {
  try {
    const { q, subject, status, sort } = req.query;

    let sql = `
      SELECT l.*, n.approval_status,
             (CASE WHEN n.id IS NOT NULL THEN 1 ELSE 0 END) as has_notes
      FROM lectures l
      LEFT JOIN notes n ON l.id = n.lecture_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (q && typeof q === 'string') {
      sql += ` AND (l.title LIKE ? OR l.subject LIKE ? OR l.teacher_name LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (subject && typeof subject === 'string' && subject !== 'all') {
      sql += ` AND l.subject = ?`;
      params.push(subject);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      if (status === 'approved') {
        sql += ` AND n.approval_status = 'approved'`;
      } else if (status === 'awaiting_review') {
        sql += ` AND n.approval_status = 'awaiting_review'`;
      } else if (status === 'transcript_ready') {
        sql += ` AND l.processing_status = 'transcript_ready' AND (n.id IS NULL OR n.approval_status != 'approved')`;
      } else if (status === 'draft') {
        sql += ` AND l.processing_status = 'draft'`;
      }
    }

    if (sort === 'oldest') {
      sql += ` ORDER BY l.created_at ASC`;
    } else if (sort === 'duration') {
      sql += ` ORDER BY l.duration_seconds DESC`;
    } else {
      sql += ` ORDER BY l.created_at DESC`;
    }

    const rows = await runQuery(sql, params);
    res.json(rows);
  } catch (err: any) {
    console.error('List lectures error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Create Lecture
app.post('/api/lectures', async (req, res) => {
  try {
    const {
      title,
      subject,
      teacher_name,
      duration_seconds = 0,
      audio_base64,
      audio_mime = 'audio/webm',
      transcript = '',
      lecture_date = new Date().toISOString().split('T')[0],
    } = req.body;

    if (!title || !subject) {
      return res.status(400).json({ error: 'Title and subject are required.' });
    }

    const id = 'lec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    let audio_path = '';

    if (audio_base64) {
      const ext = audio_mime.includes('wav') ? 'wav' : audio_mime.includes('mp3') ? 'mp3' : audio_mime.includes('m4a') ? 'm4a' : 'webm';
      const filename = `${id}.${ext}`;
      const filePath = path.join(AUDIO_DIR, filename);
      const buffer = Buffer.from(audio_base64, 'base64');
      fs.writeFileSync(filePath, buffer);
      audio_path = `/api/audio/${filename}`;
    }

    const now = new Date().toISOString();
    const status = transcript ? 'transcript_ready' : audio_path ? 'ready_to_transcribe' : 'draft';

    await runExec(
      `INSERT INTO lectures (id, title, subject, teacher_name, lecture_date, duration_seconds, audio_path, audio_mime, transcript, processing_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        title.trim(),
        subject.trim(),
        (teacher_name || 'Instructor').trim(),
        lecture_date,
        parseInt(duration_seconds, 10) || 0,
        audio_path,
        audio_mime,
        transcript.trim(),
        status,
        now,
        now,
      ]
    );

    const created = await runQuery('SELECT * FROM lectures WHERE id = ?', [id]);
    res.status(201).json(created[0]);
  } catch (err: any) {
    console.error('Create lecture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get Single Lecture + Notes
app.get('/api/lectures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lectures = await runQuery('SELECT * FROM lectures WHERE id = ?', [id]);
    if (!lectures || lectures.length === 0) {
      return res.status(404).json({ error: 'Lecture not found.' });
    }

    const lecture = lectures[0];
    const notesRows = await runQuery('SELECT * FROM notes WHERE lecture_id = ?', [id]);

    let parsedNotes = null;
    if (notesRows && notesRows.length > 0) {
      const n = notesRows[0];
      parsedNotes = {
        id: n.id,
        lecture_id: n.lecture_id,
        summary: n.summary || '',
        topic_wise_notes: n.topic_wise_notes ? JSON.parse(n.topic_wise_notes) : [],
        detailed_notes: n.detailed_notes || '',
        beginner_explanation: n.beginner_explanation || '',
        revision_notes: n.revision_notes ? JSON.parse(n.revision_notes) : [],
        important_questions: n.important_questions ? JSON.parse(n.important_questions) : [],
        question_answers: n.question_answers ? JSON.parse(n.question_answers) : [],
        mcqs: n.mcqs ? JSON.parse(n.mcqs) : [],
        key_terms: n.key_terms ? JSON.parse(n.key_terms) : [],
        action_items: n.action_items ? JSON.parse(n.action_items) : [],
        formulas_and_examples: n.formulas_and_examples ? JSON.parse(n.formulas_and_examples) : [],
        approval_status: n.approval_status || 'awaiting_review',
        created_at: n.created_at,
        updated_at: n.updated_at,
      };
    }

    res.json({ lecture, notes: parsedNotes });
  } catch (err: any) {
    console.error('Get lecture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Lecture metadata or transcript
app.put('/api/lectures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subject, teacher_name, transcript, duration_seconds } = req.body;

    const existing = await runQuery('SELECT * FROM lectures WHERE id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Lecture not found.' });
    }

    const current = existing[0];
    const newTitle = title !== undefined ? title : current.title;
    const newSubject = subject !== undefined ? subject : current.subject;
    const newTeacher = teacher_name !== undefined ? teacher_name : current.teacher_name;
    const newTranscript = transcript !== undefined ? transcript : current.transcript;
    const newDuration = duration_seconds !== undefined ? parseInt(duration_seconds, 10) : current.duration_seconds;
    const newStatus = newTranscript && newTranscript.trim() ? (current.processing_status === 'draft' ? 'transcript_ready' : current.processing_status) : current.processing_status;

    const now = new Date().toISOString();
    await runExec(
      `UPDATE lectures SET title = ?, subject = ?, teacher_name = ?, transcript = ?, duration_seconds = ?, processing_status = ?, updated_at = ? WHERE id = ?`,
      [newTitle, newSubject, newTeacher, newTranscript, newDuration, newStatus, now, id]
    );

    const updated = await runQuery('SELECT * FROM lectures WHERE id = ?', [id]);
    res.json(updated[0]);
  } catch (err: any) {
    console.error('Update lecture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Delete Lecture
app.delete('/api/lectures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const lectures = await runQuery('SELECT * FROM lectures WHERE id = ?', [id]);
    if (lectures.length > 0 && lectures[0].audio_path) {
      const filename = path.basename(lectures[0].audio_path);
      const filePath = path.join(AUDIO_DIR, filename);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
          console.warn('Failed to delete audio file:', e);
        }
      }
    }

    await runExec('DELETE FROM notes WHERE lecture_id = ?', [id]);
    await runExec('DELETE FROM lectures WHERE id = ?', [id]);
    res.json({ success: true, message: 'Lecture and notes deleted successfully.' });
  } catch (err: any) {
    console.error('Delete lecture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Audio Stream Endpoint
app.get('/api/audio/:filename', (req, res) => {
  const { filename } = req.params;
  const safeFilename = path.basename(filename);
  const filePath = path.join(AUDIO_DIR, safeFilename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).send('Audio file not found.');
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  let contentType = 'audio/webm';
  if (safeFilename.endsWith('.mp3')) contentType = 'audio/mp3';
  if (safeFilename.endsWith('.wav')) contentType = 'audio/wav';
  if (safeFilename.endsWith('.m4a')) contentType = 'audio/m4a';

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Transcribe Endpoint
app.post('/api/lectures/:id/transcribe', async (req, res) => {
  try {
    const { id } = req.params;
    const { language = 'auto', custom_audio_base64, audio_mime } = req.body;

    const lectures = await runQuery('SELECT * FROM lectures WHERE id = ?', [id]);
    if (!lectures.length) {
      return res.status(404).json({ error: 'Lecture not found.' });
    }

    const lecture = lectures[0];
    let audioBase64 = custom_audio_base64;
    let mime = audio_mime || lecture.audio_mime || 'audio/webm';

    if (!audioBase64) {
      if (!lecture.audio_path) {
        return res.status(400).json({ error: 'No audio recording found for this lecture. Please record or upload audio first.' });
      }
      const filename = path.basename(lecture.audio_path);
      const filePath = path.join(AUDIO_DIR, filename);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Stored audio file was not found on disk.' });
      }
      const buffer = fs.readFileSync(filePath);
      audioBase64 = buffer.toString('base64');
    }

    const result = await transcribeAudio(audioBase64, mime, language);
    const now = new Date().toISOString();

    await runExec(
      `UPDATE lectures SET transcript = ?, processing_status = 'transcript_ready', updated_at = ? WHERE id = ?`,
      [result.transcript, now, id]
    );

    res.json({
      success: true,
      transcript: result.transcript,
      languageDetected: result.languageDetected,
    });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(500).json({
      error: err.message || 'Speech-to-text transcription failed. Ensure Gemini API key is valid.',
    });
  }
});

// Generate Notes Endpoint
app.post('/api/lectures/:id/generate-notes', async (req, res) => {
  try {
    const { id } = req.params;
    const lectures = await runQuery('SELECT * FROM lectures WHERE id = ?', [id]);
    if (!lectures.length) {
      return res.status(404).json({ error: 'Lecture not found.' });
    }

    const lecture = lectures[0];
    const transcript = req.body.transcript || lecture.transcript;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        error: 'Cannot generate notes: Transcript is empty. Please transcribe or provide lecture transcript first.',
      });
    }

    const notesData = await generateLectureNotes(transcript, {
      title: lecture.title,
      subject: lecture.subject,
      teacherName: lecture.teacher_name,
    });

    const now = new Date().toISOString();
    const noteId = 'notes_' + Date.now();

    // Upsert notes row
    const existingNotes = await runQuery('SELECT id FROM notes WHERE lecture_id = ?', [id]);
    if (existingNotes.length > 0) {
      await runExec(
        `UPDATE notes SET
          summary = ?,
          topic_wise_notes = ?,
          detailed_notes = ?,
          beginner_explanation = ?,
          revision_notes = ?,
          important_questions = ?,
          question_answers = ?,
          mcqs = ?,
          key_terms = ?,
          action_items = ?,
          formulas_and_examples = ?,
          approval_status = 'awaiting_review',
          updated_at = ?
         WHERE lecture_id = ?`,
        [
          notesData.summary,
          JSON.stringify(notesData.topic_wise_notes),
          notesData.detailed_notes,
          notesData.beginner_explanation,
          JSON.stringify(notesData.revision_notes),
          JSON.stringify(notesData.important_questions),
          JSON.stringify(notesData.question_answers),
          JSON.stringify(notesData.mcqs),
          JSON.stringify(notesData.key_terms),
          JSON.stringify(notesData.action_items),
          JSON.stringify(notesData.formulas_and_examples),
          now,
          id,
        ]
      );
    } else {
      await runExec(
        `INSERT INTO notes (
          id, lecture_id, summary, topic_wise_notes, detailed_notes, beginner_explanation,
          revision_notes, important_questions, question_answers, mcqs, key_terms,
          action_items, formulas_and_examples, approval_status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'awaiting_review', ?, ?)`,
        [
          noteId,
          id,
          notesData.summary,
          JSON.stringify(notesData.topic_wise_notes),
          notesData.detailed_notes,
          notesData.beginner_explanation,
          JSON.stringify(notesData.revision_notes),
          JSON.stringify(notesData.important_questions),
          JSON.stringify(notesData.question_answers),
          JSON.stringify(notesData.mcqs),
          JSON.stringify(notesData.key_terms),
          JSON.stringify(notesData.action_items),
          JSON.stringify(notesData.formulas_and_examples),
          now,
          now,
        ]
      );
    }

    await runExec(
      `UPDATE lectures SET processing_status = 'awaiting_review', updated_at = ? WHERE id = ?`,
      [now, id]
    );

    res.json({ success: true, notes: notesData });
  } catch (err: any) {
    console.error('Note generation error:', err);
    res.status(500).json({
      error: err.message || 'AI note generation failed. Please check the API configuration and retry.',
    });
  }
});

// Regenerate single section
app.post('/api/lectures/:id/regenerate-section', async (req, res) => {
  try {
    const { id } = req.params;
    const { sectionName, customInstructions } = req.body;

    const lectures = await runQuery('SELECT * FROM lectures WHERE id = ?', [id]);
    if (!lectures.length) return res.status(404).json({ error: 'Lecture not found.' });

    const lecture = lectures[0];
    if (!lecture.transcript) return res.status(400).json({ error: 'Transcript missing.' });

    const regenerated = await regenerateSection(
      sectionName,
      lecture.transcript,
      { title: lecture.title, subject: lecture.subject, teacherName: lecture.teacher_name },
      customInstructions
    );

    res.json({ success: true, sectionName, data: regenerated[sectionName] || regenerated });
  } catch (err: any) {
    console.error('Regenerate section error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Update Teacher Edits on Notes
app.put('/api/lectures/:id/notes', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      summary,
      topic_wise_notes,
      detailed_notes,
      beginner_explanation,
      revision_notes,
      important_questions,
      question_answers,
      mcqs,
      key_terms,
      action_items,
      formulas_and_examples,
      approval_status,
    } = req.body;

    const existing = await runQuery('SELECT * FROM notes WHERE lecture_id = ?', [id]);
    if (!existing.length) {
      return res.status(404).json({ error: 'Notes record does not exist for this lecture.' });
    }

    const now = new Date().toISOString();
    await runExec(
      `UPDATE notes SET
        summary = ?,
        topic_wise_notes = ?,
        detailed_notes = ?,
        beginner_explanation = ?,
        revision_notes = ?,
        important_questions = ?,
        question_answers = ?,
        mcqs = ?,
        key_terms = ?,
        action_items = ?,
        formulas_and_examples = ?,
        approval_status = COALESCE(?, approval_status),
        updated_at = ?
       WHERE lecture_id = ?`,
      [
        summary,
        JSON.stringify(topic_wise_notes || []),
        detailed_notes,
        beginner_explanation,
        JSON.stringify(revision_notes || []),
        JSON.stringify(important_questions || []),
        JSON.stringify(question_answers || []),
        JSON.stringify(mcqs || []),
        JSON.stringify(key_terms || []),
        JSON.stringify(action_items || []),
        JSON.stringify(formulas_and_examples || []),
        approval_status || null,
        now,
        id,
      ]
    );

    res.json({ success: true, message: 'Notes saved successfully.' });
  } catch (err: any) {
    console.error('Save notes error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Approve Notes for Students
app.post('/api/lectures/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    await runExec("UPDATE notes SET approval_status = 'approved', updated_at = ? WHERE lecture_id = ?", [now, id]);
    await runExec("UPDATE lectures SET processing_status = 'approved', updated_at = ? WHERE id = ?", [now, id]);
    res.json({ success: true, status: 'approved' });
  } catch (err: any) {
    console.error('Approve error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Unapprove Notes
app.post('/api/lectures/:id/unapprove', async (req, res) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();
    await runExec("UPDATE notes SET approval_status = 'awaiting_review', updated_at = ? WHERE lecture_id = ?", [now, id]);
    await runExec("UPDATE lectures SET processing_status = 'awaiting_review', updated_at = ? WHERE id = ?", [now, id]);
    res.json({ success: true, status: 'awaiting_review' });
  } catch (err: any) {
    console.error('Unapprove error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Student View API: ONLY Approved Lectures
app.get('/api/student/lectures', async (req, res) => {
  try {
    const { q, subject } = req.query;
    let sql = `
      SELECT l.id, l.title, l.subject, l.teacher_name, l.lecture_date, l.duration_seconds, l.created_at,
             n.summary, n.updated_at as notes_updated_at
      FROM lectures l
      JOIN notes n ON l.id = n.lecture_id
      WHERE n.approval_status = 'approved'
    `;
    const params: any[] = [];

    if (q && typeof q === 'string') {
      sql += ` AND (l.title LIKE ? OR l.subject LIKE ? OR l.teacher_name LIKE ?)`;
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }

    if (subject && typeof subject === 'string' && subject !== 'all') {
      sql += ` AND l.subject = ?`;
      params.push(subject);
    }

    sql += ` ORDER BY l.lecture_date DESC, l.created_at DESC`;

    const rows = await runQuery(sql, params);
    res.json(rows);
  } catch (err: any) {
    console.error('Student list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Student View Single Lecture (Must be approved)
app.get('/api/student/lectures/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const rows = await runQuery(
      `SELECT l.id, l.title, l.subject, l.teacher_name, l.lecture_date, l.duration_seconds,
              n.summary, n.topic_wise_notes, n.detailed_notes, n.beginner_explanation,
              n.revision_notes, n.important_questions, n.question_answers, n.mcqs,
              n.key_terms, n.action_items, n.formulas_and_examples, n.updated_at
       FROM lectures l
       JOIN notes n ON l.id = n.lecture_id
       WHERE l.id = ? AND n.approval_status = 'approved'`,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Approved lecture notes not found or not yet approved by the teacher.' });
    }

    const raw = rows[0];
    const data = {
      id: raw.id,
      title: raw.title,
      subject: raw.subject,
      teacher_name: raw.teacher_name,
      lecture_date: raw.lecture_date,
      duration_seconds: raw.duration_seconds,
      summary: raw.summary,
      topic_wise_notes: raw.topic_wise_notes ? JSON.parse(raw.topic_wise_notes) : [],
      detailed_notes: raw.detailed_notes,
      beginner_explanation: raw.beginner_explanation,
      revision_notes: raw.revision_notes ? JSON.parse(raw.revision_notes) : [],
      important_questions: raw.important_questions ? JSON.parse(raw.important_questions) : [],
      question_answers: raw.question_answers ? JSON.parse(raw.question_answers) : [],
      mcqs: raw.mcqs ? JSON.parse(raw.mcqs) : [],
      key_terms: raw.key_terms ? JSON.parse(raw.key_terms) : [],
      action_items: raw.action_items ? JSON.parse(raw.action_items) : [],
      formulas_and_examples: raw.formulas_and_examples ? JSON.parse(raw.formulas_and_examples) : [],
      updated_at: raw.updated_at,
    };

    res.json(data);
  } catch (err: any) {
    console.error('Student lecture error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Settings & Diagnostic Endpoint
app.get('/api/settings', async (_req, res) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const audioFiles = fs.existsSync(AUDIO_DIR) ? fs.readdirSync(AUDIO_DIR).length : 0;
  res.json({
    appName: 'Lectra - AI-Powered Lecture to Notes Platform',
    version: '1.0.0',
    geminiKeyConfigured: hasGeminiKey,
    transcriptionProvider: hasGeminiKey ? 'Gemini 3.5 Transcribe' : 'Unconfigured (Key missing)',
    notesProvider: hasGeminiKey ? 'Gemini 3.8 Flash' : 'Unconfigured (Key missing)',
    storageType: 'SQLite (Persistent file-backed)',
    storageLocation: 'data/lectra.sqlite',
    totalAudioRecordings: audioFiles,
    supportedAudioFormats: ['WAV', 'MP3', 'M4A', 'WEBM', 'OGG', 'AAC'],
    maxRecordingDurationMinutes: 60,
    supportedLanguages: [
      { code: 'en', name: 'English' },
      { code: 'hi', name: 'Hindi' },
      { code: 'hinglish', name: 'Hinglish (Mixed)' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
    ],
  });
});

// Seed endpoint with rich realistic demo lecture if empty!
app.post('/api/seed', async (_req, res) => {
  try {
    const existing = await runQuery('SELECT COUNT(*) as count FROM lectures');
    if (existing[0]?.count > 0) {
      return res.json({ message: 'Database already has data. Skipping seed.' });
    }

    const lecId = 'lec_demo_neuro';
    const now = new Date().toISOString();

    const transcript = `Good morning everyone. Today we are diving into one of the most fundamental questions in computer science and neuroscience: How do artificial neural networks compare to the biological human brain?

Let's begin with biological neurons. A biological neuron consists of three primary structures: dendrites, the soma or cell body, and the axon. Dendrites receive incoming electrochemical signals from adjacent neurons across microscopic synaptic clefts. Inside the soma, these inputs are integrated. If the cumulative membrane potential crosses a critical threshold — typically around negative 55 millivolts — an action potential fires down the axon. This is fundamentally an all-or-none biological phenomenon.

Now contrast this with an artificial neuron, often called a perceptron, formalized by McCulloch and Pitts and later refined by Frank Rosenblatt. In an artificial neuron, we model dendrites as numerical inputs x_1, x_2, through x_n. Each input is multiplied by a real-valued synaptic weight w_i. In the artificial soma, we compute a linear combination: the sum of w_i times x_i, plus a learnable bias term b. 

Mathematically: z equals the summation of w_i * x_i + b.

Then, we pass this scalar z through a non-linear activation function, sigma of z, such as ReLU, the Rectified Linear Unit, which is simply max of 0 and z, or the sigmoid function 1 over 1 plus e to the negative z. The activation function is crucial because without non-linearity, stacking twenty layers of neural networks would mathematically collapse into a single linear matrix multiplication.

Now, where do biological and artificial networks diverge?
First, learning mechanism. Biological brains rely on Hebbian plasticity — often summarized as 'neurons that fire together, wire together' — and spike-timing-dependent plasticity (STDP). There is no global supervisor propagating error derivatives backward through axons in our skull! In contrast, artificial neural networks rely on Backpropagation with Gradient Descent. We compute the derivative of a scalar loss function with respect to every weight using the mathematical chain rule of calculus: partial L over partial w equals partial L over partial y-hat times partial y-hat over partial z times partial z over partial w.

Second, energy efficiency. The human brain operates at approximately 20 watts of power — about the energy of a dim refrigerator bulb — while handling language, vision, motor control, and abstract imagination simultaneously. In comparison, training a modern frontier transformer model requires megawatts of electrical power across thousands of specialized H100 GPUs.

For next Tuesday's seminar, your homework reading is Chapter 4 of David MacKay's Information Theory, specifically pages 112 to 135 on information geometry. We will also have a 10-minute quiz on backpropagation derivations at the start of class. Thank you everyone, see you Thursday!`;

    await runExec(
      `INSERT INTO lectures (id, title, subject, teacher_name, lecture_date, duration_seconds, audio_path, audio_mime, transcript, processing_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        lecId,
        'Introduction to Neural Architectures: Biological Brains vs. Artificial Networks',
        'Computational Neuroscience',
        'Prof. Elena Vance',
        new Date().toISOString().split('T')[0],
        2730, // 45.5 minutes
        '',
        'audio/webm',
        transcript,
        'approved',
        now,
        now,
      ]
    );

    const notesId = 'notes_demo_neuro';
    const sampleNotes = {
      summary: "This lecture contrasts biological neurons with artificial neural networks (ANNs). Prof. Vance breaks down the biological anatomy of neurons (dendrites, soma, axon) and their electrochemical threshold firing at -55mV, comparing them with the mathematical perceptron model (weighted sum, bias, activation functions like ReLU and Sigmoid). The lecture highlights key divergences in learning paradigms (Hebbian plasticity vs. Backpropagation with Gradient Descent) and energy efficiency (the 20-watt human brain vs. megawatt GPU clusters).",
      topic_wise_notes: [
        {
          topic: "Biological Neuron Architecture",
          subtopics: ["Dendrites", "Soma / Cell Body", "Axon & Synaptic Cleft", "Action Potential Threshold (-55mV)"],
          summary: "Biological neurons accumulate incoming electrochemical signals across dendrites and fire an all-or-none action potential down the axon when crossing a -55mV threshold."
        },
        {
          topic: "Artificial Perceptron Model",
          subtopics: ["Inputs and Synaptic Weights", "Linear Summation (z = Σ w_i * x_i + b)", "Non-linear Activation Functions (ReLU, Sigmoid)", "Significance of Non-linearity"],
          summary: "Artificial neurons simulate synapses via scalar weights and compute z = Σ(w_i * x_i) + b. Non-linear activation functions prevent multi-layer networks from collapsing into simple linear transformations."
        },
        {
          topic: "Learning Mechanisms & Energy Discrepancy",
          subtopics: ["Hebbian Plasticity vs. Backpropagation", "Calculus Chain Rule in Error Propagation", "Energy Efficiency: 20W biological brain vs. megawatt GPU clusters"],
          summary: "Biological systems learn locally via synaptic plasticity without global loss propagation, whereas ANNs optimize weights via calculus chain rule backpropagation with massive electrical energy requirements."
        }
      ],
      detailed_notes: `## Biological vs Artificial Neural Architecture

### 1. Biological Neurons
* **Dendrites**: Tree-like input branches receiving electrochemical signals from adjacent synapses.
* **Soma**: Cell body that integrates ionic charges.
* **Axon**: Output conduit conducting the action potential.
* **Firing Threshold**: Membrane depolarization crossing approximately **-55 millivolts** triggers an all-or-nothing electrical pulse.

### 2. The Artificial Perceptron
An artificial neuron models biological processing mathematically:
* **Inputs ($x_i$)**: Feature representations.
* **Weights ($w_i$)**: Scalar connection strengths.
* **Bias ($b$)**: Baseline threshold adjustment.
* **Affine Combination**:
  $$z = \\sum_{i=1}^n w_i x_i + b$$
* **Activation Function ($\\sigma$)**: Introduces non-linearity:
  * **ReLU**: $\\text{max}(0, z)$
  * **Sigmoid**: $\\frac{1}{1 + e^{-z}}$

> **Core Insight:** Without activation functions, any $N$-layer deep neural network simplifies to a single linear transformation $W_1 \\cdot W_2 \\dots W_N = W_{eff}$.

### 3. Contrasting Learning Paradigms
| Attribute | Biological Brain | Artificial Neural Network |
| :--- | :--- | :--- |
| **Learning Rule** | Hebbian plasticity ("fire together, wire together") | Backpropagation with Gradient Descent |
| **Feedback Signal** | Local synaptic adjustment (STDP) | Global error gradient via Chain Rule |
| **Power Consumption** | ~20 Watts | Megawatts (data center scale) |
| **Architecture** | Recurrent, continuous, noisy spikes | Layered, discrete tensors |`,
      beginner_explanation: "Think of a biological neuron like a committee voting on a decision: several friends (dendrites) whisper advice into the leader's ear (soma). If enough friends agree and get excited enough to cross a line (-55mV), the leader yells an announcement down a megaphone (axon). An artificial neuron does the exact same thing using simple arithmetic: it multiplies each piece of advice by how much it trusts that friend (weights), adds them up, and then uses a filter (activation function) to decide whether to pass the message forward. Amazingly, your brain runs this entire orchestra of 86 billion neurons on the same electricity as a tiny light bulb!",
      revision_notes: [
        "Action potentials in biological neurons fire when depolarized past ~-55mV (all-or-none principle).",
        "Artificial neuron formula: z = Σ(w_i * x_i) + b, followed by activation σ(z).",
        "Activation functions (ReLU, Sigmoid) are essential to prevent multi-layer neural networks from collapsing into a single linear map.",
        "Biological learning: Hebbian plasticity and local synaptic timing (STDP).",
        "Artificial learning: Backpropagation using the calculus chain rule for gradient descent.",
        "Energy comparison: Human brain operates at ~20W vs megawatt GPU clusters."
      ],
      important_questions: [
        "Why is non-linearity indispensable in deep neural network architectures?",
        "How does Hebbian plasticity differ fundamentally from backpropagation?",
        "What physical threshold triggers an action potential in human neurons?",
        "Why is biological neural computation orders of magnitude more energy-efficient than modern GPUs?"
      ],
      question_answers: [
        {
          question: "Why do artificial neural networks require non-linear activation functions?",
          answer: "Without non-linear activation functions, repeated matrix multiplications across multiple hidden layers would mathematically collapse into a single affine matrix transformation, preventing the network from learning non-linear boundary functions.",
          transcript_reference: "without non-linearity, stacking twenty layers of neural networks would mathematically collapse into a single linear matrix multiplication."
        },
        {
          question: "How does error propagation differ between biological and artificial networks?",
          answer: "Biological brains learn through local synaptic mechanisms like Hebbian plasticity and STDP without a global supervisor. In contrast, artificial networks calculate exact partial derivatives of a scalar loss function using the calculus chain rule across all layers.",
          transcript_reference: "There is no global supervisor propagating error derivatives backward through axons in our skull! In contrast, artificial neural networks rely on Backpropagation."
        }
      ],
      mcqs: [
        {
          question: "What is the typical membrane potential threshold required to trigger an action potential in a biological neuron?",
          options: ["-55 millivolts", "-70 millivolts", "+40 millivolts", "0 millivolts"],
          correctAnswer: "-55 millivolts",
          explanation: "As stated by Prof. Vance, an action potential fires when cumulative membrane potential depolarizes to approximately -55 mV."
        },
        {
          question: "What mathematical property collapses deep linear networks into a single layer if activation functions are omitted?",
          options: ["Composition of linear functions is always linear", "Backpropagation vanishing gradient", "Hebbian weight saturation", "ReLU zero clamping"],
          correctAnswer: "Composition of linear functions is always linear",
          explanation: "Multiplying successive weight matrices W_2 * W_1 without non-linearities produces another linear matrix W_combined."
        },
        {
          question: "Approximately how much power does the human brain consume while operating?",
          options: ["20 Watts", "200 Watts", "2 Kilowatts", "0.5 Watts"],
          correctAnswer: "20 Watts",
          explanation: "The human brain operates continuously on approximately 20 Watts of power."
        },
        {
          question: "What learning rule is summarized as 'neurons that fire together, wire together'?",
          options: ["Hebbian Plasticity", "Stochastic Gradient Descent", "Backpropagation", "Adam Optimization"],
          correctAnswer: "Hebbian Plasticity",
          explanation: "Hebbian plasticity states that synaptic efficacy increases between neurons that consistently activate together."
        }
      ],
      key_terms: [
        { term: "Action Potential", definition: "A rapid, all-or-none electrical impulse propagating down an axon when membrane voltage passes -55mV.", context: "Biological neuron communication" },
        { term: "Activation Function", definition: "A mathematical non-linear function (e.g. ReLU, Sigmoid) applied to a perceptron's affine sum to enable non-linear modeling.", context: "Artificial Neural Networks" },
        { term: "Backpropagation", definition: "An algorithm that computes the gradient of the loss function with respect to weights using the chain rule of calculus.", context: "Supervised deep learning optimization" },
        { term: "Hebbian Plasticity", definition: "A biological neuroscientific principle where synaptic connections strengthen when presynaptic and postsynaptic cells fire concurrently.", context: "Biological synaptic learning" }
      ],
      action_items: [
        "Read Chapter 4 of David MacKay's 'Information Theory' (pages 112–135 on information geometry) for Tuesday's seminar.",
        "Prepare for a 10-minute quiz on backpropagation calculus derivations at the beginning of Tuesday's class."
      ],
      formulas_and_examples: [
        {
          type: "formula",
          title: "Artificial Neuron Affine Sum",
          content: "z = \\sum_{i=1}^n w_i x_i + b"
        },
        {
          type: "formula",
          title: "Rectified Linear Unit (ReLU)",
          content: "\\text{ReLU}(z) = \\max(0, z)"
        },
        {
          type: "formula",
          title: "Backpropagation Chain Rule",
          content: "\\frac{\\partial L}{\\partial w} = \\frac{\\partial L}{\\partial \\hat{y}} \\cdot \\frac{\\partial \\hat{y}}{\\partial z} \\cdot \\frac{\\partial z}{\\partial w}"
        },
        {
          type: "example",
          title: "Energy Efficiency Benchmark",
          content: "The human brain completes complex multi-modal reasoning on ~20W (dim lightbulb), whereas modern deep transformer clusters consume megawatts across server racks."
        }
      ]
    };

    await runExec(
      `INSERT INTO notes (
        id, lecture_id, summary, topic_wise_notes, detailed_notes, beginner_explanation,
        revision_notes, important_questions, question_answers, mcqs, key_terms,
        action_items, formulas_and_examples, approval_status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'approved', ?, ?)`,
      [
        notesId,
        lecId,
        sampleNotes.summary,
        JSON.stringify(sampleNotes.topic_wise_notes),
        sampleNotes.detailed_notes,
        sampleNotes.beginner_explanation,
        JSON.stringify(sampleNotes.revision_notes),
        JSON.stringify(sampleNotes.important_questions),
        JSON.stringify(sampleNotes.question_answers),
        JSON.stringify(sampleNotes.mcqs),
        JSON.stringify(sampleNotes.key_terms),
        JSON.stringify(sampleNotes.action_items),
        JSON.stringify(sampleNotes.formulas_and_examples),
        now,
        now,
      ]
    );

    res.json({ success: true, message: 'Seed lecture created successfully.' });
  } catch (err: any) {
    console.error('Seed error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Setup Vite or Static Serving
async function startServer() {
  await getDb(); // Initialize SQLite DB

  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.resolve(process.cwd(), 'dist'))) {
    app.use(express.static(path.resolve(process.cwd(), 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(process.cwd(), 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lectra Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
