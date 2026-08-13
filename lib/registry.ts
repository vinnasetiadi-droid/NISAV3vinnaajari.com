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
      "Response style: BRAINSTORM. Generate many diverse ideas, build on the user's ideas, explore before judging.",
  },
  {
    id: "comprehensive",
    name: "Comprehensive",
    desc: "Deep, thorough reasoning — weigh trade-offs and edge cases, structure the answer.",
    system:
      "Response style: COMPREHENSIVE. Reason deeply and thoroughly, weigh trade-offs and edge cases, structure the answer.",
  },
  {
    id: "deep",
    name: "Deep",
    desc: "Deep Research — plan, gather from many sources, verify, then answer (or write) with citations.",
    system:
      "Response style: DEEP RESEARCH. Plan, gather from many angles, verify, then answer with a research structure and sources when available.",
  },
  {
    id: "plan",
    name: "Plan",
    desc: "Plan-first — lay out the approach as clear steps and align before executing.",
    system:
      "Response style: PLAN-FIRST. Lay out the approach as clear steps and make sure it is aligned before executing.",
  },
  {
    id: "ringkas",
    name: "Concise",
    desc: "Concise — answer in the fewest words that still fully help; lead with the point.",
    system:
      "Response style: CONCISE. Answer as briefly as possible while still fully helping; get straight to the point.",
  },
  {
    id: "socratic",
    name: "Socratic",
    desc: "Teach by guiding questions — scaffold understanding instead of handing over the answer.",
    system:
      "Response style: SOCRATIC. Teach through guiding questions — build understanding step by step, do not hand over the final answer right away.",
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
    desc: "Create a print-ready practice quiz with an answer key from any topic.",
    elicit: true,
  },
  {
    id: "anagram",
    type: "SKILL",
    desc: "Create an instantly playable Word Builder (anagram) game from a topic.",
  },
];

export const TEMPLATES: { name: string; text: string }[] = [
  { name: "Summarize text", text: "Summarize the following text into key points:\n\n" },
  {
    name: "Fix grammar",
    text: "Fix the grammar and spelling of the following text without changing its meaning:\n\n",
  },
  {
    name: "Explain simply",
    text: "Explain the following topic in simple, beginner-friendly language:\n\n",
  },
  {
    name: "Reply to email",
    text: "Help me write a polite, professional reply to the following email:\n\n",
  },
  { name: "Step-by-step plan", text: "Create a step-by-step plan for:\n\n" },
  {
    name: "Translate (EN)",
    text: "Translate the following text into natural English:\n\n",
  },
];

export const HOME_SUGGESTIONS = [
  "Summarize a document in my Drive",
  "Help me write an email",
  "Explain with an example",
  "Create a study plan",
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
        q: "What grade level or stage of education is this test for?",
        options: [
          "Elementary school",
          "Middle school",
          "High school",
          "College / University",
        ],
      },
      {
        id: "depth",
        q: `How in-depth should the ${topic || "material"} being tested be?`,
        options: isFoto
          ? [
              "Basic (Need for water, light, CO2)",
              "Intermediate (Chloroplast and stomata structure)",
              "Advanced (Light reactions, Calvin cycle, and limiting factors)",
              "Comprehensive (From basics to biochemistry)",
            ]
          : [
              "Basic (core concepts & terms)",
              "Intermediate (applying concepts)",
              "Advanced (analysis & case studies)",
              "Comprehensive (from basics to advanced)",
            ],
      },
    ],
  };
};
