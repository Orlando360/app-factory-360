import { createServerClient, ClientData } from "./supabase";
import { runAgent1 } from "./agents/agent1-diagnostico";
import { runAgent2 } from "./agents/agent2-arquitecto";
import { runAgent3 } from "./agents/agent3-uiux";
import { runAgent4 } from "./agents/agent4-builder";
import { runAgent5 } from "./agents/agent5-qa";
import { runAgent6 } from "./agents/agent6-deploy";
import { runAgent7 } from "./agents/agent7-monetizacion";
import { runAgent8 } from "./agents/agent8-growth";

const AGENTS = [
  { key: "agent1", name: "Diagnóstico", description: "Analizando tu negocio con metodología McKinsey + JTBD" },
  { key: "agent2", name: "Arquitectura", description: "Diseñando la arquitectura de producto" },
  { key: "agent3", name: "UI/UX", description: "Creando el sistema de diseño" },
  { key: "agent4", name: "Builder", description: "Construyendo todos los archivos de la app" },
  { key: "agent5", name: "QA", description: "Revisando y corrigiendo el código" },
  { key: "agent6", name: "Deploy", description: "Desplegando en GitHub y Vercel" },
  { key: "agent7", name: "Monetización", description: "Definiendo estrategia de precios y ROI" },
  { key: "agent8", name: "Growth", description: "Diseñando onboarding y estrategia de crecimiento" },
];

async function updateProgress(
  clientId: string,
  agentIndex: number,
  status: string,
  agentOutputs: Record<string, unknown>,
  extraFields: Record<string, unknown> = {}
): Promise<void> {
  const supabase = createServerClient();
  const { error } = await supabase
    .from("clients")
    .update({
      status,
      agent_outputs: agentOutputs,
      ...extraFields,
    })
    .eq("id", clientId);

  if (error) {
    console.error(`[Orchestrator] Supabase update error at agent ${agentIndex}:`, error);
  }
}

async function runAgentWithRetry<T>(
  agentFn: () => Promise<T>,
  agentName: string,
  maxRetries = 3
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`[${agentName}] Attempt ${attempt + 1} at ${new Date().toISOString()}`);
      const result = await agentFn();
      console.log(`[${agentName}] Completed at ${new Date().toISOString()}`);
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      const status = (error as { status?: number })?.status;
      const isNonRetryable = status && status >= 400 && status < 500 && status !== 429;

      if (isLastAttempt || isNonRetryable) {
        console.error(`[${agentName}] Failed after ${attempt + 1} attempts:`, error);
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`[${agentName}] Attempt ${attempt + 1} failed (status: ${status}), retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error(`[${agentName}] Unexpected: exhausted retries`);
}

export async function runFactory(clientId: string): Promise<void> {
  const supabase = createServerClient();

  // Load client data
  const { data: clientData, error: loadError } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (loadError || !clientData) {
    console.error(`[Orchestrator] Failed to load client ${clientId}:`, loadError);
    return;
  }

  const client = clientData as ClientData;
  const agentOutputs: Record<string, unknown> = { ...((client.agent_outputs as Record<string, unknown>) || {}) };

  console.log(`[Orchestrator] Starting factory for client: ${client.business_name} (${clientId})`);

  try {
    // Agent 1 — Diagnóstico
    await updateProgress(clientId, 0, "generating", agentOutputs, { current_agent: "agent1" });
    const agent1Output = await runAgentWithRetry(
      () => runAgent1(client),
      AGENTS[0].name
    );
    agentOutputs.agent1 = agent1Output;
    await updateProgress(clientId, 1, "generating", agentOutputs, { current_agent: "agent2" });

    // Agent 2 — Arquitecto
    const agent2Output = await runAgentWithRetry(
      () => runAgent2(client, agent1Output),
      AGENTS[1].name
    );
    agentOutputs.agent2 = agent2Output;
    await updateProgress(clientId, 2, "generating", agentOutputs, { current_agent: "agent3" });

    // Agent 3 — UI/UX
    const agent3Output = await runAgentWithRetry(
      () => runAgent3(client, agentOutputs),
      AGENTS[2].name
    );
    agentOutputs.agent3 = agent3Output;
    await updateProgress(clientId, 3, "generating", agentOutputs, { current_agent: "agent4" });

    // Agent 4 — Builder
    const agent4Output = await runAgentWithRetry(
      () => runAgent4(client, agentOutputs),
      AGENTS[3].name
    );
    agentOutputs.agent4 = agent4Output;
    await updateProgress(clientId, 4, "qa_review", agentOutputs, { current_agent: "agent5" });

    // Agent 5 — QA
    const agent5Output = await runAgentWithRetry(
      () => runAgent5(client, agentOutputs),
      AGENTS[4].name
    );
    agentOutputs.agent5 = agent5Output;
    await updateProgress(clientId, 5, "deploying", agentOutputs, { current_agent: "agent6" });

    // Agent 6 — Deploy
    const agent6Output = await runAgentWithRetry(
      () => runAgent6(client, agentOutputs),
      AGENTS[5].name
    );
    agentOutputs.agent6 = agent6Output;
    await updateProgress(clientId, 6, "live", agentOutputs, {
      current_agent: "agent7",
      github_url: agent6Output.github_url,
      vercel_url: agent6Output.vercel_url,
    });

    // Agent 7 — Monetización
    const agent7Output = await runAgentWithRetry(
      () => runAgent7(client, agentOutputs),
      AGENTS[6].name
    );
    agentOutputs.agent7 = agent7Output;
    await updateProgress(clientId, 7, "live", agentOutputs, { current_agent: "agent8" });

    // Agent 8 — Growth
    const agent8Output = await runAgentWithRetry(
      () => runAgent8(client, agentOutputs),
      AGENTS[7].name
    );
    agentOutputs.agent8 = agent8Output;
    await updateProgress(clientId, 8, "live", agentOutputs, { current_agent: null });

    console.log(`[Orchestrator] Factory complete for client: ${client.business_name}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[Orchestrator] Fatal error for client ${clientId}:`, errorMessage);

    await supabase
      .from("clients")
      .update({
        status: "error",
        error_message: errorMessage,
        agent_outputs: agentOutputs,
      })
      .eq("id", clientId);
  }
}
