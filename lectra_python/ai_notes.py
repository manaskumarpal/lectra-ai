import os
import json
import google.generativeai as genai

def generate_ai_notes(transcript, title, subject, teacher):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is missing.")

    genai.configure(api_key=api_key)

    system_instruction = """You are Lectra's educational note synthesis model. Ground all notes in the lecture transcript. Return valid JSON containing:
- summary (string)
- topic_wise_notes (list of {topic, subtopics, summary})
- detailed_notes (markdown string)
- beginner_explanation (string)
- revision_notes (list of strings)
- important_questions (list of strings)
- question_answers (list of {question, answer})
- mcqs (list of {question, options, correctAnswer, explanation})
- key_terms (list of {term, definition})
- action_items (list of strings)
- formulas_and_examples (list of {type, title, content})
Do not fabricate homework or formulas not in transcript."""

    prompt = f"""Lecture: {title} | Subject: {subject} | Teacher: {teacher}
TRANSCRIPT:
\"\"\"{transcript}\"\"\"

Generate complete notes in JSON."""

    model = genai.GenerativeModel("gemini-1.5-flash", system_instruction=system_instruction)
    response = model.generate_content(prompt, generation_config={"response_mime_type": "application/json"})
    return json.loads(response.text)
