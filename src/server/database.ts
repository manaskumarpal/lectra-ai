import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'lectra.sqlite');

let dbInstance: Database | null = null;

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to load existing SQLite database, creating fresh one:', e);
      dbInstance = new SQL.Database();
    }
  } else {
    dbInstance = new SQL.Database();
  }

  initSchema(dbInstance);
  saveDb();
  return dbInstance;
}

function initSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS lectures (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      subject TEXT NOT NULL,
      teacher_name TEXT NOT NULL,
      lecture_date TEXT NOT NULL,
      duration_seconds INTEGER DEFAULT 0,
      audio_path TEXT,
      audio_mime TEXT,
      transcript TEXT,
      transcript_segments TEXT,
      processing_status TEXT DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      lecture_id TEXT UNIQUE NOT NULL,
      summary TEXT,
      topic_wise_notes TEXT,
      detailed_notes TEXT,
      beginner_explanation TEXT,
      revision_notes TEXT,
      important_questions TEXT,
      question_answers TEXT,
      mcqs TEXT,
      key_terms TEXT,
      action_items TEXT,
      formulas_and_examples TEXT,
      approval_status TEXT DEFAULT 'awaiting_review',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (lecture_id) REFERENCES lectures(id) ON DELETE CASCADE
    );
  `);
}

export function saveDb(): void {
  if (!dbInstance) return;
  try {
    const data = dbInstance.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}
