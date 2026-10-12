import { GoogleGenAI, Type } from '@google/genai';

export interface GeneratedNotesData {
  summary: string;
  topic_wise_notes: Array<{
    topic: string;
    subtopics: string[];
    summary: string;
  }>;
  detailed_notes: string;
  beginner_explanation: string;
  revision_notes: string[];
  important_questions: string[];
  question_answers: Array<{
    question: string;
    answer: string;
    transcript_reference?: string;
  }>;
  mcqs: Array<{
    question: string;
    options: string[];
    correctAnswer: string;
    explanation: string;
  }>;
  key_terms: Array<{
    term: string;
    definition: string;
    context?: string;
  }>;
  action_items: string[];
  formulas_and_examples: Array<{
    type: 'formula' | 'example' | 'calculation';
    title: string;
    content: string;
  }>;
}

export async function generateLectureNotes(
  transcript: string,
  lectureMetadata: { title: string; subject: string; teacherName: string }
): Promise<GeneratedNotesData> {
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

  const systemInstruction = `You are Lectra's educational AI engine, an expert pedagogical assistant that transforms real lecture transcripts into structured, deeply pedagogical, and accessible learning materials.

CRITICAL ACCURACY & GROUNDING RULES:
1. Use the provided lecture transcript as your primary factual source.
2. Ground all explanations, definitions, and answers in what the teacher discussed. Never fabricate quotations, assignments, or formulas that were not mentioned.
3. If homework or deadlines were NOT mentioned in the lecture, state explicitly: "No specific homework or deadlines were mentioned in this lecture."
4. If formulas were NOT mentioned, state explicitly: "No mathematical or scientific formulas were introduced in this lecture."
5. Clearly distinguish lecture-derived facts from supplementary beginner-friendly analogies.
6. If the transcript is brief or unclear on certain details, reflect that honestly without making up false facts.`;

  const prompt = `LECTURE METADATA:
Title: ${lectureMetadata.title}
Subject: ${lectureMetadata.subject}
Teacher: ${lectureMetadata.teacherName}

TRANSCRIPT:
"""
${transcript}
"""

Please analyze this transcript and generate complete, comprehensive notes matching the JSON schema provided.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      systemInstruction,
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: {
            type: Type.STRING,
            description: 'A comprehensive, clear executive summary of the entire lecture (2-4 paragraphs).',
          },
          topic_wise_notes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                subtopics: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                summary: { type: Type.STRING },
              },
              required: ['topic', 'subtopics', 'summary'],
            },
            description: 'Major topics and subtopics covered with structured breakdowns.',
          },
          detailed_notes: {
            type: Type.STRING,
            description: 'In-depth markdown notes containing headings, bullet points, core concepts, definitions, and relationships between concepts.',
          },
          beginner_explanation: {
            type: Type.STRING,
            description: 'An intuitive, beginner-friendly explanation ("Explain Like I am 12") using relatable everyday analogies to clarify difficult concepts without losing technical correctness.',
          },
          revision_notes: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'High-yield, bullet-pointed revision points for rapid exam review.',
          },
          important_questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Conceptual and analytical questions based directly on the lecture.',
          },
          question_answers: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING },
                transcript_reference: { type: Type.STRING },
              },
              required: ['question', 'answer'],
            },
            description: 'Important questions with comprehensive answers grounded in the lecture.',
          },
          mcqs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctAnswer', 'explanation'],
            },
            description: '4-choice multiple choice practice questions testing core concepts with correct answers and explanations.',
          },
          key_terms: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING },
                context: { type: Type.STRING },
              },
              required: ['term', 'definition'],
            },
            description: 'Glossary of key vocabulary, technical terms, and their definitions as used in the lecture.',
          },
          action_items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Action items, homework, deadlines, or readings assigned by the instructor. If none mentioned, note that explicitly.',
          },
          formulas_and_examples: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, description: 'formula, example, or calculation' },
                title: { type: Type.STRING },
                content: { type: Type.STRING },
              },
              required: ['type', 'title', 'content'],
            },
            description: 'Formulas, equations, calculations, or real-world examples discussed in the lecture.',
          },
        },
        required: [
          'summary',
          'topic_wise_notes',
          'detailed_notes',
          'beginner_explanation',
          'revision_notes',
          'important_questions',
          'question_answers',
          'mcqs',
          'key_terms',
          'action_items',
          'formulas_and_examples',
        ],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error('AI note generation produced an empty response.');
  }

  try {
    const parsed = JSON.parse(text) as GeneratedNotesData;
    return parsed;
  } catch (err: any) {
    console.error('Failed to parse Gemini JSON output:', text);
    throw new Error('Failed to parse generated notes schema: ' + err.message);
  }
}

export async function regenerateSection(
  sectionName: string,
  transcript: string,
  lectureMetadata: { title: string; subject: string; teacherName: string },
  customInstructions?: string
): Promise<any> {
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

  const prompt = `You are Lectra's educational assistant.
Regenerate ONLY the section: "${sectionName}" for the lecture titled "${lectureMetadata.title}" (${lectureMetadata.subject}).

TRANSCRIPT:
"""
${transcript}
"""

${customInstructions ? `USER INSTRUCTIONS: ${customInstructions}` : ''}

Respond in valid JSON with an object having the key "${sectionName}".`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.8-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
    },
  });

  const text = response.text?.trim() || '{}';
  return JSON.parse(text);
}
