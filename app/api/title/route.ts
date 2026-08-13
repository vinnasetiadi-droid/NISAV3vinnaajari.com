import Anthropic from "@anthropic-ai/sdk";
import { mockTitle } from "@/lib/mock";
import { titlePrompt } from "@/lib/prompts";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
    userName?: string;
  };
  const key = process.env.ANTHROPIC_API_KEY;
  const firstUser =
    body.messages.find((m) => m.role === "user")?.content || "Conversation";

  if (!key) {
    return Response.json({
      title: mockTitle(firstUser, body.userName || "Friend"),
    });
  }
  try {
    const client = new Anthropic({ apiKey: key });
    const res = await client.messages.create({
      model: process.env.NISA_MODEL || "claude-sonnet-5",
      max_tokens: 64,
      messages: [
        ...body.messages.slice(0, 4),
        { role: "user", content: titlePrompt() },
      ],
    });
    const text = res.content
      .map((b) => ("text" in b ? b.text : ""))
      .join("")
      .trim()
      .replace(/^["']|["']$/g, "");
    return Response.json({
      title: text || mockTitle(firstUser, body.userName || "Friend"),
    });
  } catch {
    return Response.json({
      title: mockTitle(firstUser, body.userName || "Friend"),
    });
  }
}
