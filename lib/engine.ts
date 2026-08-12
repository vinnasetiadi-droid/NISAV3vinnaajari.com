"use client";

import { useDB } from "./store";
import { uid, firstName, extractJSON } from "./utils";
import { systemPrompt, ARTIFACT_CLOSE } from "./prompts";
import { COMMANDS, QUIZ_ELICITATION } from "./registry";
import { quizHTML } from "./quizTemplate";
import { wordBuilderHTML } from "./wordBuilder";
import type { Conversation, Message } from "./types";

const aborters = new Map<string, AbortController>();

const OPEN_RE =
  /<<<ARTIFACT(?:\s+title="([^"]*)")?(?:\s+kind="(\w+)")?\s*>>>/;

function apiMessages(conv: Conversation) {
  return conv.messages
    .filter(
      (m) =>
        (m.kind === "text" || m.kind === "answers") &&
        m.content &&
        m.status !== "error"
    )
    .map((m) => ({
      role: m.role,
      content: m.artifactId
        ? m.content + "\n[artifact terlampir]"
        : m.content,
    }));
}

function ctx() {
  const s = useDB.getState();
  const me = s.me();
  return { s, me, name: firstName(me?.name || "teman") };
}

/** Parse streaming raw text into visible text + (maybe) artifact html. */
function parseRaw(raw: string) {
  const m = raw.match(OPEN_RE);
  if (!m || m.index == null)
    return { visible: raw, artifact: null as null | { title: string; kind: string; html: string; closed: boolean } };
  const before = raw.slice(0, m.index);
  const rest = raw.slice(m.index + m[0].length);
  const closeIdx = rest.indexOf(ARTIFACT_CLOSE);
  if (closeIdx === -1) {
    return {
      visible: before.trimEnd(),
      artifact: {
        title: m[1] || "Document artifact",
        kind: m[2] || "document",
        html: rest,
        closed: false,
      },
    };
  }
  const html = rest.slice(0, closeIdx).trim();
  const after = rest.slice(closeIdx + ARTIFACT_CLOSE.length);
  return {
    visible: (before.trimEnd() + "\n\n" + after.trimStart()).trim(),
    artifact: {
      title: m[1] || "Document artifact",
      kind: m[2] || "document",
      html,
      closed: true,
    },
  };
}

async function maybeTitle(convId: string) {
  const { s, me, name } = ctx();
  const conv = s.d().conversations.find((c) => c.id === convId);
  if (!conv || conv.titleLocked || conv.title !== "New chat") return;
  try {
    const res = await fetch("/api/title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: apiMessages(conv).slice(0, 4),
        userName: name,
      }),
    });
    const { title } = await res.json();
    if (title) {
      const cur = useDB.getState().d().conversations.find((c) => c.id === convId);
      if (cur && !cur.titleLocked) s.patchConv(convId, { title });
    }
  } catch {}
}

