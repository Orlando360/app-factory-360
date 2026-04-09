import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@/lib/supabase";
import { inngest } from "@/inngest/client";
import { isValidSessionToken } from "@/lib/auth";

export const runtime = "nodejs";

/**
 * Legacy entrypoint — kept so the admin dashboard keeps working, but fully
 * migrated to the new Inngest-driven pipeline underneath.
 *
 *   1. Load the client brief from `clients`.
 *   2. Create a `pipeline_jobs` row.
 *   3. Link `clients.current_pipeline_job_id`.
 *   4. Fire `app-factory/pipeline.start`.
 *   5. Return in <200ms.
 *
 * All retry / timeout / state management now live in
 * `inngest/functions/pipeline.ts`.
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("dashboard_auth");
    if (!isValidSessionToken(authCookie?.value)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId } = body;
    if (!clientId) {
      return Response.json({ error: "clientId is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: client, error: loadError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (loadError || !client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    const { data: job, error: jobError } = await supabase
      .from("pipeline_jobs")
      .insert({
        client_brief: client,
        status: "pending",
        current_step: "queued",
      })
      .select("id")
      .single();

    if (jobError || !job) {
      console.error("[API /generate] pipeline_jobs insert error:", jobError);
      return Response.json(
        { error: "Could not create pipeline job" },
        { status: 500 }
      );
    }

    const jobId = job.id as string;

    await supabase
      .from("clients")
      .update({ current_pipeline_job_id: jobId, status: "generating" })
      .eq("id", clientId);

    await inngest.send({
      name: "app-factory/pipeline.start",
      data: { jobId, clientBrief: client, clientId },
    });

    return Response.json({ started: true, clientId, jobId }, { status: 202 });
  } catch (err) {
    console.error("[API /generate] Unexpected error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
