import os
import google.generativeai as genai

def transcribe_audio_file(audio_path, language_hint=None):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY is not set in environment or Replit Secrets.")

    genai.configure(api_key=api_key)

    uploaded_file = genai.upload_file(path=audio_path)
    
    prompt = "Transcribe this classroom lecture audio accurately and verbatim. Format with clean timestamps and natural paragraphs."
    if language_hint and language_hint != "Auto":
        prompt += f" Spoken language is {language_hint}."

    model = genai.GenerativeModel("gemini-1.5-flash")
    response = model.generate_content([uploaded_file, prompt])
    
    return response.text.strip()
