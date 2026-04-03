import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, string> = { app: "ok" };
  let healthy = true;

  // Check Supabase
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from("clients").select("id").limit(1);
    checks.supabase = error ? `error: ${error.message}` : "ok";
    if (error) healthy = false;
  } catch (e) {
    checks.supabase = `error: ${(e as Error).message}`;
    healthy = false;
  }

  // Check Claude API key
  checks.claude_key = process.env.ANTHROPIC_API_KEY ? "configured" : "missing";
  if (!process.env.ANTHROPIC_API_KEY) healthy = false;

  // Check GitHub token
  checks.github_token = process.env.GITHUB_TOKEN ? "configured" : "missing";

  return NextResponse.json(
    { status: healthy ? "healthy" : "degraded", checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 }
  );
}
