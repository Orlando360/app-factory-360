"use client";

import Link from "next/link";

type Status = "pending" | "generating" | "qa_review" | "deploying" | "live" | "error";

type ClientCardProps = {
  id: string;
  business_name: string;
  sector: string;
  created_at: string;
  status: Status;
  vercel_url?: string | null;
  onGenerate?: (id: string) => void;
  generating?: boolean;
};

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  pending: { label: "Pendiente", className: "badge-pending" },
  generating: { label: "Generando", className: "badge-generating" },
  qa_review: { label: "QA Review", className: "badge-qa_review" },
  deploying: { label: "Desplegando", className: "badge-deploying" },
  live: { label: "En vivo", className: "badge-live" },
  error: { label: "Error", className: "badge-error" },
};

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ClientCard({
  id,
  business_name,
  sector,
  created_at,
  status,
  vercel_url,
  onGenerate,
  generating,
}: ClientCardProps) {
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  return (
    <div className="flex items-center gap-4 p-5 rounded-xl border border-[rgba(245,197,24,0.15)] bg-[rgba(255,255,255,0.02)] hover:border-[rgba(245,197,24,0.3)] hover:bg-[rgba(255,255,255,0.04)] transition-all duration-200">
      {/* Business info */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-white truncate">{business_name}</div>
        <div className="text-xs text-[rgba(255,255,255,0.45)] mt-0.5 truncate">{sector}</div>
      </div>

      {/* Date */}
      <div className="hidden md:block text-xs text-[rgba(255,255,255,0.4)] flex-shrink-0 w-40">
        {formatDate(created_at)}
      </div>

      {/* Status badge */}
      <div className="flex-shrink-0">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusConfig.className}`}>
          {(status === "generating" || status === "deploying") && (
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
          )}
          {statusConfig.label}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link
          href={`/dashboard/${id}`}
          className="px-3 py-1.5 text-xs font-semibold border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.6)] rounded-lg hover:border-[rgba(245,197,24,0.4)] hover:text-white transition-all duration-200"
        >
          Ver detalle
        </Link>

        {status === "pending" && onGenerate && (
          <button
            onClick={() => onGenerate(id)}
            disabled={generating}
            className="px-3 py-1.5 text-xs font-bold bg-[#F5C518] text-[#0A0A0A] rounded-lg hover:bg-[#e6b515] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {generating ? (
              <>
                <span className="w-3 h-3 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                Iniciando...
              </>
            ) : (
              "Generar App ⚡"
            )}
          </button>
        )}

        {status === "live" && vercel_url && (
          <a
            href={vercel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 text-xs font-bold bg-[rgba(34,197,94,0.15)] text-[#4ade80] border border-[rgba(34,197,94,0.3)] rounded-lg hover:bg-[rgba(34,197,94,0.25)] transition-colors"
          >
            Ver app →
          </a>
        )}
      </div>
    </div>
  );
}
