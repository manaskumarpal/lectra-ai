import { Lecture, Notes } from '../types';

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function sanitizeFilename(title: string): string {
  return title.replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 50);
}

export function exportTranscriptText(lecture: Lecture) {
  const title = sanitizeFilename(lecture.title);
  const header = `LECTRA LECTURE TRANSCRIPT
=========================================
Title: ${lecture.title}
Subject: ${lecture.subject}
Teacher: ${lecture.teacher_name}
Date: ${lecture.lecture_date}
Duration: ${formatDuration(lecture.duration_seconds)}
Platform: Lectra (AI Lecture to Notes Platform)
=========================================

TRANSCRIPT:
${lecture.transcript || 'No transcript recorded.'}
`;
  downloadFile(`${title}-transcript.txt`, header);
}

export function exportSummaryText(lecture: Lecture, notes: Notes) {
  const title = sanitizeFilename(lecture.title);
  const content = `LECTURE SUMMARY: ${lecture.title}
Subject: ${lecture.subject} | Teacher: ${lecture.teacher_name}
Date: ${lecture.lecture_date}

${notes.summary || 'No summary available.'}

KEY REVISION POINTS:
${notes.revision_notes?.map((pt, i) => `${i + 1}. ${pt}`).join('\n') || 'None'}
`;
  downloadFile(`${title}-summary.txt`, content);
}

export function exportMarkdownNotes(lecture: Lecture, notes: Notes) {
  const title = sanitizeFilename(lecture.title);
  const md = `# ${lecture.title}

* **Subject:** ${lecture.subject}
* **Instructor:** ${lecture.teacher_name}
* **Date:** ${lecture.lecture_date}
* **Duration:** ${formatDuration(lecture.duration_seconds)}
* **Platform:** Lectra AI

---

## 📌 Executive Summary
${notes.summary}

---

## 📚 Topic Breakdown
${notes.topic_wise_notes?.map(t => `### ${t.topic}
* **Subtopics:** ${t.subtopics.join(', ')}
${t.summary}
`).join('\n\n')}

---

## 📖 Detailed Lecture Notes
${notes.detailed_notes}

---

## 💡 Beginner-Friendly Explanation ("Explain Like I'm 12")
${notes.beginner_explanation}

---

## ⚡ Quick Revision Points
${notes.revision_notes?.map(r => `* ${r}`).join('\n')}

---

## 🔑 Key Terms & Glossary
| Term | Definition | Context |
| :--- | :--- | :--- |
${notes.key_terms?.map(k => `| **${k.term}** | ${k.definition} | ${k.context || '-'} |`).join('\n')}

---

## 📐 Formulas & Real-World Examples
${notes.formulas_and_examples?.map(f => `### [${f.type.toUpperCase()}] ${f.title}
\`\`\`
${f.content}
\`\`\`
`).join('\n\n')}

---

## ❓ Question Bank & Grounded Answers
${notes.question_answers?.map((qa, i) => `### Q${i + 1}: ${qa.question}
**Answer:** ${qa.answer}  
${qa.transcript_reference ? `*> Reference from lecture:* "${qa.transcript_reference}"` : ''}
`).join('\n\n')}

---

## 📝 Practice Multiple Choice Questions (MCQs)
${notes.mcqs?.map((m, i) => `### MCQ ${i + 1}: ${m.question}
${m.options.map(opt => `- [ ] ${opt}`).join('\n')}
* **Correct Answer:** ${m.correctAnswer}
* **Explanation:** ${m.explanation}
`).join('\n\n')}

---

## 📋 Action Items & Homework
${notes.action_items?.map(a => `* [ ] ${a}`).join('\n')}

---
*Generated with Lectra — Every Lecture. Clearly Understood.*
`;
  downloadFile(`${title}-notes.md`, md, 'text/markdown;charset=utf-8');
}

export function exportQuestionBankText(lecture: Lecture, notes: Notes) {
  const title = sanitizeFilename(lecture.title);
  const content = `LECTRA QUESTION BANK: ${lecture.title}
Subject: ${lecture.subject} | Teacher: ${lecture.teacher_name}

==============================
I. CONCEPTUAL QUESTIONS
==============================
${notes.important_questions?.map((q, i) => `${i + 1}. ${q}`).join('\n\n')}

==============================
II. QUESTIONS & DETAILED ANSWERS
==============================
${notes.question_answers?.map((qa, i) => `Q${i + 1}: ${qa.question}
ANSWER: ${qa.answer}
${qa.transcript_reference ? `TRANSCRIPT SOURCE: "${qa.transcript_reference}"` : ''}
----------------------------------------`).join('\n\n')}
`;
  downloadFile(`${title}-question-bank.txt`, content);
}

export function exportMCQsJSON(lecture: Lecture, notes: Notes) {
  const title = sanitizeFilename(lecture.title);
  const payload = {
    lectureTitle: lecture.title,
    subject: lecture.subject,
    teacher: lecture.teacher_name,
    exportedAt: new Date().toISOString(),
    mcqs: notes.mcqs || [],
  };
  downloadFile(`${title}-mcqs.json`, JSON.stringify(payload, null, 2), 'application/json');
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
