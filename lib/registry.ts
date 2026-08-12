import type { ModeId } from "./types";

export interface ModeDef {
  id: ModeId;
  name: string;
  desc: string;
  system: string;
}

export const MODES: ModeDef[] = [
  {
    id: "auto",
    name: "Auto",
    desc: "Let NISA choose how to respond",
    system: "",
  },
  {
    id: "brainstorm",
    name: "Brainstorm",
    desc: "Brainstorm — generate many ideas, build on theirs, explore before judging.",
    system:
      "Gaya respons: BRAINSTORM. Hasilkan banyak ide beragam, bangun dari ide user, eksplorasi dulu sebelum menilai.",
  },
  {
    id: "comprehensive",
    name: "Comprehensive",
    desc: "Deep, thorough reasoning — weigh trade-offs and edge cases, structure the answer.",
    system:
      "Gaya respons: COMPREHENSIVE. Nalar mendalam dan menyeluruh, timbang trade-off dan edge case, susun jawaban terstruktur.",
  },
  {
    id: "deep",
    name: "Deep",
    desc: "Deep Research — plan, gather from many sources, verify, then answer (or write) with citations.",
    system:
      "Gaya respons: DEEP RESEARCH. Rencanakan, kumpulkan dari banyak sudut, verifikasi, lalu jawab dengan struktur riset dan sumber bila ada.",
  },
  {
    id: "plan",
    name: "Plan",
    desc: "Plan-first — lay out the approach as clear steps and align before executing.",
    system:
      "Gaya respons: PLAN-FIRST. Susun pendekatan sebagai langkah-langkah jelas dan pastikan selaras sebelum eksekusi.",
  },
  {
    id: "ringkas",
    name: "Ringkas",
    desc: "Concise — answer in the fewest words that still fully help; lead with the point.",
    system:
      "Gaya respons: RINGKAS. Jawab sesingkat mungkin namun tetap membantu penuh; langsung ke inti.",
  },
  {
    id: "socratic",
    name: "Socratic",
    desc: "Teach by guiding questions — scaffold understanding instead of handing over the answer.",
    system:
      "Gaya respons: SOCRATIC. Ajari lewat pertanyaan penuntun — bangun pemahaman bertahap, jangan langsung beri jawaban akhir.",
  },
];

export interface CommandDef {
  id: string;
  type: "AGENT" | "SKILL";
  desc: string;
  elicit?: boolean;
}

export const COMMANDS: CommandDef[] = [
  {
    id: "edu-games-assistant",
    type: "AGENT",
    desc: "Creates playable educational games for school children (quiz arcade, word games, matching).",
  },
  {
    id: "main",
    type: "AGENT",
    desc: "The default general assistant — routes any request to the right skill or tool.",
  },
  {
    id: "research-assistant",
    type: "AGENT",
    desc: "Answers questions, extracts data, and summarizes over user documents and the web.",
  },
  {
    id: "workspace-assistant",
    type: "AGENT",
    desc: "Creates editable, downloadable office documents (Word/Excel/PowerPoint style).",
  },
  {
    id: "charts",
    type: "SKILL",
    desc: "Show a chart inline in your reply by emitting a fenced ```chart block with JSON data.",
  },
  {
    id: "diagrams",
    type: "SKILL",
    desc: "Show a diagram inline in your reply by emitting a fenced ```mermaid block.",
  },
  {
    id: "edu-games",
    type: "SKILL",
    desc: "Generate playable, self-contained educational games for school children.",
  },
  {
    id: "edu-teacher",
    type: "SKILL",
    desc: "Generate finished, editable teaching materials for teachers (lesson plans, worksheets).",
  },
  {
    id: "quiz",
    type: "SKILL",
    desc: "Buat latihan soal / kuis siap cetak dengan kunci jawaban dari topik apa pun.",
    elicit: true,
  },
  {
    id: "anagram",
    type: "SKILL",
    desc: "Buat game Word Builder (anagram) yang bisa langsung dimainkan dari sebuah topik.",
  },
];

