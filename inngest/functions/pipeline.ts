import { inngest } from "@/inngest/client";
import { AGENT_PROMPTS } from "@/inngest/agent-prompts";
import { callAnthropicWithRetry } from "@/lib/anthropic-retry";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function updateJob(jobId: string, update: Record<string, unknown>) {
  const supabase = getSupabase();
  const { error } = await supabase.from("pipeline_jobs").update(update).eq("id", jobId);
  if (error) {
    console.error(`[Pipeline] Failed to update job ${jobId}:`, error.message);
  }
}

async function syncClient(clientId: string, patch: Record<string, unknown>) {
  if (!clientId) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("clients").update(patch).eq("id", clientId);
  if (error) {
    console.error(`[Pipeline] Failed to sync client ${clientId}:`, error.message);
  }
}

async function appendAgentOutput(jobId: string, agentId: string, output: string) {
  const supabase = getSupabase();
  const { error } = await supabase.rpc("append_agent_output", {
    job_id: jobId,
    agent_id: agentId,
    output,
  });
  if (error) {
    console.error(`[Pipeline] Failed to append output for ${agentId}:`, error.message);
  }
}

// Strategic agents (01, 02, 05, 06, 07, 08) → Opus 4.7 with max_tokens ×1.4
// Builder/UI-UX agents (03, 04) → Sonnet 4.6 (cost-optimized)
const BUILDER_AGENTS = new Set(["03-builder", "04-ui-ux"]);

async function callAgent(
  agentId: keyof typeof AGENT_PROMPTS,
  userMessage: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada");

  const isBuilder = BUILDER_AGENTS.has(agentId);

  const response = await callAnthropicWithRetry(
    {
      model: isBuilder ? "claude-sonnet-4-6" : "claude-opus-4-7",
      max_tokens: isBuilder ? 16000 : 22400,
      ...(isBuilder ? {} : { thinking: { type: "adaptive" } }),
      system: AGENT_PROMPTS[agentId],
      messages: [{ role: "user", content: userMessage }],
    },
    apiKey,
  );

  return response.content.find((b) => b.type === "text")?.text ?? "";
}

export const pipelineFunction = inngest.createFunction(
  {
    id: "app-factory-pipeline",
    name: "App Factory 360 Pipeline",
    retries: 2,
    triggers: [{ event: "app-factory/pipeline.start" }],
  },
  async ({ event, step }) => {
    const { jobId, client_brief } = event.data;
    const clientId = (client_brief as Record<string, unknown>)?.id as string | undefined;
    const briefText = JSON.stringify(client_brief, null, 2);

    // ── Step 01: Diagnosticador ──────────────────────────────────────────────
    const diagnostico = await step.run("01-diagnosticador", async () => {
      await updateJob(jobId, { current_step: "01-diagnosticador", status: "running" });
      if (clientId) await syncClient(clientId, { status: "generating", current_pipeline_job_id: jobId });
      const output = await callAgent(
        "01-diagnosticador",
        `Analiza este brief de cliente y produce el diagnóstico estratégico:\n\n${briefText}`
      );
      await appendAgentOutput(jobId, "01-diagnosticador", output);
      return output;
    });

    // ── Step 02: Arquitecto ──────────────────────────────────────────────────
    const arquitectura = await step.run("02-arquitecto", async () => {
      await updateJob(jobId, { current_step: "02-arquitecto" });
      const output = await callAgent(
        "02-arquitecto",
        `Con base en este diagnóstico estratégico, produce la especificación técnica completa de la app:\n\n${diagnostico}`
      );
      await appendAgentOutput(jobId, "02-arquitecto", output);
      return output;
    });

    // ── Steps 03 + 04: Builder y UI/UX en paralelo ──────────────────────────
    await updateJob(jobId, { current_step: "03-builder y 04-ui-ux" });

    const [codigoBackend, codigoFrontend] = await Promise.all([
      step.run("03-builder", async () => {
        const output = await callAgent(
          "03-builder",
          `Con base en esta especificación técnica, genera el código backend completo (API Routes, Server Actions, tipos, integración Supabase):\n\n${arquitectura}`
        );
        await appendAgentOutput(jobId, "03-builder", output);
        return output;
      }),
      step.run("04-ui-ux", async () => {
        const output = await callAgent(
          "04-ui-ux",
          `Con base en esta especificación técnica, genera todos los componentes React y páginas con el sistema de diseño Quiet Luxury:\n\n${arquitectura}`
        );
        await appendAgentOutput(jobId, "04-ui-ux", output);
        return output;
      }),
    ]);

    // ── Steps 05 + 06: QA y Deployment en paralelo ──────────────────────────
    await updateJob(jobId, { current_step: "05-qa y 06-deployment" });

    const [qa, deployment] = await Promise.all([
      step.run("05-qa", async () => {
        const codeContext = `ARQUITECTURA:\n${arquitectura}\n\nCÓDIGO BACKEND:\n${codigoBackend}\n\nCÓDIGO FRONTEND:\n${codigoFrontend}`;
        const output = await callAgent(
          "05-qa",
          `Revisa este código y produce el reporte QA completo con correcciones:\n\n${codeContext}`
        );
        await appendAgentOutput(jobId, "05-qa", output);
        return output;
      }),
      step.run("06-deployment", async () => {
        const output = await callAgent(
          "06-deployment",
          `Con base en esta arquitectura, genera la configuración completa de deployment para Vercel + Supabase:\n\n${arquitectura}`
        );
        await appendAgentOutput(jobId, "06-deployment", output);
        return output;
      }),
    ]);

    // ── Step 07: Monetización ────────────────────────────────────────────────
    const monetizacion = await step.run("07-monetizacion", async () => {
      await updateJob(jobId, { current_step: "07-monetizacion" });
      const context = `DIAGNÓSTICO:\n${diagnostico}\n\nARQUITECTURA:\n${arquitectura}`;
      const output = await callAgent(
        "07-monetizacion",
        `Define la estrategia de monetización completa para esta app en el mercado colombiano/LATAM:\n\n${context}`
      );
      await appendAgentOutput(jobId, "07-monetizacion", output);
      return output;
    });

    // ── Step 08: Growth (reporte final) ─────────────────────────────────────
    const finalReport = await step.run("08-growth", async () => {
      await updateJob(jobId, { current_step: "08-growth" });
      const fullContext = [
        `DIAGNÓSTICO:\n${diagnostico}`,
        `ARQUITECTURA:\n${arquitectura}`,
        `CÓDIGO BACKEND:\n${codigoBackend}`,
        `CÓDIGO FRONTEND:\n${codigoFrontend}`,
        `QA:\n${qa}`,
        `DEPLOYMENT:\n${deployment}`,
        `MONETIZACIÓN:\n${monetizacion}`,
      ].join("\n\n---\n\n");

      const output = await callAgent(
        "08-growth",
        `Genera el reporte ejecutivo final para el cliente basándote en todos estos outputs del pipeline:\n\n${fullContext}`
      );
      await appendAgentOutput(jobId, "08-growth", output);
      return output;
    });

    // ── Marcar como completado ───────────────────────────────────────────────
    await step.run("complete", async () => {
      await updateJob(jobId, {
        current_step: "completed",
        status: "completed",
        final_report: finalReport,
        completed_at: new Date().toISOString(),
      });
      if (clientId) await syncClient(clientId, { status: "live" });
    });

    return { jobId, status: "completed" };
  }
);
