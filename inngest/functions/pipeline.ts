import { inngest } from "../client";
import { createServerClient } from "@/lib/supabase";
import { runSubagent } from "@/lib/agent-runner";

type AgentsOutputs = Record<string, unknown>;

async function patchJob(
  jobId: string,
  patch: Record<string, unknown>
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("pipeline_jobs")
    .update(patch)
    .eq("id", jobId);
  if (error) console.error(`[pipeline] supabase patch error (${jobId}):`, error);
}

async function mergeOutputs(
  jobId: string,
  newOutputs: AgentsOutputs,
  currentStep: string
): Promise<void> {
  const supabase = createServerClient();
  const { data } = await supabase
    .from("pipeline_jobs")
    .select("agents_outputs")
    .eq("id", jobId)
    .single();
  const prev = (data?.agents_outputs as AgentsOutputs) || {};
  await patchJob(jobId, {
    agents_outputs: { ...prev, ...newOutputs },
    current_step: currentStep,
  });
}

export const pipelineFn = inngest.createFunction(
  {
    id: "app-factory-pipeline",
    name: "App Factory 360 Pipeline",
    retries: 2,
    concurrency: { limit: 5 },
    triggers: [{ event: "app-factory/pipeline.start" }],
    onFailure: async ({ event, error }) => {
      const data = (event as { data?: { event?: { data?: { jobId?: string; clientId?: string } } } })
        .data?.event?.data;
      const jobId = data?.jobId;
      const clientId = data?.clientId;
      if (jobId) {
        await patchJob(jobId, {
          status: "error",
          error_message: error?.message ?? String(error),
          completed_at: new Date().toISOString(),
        });
      }
      if (clientId) {
        const supabase = createServerClient();
        await supabase
          .from("clients")
          .update({ status: "error", error_message: error?.message ?? String(error) })
          .eq("id", clientId);
      }
    },
  },
  async ({ event, step, runId }) => {
    const { jobId, clientBrief, clientId } = event.data as {
      jobId: string;
      clientBrief: Record<string, unknown>;
      clientId?: string;
    };

    const syncClient = async (patch: Record<string, unknown>) => {
      if (!clientId) return;
      const supabase = createServerClient();
      const { error } = await supabase.from("clients").update(patch).eq("id", clientId);
      if (error) console.error(`[pipeline] client sync error (${clientId}):`, error);
    };

    await step.run("init-job", async () => {
      await patchJob(jobId, {
        inngest_run_id: runId,
        status: "running",
        current_step: "diagnosticador",
      });
      await syncClient({ status: "generating" });
    });

    // ───────────── STEP 1 — Diagnosticador (sequential) ─────────────
    const diagnostico = await step.run("01-diagnosticador", async () => {
      const out = await runSubagent({
        subagentFile: "01-diagnosticador.md",
        userInput: { client_brief: clientBrief },
      });
      await mergeOutputs(jobId, { diagnosticador: out }, "arquitecto");
      return out;
    });

    // ───────────── STEP 2 — Arquitecto (sequential) ─────────────
    const arquitectura = await step.run("02-arquitecto", async () => {
      const out = await runSubagent({
        subagentFile: "02-arquitecto.md",
        userInput: { diagnostico },
      });
      await mergeOutputs(jobId, { arquitecto: out }, "builder+ui-ux");
      return out;
    });

    // ───────────── STEPS 3+4 — Builder ‖ UI/UX (parallel) ─────────────
    const [builderOut, uiOut] = await Promise.all([
      step.run("03-builder", async () => {
        const out = await runSubagent({
          subagentFile: "03-builder.md",
          userInput: { arquitectura },
        });
        await mergeOutputs(jobId, { builder: out }, "builder+ui-ux");
        return out;
      }),
      step.run("04-ui-ux", async () => {
        const out = await runSubagent({
          subagentFile: "04-ui-ux.md",
          userInput: { arquitectura },
        });
        await mergeOutputs(jobId, { ui: out }, "builder+ui-ux");
        return out;
      }),
    ]);

    await patchJob(jobId, { current_step: "qa+deployment" });

    // ───────────── STEPS 5+6 — QA ‖ Deployment (parallel) ─────────────
    const [qaOut, deploymentOut] = await Promise.all([
      step.run("05-qa", async () => {
        const out = await runSubagent({
          subagentFile: "05-qa.md",
          userInput: { builder: builderOut, ui: uiOut, arquitectura },
        });
        await mergeOutputs(jobId, { qa: out }, "qa+deployment");
        return out;
      }),
      step.run("06-deployment", async () => {
        const out = await runSubagent({
          subagentFile: "06-deployment.md",
          userInput: { arquitectura, builder: builderOut },
        });
        await mergeOutputs(jobId, { deployment: out }, "qa+deployment");
        return out;
      }),
    ]);

    await patchJob(jobId, { current_step: "monetizacion" });

    // ───────────── STEP 7 — Monetización (sequential) ─────────────
    const monetizacion = await step.run("07-monetizacion", async () => {
      const out = await runSubagent({
        subagentFile: "07-monetizacion.md",
        userInput: {
          diagnostico,
          arquitectura,
          builder: builderOut,
          ui: uiOut,
          qa: qaOut,
          deployment: deploymentOut,
        },
      });
      await mergeOutputs(jobId, { monetizacion: out }, "growth");
      return out;
    });

    // ───────────── STEP 8 — Growth (sequential, Markdown output) ─────────────
    const finalReport = await step.run("08-growth", async () => {
      const markdown = await runSubagent<string>({
        subagentFile: "08-growth.md",
        userInput: {
          diagnostico,
          arquitectura,
          builder: builderOut,
          ui: uiOut,
          qa: qaOut,
          deployment: deploymentOut,
          monetizacion,
        },
        expectJSON: false,
      });
      await patchJob(jobId, {
        final_report: markdown,
        status: "completed",
        current_step: "done",
        completed_at: new Date().toISOString(),
      });
      await syncClient({ status: "live" });
      return markdown;
    });

    return { jobId, status: "completed", reportLength: finalReport.length };
  }
);
