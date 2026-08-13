import type { AnagramData, QuizData } from "./types";

/** Server-side mock brain used when ANTHROPIC_API_KEY is missing (demo mode). */

export function mockGreeting(name: string) {
  const h = new Date().getHours();
  const tod = h < 11 ? "morning" : h < 18 ? "afternoon" : "evening";
  return `Good ${tod}, ${name}! 😊 How can I help you today?`;
}

export function isGreeting(text: string) {
  return /\b(hai|halo|hallo|hello|hey|hi|pagi|siang|sore|malam|morning|afternoon|evening|assalamualaikum)\b/i.test(
    text.trim()
  );
}

export function mockGeneric(name: string) {
  return (
    `I'm running in **demo mode** because \`ANTHROPIC_API_KEY\` hasn't been set in \`.env.local\`, ` +
    `so my answers are limited for now, ${name} 😅\n\n` +
    `Still, almost every feature can be tried:\n\n` +
    `- type \`/quiz create practice questions about photosynthesis\` for a print-ready quiz\n` +
    `- type \`/anagram create one about the solar system\` for a Word Builder game\n` +
    `- upload a file to **Drive**, then mention it with \`@\` in chat\n` +
    `- also try the **TLDR**, **Compact**, and **New Doc** buttons above\n\n` +
    `Once the API key is set, I'll answer any question live. ✨`
  );
}

export function mockTLDR(msgCount: number) {
  return (
    `**TLDR:**\n` +
    `- This conversation contains ${msgCount} messages between you and NISA.\n` +
    `- Demo mode is active — set \`ANTHROPIC_API_KEY\` for a real summary.\n` +
    `- Try \`/quiz\` or \`/anagram\` to see an interactive artifact.`
  );
}

