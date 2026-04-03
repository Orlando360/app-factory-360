import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const AGENT_NAMES: Record<string, { name: string; description: string }> = {
  agent1: { name: "Diagnóstico", description: "Analizando tu negocio con metodología McKinsey + JTBD" },
  agent2: { name: "Arquitectura", description: "Diseñando la arquitectura de producto" },
  agent3: { name: "UI/UX", description: "Creando el sistema de diseño" },
  agent4: { name: "Builder", description: "Construyendo todos los archivos de la app" },
  agent5: { name: "QA", description: "Revisando y corrigiendo el código" },
  agent6: { name: "Deploy", description: "Desplegando en GitHub y Vercel" },
  agent7: { name: "Monetización", description: "Definiendo estrategia de precios y ROI" },
  agent8: { name: "Growth", description: "Diseñando onboarding y estrategia de crecimiento" },
};

function getAgentIndex(agentOutputs: Record<string, unknown>): number {
  const keys = ["agent1", "agent2", "agent3", "agent4", "agent5", "agent6", "agent7", "agent8"];
  let count = 0;
  for (const key of keys) {
    if (agentOutputs[key]) count++;
    else break;
  }
  return count;
}

function formatSSE(data: unknown): string {
  return `data: ${JSON.stringify(data)}\n\n`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  const { clientId } = await params;

  const encoder = new TextEncoder();
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      const supabase = createServerClient();

      const send = (data: unknown) => {
        if (!closed) {
          try {
            controller.enqueue(encoder.encode(formatSSE(data)));
          } catch {
            closed = true;
          }
        }
      };

      // Initial ping
      send({ type: "connected", clientId });

      const poll = async () => {
        if (closed) return;

        try {
          const { data: client, error } = await supabase
            .from("clients")
            .select("status, agent_outputs, current_agent, github_url, vercel_url, error_message")
            .eq("id", clientId)
            .single();

          if (error || !client) {
            send({ type: "error", message: "Client not found" });
            closed = true;
            controller.close();
            return;
          }

          const agentOutputs = (client.agent_outputs as Record<string, unknown>) || {};
          const completedAgents = getAgentIndex(agentOutputs);
          const progress = Math.round((completedAgents / 8) * 100);
          const currentAgent = client.current_agent as string | null;

          const payload = {
            type: "progress",
            status: client.status,
            progress,
            completed_agents: completedAgents,
            current_agent: currentAgent
              ? { key: currentAgent, ...AGENT_NAMES[currentAgent] }
              : null,
            agent_outputs: agentOutputs,
            github_url: client.github_url,
            vercel_url: client.vercel_url,
            error: client.error_message,
          };

          send(payload);

          // Stop polling if terminal state
          if (
            client.status === "live" ||
            client.status === "error"
          ) {
            send({ type: "done", status: client.status });
            closed = true;
            controller.close();
            return;
          }
        } catch (err) {
          console.error("[SSE] Poll error:", err);
          send({ type: "error", message: "Polling error" });
        }

        if (!closed) {
          setTimeout(poll, 2000);
        }
      };

      // Start polling
      await poll();

      // Handle client disconnect
      request.signal.addEventListener("abort", () => {
        closed = true;
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
