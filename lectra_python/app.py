import streamlit as st
import os
import time
from database import init_db, get_all_lectures, save_lecture, get_lecture_by_id, get_notes_by_lecture_id, save_notes, approve_lecture_notes, delete_lecture
from transcription import transcribe_audio_file
from ai_notes import generate_ai_notes
from audio_utils import save_uploaded_audio

st.set_page_config(page_title="Lectra - AI Lecture to Notes Platform", layout="wide", page_icon="🎙️")

init_db()

st.sidebar.title("🎙️ Lectra")
st.sidebar.caption("Every Lecture. Clearly Understood.")

menu = st.sidebar.radio("Navigation", ["Dashboard", "Record / Upload", "My Lectures", "AI Notes Studio", "Student View", "Settings"])

if menu == "Dashboard":
    st.title("📊 Educator Dashboard")
    lectures = get_all_lectures()
    total_lectures = len(lectures)
    total_duration = sum(l.get("duration_seconds", 0) for l in lectures)
    approved_count = sum(1 for l in lectures if l.get("approval_status") == "approved")
    awaiting_count = sum(1 for l in lectures if l.get("approval_status") == "awaiting_review")

    col1, col2, col3, col4 = st.columns(4)
    col1.metric("Total Lectures", total_lectures)
    col2.metric("Total Audio (mins)", round(total_duration / 60, 1))
    col3.metric("Awaiting Review", awaiting_count)
    col4.metric("Approved for Students", approved_count)

    st.subheader("Recent Lectures")
    if lectures:
        for lec in lectures[:5]:
            with st.container():
                st.write(f"**{lec['title']}** — *{lec['subject']}* ({lec['teacher_name']})")
                st.caption(f"Status: {lec.get('processing_status')} | Date: {lec.get('lecture_date')}")
                st.divider()
    else:
        st.info("No lectures recorded yet. Start by uploading or recording a lecture!")

elif menu == "Record / Upload":
    st.title("🎙️ Capture Lecture Audio")
    with st.form("lecture_form"):
        title = st.text_input("Lecture Title *", placeholder="e.g. Quantum Computing Fundamentals")
        subject = st.text_input("Subject *", placeholder="e.g. Physics")
        teacher = st.text_input("Instructor Name", placeholder="e.g. Dr. Feynman")
        audio_file = st.file_uploader("Upload Audio Recording (WAV, MP3, M4A, WEBM)", type=["wav", "mp3", "m4a", "webm"])
        submitted = st.form_submit_button("Save & Transcribe")

        if submitted:
            if not title or not subject or not audio_file:
                st.error("Please provide title, subject, and an audio file.")
            else:
                path = save_uploaded_audio(audio_file)
                st.info("Transcribing audio using Gemini...")
                try:
                    transcript = transcribe_audio_file(path)
                    lec_id = "lec_" + str(int(time.time()))
                    save_lecture({
                        "id": lec_id,
                        "title": title,
                        "subject": subject,
                        "teacher_name": teacher or "Instructor",
                        "lecture_date": time.strftime("%Y-%m-%d"),
                        "duration_seconds": 1800,
                        "audio_path": path,
                        "transcript": transcript,
                        "processing_status": "transcript_ready"
                    })
                    st.success("Lecture saved and transcribed! Go to AI Notes Studio to generate notes.")
                except Exception as e:
                    st.error(f"Transcription failed: {e}")

elif menu == "My Lectures":
    st.title("📚 My Lectures Library")
    lectures = get_all_lectures()
    for lec in lectures:
        st.markdown(f"### {lec['title']}")
        st.write(f"**Subject:** {lec['subject']} | **Teacher:** {lec['teacher_name']} | **Status:** {lec['processing_status']}")
        if st.button("Delete", key=f"del_{lec['id']}"):
            delete_lecture(lec['id'])
            st.rerun()
        st.divider()

elif menu == "Student View":
    st.title("🎓 Student Learning Portal")
    approved = [l for l in get_all_lectures() if l.get("approval_status") == "approved"]
    if not approved:
        st.info("No approved lectures are available for students yet.")
    else:
        for lec in approved:
            st.subheader(lec['title'])
            st.caption(f"{lec['subject']} • {lec['teacher_name']}")
            notes = get_notes_by_lecture_id(lec['id'])
            if notes:
                with st.expander("Executive Summary"):
                    st.write(notes.get("summary"))
                with st.expander("Detailed Notes"):
                    st.markdown(notes.get("detailed_notes"))
            st.divider()

elif menu == "Settings":
    st.title("⚙️ Settings & System Information")
    st.write("**Model:** Gemini Multimodal (Speech-to-Text & Reasoning)")
    st.write("**Database:** Local SQLite (lectra.db)")
    st.info("Classroom Privacy: Always obtain explicit student and instructor consent prior to lecture recording.")
