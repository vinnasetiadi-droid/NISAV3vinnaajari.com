export const dynamic = "force-dynamic";

export async function GET() {
  const live = !!process.env.ANTHROPIC_API_KEY;
  const model = process.env.NISA_MODEL || "claude-sonnet-5";
  return Response.json({ live, model });
}
