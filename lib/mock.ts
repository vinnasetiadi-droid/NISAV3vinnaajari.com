import type { AnagramData, QuizData } from "./types";

/** Server-side mock brain used when ANTHROPIC_API_KEY is missing (demo mode). */

export function mockGreeting(name: string) {
  const h = new Date().getHours();
  const tod = h < 11 ? "pagi" : h < 15 ? "siang" : h < 18 ? "sore" : "malam";
  return `Selamat ${tod}, ${name}! 😊 Ada yang bisa aku bantu hari ini?`;
}

export function isGreeting(text: string) {
  return /\b(hai|halo|hallo|hello|hey|hi|pagi|siang|sore|malam|assalamualaikum)\b/i.test(
    text.trim()
  );
}

export function mockGeneric(name: string) {
  return (
    `Aku lagi berjalan dalam **mode demo** karena \`ANTHROPIC_API_KEY\` belum diisi di \`.env.local\`, ` +
    `jadi jawabanku terbatas ya, ${name} 😅\n\n` +
    `Tapi hampir semua fitur tetap bisa dicoba:\n\n` +
    `- ketik \`/quiz buatkan latihan soal tentang fotosintesis\` untuk kuis siap cetak\n` +
    `- ketik \`/anagram buatkan terkait tatasurya\` untuk game Word Builder\n` +
    `- unggah file ke **Drive**, lalu sebut dengan \`@\` di chat\n` +
    `- coba juga tombol **TLDR**, **Compact**, dan **New Doc** di atas\n\n` +
    `Kalau API key sudah diisi, aku akan menjawab pertanyaan apa pun secara live. ✨`
  );
}

export function mockTLDR(msgCount: number) {
  return (
    `**TLDR:**\n` +
    `- Percakapan ini berisi ${msgCount} pesan antara kamu dan NISA.\n` +
    `- Mode demo aktif — isi \`ANTHROPIC_API_KEY\` untuk ringkasan yang sesungguhnya.\n` +
    `- Coba \`/quiz\` atau \`/anagram\` untuk melihat artifact interaktif.`
  );
}