async function streamChat(opts: {
  convId: string;
  msgId: string;
  kind?: "chat" | "tldr";
  extraContext?: string;
}) {
  const { s, name } = ctx();
  const conv = s.d().conversations.find((c) => c.id === opts.convId);
  if (!conv) return;

  const ab = new AbortController();
  aborters.set(opts.msgId, ab);

  let raw = "";
  let artifactCreated: string | null = null;

  const finalize = (status: Message["status"]) => {
    const parsed = parseRaw(raw);
    s.patchMsg(opts.convId, opts.msgId, {
      content: parsed.visible || (status === "stopped" ? "(dihentikan)" : ""),
      status,
    });
    s.recomputeTokens(opts.convId);
    aborters.delete(opts.msgId);
  };

  try {
    const messages = apiMessages(conv);
    if (opts.extraContext && messages.length)
      messages[messages.length - 1] = {
        ...messages[messages.length - 1],
        content:
          messages[messages.length - 1].content + "\n\n" + opts.extraContext,
      };

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: ab.signal,
      body: JSON.stringify({
        messages,
        system: systemPrompt({ userName: name, mode: conv.mode }),
        userName: name,
        kind: opts.kind || "chat",
      }),
    });
    if (!res.body) throw new Error("no stream");
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const parts = buf.split("\n\n");
      buf = parts.pop() || "";
      for (const p of parts) {
        const line = p.trim();
        if (!line.startsWith("data: ")) continue;
        const payload = line.slice(6);
        if (payload === "[DONE]") continue;
        try {
          const j = JSON.parse(payload);
          if (j.error) throw new Error(j.error);
          if (j.t) {
            raw += j.t;
            const parsed = parseRaw(raw);
            const st = useDB.getState();
            st.patchMsg(opts.convId, opts.msgId, {
              content: parsed.visible,
              status: "streaming",
              statusLine:
                parsed.artifact && !parsed.artifact.closed
                  ? "Membuat artifact…"
                  : undefined,
            });
            if (parsed.artifact?.closed && !artifactCreated) {
              const a = st.addArtifact({
                title: parsed.artifact.title,
                html: parsed.artifact.html,
                kind: parsed.artifact.kind === "game" ? "game" : "document",
                convId: opts.convId,
              });
              artifactCreated = a.id;
              st.patchMsg(opts.convId, opts.msgId, { artifactId: a.id });
              st.setOpenArtifact(a.id);
            }
          }
        } catch (e: any) {
          if (e?.name === "AbortError") throw e;
          if (e?.message && !payload.startsWith("{")) continue;
          if (e?.message) {
            raw += `\n\n⚠️ ${e.message}`;
          }
        }
      }
    }
    finalize("done");
    maybeTitle(opts.convId);
  } catch (e: any) {
    if (e?.name === "AbortError") {
      finalize("stopped");
    } else {
      const st = useDB.getState();
      st.patchMsg(opts.convId, opts.msgId, {
        content:
          raw ||
          "⚠️ Terjadi kesalahan saat menghubungi server. Coba lagi sebentar ya.",
        status: "error",
      });
      aborters.delete(opts.msgId);
    }
  }
}

export function stopStreaming(convId: string) {
  const s = useDB.getState();
  const conv = s.d().conversations.find((c) => c.id === convId);
  conv?.messages.forEach((m) => {
    const ab = aborters.get(m.id);
    if (ab) ab.abort();
  });
}

export function isStreaming(conv: Conversation | undefined | null) {
  if (!conv) return false;
  return conv.messages.some(
    (m) => m.status === "streaming" || m.status === "pending"
  );
}

/** Run a skill (quiz after answers / anagram direct): WORKING card → JSON → template → artifact. */
async function runSkill(opts: {
  convId: string;
  skillId: "quiz" | "anagram";
  topic: string;
  grade?: string;
  depth?: string;
}) {
  const { s, name } = ctx();

  // loading ala Claude: orb + kata acak (render "pending" di AssistantMessage)
  const wmsg: Message = {
    id: uid("m_"),
    role: "assistant",
    kind: "text",
    content: "",
    createdAt: Date.now(),
    status: "pending",
  };
  s.appendMsg(opts.convId, wmsg);

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [],
        userName: name,
        skill: {
          id: opts.skillId,
          topic: opts.topic,
          grade: opts.grade,
          depth: opts.depth,
        },
      }),
    });
    const { data } = await res.json();
    if (!data) throw new Error("no data");

    const st = useDB.getState();
    let artifactId: string;
    let finalText: string;

    if (opts.skillId === "quiz") {
      const html = quizHTML(data);
      const a = st.addArtifact({
        title: data.title || `Kuis: ${opts.topic}`,
        html,
        kind: "document",
        convId: opts.convId,
      });
      artifactId = a.id;
      const gradeShort = (opts.grade || "").match(/^[A-Za-z]+/)?.[0] || "SD";
      finalText =
        `Latihan soal ${opts.topic} untuk tingkat ${gradeShort} sudah selesai aku buatkan, ${name}! 😊\n\n` +
        `Soal-soalnya aku sesuaikan dengan jenjang **${opts.grade || "SD"}** dan kedalaman **${opts.depth || "dasar"}** supaya pas. ` +
        `Kamu bisa langsung cek hasilnya di panel sebelah, dan ada tombol untuk melihat kunci jawabannya juga kalau dibutuhkan.\n\n` +
        `Kira-kira ada yang ingin ditambah atau diubah? Atau mungkin mau aku buatkan materi ringkasnya juga biar mereka bisa belajar dulu sebelum mengerjakan?`;
    } else {
      const html = wordBuilderHTML(data);
      const a = st.addArtifact({
        title: data.title || `Word Builder: ${opts.topic}`,
        html,
        kind: "game",
        convId: opts.convId,
      });
      artifactId = a.id;
      finalText =
        `Ini dia game **Word Builder** tentang ${opts.topic} untukmu, ${name}! 🎮\n\n` +
        `Susun huruf-hurufnya jadi kata yang benar — ada skor, streak, dan hint kalau buntu. ` +
        `Selamat bermain dan menebak! 🚀 ✨`;
    }

    st.patchMsg(opts.convId, wmsg.id, {
      kind: "text",
      content: finalText,
      status: "done",
      steps: undefined,
      statusLine: undefined,
      artifactId,
    });
    st.setOpenArtifact(artifactId);
    st.recomputeTokens(opts.convId);
    maybeTitle(opts.convId);
  } catch {
    useDB.getState().patchMsg(opts.convId, wmsg.id, {
      kind: "text",
      content: "⚠️ Gagal membuat artifact. Coba lagi sebentar ya.",
      status: "error",
      steps: undefined,
      statusLine: undefined,
    });
  }
}

