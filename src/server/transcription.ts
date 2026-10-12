import { GoogleGenAI } from '@google/genai';

export interface TranscriptionResult {
  transcript: string;
  languageDetected?: string;
  durationSeconds?: number;
}

export async function transcribeAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  languageHint?: string
): Promise<TranscriptionResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in the environment.');
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Ensure mimeType is valid audio format
  const validMime = mimeType.startsWith('audio/') ? mimeType : 'audio/webm';

  const audioPart = {
    inlineData: {
      mimeType: validMime,
      data: audioBase64,
    },
  };

  const languagePrompt = languageHint && languageHint !== 'auto'
    ? ` The spoken language is expected to be ${languageHint}. If there are terms or code in English or Hindi, capture them accurately.`
    : '';

  const promptText = `You are Lectra's professional educational speech-to-text engine.
Transcribe this lecture audio verbatim, accurately, and clearly.${languagePrompt}
Format the transcript cleanly with natural paragraph breaks and timestamps where appropriate (e.g. [00:00], [01:15]).
Correct minor phonetic stuttering while preserving all technical terminology, equations, definitions, and teacher explanations.
Do not summarize or invent words that were not spoken.
Return ONLY the transcription text.`;

  try {
    // Primary transcription model: gemini-3.5-transcribe
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-transcribe',
      contents: {
        parts: [audioPart, { text: promptText }],
      },
    });

    const transcriptText = response.text?.trim() || '';
    if (!transcriptText) {
      throw new Error('The transcription engine returned an empty result. Please verify the audio volume and clarity.');
    }

    return {
      transcript: transcriptText,
      languageDetected: languageHint || 'Auto-detected',
    };
  } catch (err: any) {
    console.warn('gemini-3.5-transcribe attempt error, attempting gemini-3.8-flash fallback:', err?.message);
    // Fallback to gemini-3.8-flash which also has full multimodal audio understanding
    const fallbackResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [audioPart, { text: promptText }],
      },
    });

    const fallbackText = fallbackResponse.text?.trim() || '';
    if (!fallbackText) {
      throw new Error(`Audio transcription failed: ${err?.message || 'Empty response'}`);
    }

    return {
      transcript: fallbackText,
      languageDetected: languageHint || 'Auto-detected',
    };
  }
}
