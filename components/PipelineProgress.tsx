"use client";

import { useEffect, useState } from "react";
import { createBrowserClient } from "@/lib/supabase";

type PipelineJob = {
  id: string;
  status: "pending" | "running" | "completed" | "error";
  current_step: string | null;
  agents_outputs: Record<string, unknown> | null;
  final_report: string | null;
  error_message: string | null;
};

const STEPS: { key: string; label: string }[] = [
  { key: "diagnosticador", label: "Diagnóstico" },
  { key: "arquitecto", label: "Arquitectura" },
  { key: "builder+ui-ux", label: "Builder + UI/UX (paralelo)" },
  { key: "qa+deployment", label: "QA + Deployment (paralelo)" },
  { key: "monetizacion", label: "Monetización" },
  { key: "growth", label: "Growth / Reporte final" },
  { key: "done", label: "Completado" },
];

function stepIndex(currentStep: string | null): number {
  if (!currentStep) return -1;
  return STEPS.findIndex((s) => s.key === currentStep);
}

export function PipelineProgress({ jobId }: { jobId: string }) {
  const [job, setJob] = useState<PipelineJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserClient();

    let cancelled = false;

    // initial fetch
    supabase
      .from("pipeline_jobs")
      .select("id,status,current_step,agents_outputs,final_report,error_message")
      .eq("id", jobId)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setJob(data as PipelineJob);
      });

    // realtime subscription
    const channel = supabase
      .channel(`pipeline_jobs:${jobId}`)
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
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        Error cargando el job: {error}
      </div>
    );
  }

  if (!job) {
    return (
      <div className="rounded-2xl border border-[#E8D8C1] bg-[#F7F3EE] p-6 text-[#1B1916]">
        Cargando pipeline…
      </div>
    );
  }

  const idx = stepIndex(job.current_step);
  const progressPct = job.status === "completed" ? 100 : Math.max(0, ((idx + 1) / STEPS.length) * 100);

  return (
    <div className="rounded-2xl border border-[#E8D8C1] bg-[#F7F3EE] p-6 text-[#1B1916]">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Pipeline en curso</h2>
        <span
          className={`rounded-xl px-3 py-1 text-sm font-medium ${
            job.status === "completed"
              ? "bg-[#3A7D44] text-white"
              : job.status === "error"
                ? "bg-[#B3261E] text-white"
                : "bg-[#C4873A] text-white"
          }`}
        >
          {job.status}
        </span>
      </div>

      <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-[#E8D8C1]">
        <div
          className="h-full rounded-full bg-[#C4873A] transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      <ol className="space-y-2">
        {STEPS.map((step, i) => {
          const done = job.status === "completed" || i < idx;
          const active = i === idx && job.status !== "completed";
          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors duration-200 ${
                active
                  ? "bg-[#C4873A]/10 font-semibold"
                  : done
                    ? "opacity-70"
                    : "opacity-40"
              }`}
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                  done
                    ? "bg-[#3A7D44] text-white"
                    : active
                      ? "bg-[#C4873A] text-white"
                      : "bg-[#E8D8C1] text-[#1B1916]"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              <span>{step.label}</span>
            </li>
          );
        })}
      </ol>

      {job.status === "error" && job.error_message && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {job.error_message}
        </div>
      )}

      {job.status === "completed" && job.final_report && (
        <article className="prose prose-stone mt-6 max-w-none rounded-xl bg-white p-6">
          <pre className="whitespace-pre-wrap text-sm">{job.final_report}</pre>
        </article>
      )}
    </div>
  );
}
