"use client";

import { useState } from "react";

type AppPreviewProps = {
  github_url: string;
  vercel_url: string;
  app_name?: string;
};

export default function AppPreview({ github_url, vercel_url, app_name }: AppPreviewProps) {
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [showIframe, setShowIframe] = useState(false);

  return (
    <div className="space-y-4">
      {/* App header */}
      <div className="p-5 rounded-xl border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.05)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-[rgba(34,197,94,0.15)] border border-[rgba(34,197,94,0.3)] flex items-center justify-center">
            <span className="text-[#4ade80] text-xl">🚀</span>
          </div>
          <div>
            <div className="font-bold text-white">{app_name || "Tu app está en vivo"}</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
              <span className="text-xs text-[#4ade80]">Desplegada y funcionando</span>
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={vercel_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(245,197,24,0.4)] hover:bg-[rgba(245,197,24,0.03)] transition-all duration-200 group"
          >
            <span className="text-xl">🌐</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[rgba(255,255,255,0.5)] mb-0.5">App en producción</div>
              <div className="text-sm font-medium text-white truncate group-hover:text-[#F5C518] transition-colors">
                {vercel_url.replace(/^https?:\/\//, "")}
              </div>
            </div>
            <span className="text-[rgba(255,255,255,0.3)] group-hover:text-[#F5C518] transition-colors text-sm">↗</span>
          </a>

          <a
            href={github_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] hover:border-[rgba(245,197,24,0.4)] hover:bg-[rgba(245,197,24,0.03)] transition-all duration-200 group"
          >
            <span className="text-xl">📦</span>
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[rgba(255,255,255,0.5)] mb-0.5">Repositorio GitHub</div>
              <div className="text-sm font-medium text-white truncate group-hover:text-[#F5C518] transition-colors">
                {github_url.replace(/^https?:\/\/github\.com\//, "")}
              </div>
            </div>
            <span className="text-[rgba(255,255,255,0.3)] group-hover:text-[#F5C518] transition-colors text-sm">↗</span>
          </a>
        </div>
      </div>

      {/* Iframe preview */}
      <div className="rounded-xl border border-[rgba(255,255,255,0.08)] overflow-hidden">
        {/* Browser chrome */}
        <div className="bg-[rgba(255,255,255,0.04)] px-4 py-3 flex items-center gap-3 border-b border-[rgba(255,255,255,0.06)]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]" />
            <div className="w-3 h-3 rounded-full bg-[rgba(255,255,255,0.1)]" />
          </div>
          <div className="flex-1 bg-[rgba(255,255,255,0.05)] rounded-md px-3 py-1 text-xs text-[rgba(255,255,255,0.4)] truncate">
            {vercel_url}
          </div>
          {!showIframe && (
            <button
              onClick={() => setShowIframe(true)}
              className="text-xs bg-[#F5C518] text-[#0A0A0A] font-bold px-3 py-1 rounded-md hover:bg-[#e6b515] transition-colors"
            >
              Cargar preview
            </button>
          )}
        </div>

        {/* Iframe content */}
        {showIframe ? (
          <div className="relative" style={{ height: "500px" }}>
            {!iframeLoaded && !iframeError && (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.02)]">
                <div className="text-center">
                  <div className="w-8 h-8 border-2 border-[#F5C518] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm text-[rgba(255,255,255,0.4)]">Cargando preview...</p>
                </div>
              </div>
            )}
            {iframeError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-[rgba(255,255,255,0.02)]">
                <div className="text-center">
                  <p className="text-sm text-[rgba(255,255,255,0.4)] mb-3">
                    No se puede mostrar en iframe. Abre en nueva pestaña.
                  </p>
                  <a
                    href={vercel_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#F5C518] hover:underline"
                  >
                    Abrir app →
                  </a>
                </div>
              </div>
            ) : (
              <iframe
                src={vercel_url}
                className="w-full h-full border-0"
                onLoad={() => setIframeLoaded(true)}
                onError={() => setIframeError(true)}
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            )}
          </div>
        ) : (
          <div className="h-40 flex items-center justify-center bg-[rgba(255,255,255,0.01)]">
            <p className="text-sm text-[rgba(255,255,255,0.3)]">
              Haz clic en &quot;Cargar preview&quot; para ver la app
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