function cap(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

/** Main entry: user sends text (may contain /command and attachments). */
export async function sendMessage(
  text: string,
  opts?: {
    attachments?: { name: string; size: number; mime: string; text?: string }[];
  }
) {
  const { s, name } = ctx();
  let conv = s.d().conversations.find((c) => c.id === s.activeConvId);
  if (!conv || conv.archived) conv = s.newConversation();
  const convId = conv.id;

  s.addRecent(text);

  // slash command?
  const m = text.match(/^\/([\w-]+)\s*([\s\S]*)$/);
  const cmd = m ? COMMANDS.find((c) => c.id === m[1].toLowerCase()) : null;
  const arg = m ? m[2].trim() : "";

  const userMsg: Message = {
    id: uid("m_"),
    role: "user",
    kind: "text",
    content: text,
    createdAt: Date.now(),
    attachments: opts?.attachments?.map(({ name, size, mime }) => ({
      name,
      size,
      mime,
    })),
  };
  s.appendMsg(convId, userMsg);
  s.recomputeTokens(convId);

  // --- quiz: needs elicitation first ---
  if (cmd?.id === "quiz") {
    const topic =
      arg.replace(/^buat(kan)?\s+(latihan\s+soal|soal|kuis|quiz)?\s*(tentang|mengenai)?\s*/i, "").trim() ||
      arg ||
      "materi ini";
    const intro =
      `Latihan soal tentang ${topic} sudah aku siapkan, tapi supaya hasilnya pas dan nggak terlalu mudah ` +
      `atau terlalu sulit, boleh bantu aku jawab beberapa hal dulu ya, ${name}? 😊\n\n` +
      `Silakan pilih atau isi di kartu pertanyaan yang muncul ya!`;
    const emsg: Message = {
      id: uid("m_"),
      role: "assistant",
      kind: "elicitation",
      content: intro,
      createdAt: Date.now(),
      status: "done",
      elicitation: QUIZ_ELICITATION(topic),
    };
    s.appendMsg(convId, emsg);
    s.recomputeTokens(convId);
    maybeTitle(convId);
    return;
  }

  // --- anagram: run directly ---
  if (cmd?.id === "anagram") {
    const topic =
      arg.replace(/^buat(kan)?\s*(game|permainan)?\s*(terkait|tentang|mengenai)?\s*/i, "").trim() ||
      "kosakata";
    await runSkill({ convId, skillId: "anagram", topic });
    return;
  }

  // --- other commands + plain chat → LLM stream ---
  let extraContext = "";
  if (cmd)
    extraContext += `\n[Perintah aktif: /${cmd.id} — ${cmd.desc}]`;
  if (opts?.attachments?.length) {
    for (const a of opts.attachments) {
      extraContext += `\n[Lampiran: ${a.name} (${a.mime}, ${a.size} B)]`;
      if (a.text) extraContext += `\nIsi lampiran:\n${a.text.slice(0, 4000)}`;
    }
  }
  // @mentions of drive docs
  const mentions = text.match(/@"([^"]+)"/g);
  if (mentions) {
    const d = s.d();
    for (const raw of mentions) {
      const nm = raw.slice(2, -1);
      const f = d.files.find((f) => f.name === nm);
      if (f?.text)
        extraContext += `\n[Dokumen Drive: ${f.name}]\n${f.text.slice(0, 4000)}`;
      const art = d.artifacts.find((a) => a.title === nm);
      if (art) extraContext += `\n[Artifact Drive: ${art.title} (${art.kind})]`;
    }
  }

  const amsg: Message = {
    id: uid("m_"),
    role: "assistant",
    kind: "text",
    content: "",
    createdAt: Date.now(),
    status: "pending",
  };
  s.appendMsg(convId, amsg);
  await streamChat({
    convId,
    msgId: amsg.id,
    extraContext: extraContext || undefined,
  });
}

