import { MODES } from "./registry";
import type { ModeId } from "./types";

export const ARTIFACT_OPEN = "<<<ARTIFACT";
export const ARTIFACT_CLOSE = "<<<END_ARTIFACT>>>";

export function systemPrompt(opts: {
  userName: string;
  mode: ModeId;
  agent?: string | null;
}) {
  const mode = MODES.find((m) => m.id === opts.mode);
  const agentNote = opts.agent
    ? `\nThe user invoked you via the "/${opts.agent}" agent — focus on that agent's specialty.`
    : "";
  return [
    `You are NISA (Neural Interactive Systematic Assistant) version 3 — ${opts.userName}'s personal "AI Operating System".`,
    `Tone: warm, casual, and helpful. Address the user by name (${opts.userName}) occasionally. Use emoji sparingly (😊 ✨ 🚀), never excessively.`,
    `Always reply in the language the user is using (default English).`,
    `If the user asks for a document, page, teaching material, or game, output it as an artifact: write complete self-contained HTML (inline CSS+JS, no external resources) between the lines ${ARTIFACT_OPEN} title="Title" kind="document">>> and ${ARTIFACT_CLOSE} — without markdown code fences around it. Before/after the artifact, write a short friendly explanation.`,
    mode?.system || "",
    agentNote,
  ]
    .filter(Boolean)
    .join("\n");
}

export function quizJSONPrompt(topic: string, grade: string, depth: string) {
  return `Create quiz data as VALID JSON (no other text, no markdown) for the topic "${topic}", level "${grade}", depth "${depth}".
Schema:
{
  "title": "Quiz ...: catchy title",
  "subject": "school subject, e.g. Natural Science",
  "grade": "${grade}",
  "minutes": 30,
  "instructions": "short instructions for students",
  "questions": [
    { "type": "mc", "prompt": "...", "options": ["...","...","...","..."], "answer": "text of the correct option", "points": 1, "explanation": "..." },
    { "type": "tf", "prompt": "... True or False?", "answer": "True|False", "points": 1 },
    { "type": "fill", "prompt": "a sentence with ________ to fill in.", "answer": "...", "points": 2 },
    { "type": "essay", "prompt": "...", "answer": "short sample answer", "points": 4 }
  ]
}
Rules: 8-10 mixed questions (mostly mc), language appropriate for the grade level, total points 18-22, high-quality unambiguous questions.`;
}

export function anagramJSONPrompt(topic: string) {
  return `Create anagram game data as VALID JSON (no other text, no markdown) for the topic "${topic}".
Schema:
{
  "title": "Word Builder: ${topic}",
  "topic": "${topic}",
  "words": [
    { "word": "WORD", "hint": "short hint", "category": "short category", "level": "EASY|MEDIUM|HARD" }
  ]
}
Rules: exactly 10 UNIQUE topic-related words, letters A-Z only with NO spaces/hyphens, 4-10 letters long, mixed levels (4 EASY, 4 MEDIUM, 2 HARD), all UPPERCASE.`;
}

export function tldrPrompt() {
  return "Write a TLDR of this conversation: 3-6 concise bullets, straight to the point, starting with '**TLDR:**'.";
}

export function titlePrompt() {
  return "Write a short title (3-6 words, Title Case, no quotation marks) summarizing this conversation. Reply with the title only.";
}
