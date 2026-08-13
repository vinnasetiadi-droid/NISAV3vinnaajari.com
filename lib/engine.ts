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
        ? m.content + "\n[artifact attached]"
        : m.content,
    }));
}

function ctx() {
  const s = useDB.getState();
  const me = s.me();
  return { s, me, name: firstName(me?.name || "friend") };
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
      content: parsed.visible || (status === "stopped" ? "(stopped)" : ""),
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
                  ? "Creating artifact…"
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
          "⚠️ Something went wrong while contacting the server. Please try again in a moment.",
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

  // Progres bertahap khusus skill (quiz / word builder) — ditampilkan di bawah "Thinking…"
  const steps =
    opts.skillId === "quiz"
      ? [
          "Reading your topic…",
          "Drafting the first questions…",
          "Balancing difficulty…",
          "Writing the answer key…",
          "Final touches…",
        ]
      : [
          "Picking the best words…",
          "Scrambling the letters…",
          "Writing the hints…",
          "Setting up the board…",
          "Final touches…",
        ];
  let stepIdx = 0;
  useDB.getState().patchMsg(opts.convId, wmsg.id, { statusLine: steps[0] });
  const stepTimer = setInterval(() => {
    stepIdx = Math.min(stepIdx + 1, steps.length - 1);
    useDB.getState().patchMsg(opts.convId, wmsg.id, { statusLine: steps[stepIdx] });
  }, 1000);

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
    clearInterval(stepTimer);

    const st = useDB.getState();
    let artifactId: string;
    let finalText: string;

    if (opts.skillId === "quiz") {
      const html = quizHTML(data);
      const a = st.addArtifact({
        title: data.title || `Quiz: ${opts.topic}`,
        html,
        kind: "document",
        convId: opts.convId,
      });
      artifactId = a.id;
      const gradeShort = (opts.grade || "").match(/^[A-Za-z]+/)?.[0] || "Elementary";
      finalText =
        `Your ${opts.topic} practice quiz for the ${gradeShort} level is ready, ${name}! 😊\n\n` +
        `I tailored the questions to the **${opts.grade || "Elementary school"}** level with **${opts.depth || "basic"}** depth so they fit just right. ` +
        `You can check the result in the side panel, and there's a button to reveal the answer key whenever you need it.\n\n` +
        `Is there anything you'd like to add or change? Or would you like me to prepare a short study summary so they can review before taking the quiz?`;
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
        `Here's your **Word Builder** game about ${opts.topic}, ${name}! 🎮\n\n` +
        `Arrange the letters into the correct word — there's a score, a streak, and hints if you get stuck. ` +
        `Have fun playing and guessing! 🚀 ✨`;
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
    clearInterval(stepTimer);
    useDB.getState().patchMsg(opts.convId, wmsg.id, {
      kind: "text",
      content: "⚠️ Failed to create the artifact. Please try again in a moment.",
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

  // Mode coba-coba (guest dari landing): maksimal 3 kirim, selanjutnya wajib sign in.
  const me = s.me();
  if (me?.email?.endsWith("@guest.nisa")) {
    const sent = s
      .d()
      .conversations.reduce(
        (n, c) => n + c.messages.filter((m) => m.role === "user").length,
        0
      );
    if (sent >= 3) {
      s.setGuestGate(true);
      return;
    }
    // fitur generator (quiz / word builder / presentasi) → langsung wajib sign in
    const lower = text.toLowerCase();
    if (
      /^\/(quiz|anagram)/.test(lower) ||
      (/\b(quiz|kuis|practice questions?|latihan soal|anagram|word builder|presentation|slides?|ppt)\b/.test(lower) &&
        /\b(create|make|generate|build|buat(kan)?|bikin|outline)\b/.test(lower))
    ) {
      s.setGuestGate(true);
      return;
    }
  }

  let conv = s.d().conversations.find((c) => c.id === s.activeConvId);
  if (!conv || conv.archived) conv = s.newConversation();
  const convId = conv.id;

  s.addRecent(text);

  // slash command?
  const m = text.match(/^\/([\w-]+)\s*([\s\S]*)$/);
  let cmd = m ? COMMANDS.find((c) => c.id === m[1].toLowerCase()) : null;
  let arg = m ? m[2].trim() : "";

  // Deteksi niat natural (tanpa slash): "create a quiz about…", "make an anagram game…"
  if (!cmd) {
    const lower = text.toLowerCase();
    if (/\b(quiz|kuis|practice questions?|latihan soal)\b/.test(lower) && /\b(create|make|generate|build|buat(kan)?|bikin)\b/.test(lower)) {
      cmd = COMMANDS.find((c) => c.id === "quiz") || null;
      arg = text;
    } else if (/\b(anagram|word builder)\b/.test(lower) && /\b(create|make|generate|build|buat(kan)?|bikin)\b/.test(lower)) {
      cmd = COMMANDS.find((c) => c.id === "anagram") || null;
      arg = text;
    }
  }

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
      arg
        .replace(/^(buat(kan)?|bikin|create|make|generate|build)\s+/i, "")
        .replace(/^(a|an|some)\s+/i, "")
        .replace(/^[\w-]*[- ]?(grade|kelas)\s*/i, "")
        .replace(/^(science|math|history)?\s*(latihan\s+soal|soal|kuis|quiz|practice\s+questions?)\s*/i, "")
        .replace(/^(tentang|mengenai|about|on)\s*/i, "")
        .replace(/[.?!]+$/, "")
        .trim() ||
      arg ||
      "this topic";
    const intro =
      `I'm ready to build your practice quiz about ${topic}, but so it lands just right — not too easy ` +
      `and not too hard — could you help me answer a few things first, ${name}? 😊\n\n` +
      `Just pick or type your answers in the question card below!`;
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
      arg.replace(/^(buat(kan)?|create|make|generate)\s*((a|one)\s+)?(game|permainan)?\s*(terkait|tentang|mengenai|about|on|one\s+about)?\s*/i, "").trim() ||
      "vocabulary";
    await runSkill({ convId, skillId: "anagram", topic });
    return;
  }

  // --- other commands + plain chat → LLM stream ---
  let extraContext = "";
  if (cmd)
    extraContext += `\n[Active command: /${cmd.id} — ${cmd.desc}]`;
  if (opts?.attachments?.length) {
    for (const a of opts.attachments) {
      extraContext += `\n[Attachment: ${a.name} (${a.mime}, ${a.size} B)]`;
      if (a.text) extraContext += `\nAttachment content:\n${a.text.slice(0, 4000)}`;
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
        extraContext += `\n[Drive document: ${f.name}]\n${f.text.slice(0, 4000)}`;
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
    const grade = answers.find((a) => a.q.includes("grade level"))?.a || answers[0]?.a;
    const depth = answers.find((a) => a.q.includes("in-depth"))?.a || answers[1]?.a;
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
    content: `🔄 *Conversation compacted — the previous ${
      conv.messages.length - 2
    } messages were summarized to save context.*`,
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
    .map((m) => `**${m.role === "user" ? "You" : "NISA"}:** ${m.content}`)
    .join("\n\n");
}
