import sqlite3
import json
import os
from datetime import datetime

DB_FILE = os.path.join(os.path.dirname(__file__), "lectra.db")

def get_connection():
    conn = sqlite3.connect(DB_FILE, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS lectures (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            subject TEXT NOT NULL,
            teacher_name TEXT NOT NULL,
            lecture_date TEXT NOT NULL,
            duration_seconds INTEGER DEFAULT 0,
            audio_path TEXT,
            transcript TEXT,
            processing_status TEXT DEFAULT 'draft',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    cursor.execute("""
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
        )
    """)
    conn.commit()
    conn.close()

def save_lecture(lecture_data):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT INTO lectures (id, title, subject, teacher_name, lecture_date, duration_seconds, audio_path, transcript, processing_status, created_at, updated_at)
        VALUES (:id, :title, :subject, :teacher_name, :lecture_date, :duration_seconds, :audio_path, :transcript, :processing_status, :created_at, :updated_at)
    """, {
        **lecture_data,
        "created_at": now,
        "updated_at": now
    })
    conn.commit()
    conn.close()

def get_all_lectures(subject=None, status=None, search=None):
    conn = get_connection()
    cursor = conn.cursor()
    query = """
        SELECT l.*, n.approval_status, (CASE WHEN n.id IS NOT NULL THEN 1 ELSE 0 END) as has_notes
        FROM lectures l
        LEFT JOIN notes n ON l.id = n.lecture_id
        WHERE 1=1
    """
    params = []
    if search:
        query += " AND (l.title LIKE ? OR l.subject LIKE ? OR l.teacher_name LIKE ?)"
        params.extend([f"%{search}%", f"%{search}%", f"%{search}%"])
    if subject and subject != "All":
        query += " AND l.subject = ?"
        params.append(subject)
    if status and status != "All":
        if status == "Approved":
            query += " AND n.approval_status = 'approved'"
        elif status == "Awaiting Review":
            query += " AND n.approval_status = 'awaiting_review'"
    query += " ORDER BY l.created_at DESC"
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def get_lecture_by_id(lecture_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM lectures WHERE id = ?", (lecture_id,))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def get_notes_by_lecture_id(lecture_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM notes WHERE lecture_id = ?", (lecture_id,))
    row = cursor.fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    for field in ['topic_wise_notes', 'revision_notes', 'important_questions', 'question_answers', 'mcqs', 'key_terms', 'action_items', 'formulas_and_examples']:
        if d.get(field):
            try:
                d[field] = json.loads(d[field])
            except:
                pass
    return d

def save_notes(notes_data):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("""
        INSERT OR REPLACE INTO notes (id, lecture_id, summary, topic_wise_notes, detailed_notes, beginner_explanation,
            revision_notes, important_questions, question_answers, mcqs, key_terms, action_items, formulas_and_examples,
            approval_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        notes_data.get('id', 'note_' + str(int(datetime.utcnow().timestamp()))),
        notes_data['lecture_id'],
        notes_data.get('summary', ''),
        json.dumps(notes_data.get('topic_wise_notes', [])),
        notes_data.get('detailed_notes', ''),
        notes_data.get('beginner_explanation', ''),
        json.dumps(notes_data.get('revision_notes', [])),
        json.dumps(notes_data.get('important_questions', [])),
        json.dumps(notes_data.get('question_answers', [])),
        json.dumps(notes_data.get('mcqs', [])),
        json.dumps(notes_data.get('key_terms', [])),
        json.dumps(notes_data.get('action_items', [])),
        json.dumps(notes_data.get('formulas_and_examples', [])),
        notes_data.get('approval_status', 'awaiting_review'),
        now,
        now
    ))
    cursor.execute("UPDATE lectures SET processing_status = ?, updated_at = ? WHERE id = ?", 
                   (notes_data.get('approval_status', 'awaiting_review'), now, notes_data['lecture_id']))
    conn.commit()
    conn.close()

def approve_lecture_notes(lecture_id, status='approved'):
    conn = get_connection()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    cursor.execute("UPDATE notes SET approval_status = ?, updated_at = ? WHERE lecture_id = ?", (status, now, lecture_id))
    cursor.execute("UPDATE lectures SET processing_status = ?, updated_at = ? WHERE id = ?", (status, now, lecture_id))
    conn.commit()
    conn.close()

def delete_lecture(lecture_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM notes WHERE lecture_id = ?", (lecture_id,))
    cursor.execute("DELETE FROM lectures WHERE id = ?", (lecture_id,))
    conn.commit()
    conn.close()
