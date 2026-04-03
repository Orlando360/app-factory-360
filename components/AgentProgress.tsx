"use client";

import { useEffect, useRef, useState } from "react";

type AgentInfo = {
  key: string;
  name: string;
  description: string;
};

type ProgressData = {
  type: string;
  status?: string;
  progress?: number;
  completed_agents?: number;
  current_agent?: AgentInfo | null;
  agent_outputs?: Record<string, unknown>;
  github_url?: string | null;
  vercel_url?: string | null;
  error?: string | null;
};

type AgentProgressProps = {
  clientId: string;
  initialStatus?: string;
  initialOutputs?: Record<string, unknown>;
};

const ALL_AGENTS = [
  { key: "agent1", name: "Diagnóstico", description: "Metodología McKinsey + JTBD" },
  { key: "agent2", name: "Arquitectura", description: "Product Architecture" },
  { key: "agent3", name: "UI/UX", description: "Sistema de diseño" },
  { key: "agent4", name: "Builder", description: "Full Stack Engineering" },
  { key: "agent5", name: "QA", description: "Quality Assurance" },
  { key: "agent6", name: "Deploy", description: "GitHub + Vercel" },
  { key: "agent7", name: "Monetización", description: "Revenue Strategy LATAM" },
  { key: "agent8", name: "Growth", description: "B2B User Activation" },
];

function AgentStateIcon({ state }: { state: "pending" | "active" | "complete" | "error" }) {
  if (state === "complete") {
    return (
      <div className="w-8 h-8 rounded-full bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.4)] flex items-center justify-center flex-shrink-0">
        <span className="text-[#4ade80] text-sm">✓</span>
      </div>
    );
  }
  if (state === "active") {
    return (
      <div className="w-8 h-8 rounded-full bg-[rgba(245,197,24,0.1)] border-2 border-[#F5C518] flex items-center justify-center flex-shrink-0">
        <span className="w-3 h-3 rounded-full bg-[#F5C518] animate-pulse" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="w-8 h-8 rounded-full bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.4)] flex items-center justify-center flex-shrink-0">
        <span className="text-red-400 text-sm">✕</span>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full border border-[rgba(255,255,255,0.1)] flex items-center justify-center flex-shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-[rgba(255,255,255,0.2)]" />
    </div>
  );
}

function OutputPreview({ data }: { data: unknown }) {
  const [expanded, setExpanded] = useState(false);
  const preview = JSON.stringify(data, null, 2).slice(0, 200);
  const full = JSON.stringify(data, null, 2);

  return (
    <div className="mt-2">
      <pre className="text-xs text-[rgba(255,255,255,0.5)] bg-[rgba(255,255,255,0.03)] rounded-lg p-3 overflow-auto max-h-40 font-mono">
        {expanded ? full : preview + (full.length > 200 ? "..." : "")}
      </pre>
      {full.length > 200 && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="mt-1 text-xs text-[rgba(245,197,24,0.6)] hover:text-[#F5C518] transition-colors"
        >
          {expanded ? "Ver menos ↑" : "Ver más ↓"}
        </button>
      )}
    </div>
  );
}

export default function AgentProgress({ clientId, initialStatus, initialOutputs }: AgentProgressProps) {
  const [data, setData] = useState<ProgressData>({
    type: "progress",
    status: initialStatus || "pending",
    progress: 0,
    completed_agents: 0,
    current_agent: null,
    agent_outputs: initialOutputs || {},
  });
  const [connected, setConnected] = useState(false);
  const [done, setDone] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (initialStatus === "live" || initialStatus === "error") {
      setDone(true);
      return;
    }

    const es = new EventSource(`/api/progress/${clientId}`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    es.onmessage = (event) => {
      try {
        const parsed: ProgressData = JSON.parse(event.data);
        if (parsed.type === "progress") {
          setData(parsed);
        } else if (parsed.type === "done") {
          setDone(true);
          es.close();
        } else if (parsed.type === "error") {
          setDone(true);
          es.close();
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
    };
  }, [clientId, initialStatus]);

  const completedAgents = data.completed_agents || 0;
  const progress = data.progress || 0;
  const agentOutputs = data.agent_outputs || {};

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div className="p-6 rounded-xl border border-[rgba(245,197,24,0.2)] bg-[rgba(255,255,255,0.02)]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-bold text-lg">
              {data.status === "live" ? "App generada y desplegada" :
               data.status === "error" ? "Error en la generación" :
               data.current_agent ? `Ejecutando: ${data.current_agent.name}` :
               "En cola..."}
            </div>
            {data.current_agent && data.status !== "live" && (
              <div className="text-sm text-[rgba(255,255,255,0.5)] mt-0.5">
                {data.current_agent.description}
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-black text-[#F5C518]">{progress}%</div>
            <div className="text-xs text-[rgba(255,255,255,0.4)]">
              {completedAgents}/8 agentes
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-[rgba(255,255,255,0.06)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#F5C518] rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Connection indicator */}
        {!done && (
          <div className="flex items-center gap-1.5 mt-3">
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[#4ade80] animate-pulse" : "bg-[rgba(255,255,255,0.2)]"}`} />
            <span className="text-xs text-[rgba(255,255,255,0.35)]">
              {connected ? "Recibiendo actualizaciones en tiempo real" : "Conectando..."}
            </span>
          </div>
        )}
      </div>

      {/* Error message */}
      {data.error && (
        <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.08)] border border-[rgba(239,68,68,0.2)] text-red-400 text-sm">
          <strong>Error:</strong> {data.error}
        </div>
      )}

      {/* Agent list */}
      <div className="space-y-3">
        {ALL_AGENTS.map((agent, index) => {
          const isComplete = index < completedAgents;
          const isActive = data.current_agent?.key === agent.key && !isComplete;
          const isError = data.status === "error" && index === completedAgents && !isComplete;
          const state = isError ? "error" : isComplete ? "complete" : isActive ? "active" : "pending";
          const output = agentOutputs[agent.key];

          return (
            <div
              key={agent.key}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                isActive
                  ? "border-[rgba(245,197,24,0.4)] bg-[rgba(245,197,24,0.04)]"
                  : isComplete
                  ? "border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.02)]"
                  : "border-[rgba(255,255,255,0.06)] bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <AgentStateIcon state={state} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[rgba(245,197,24,0.5)] font-bold">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className={`font-semibold text-sm ${isComplete ? "text-white" : isActive ? "text-[#F5C518]" : "text-[rgba(255,255,255,0.4)]"}`}>
                      {agent.name}
                    </span>
                    {isActive && (
                      <span className="text-xs text-[rgba(245,197,24,0.6)] animate-pulse">ejecutando...</span>
                    )}
                  </div>
                  <div className="text-xs text-[rgba(255,255,255,0.35)] mt-0.5">{agent.description}</div>
                </div>
              </div>

              {isComplete && output != null && (
                <OutputPreview data={output} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
