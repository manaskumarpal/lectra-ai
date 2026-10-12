# Lectra — AI-Powered Lecture to Notes Platform

> **Tagline:** *Every Lecture. Clearly Understood.*

**Lectra** is an intelligent educational web application designed for university professors, school educators, and students. It captures raw classroom speech (via device microphones or audio file uploads), transcribes it verbatim using Google Gemini Speech-to-Text models, and synthesizes 11 structured pedagogical assets—ranging from executive summaries and topic breakdowns to flashcards, grounded Q&A, and multiple-choice quizzes.

---

## 📌 Problem Statement

College lectures often last 45 to 90 minutes. Students struggle between paying attention and frantically typing notes. Traditional recording devices capture hours of audio that nobody has time to re-listen to. Existing transcription software merely generates unformatted walls of text filled with inaccuracies and without any pedagogical structure.

## 🚀 The Solution: Lectra

**One lecture recording → Structured transcript → Organised notes → Better learning.**

Lectra bridges the gap by providing:
1. **Live Microphone Recording:** Up to 60+ minutes with real-time waveform visualization, pause/resume, and instant playback.
2. **Audio File Upload:** Drag-and-drop support for WAV, MP3, M4A, WEBM, and OGG formats.
3. **Accurate Speech-to-Text:** Gemini 3.5 Transcribe engine preserving technical equations and multilingual terminology (English, Hindi, Hinglish, Spanish).
4. **Pedagogical AI Note Synthesis:** Gemini 3.8 Flash structured synthesis generating 11 specific sections:
   - Executive Summary
   - Topic-Wise Breakdown
   - Comprehensive Markdown Notes
   - Beginner-Friendly Explanation ("Explain Like I'm 12")
   - High-Yield Quick Revision Bullet Points
   - Conceptual Questions & Grounded Q&A with transcript citations
   - Practice MCQs with 4 options, correct answer tag, and reasoning
   - Key Terms & Definitions Glossary
   - Extracted Formulas, Calculations, and Real-World Examples
   - Action Items, Homework, and Reading Assignments
5. **Teacher Review & Approval Studio:** Edit any section, regenerate specific modules with custom guidance, and approve notes for student publishing.
6. **Student Learning Portal:** An isolated, distraction-free study space showing **only** teacher-approved materials with interactive flashcards, self-grading MCQ quizzes with confetti celebration, and study guide downloads.
7. **Complete Export Center:** Export notes to Markdown (`.md`), plain-text summaries, question banks, and JSON datasets.

---

## 🏗️ Architecture & Technology Stack

Lectra offers two production-grade runtimes:

### 1. Modern Full-Stack (Primary Live App on Port 3000)
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Canvas Confetti.
- **Backend:** Node.js Express server mounting Vite middleware with high-payload limits.
- **Persistent Database:** SQLite 3 (`data/lectra.sqlite`) with parameterized SQL operations.
- **AI Models:**
  - `gemini-3.5-transcribe` for verbatim speech-to-text.
  - `gemini-3.8-flash` for high-throughput pedagogical note synthesis.

### 2. Python / Streamlit Option (`/lectra_python`)
- **Web Interface:** Streamlit (`lectra_python/app.py`).
- **Logic:** Python 3.10+, Google GenAI SDK (`google-generativeai`), SQLite (`lectra_python/database.py`).

---

## 🛠️ Local Setup Instructions

### Option A: Running the Full-Stack React + Node App (Recommended)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/lectra.git
   cd lectra
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key:
   ```env
   GEMINI_API_KEY="your_actual_gemini_api_key_here"
   PORT=3000
   ```

4. **Launch the development server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

### Option B: Running the Streamlit Python App

1. **Navigate to the python directory:**
   ```bash
   cd lectra_python
   ```

2. **Install python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Export your API Key:**
   ```bash
   export GEMINI_API_KEY="your_actual_gemini_api_key_here"
   ```

4. **Run Streamlit:**
   ```bash
   streamlit run app.py
   ```

---

## 🔒 Privacy & Classroom Ethics

- **Explicit Consent:** Never record a lecture without written or verbal consent from the instructor, guest lecturers, and students.
- **Local Persistence:** Audio files and SQLite databases are stored locally on your machine or container. They are ignored in `.gitignore` to prevent leaking private recordings.
- **Grounded AI Guardrails:** Lectra enforces strict anti-hallucination prompts. If homework or formulas were not explicitly mentioned in class, the AI explicitly reports "None mentioned".

---

## 🔮 Future Roadmap: The Lectra Wearable Device

- **Lightweight Lapel Microphone:** 18g collar-clip hardware with dual-capsule cardioid beamforming to eliminate classroom ambient noise.
- **Instant Wi-Fi Sync:** One-button lecture sync to Lectra cloud without opening a laptop.
- **Multilingual Code-Switching:** Advanced acoustic models tuned for rapid Hindi-English mixed collegiate speech.
- **Slide & Whiteboard Vision:** Multimodal visual capture correlating board diagrams with spoken timestamps.
- **Enterprise LMS Integration:** Direct sync with Canvas, Blackboard, and Google Classroom.

---

*Lectra — Empowering educators, enlightening students.*
