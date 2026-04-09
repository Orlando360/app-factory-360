import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { inngest } from "@/inngest/client";
import { isValidSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Pipeline entrypoint.
 *
 * Responsibilities (kept deliberately minimal — target <200ms):
 *   1. Auth check.
 *   2. Insert a `pipeline_jobs` row with status=pending.
 *   3. Fire the Inngest event `app-factory/pipeline.start`.
 *   4. Return { jobId, status }.
 *
 * All long-running agent work now lives in the Inngest function
 * (`inngest/functions/pipeline.ts`), which escapes the Vercel 300s
 * function timeout because Inngest drives progress via discrete steps.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("dashboard_auth");
    if (!isValidSessionToken(authCookie?.value)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const clientBrief = body?.clientBrief ?? body?.client_brief ?? body;

    if (!clientBrief || typeof clientBrief !== "object") {
      return Response.json(
        { error: "clientBrief (object) is required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("pipeline_jobs")
      .insert({
        client_brief: clientBrief,
        status: "pending",
        current_step: "queued",
      })
      .select("id")
      .single();

    if (error || !data) {
      console.error("[API /pipeline] insert error:", error);
      return Response.json(
        { error: "Could not create pipeline job" },
        { status: 500 }
      );
    }

    const jobId = data.id as string;

    await inngest.send({
      name: "app-factory/pipeline.start",
      data: { jobId, clientBrief },
    });

    return Response.json({ jobId, status: "pending" }, { status: 202 });
  } catch (err) {
    console.error("[API /pipeline] unexpected error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const jobId = url.searchParams.get("jobId");
  if (!jobId) {
    return Response.json({ error: "jobId query param required" }, { status: 400 });
  }
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("pipeline_jobs")
    .select("id,status,current_step,agents_outputs,final_report,error_message,created_at,completed_at")
    .eq("id", jobId)
    .single();
  if (error || !data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }
  return Response.json(data);
}