export function mockTitle(firstUserText: string, name: string) {
  if (isGreeting(firstUserText)) {
    const h = new Date().getHours();
    const tod = h < 11 ? "Pagi" : h < 15 ? "Siang" : h < 18 ? "Sore" : "Malam";
    return `Sapaan Selamat ${tod} ${cap(name)}`;
  }
  const words = firstUserText
    .replace(/^\/[\w-]+\s*/, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 5)
    .map(cap)
    .join(" ");
  return words || "Percakapan Baru";
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function mockQuiz(topic: string, grade: string): QuizData {
  const isFoto = /fotosintesis|photosint/i.test(topic);
  if (isFoto) {
    return {
      title: "Kuis Sains: Rahasia Fotosintesis",
      subject: "Ilmu Pengetahuan Alam (IPA)",
      grade,
      minutes: 30,
      instructions:
        "Bacalah setiap pertanyaan dengan teliti. Kamu memiliki waktu 30 menit untuk mengerjakan kuis ini. Kerjakan dengan jujur dan teliti!",
      questions: [
        {
          type: "mc",
          prompt:
            "Apa nama proses yang digunakan tumbuhan hijau untuk membuat makanannya sendiri?",
          options: ["Pernapasan", "Fotosintesis", "Penguapan", "Penyerapan"],
          answer: "Fotosintesis",
          points: 1,
          explanation:
            "Fotosintesis berasal dari kata foto (cahaya) dan sintesis (menyusun).",
        },
        {
          type: "mc",
          prompt:
            "Bagian tumbuhan manakah yang paling utama berfungsi untuk melakukan fotosintesis?",
          options: ["Akar", "Batang", "Daun", "Bunga"],
          answer: "Daun",
          points: 1,
          explanation: "Daun mengandung banyak klorofil pada jaringan palisadenya.",
        },
        {
          type: "tf",
          prompt:
            "Tumbuhan membutuhkan karbon dioksida (CO2) dari udara untuk melakukan fotosintesis. Benar atau Salah?",
          answer: "True",
          points: 1,
        },
        {
          type: "fill",
          prompt:
            "Zat hijau daun yang berfungsi menangkap energi cahaya matahari disebut dengan ________.",
          answer: "Klorofil",
          points: 2,
        },
        {
          type: "mc",
          prompt:
            "Apa yang diserap oleh akar tumbuhan dari dalam tanah untuk membantu proses fotosintesis?",
          options: ["Cahaya Matahari", "Oksigen", "Air dan Mineral", "Karbon Dioksida"],
          answer: "Air dan Mineral",
          points: 2,
        },
        {
          type: "mc",
          prompt: "Hasil fotosintesis yang menjadi makanan bagi tumbuhan adalah ...",
          options: ["Oksigen", "Karbohidrat (amilum)", "Air", "Nitrogen"],
          answer: "Karbohidrat (amilum)",
          points: 2,
          explanation: "Amilum disimpan sebagai cadangan makanan.",
        },
        {
          type: "tf",
          prompt: "Fotosintesis hanya dapat terjadi pada malam hari. Benar atau Salah?",
          answer: "False",
          points: 1,
        },
        {
          type: "fill",
          prompt:
            "Selain makanan, fotosintesis juga menghasilkan gas ________ yang kita hirup untuk bernapas.",
          answer: "Oksigen",
          points: 2,
        },
        {
          type: "mc",
          prompt: "Manakah yang BUKAN merupakan bahan untuk fotosintesis?",
          options: ["Air", "Cahaya matahari", "Karbon dioksida", "Oksigen"],
          answer: "Oksigen",
          points: 2,
          explanation: "Oksigen adalah hasil fotosintesis, bukan bahannya.",
        },
        {
          type: "essay",
          prompt:
            "Jelaskan dengan kata-katamu sendiri, mengapa fotosintesis penting bagi manusia dan hewan!",
          answer:
            "Karena fotosintesis menghasilkan oksigen untuk bernapas dan makanan yang menjadi sumber energi bagi makhluk hidup lain.",
          points: 4,
        },
      ],
    };
  }
  return {
    title: `Kuis: ${cap(topic || "Pengetahuan Umum")}`,
    subject: "Pengetahuan Umum",
    grade,
    minutes: 30,
    questions: [
      {
        type: "mc",
        prompt: `Pertanyaan pilihan ganda contoh tentang ${topic}. (Mode demo — isi API key untuk soal sungguhan.)`,
        options: ["Opsi A", "Opsi B", "Opsi C", "Opsi D"],
        answer: "Opsi A",
        points: 2,
      },
      {
        type: "tf",
        prompt: `${cap(topic)} adalah topik yang menarik untuk dipelajari. Benar atau Salah?`,
        answer: "True",
        points: 2,
      },
      {
        type: "fill",
        prompt: `Topik kuis ini adalah ________.`,
        answer: cap(topic),
        points: 2,
      },
      {
        type: "essay",
        prompt: `Tuliskan tiga hal yang kamu ketahui tentang ${topic}!`,
        answer: "Jawaban bebas sesuai pemahaman siswa.",
        points: 4,
      },
    ],
  };
}

export function mockAnagram(topic: string): AnagramData {
  const t = topic.toLowerCase();
  const isSpace = /tata\s*surya|tatasurya|planet|antariksa|luar angkasa|astronomi/.test(t);
  const words = isSpace
    ? [
        { word: "PLANET", hint: "Benda langit yang mengorbit bintang", category: "term", level: "EASY" as const },
        { word: "KOMET", hint: "Bintang berekor dari es dan debu", category: "benda langit", level: "EASY" as const },
        { word: "ORBIT", hint: "Lintasan benda langit mengelilingi pusatnya", category: "term", level: "EASY" as const },
        { word: "BULAN", hint: "Satelit alami Bumi", category: "benda langit", level: "EASY" as const },
        { word: "METEOR", hint: "Bintang jatuh yang terbakar di atmosfer", category: "benda langit", level: "MEDIUM" as const },
        { word: "ASTEROID", hint: "Batuan luar angkasa, banyak di antara Mars dan Jupiter", category: "term", level: "MEDIUM" as const },
        { word: "MATAHARI", hint: "Bintang pusat tata surya kita", category: "bintang", level: "MEDIUM" as const },
        { word: "GALAKSI", hint: "Kumpulan miliaran bintang, contohnya Bimasakti", category: "term", level: "MEDIUM" as const },
        { word: "SATURNUS", hint: "Planet bercincin paling terkenal", category: "planet", level: "HARD" as const },
        { word: "BINTANG", hint: "Bola gas panas yang memancarkan cahaya sendiri", category: "benda langit", level: "HARD" as const },
      ]
    : [
        { word: "BELAJAR", hint: "Kegiatan menambah ilmu", category: "umum", level: "EASY" as const },
        { word: "BUKU", hint: "Sumber bacaan", category: "umum", level: "EASY" as const },
        { word: "GURU", hint: "Pengajar di sekolah", category: "umum", level: "EASY" as const },
        { word: "SEKOLAH", hint: "Tempat menuntut ilmu", category: "umum", level: "EASY" as const },
        { word: "PINTAR", hint: "Hasil dari rajin belajar", category: "umum", level: "MEDIUM" as const },
        { word: "MEMBACA", hint: "Jendela dunia", category: "umum", level: "MEDIUM" as const },
        { word: "MENULIS", hint: "Menuangkan ide ke kertas", category: "umum", level: "MEDIUM" as const },
        { word: "ILMUWAN", hint: "Orang yang meneliti ilmu pengetahuan", category: "umum", level: "MEDIUM" as const },
        { word: "PERPUSTAKAAN", hint: "Rumah ribuan buku", category: "umum", level: "HARD" as const },
        { word: "PENGETAHUAN", hint: "Hasil dari rasa ingin tahu", category: "umum", level: "HARD" as const },
      ];
  return {
    title: `Word Builder: ${topic || "kata"}`,
    topic,
    words,
  };
}