/** Called by the elicitation card. */
export async function submitAnswers(
  convId: string,
  msgId: string,
  answers: { q: string; a: string }[]
) {
  const s = useDB.getState();
  const msg = s
    .d()
    .conversations.find((c) => c.id === convId)
    ?.messages.find((m) => m.id === msgId);
  const elic = msg?.elicitation;
  if (!elic) return;

  s.patchMsg(convId, msgId, {
    elicitation: { ...elic, answered: true },
  });

  const content = answers.map((x) => `${x.q} — ${x.a}`).join("\n");
  const ansMsg: Message = {
    id: uid("m_"),
    role: "user",
    kind: "answers",
    content,
    createdAt: Date.now(),
  };
  s.appendMsg(convId, ansMsg);
  s.recomputeTokens(convId);

  if (elic.skillId === "quiz") {
    const grade = answers.find((a) => a.q.includes("jenjang"))?.a || answers[0]?.a;
    const depth = answers.find((a) => a.q.includes("mendalam"))?.a || answers[1]?.a;
    await runSkill({
      convId,
      skillId: "quiz",
      topic: elic.topic,
      grade,
      depth,
    });
  }
}

/** Header actions */
export async function runTLDR() {
  const { s } = ctx();
  const conv = s.d().conversations.find((c) => c.id === s.activeConvId);
  if (!conv || !conv.messages.length) return;
  const amsg: Message = {
    id: uid("m_"),
    role: "assistant",
    kind: "text",
    content: "",
    createdAt: Date.now(),
    status: "pending",
  };
  s.appendMsg(conv.id, amsg);
  await streamChat({ convId: conv.id, msgId: amsg.id, kind: "tldr" });
}

export function compactConversation() {
  const s = useDB.getState();
  const conv = s.d().conversations.find((c) => c.id === s.activeConvId);
  if (!conv || conv.messages.length <= 3) return false;
  const keep = conv.messages.slice(-2);
  const note: Message = {
    id: uid("m_"),
    role: "assistant",
    kind: "text",
    content: `🔄 *Percakapan dipadatkan (Compact) — ${
      conv.messages.length - 2
    } pesan sebelumnya diringkas untuk menghemat konteks.*`,
    createdAt: Date.now(),
    status: "done",
  };
  s.setMessages(conv.id, [note, ...keep]);
  s.recomputeTokens(conv.id);
  return true;
}

export function transcriptOf(conv: Conversation) {
  return conv.messages
    .filter((m) => m.kind === "text" || m.kind === "answers")
    .map((m) => `**${m.role === "user" ? "Kamu" : "NISA"}:** ${m.content}`)
    .join("\n\n");
}
