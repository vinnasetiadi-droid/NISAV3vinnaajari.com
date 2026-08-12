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
    ? `\nUser memanggilmu lewat agent "/${opts.agent}" — fokuslah pada spesialisasi agent itu.`
    : "";
  return [
    `Kamu adalah NISA (Neural Interactive Systematic Assistant) versi 3 — "AI Operating System" pribadi milik ${opts.userName}.`,
    `Gaya bicara: hangat, kasual, dan membantu. Gunakan "aku" untuk dirimu dan "kamu" untuk user. Panggil user dengan namanya (${opts.userName}) sesekali. Emoji secukupnya (😊 ✨ 🚀), jangan berlebihan.`,
    `Selalu balas dalam bahasa yang dipakai user (default Bahasa Indonesia).`,
    `Jika user meminta dokumen, halaman, materi ajar, atau permainan, keluarkan sebagai artifact: tulis HTML lengkap self-contained (CSS+JS inline, tanpa resource eksternal) di antara baris ${ARTIFACT_OPEN} title="Judul" kind="document">>> dan ${ARTIFACT_CLOSE} — tanpa code fence markdown di sekelilingnya. Sebelum/ sesudah artifact, tulis penjelasan singkat yang ramah.`,
    mode?.system || "",
    agentNote,
  ]
    .filter(Boolean)
    .join("\n");
}

export function quizJSONPrompt(topic: string, grade: string, depth: string) {
  return `Buat data kuis dalam JSON VALID (tanpa teks lain, tanpa markdown) untuk topik "${topic}", jenjang "${grade}", kedalaman "${depth}".
Skema:
{
  "title": "Kuis ...: judul menarik",
  "subject": "mata pelajaran, mis. Ilmu Pengetahuan Alam (IPA)",
  "grade": "${grade}",
  "minutes": 30,
  "instructions": "instruksi singkat untuk siswa",
  "questions": [
    { "type": "mc", "prompt": "...", "options": ["...","...","...","..."], "answer": "teks opsi yang benar", "points": 1, "explanation": "..." },
    { "type": "tf", "prompt": "... Benar atau Salah?", "answer": "True|False", "points": 1 },
    { "type": "fill", "prompt": "kalimat dengan ________ untuk diisi.", "answer": "...", "points": 2 },
    { "type": "essay", "prompt": "...", "answer": "contoh jawaban ringkas", "points": 4 }
  ]
}
Aturan: 8-10 soal campuran (mayoritas mc), bahasa Indonesia sesuai jenjang, total poin 18-22, soal berkualitas dan tidak ambigu.`;
}

export function anagramJSONPrompt(topic: string) {
  return `Buat data game anagram dalam JSON VALID (tanpa teks lain, tanpa markdown) untuk topik "${topic}".
Skema:
{
  "title": "Word Builder: ${topic}",
  "topic": "${topic}",
  "words": [
    { "word": "KATA", "hint": "petunjuk singkat bahasa Indonesia", "category": "kategori singkat", "level": "EASY|MEDIUM|HARD" }
  ]
}
Aturan: tepat 10 kata UNIK terkait topik, huruf A-Z saja TANPA spasi/tanda hubung, panjang 4-10 huruf, campuran level (4 EASY, 4 MEDIUM, 2 HARD), semua UPPERCASE.`;
}

export function tldrPrompt() {
  return "Buat TLDR percakapan ini: 3-6 bullet ringkas dalam Bahasa Indonesia, langsung ke inti, awali dengan '**TLDR:**'.";
}

export function titlePrompt() {
  return "Buat judul singkat (3-6 kata, Bahasa Indonesia, Title Case, tanpa tanda kutip) yang merangkum percakapan ini. Balas judulnya saja.";
}
