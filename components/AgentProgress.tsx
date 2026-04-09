"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

const AGENT_NAMES: Record<string, { name: string; description: string }> = {
  "01-diagnosticador": { name: "Diagnóstico", description: "Analizando tu negocio con metodología McKinsey + JTBD" },
  "02-arquitecto": { name: "Arquitectura", description: "Diseñando la arquitectura de producto" },
  "03-builder": { name: "Builder", description: "Construyendo el código backend" },
  "04-ui-ux": { name: "UI/UX", description: "Creando el sistema de diseño Quiet Luxury" },
  "05-qa": { name: "QA", description: "Revisando y corrigiendo el código" },
  "06-deployment": { name: "Deploy", description: "Configurando deployment en Vercel + Supabase" },
  "07-monetizacion": { name: "Monetización", description: "Definiendo estrategia de precios y ROI" },
  "08-growth": { name: "Growth", description: "Generando el reporte ejecutivo final" },
};

const AGENT_ORDER = [
  "01-diagnosticador",
  "02-arquitecto",
  "03-builder",
  "04-ui-ux",
  "05-qa",
  "06-deployment",
  "07-monetizacion",
  "08-growth",
];

type PipelineJob = {
  id: string;
  status: string;
  current_step: string | null;
  agents_outputs: Record<string, string>;
  final_report: string | null;
};

type AgentProgressProps = {
  jobId: string;
};

export default function AgentProgress({ jobId }: AgentProgressProps) {
  const [job, setJob] = useState<PipelineJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createBrowserClient();

    // Initial fetch
    supabase
      .from("pipeline_jobs")
      .select("id, status, current_step, agents_outputs, final_report")
      .eq("id", jobId)
      .single()
      .then(({ data }) => {
        if (data) setJob(data as PipelineJob);
        setLoading(false);
      });

    // Realtime subscription — push updates instead of polling
    const channel = supabase
      .channel(`pipeline-job-${jobId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pipeline_jobs",
          filter: `id=eq.${jobId}`,
        },
        (payload) => {
          setJob(payload.new as PipelineJob);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-[rgba(255,255,255,0.4)] text-sm py-4">
        <span className="w-4 h-4 border-2 border-[rgba(245,197,24,0.4)] border-t-[#F5C518] rounded-full animate-spin" />
        Conectando al pipeline...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-[rgba(255,255,255,0.4)] text-sm py-4">
        No se encontró el job de pipeline.
      </div>
    );
  }

  const completedAgents = AGENT_ORDER.filter((id) => !!job.agents_outputs?.[id]);
  const progress = Math.round((completedAgents.length / 8) * 100);
  const isCompleted = job.status === "completed";
  const isError = job.status === "error";

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-white">
            {isCompleted
              ? "Pipeline completado"
              : isError
              ? "Error en el pipeline"
              : progress === 0
              ? "Iniciando pipeline..."
              : `Progreso: ${progress}%`}
          </span>
          <span className="text-xs text-[rgba(255,255,255,0.4)]">
            {completedAgents.length}/8 agentes
          </span>
        </div>
        <div className="w-full bg-[rgba(255,255,255,0.08)] rounded-full h-2">
          <div
            className="h-2 rounded-full transition-all duration-700"
            style={{
              width: `${progress}%`,
              backgroundColor: isError ? "#ef4444" : "#F5C518",
            }}
          />
        </div>
      </div>

      {/* Agent cards */}
      <div className="space-y-2">
        {AGENT_ORDER.map((agentId) => {
          const agent = AGENT_NAMES[agentId];
          const isDone = !!job.agents_outputs?.[agentId];
          const isRunning = !isDone && job.current_step?.includes(agentId);

          return (
            <div
              key={agentId}
              className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                isDone
                  ? "border-[rgba(245,197,24,0.2)] bg-[rgba(245,197,24,0.05)]"
                  : isRunning
                  ? "border-[rgba(245,197,24,0.4)] bg-[rgba(245,197,24,0.08)]"
                  : "border-[rgba(255,255,255,0.06)] bg-[rgba(255,255,255,0.02)]"
              }`}
            >
              {/* Status icon */}
              <div className="w-7 h-7 flex items-center justify-center flex-shrink-0">
                {isDone ? (
                  <span className="text-[#F5C518] text-base leading-none">✓</span>
                ) : isRunning ? (
                  <span className="w-4 h-4 border-2 border-[rgba(245,197,24,0.4)] border-t-[#F5C518] rounded-full animate-spin block" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)] block" />
                )}
              </div>

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-semibold ${
                    isDone || isRunning ? "text-white" : "text-[rgba(255,255,255,0.4)]"
                  }`}
                >
                  {agent.name}
                </div>
                <div className="text-xs text-[rgba(255,255,255,0.3)] truncate">
                  {agent.description}
                </div>
              </div>

              {isDone && (
                <span className="text-xs text-[rgba(245,197,24,0.6)] font-medium flex-shrink-0">
                  Completado
                </span>
              )}
              {isRunning && (
                <span className="text-xs text-[#F5C518] font-medium flex-shrink-0 animate-pulse">
                  Procesando...
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Final report */}
      {isCompleted && job.final_report && (
        <div className="mt-4 p-5 rounded-2xl border border-[rgba(245,197,24,0.2)] bg-[rgba(245,197,24,0.04)]">
          <h3 className="text-sm font-bold text-[#F5C518] mb-3 uppercase tracking-wider">
            Reporte Ejecutivo Final
          </h3>
          <div className="text-[rgba(255,255,255,0.8)] text-sm leading-relaxed whitespace-pre-wrap">
            {job.final_report}
          </div>
        </div>
      )}
    </div>
  );
}
