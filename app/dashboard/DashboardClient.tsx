"use client";

import { useState } from "react";
import ClientCard from "@/components/ClientCard";

type Client = {
  id: string;
  business_name: string;
  sector: string;
  created_at: string;
  status: string;
  vercel_url: string | null;
};

type DashboardClientProps = {
  clients: Client[];
  statusCounts: Record<string, number>;
  loadError: string | null;
};

const STATUS_DISPLAY: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "#eab308" },
  generating: { label: "Generando", color: "#60a5fa" },
  qa_review: { label: "QA Review", color: "#fb923c" },
  deploying: { label: "Desplegando", color: "#c084fc" },
  live: { label: "En vivo", color: "#4ade80" },
  error: { label: "Error", color: "#f87171" },
};

export default function DashboardClient({ clients, statusCounts, loadError }: DashboardClientProps) {
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [localClients, setLocalClients] = useState(clients);
  const [filter, setFilter] = useState<string>("all");

  const handleGenerate = async (clientId: string) => {
    setGeneratingId(clientId);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });

      if (response.ok) {
        // Update local state
        setLocalClients((prev) =>
          prev.map((c) => c.id === clientId ? { ...c, status: "generating" } : c)
        );
      }
    } catch (err) {
      console.error("Failed to start generation:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  const filteredClients = filter === "all"
    ? localClients
    : localClients.filter((c) => c.status === filter);

  const totalClients = localClients.length;
  const liveCount = statusCounts.live || 0;

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="border-b border-[rgba(245,197,24,0.1)] bg-[rgba(10,10,10,0.9)] backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F5C518] flex items-center justify-center">
              <span className="text-[#0A0A0A] font-black text-sm">360</span>
            </div>
            <div>
              <span className="font-bold text-white">App Factory 360</span>
              <span className="ml-2 text-xs text-[rgba(255,255,255,0.4)]">Dashboard</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-[rgba(255,255,255,0.4)]">
              {liveCount} apps en vivo
            </span>
            <a
              href="/"
              className="text-xs text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
            >
              ← Sitio público
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
          {Object.entries(STATUS_DISPLAY).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setFilter(filter === status ? "all" : status)}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                filter === status
                  ? "border-[rgba(245,197,24,0.5)] bg-[rgba(245,197,24,0.05)]"
                  : "border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.15)]"
              }`}
            >
              <div className="text-2xl font-black mb-1" style={{ color: config.color }}>
                {statusCounts[status] || 0}
              </div>
              <div className="text-xs text-[rgba(255,255,255,0.4)]">{config.label}</div>
            </button>
          ))}
        </div>

        {/* Section header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg">
            {filter === "all"
              ? `Todos los clientes (${totalClients})`
              : `${STATUS_DISPLAY[filter]?.label} (${filteredClients.length})`}
          </h2>
          {filter !== "all" && (
            <button
              onClick={() => setFilter("all")}
              className="text-xs text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
            >
              Ver todos ×
            </button>
          )}
        </div>

        {/* Error state */}
        {loadError && (
          <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 text-sm mb-6">
            Error al cargar clientes: {loadError}. Verifica las variables de entorno de Supabase.
          </div>
        )}

        {/* Clients list */}
        {filteredClients.length === 0 ? (
          <div className="text-center py-20 text-[rgba(255,255,255,0.3)]">
            {filter === "all"
              ? "No hay clientes todavía. Comparte el link de /intake para empezar."
              : `No hay clientes con estado "${STATUS_DISPLAY[filter]?.label}".`}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Table header */}
            <div className="hidden md:flex items-center gap-4 px-5 py-2 text-xs text-[rgba(255,255,255,0.35)] font-semibold uppercase tracking-wider">
              <div className="flex-1">Negocio</div>
              <div className="w-40">Fecha</div>
              <div className="w-28">Estado</div>
              <div className="w-40">Acciones</div>
            </div>

            {filteredClients.map((client) => (
              <ClientCard
                key={client.id}
                id={client.id}
                business_name={client.business_name}
                sector={client.sector}
                created_at={client.created_at}
                status={client.status as "pending" | "generating" | "qa_review" | "deploying" | "live" | "error"}
                vercel_url={client.vercel_url}
                onGenerate={handleGenerate}
                generating={generatingId === client.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
