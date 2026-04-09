import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { isValidSessionToken } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase";
import { inngest } from "@/inngest/client";

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

    // Fetch the client brief
    const { data: client, error: clientError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (clientError || !client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    // Create the pipeline_jobs record
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
      console.error("[API /pipeline] Failed to create job:", jobError?.message);
      return Response.json({ error: "Failed to create pipeline job" }, { status: 500 });
    }

    // Fire Inngest event — returns immediately, pipeline runs asynchronously
    await inngest.send({
      name: "app-factory/pipeline.start",
      data: {
        jobId: job.id,
        client_brief: client,
      },
    });

    return Response.json({ jobId: job.id, status: "pending" }, { status: 200 });
  } catch (err) {
    console.error("[API /pipeline] Unexpected error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