export function mockTitle(firstUserText: string, name: string) {
  if (isGreeting(firstUserText)) {
    const h = new Date().getHours();
    const tod = h < 11 ? "Morning" : h < 18 ? "Afternoon" : "Evening";
    return `Good ${tod} Greeting From ${cap(name)}`;
  }
  const words = firstUserText
    .replace(/^\/[\w-]+\s*/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map(cap)
    .join(" ");
  return words || "New Conversation";
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function mockQuiz(topic: string, grade: string): QuizData {
  const isFoto = /fotosintesis|photosint/i.test(topic);
  if (isFoto) {
    return {
      title: "Science Quiz: The Secrets of Photosynthesis",
      subject: "Natural Science",
      grade,
      minutes: 30,
      instructions:
        "Read each question carefully. You have 30 minutes to complete this quiz. Work honestly and carefully!",
      questions: [
        {
          type: "mc",
          prompt:
            "What is the name of the process green plants use to make their own food?",
          options: ["Respiration", "Photosynthesis", "Evaporation", "Absorption"],
          answer: "Photosynthesis",
          points: 1,
          explanation:
            "Photosynthesis comes from photo (light) and synthesis (putting together).",
        },
        {
          type: "mc",
          prompt:
            "Which part of the plant is mainly responsible for photosynthesis?",
          options: ["Roots", "Stem", "Leaves", "Flowers"],
          answer: "Leaves",
          points: 1,
          explanation: "Leaves contain lots of chlorophyll in their palisade tissue.",
        },
        {
          type: "tf",
          prompt:
            "Plants need carbon dioxide (CO2) from the air to carry out photosynthesis. True or False?",
          answer: "True",
          points: 1,
        },
        {
          type: "fill",
          prompt:
            "The green pigment in leaves that captures energy from sunlight is called ________.",
          answer: "Chlorophyll",
          points: 2,
        },
        {
          type: "mc",
          prompt:
            "What do plant roots absorb from the soil to help the process of photosynthesis?",
          options: ["Sunlight", "Oxygen", "Water and minerals", "Carbon dioxide"],
          answer: "Water and minerals",
          points: 2,
        },
        {
          type: "mc",
          prompt: "The product of photosynthesis that becomes food for the plant is ...",
          options: ["Oxygen", "Carbohydrates (starch)", "Water", "Nitrogen"],
          answer: "Carbohydrates (starch)",
          points: 2,
          explanation: "Starch is stored as a food reserve.",
        },
        {
          type: "tf",
          prompt: "Photosynthesis can only happen at night. True or False?",
          answer: "False",
          points: 1,
        },
        {
          type: "fill",
          prompt:
            "Besides food, photosynthesis also produces ________ gas, which we breathe in.",
          answer: "Oxygen",
          points: 2,
        },
        {
          type: "mc",
          prompt: "Which of these is NOT an ingredient of photosynthesis?",
          options: ["Water", "Sunlight", "Carbon dioxide", "Oxygen"],
          answer: "Oxygen",
          points: 2,
          explanation: "Oxygen is a product of photosynthesis, not an ingredient.",
        },
        {
          type: "essay",
          prompt:
            "In your own words, explain why photosynthesis is important for humans and animals!",
          answer:
            "Because photosynthesis produces the oxygen we breathe and the food that becomes a source of energy for other living things.",
          points: 4,
        },
      ],
    };
  }
  return {
    title: `Quiz: ${cap(topic || "General Knowledge")}`,
    subject: "General Knowledge",
    grade,
    minutes: 30,
    questions: [
      {
        type: "mc",
        prompt: `Sample multiple-choice question about ${topic}. (Demo mode — set an API key for real questions.)`,
        options: ["Option A", "Option B", "Option C", "Option D"],
        answer: "Option A",
        points: 2,
      },
      {
        type: "tf",
        prompt: `${cap(topic)} is an interesting topic to learn about. True or False?`,
        answer: "True",
        points: 2,
      },
      {
        type: "fill",
        prompt: `The topic of this quiz is ________.`,
        answer: cap(topic),
        points: 2,
      },
      {
        type: "essay",
        prompt: `Write down three things you know about ${topic}!`,
        answer: "Open answer based on the student's understanding.",
        points: 4,
      },
    ],
  };
}

export function mockAnagram(topic: string): AnagramData {
  const t = topic.toLowerCase();
  const isSpace = /tata\s*surya|tatasurya|planet|antariksa|luar angkasa|astronomi|solar\s*system|space|astronomy/.test(t);
  const words = isSpace
    ? [
        { word: "PLANET", hint: "A celestial body that orbits a star", category: "term", level: "EASY" as const },
        { word: "COMET", hint: "A tailed object made of ice and dust", category: "celestial body", level: "EASY" as const },
        { word: "ORBIT", hint: "The path a celestial body follows around its center", category: "term", level: "EASY" as const },
        { word: "MOON", hint: "Earth's natural satellite", category: "celestial body", level: "EASY" as const },
        { word: "METEOR", hint: "A shooting star burning up in the atmosphere", category: "celestial body", level: "MEDIUM" as const },
        { word: "ASTEROID", hint: "Space rock, plentiful between Mars and Jupiter", category: "term", level: "MEDIUM" as const },
        { word: "SUN", hint: "The star at the center of our solar system", category: "star", level: "MEDIUM" as const },
        { word: "GALAXY", hint: "A collection of billions of stars, like the Milky Way", category: "term", level: "MEDIUM" as const },
        { word: "SATURN", hint: "The most famous ringed planet", category: "planet", level: "HARD" as const },
        { word: "STAR", hint: "A ball of hot gas that shines with its own light", category: "celestial body", level: "HARD" as const },
      ]
    : [
        { word: "LEARNING", hint: "The activity of gaining knowledge", category: "general", level: "EASY" as const },
        { word: "BOOK", hint: "A source of reading", category: "general", level: "EASY" as const },
        { word: "TEACHER", hint: "The person who teaches at school", category: "general", level: "EASY" as const },
        { word: "SCHOOL", hint: "A place to pursue knowledge", category: "general", level: "EASY" as const },
        { word: "CLEVER", hint: "The result of diligent studying", category: "general", level: "MEDIUM" as const },
        { word: "READING", hint: "A window to the world", category: "general", level: "MEDIUM" as const },
        { word: "WRITING", hint: "Putting ideas onto paper", category: "general", level: "MEDIUM" as const },
        { word: "SCIENTIST", hint: "Someone who researches science", category: "general", level: "MEDIUM" as const },
        { word: "LIBRARY", hint: "Home to thousands of books", category: "general", level: "HARD" as const },
        { word: "KNOWLEDGE", hint: "The result of curiosity", category: "general", level: "HARD" as const },
      ];
  return {
    title: `Word Builder: ${topic || "words"}`,
    topic,
    words,
  };
}
