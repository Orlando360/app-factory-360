"use client";

import { useState } from "react";
import AgentProgress from "@/components/AgentProgress";
import AppPreview from "@/components/AppPreview";
import type { ClientData } from "@/lib/supabase";

const ANSWERS = [
  { key: "business_name", label: "Nombre del negocio" },
  { key: "sector", label: "Sector" },
  { key: "years_operating", label: "Años operando" },
  { key: "team_size", label: "Tamaño del equipo" },
  { key: "main_product", label: "Producto/servicio principal" },
  { key: "business_description", label: "Descripción del negocio" },
  { key: "main_problem", label: "Problema principal" },
  { key: "problem_duration", label: "Tiempo con el problema" },
  { key: "tried_solutions", label: "Soluciones intentadas" },
  { key: "monthly_cost", label: "Costo mensual estimado" },
  { key: "impact_if_solved", label: "Impacto si se resuelve" },
  { key: "client_management", label: "Gestión de clientes" },
  { key: "time_consuming_process", label: "Proceso más lento" },
  { key: "has_team", label: "Acceso del equipo" },
  { key: "daily_metrics", label: "Métricas diarias" },
  { key: "current_software", label: "Software actual" },
  { key: "six_month_goal", label: "Meta 6 meses" },
  { key: "competitors", label: "Competidores" },
  { key: "differentiator", label: "Diferenciador" },
  { key: "willingness_to_pay", label: "Disposición a pagar" },
  { key: "additional_info", label: "Información adicional" },
];

const STATUS_BADGE: Record<string, string> = {
  pending: "badge-pending",
  generating: "badge-generating",
  qa_review: "badge-qa_review",
  deploying: "badge-deploying",
  live: "badge-live",
  error: "badge-error",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  generating: "Generando",
  qa_review: "QA Review",
  deploying: "Desplegando",
  live: "En vivo",
  error: "Error",
};

type ClientDetailClientProps = {
  client: ClientData;
};

export default function ClientDetailClient({ client }: ClientDetailClientProps) {
  const [generating, setGenerating] = useState(false);
  const [jobId, setJobId] = useState<string | null>(
    client.current_pipeline_job_id ??
      (typeof window !== "undefined"
        ? localStorage.getItem(`pipeline_job_${client.id}`)
        : null)
  );
  const [activeTab, setActiveTab] = useState<"progress" | "answers">("progress");

  const agentOutputs = (client.agent_outputs as Record<string, unknown>) || {};
  const currentStatus = jobId ? "generating" : client.status;

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const response = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id }),
      });
      if (response.ok) {
        const { jobId: newJobId } = await response.json();
        setJobId(newJobId);
        localStorage.setItem(`pipeline_job_${client.id}`, newJobId);
      }
    } catch (err) {
      console.error("Failed to start pipeline:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-[rgba(245,197,24,0.1)] bg-[rgba(10,10,10,0.9)] backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center gap-3 mb-1">
            <a
              href="/dashboard"
              className="text-sm text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
            >
              ← Dashboard
            </a>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black">{client.business_name}</h1>
              <div className="text-sm text-[rgba(255,255,255,0.4)]">{client.sector}</div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_BADGE[currentStatus] || "badge-pending"}`}>
                {STATUS_LABEL[currentStatus] || currentStatus}
              </span>
              {(client.status === "pending" && !jobId) && (
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="bg-[#F5C518] text-[#0A0A0A] font-bold px-5 py-2 text-sm rounded-lg hover:bg-[#e6b515] transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {generating ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                      Iniciando...
                    </>
                  ) : (
                    "⚡ Generar App"
                  )}
                </button>
              )}
              {client.status === "live" && client.vercel_url && (
                <a
                  href={client.vercel_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[rgba(34,197,94,0.15)] text-[#4ade80] border border-[rgba(34,197,94,0.3)] font-bold px-5 py-2 text-sm rounded-lg hover:bg-[rgba(34,197,94,0.25)] transition-colors"
                >
                  Ver app en vivo →
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* App preview for live status */}
        {client.status === "live" && client.github_url && client.vercel_url && (
          <div className="mb-8">
            <AppPreview
              github_url={client.github_url}
              vercel_url={client.vercel_url}
              app_name={
                (agentOutputs.agent2 as Record<string, unknown>)?.app_name as string | undefined
              }
            />
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 border-b border-[rgba(255,255,255,0.08)] mb-6">
          {(["progress", "answers"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "text-[#F5C518] border-[#F5C518]"
                  : "text-[rgba(255,255,255,0.4)] border-transparent hover:text-white"
              }`}
            >
              {tab === "progress" ? "Progreso de agentes" : "Respuestas del cliente"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "progress" ? (
          jobId ? (
            <AgentProgress jobId={jobId} />
          ) : (
            <div className="text-[rgba(255,255,255,0.4)] text-sm py-6 text-center">
              Presiona <strong className="text-white">⚡ Generar App</strong> para iniciar el pipeline de 8 agentes.
            </div>
          )
        ) : (
          <div className="grid gap-3">
            {ANSWERS.map(({ key, label }, index) => {
              const value = client[key as keyof ClientData] as string;
              return (
                <div
                  key={key}
                  className="p-4 rounded-xl border border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs text-[rgba(245,197,24,0.5)] font-bold w-6 flex-shrink-0 mt-0.5">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-[rgba(255,255,255,0.4)] mb-1">{label}</div>
                      <div className="text-sm text-white break-words">
                        {value || <span className="text-[rgba(255,255,255,0.2)] italic">Sin respuesta</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
