import Anthropic from "@anthropic-ai/sdk";
import {
  isGreeting,
  mockAnagram,
  mockGeneric,
  mockGreeting,
  mockQuiz,
  mockTLDR,
} from "@/lib/mock";
import { anagramJSONPrompt, quizJSONPrompt, tldrPrompt } from "@/lib/prompts";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

const MODEL = () => process.env.NISA_MODEL || "claude-sonnet-5";

interface ChatBody {
  messages: { role: "user" | "assistant"; content: string }[];
  system?: string;
  userName?: string;
  kind?: "chat" | "tldr";
  skill?: { id: "quiz" | "anagram"; topic: string; grade?: string; depth?: string };
}

/** Turn a plain string into a slow SSE stream (demo mode typing effect). */
function mockStream(text: string): Response {
  const encoder = new TextEncoder();
  const chunks = text.match(/[\s\S]{1,7}/g) || [];
  const stream = new ReadableStream({
    async start(controller) {
      await sleep(8000); // beri ruang animasi "Thinking…" tampil dulu (request: ±8 detik)
      for (const c of chunks) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ t: c })}\n\n`)
        );
        await sleep(14);
      }
      controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      controller.close();
    },
  });
  return sseResponse(stream);
}

function sseResponse(stream: ReadableStream): Response {
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function POST(req: Request) {
  const body = (await req.json()) as ChatBody;
  const key = process.env.ANTHROPIC_API_KEY;
  const name = body.userName || "friend";

  // ---------- Skill runs return JSON (not a stream) ----------
  if (body.skill) {
    const { id, topic, grade = "Elementary school", depth = "Basic" } = body.skill;

    if (!key) {
      await sleep(8000); // beri waktu animasi thinking (orb + kata acak) tampil (±8 detik)
      const data = id === "quiz" ? mockQuiz(topic, grade) : mockAnagram(topic);
      return Response.json({ data, demo: true });
    }

    try {
      const client = new Anthropic({ apiKey: key });
      const prompt =
        id === "quiz" ? quizJSONPrompt(topic, grade, depth) : anagramJSONPrompt(topic);
      const res = await client.messages.create({
        model: MODEL(),
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      });
      const text = res.content
        .map((b) => ("text" in b ? b.text : ""))
        .join("");
      const m = text.match(/\{[\s\S]*\}/);
      const data = m ? JSON.parse(m[0]) : null;
      if (!data) throw new Error("no json");
      return Response.json({ data, demo: false });
    } catch (e) {
      const data = id === "quiz" ? mockQuiz(topic, grade) : mockAnagram(topic);
      return Response.json({ data, demo: true, fallback: true });
    }
  }

  // ---------- Normal chat: SSE stream ----------
  if (!key) {
    const lastUser =
      [...body.messages].reverse().find((m) => m.role === "user")?.content || "";
    const userTurns = body.messages.filter((m) => m.role === "user").length;
    let text: string;
    if (body.kind === "tldr") text = mockTLDR(body.messages.length);
    else if (isGreeting(lastUser) && userTurns <= 2) text = mockGreeting(name);
    else text = mockGeneric(name);
    return mockStream(text);
  }

  const client = new Anthropic({ apiKey: key });
  const encoder = new TextEncoder();
  const messages = body.messages.slice(-30);
  const system =
    body.kind === "tldr"
      ? (body.system || "") + "\n" + tldrPrompt()
      : body.system;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const s = client.messages.stream({
          model: MODEL(),
          max_tokens: 8192,
          system: system || undefined,
          messages:
            body.kind === "tldr"
              ? [
                  ...messages,
                  { role: "user" as const, content: tldrPrompt() },
                ]
              : messages,
        });
        s.on("text", (t) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ t })}\n\n`)
          );
        });
        await s.finalMessage();
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (e: any) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: e?.message || "Failed to reach the model.",
            })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });
  return sseResponse(stream);
}