export const TEMPLATES: { name: string; text: string }[] = [
  { name: "Ringkas teks", text: "Ringkas teks berikut menjadi poin-poin utama:\n\n" },
  {
    name: "Perbaiki tata bahasa",
    text: "Perbaiki tata bahasa dan ejaan teks berikut tanpa mengubah maknanya:\n\n",
  },
  {
    name: "Jelaskan sederhana",
    text: "Jelaskan topik berikut dengan bahasa sederhana seperti untuk pemula:\n\n",
  },
  {
    name: "Balas email",
    text: "Bantu aku menulis balasan email yang sopan dan profesional untuk email berikut:\n\n",
  },
  { name: "Rencana langkah", text: "Buatkan rencana langkah demi langkah untuk:\n\n" },
  {
    name: "Terjemahkan (EN)",
    text: "Terjemahkan teks berikut ke bahasa Inggris yang natural:\n\n",
  },
];

export const HOME_SUGGESTIONS = [
  "Ringkas dokumen di Drive-ku",
  "Bantu tulis email",
  "Jelaskan dengan contoh",
  "Buatkan rencana belajar",
];

export const REPLY_SUGGESTIONS = [
  "Explain in more detail",
  "Summarize the key points",
  "Give a concrete example",
  "What are the next steps?",
];

export interface AIModelDef {
  id: string;
  name: string;
  kb: string;
  desc: string;
  /** kelas gradient untuk blob */
  grad: string;
}

export const AI_MODELS: AIModelDef[] = [
  {
    id: "alf",
    name: "Alf",
    kb: "20B Knowledge Base",
    desc: "Lightweight Model with fast & efficient processing for K–12, literacy, and pilot programs",
    grad: "from-teal-300 via-cyan-400 to-blue-500",
  },
  {
    id: "raa",
    name: "Raa",
    kb: "32B Knowledge Base",
    desc: "Balanced performance and advanced reasoning for universities, professional training, and curriculum design",
    grad: "from-blue-500 via-purple-500 to-fuchsia-500",
  },
  {
    id: "zee",
    name: "Zee",
    kb: "132B Knowledge Base",
    desc: "Flagship scalability and multilingual personalization for national programs and R&D hubs",
    grad: "from-rose-500 via-red-400 to-orange-400",
  },
];

export interface ServerDef {
  name: string;
  tools: number;
  online: boolean;
  desc: string;
}

export const SERVERS: ServerDef[] = [
  { name: "nisa-core", tools: 14, online: true, desc: "Reasoning, memory & routing" },
  { name: "drive", tools: 9, online: true, desc: "Documents, artifacts & files" },
  { name: "edu-tools", tools: 16, online: true, desc: "Quiz, games & teaching materials" },
  { name: "workspace", tools: 13, online: true, desc: "Docs, sheets & slides authoring" },
  { name: "web-search", tools: 7, online: false, desc: "Live web search & fetch" },
];

export const QUIZ_ELICITATION = (topic: string) => {
  const isFoto = /fotosintesis|photosint/i.test(topic);
  return {
    skillId: "quiz",
    topic,
    questions: [
      {
        id: "grade",
        q: "Untuk tingkat kelas atau jenjang pendidikan mana tes ini ditujukan?",
        options: [
          "SD (Sekolah Dasar)",
          "SMP (Sekolah Menengah Pertama)",
          "SMA (Sekolah Menengah Atas)",
          "Perguruan Tinggi",
        ],
      },
      {
        id: "depth",
        q: `Seberapa mendalam materi ${topic || "ini"} yang ingin diuji?`,
        options: isFoto
          ? [
              "Dasar (Kebutuhan air, cahaya, CO2)",
              "Menengah (Struktur kloroplas dan stomata)",
              "Lanjut (Reaksi terang, siklus Calvin, dan faktor pembatas)",
              "Komprehensif (Dari dasar hingga biokimia)",
            ]
          : [
              "Dasar (konsep & istilah utama)",
              "Menengah (penerapan konsep)",
              "Lanjut (analisis & studi kasus)",
              "Komprehensif (dari dasar hingga lanjutan)",
            ],
      },
    ],
  };
};
