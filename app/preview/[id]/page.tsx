"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

interface TechStack {
  frontend: string;
  backend: string;
  database: string;
  auth: string;
  integrations: string[];
}

interface Module {
  name: string;
  description: string;
  priority: "core" | "important" | "nice-to-have";
}

interface UserFlow {
  actor: string;
  flow: string;
}

interface Preview {
  app_name: string;
  tagline: string;
  problem_statement: string;
  solution_summary: string;
  roi_projection: string;
  tech_stack: TechStack;
  modules: Module[];
  user_flows: UserFlow[];
  complexity: "simple" | "medium" | "complex";
  estimated_weeks: number;
  risks: string[];
  competitive_advantage: string;
}

const PRIORITY_STYLES = {
  core: { bg: "#1a3a1a", border: "#22c55e", text: "#22c55e", label: "CORE" },
  important: { bg: "#1a2a3a", border: "#3b82f6", text: "#3b82f6", label: "IMPORTANTE" },
  "nice-to-have": { bg: "#2a1a3a", border: "#a855f7", text: "#a855f7", label: "OPCIONAL" },
};

const COMPLEXITY_LABEL = {
  simple: { label: "Simple", color: "#22c55e" },
  medium: { label: "Media", color: "#f59e0b" },
  complex: { label: "Compleja", color: "#ef4444" },
};

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;

  const [preview, setPreview] = useState<Preview | null>(null);
  const [clientName, setClientName] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [adjustText, setAdjustText] = useState("");
  const [showAdjust, setShowAdjust] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchPreview();
  }, [clientId]);

  async function fetchPreview() {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/${clientId}`);
      const data = await res.json();
      if (data.client) {
        setClientName(data.client.business_name || "Cliente");
        if (data.client.agent_outputs?.preview) {
          setPreview(data.client.agent_outputs.preview);
        } else {
          await generatePreview();
        }
      }
    } catch {
      setError("No se pudo cargar la propuesta.");
    } finally {
      setLoading(false);
    }
  }

  async function generatePreview() {
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.preview) {
        setPreview(data.preview);
      } else {
        setError("No se pudo generar la propuesta. Intenta de nuevo.");
      }
    } catch {
      setError("Error generando propuesta.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleApprove() {
    setApproving(true);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (data.started || data.jobId) {
        router.push(`/dashboard/${clientId}`);
      } else {
        setError("No se pudo iniciar el pipeline.");
        setApproving(false);
      }
    } catch {
      setError("Error iniciando la construcción.");
      setApproving(false);
    }
  }

  async function handleAdjust() {
    if (!adjustText.trim()) return;
    setGenerating(true);
    setShowAdjust(false);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, adjustments: adjustText }),
      });
      const data = await res.json();
      if (data.preview) {
        setPreview(data.preview);
        setAdjustText("");
      }
    } catch {
      setError("Error regenerando propuesta.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading || generating) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, border: "3px solid #F5C518", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#F5C518", fontFamily: "Inter, sans-serif", fontSize: 16 }}>
          {generating ? "Claude está analizando tu negocio y diseñando la propuesta..." : "Cargando propuesta..."}
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error && !preview) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
        <p style={{ color: "#ef4444", fontFamily: "Inter, sans-serif" }}>{error}</p>
        <button onClick={generatePreview} style={{ background: "#F5C518", color: "#0A0A0A", border: "none", borderRadius: 8, padding: "12px 24px", fontWeight: 700, cursor: "pointer" }}>
          Reintentar
        </button>
      </div>
    );
  }

  if (!preview) return null;

  const complexity = COMPLEXITY_LABEL[preview.complexity] || COMPLEXITY_LABEL.medium;

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "Inter, sans-serif", color: "#FFFFFF", padding: "40px 24px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <button onClick={() => router.push("/dashboard")} style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: 14, marginBottom: 16, padding: 0 }}>
            ← Volver al dashboard
          </button>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <p style={{ color: "#888", fontSize: 13, marginBottom: 4 }}>Propuesta para {clientName}</p>
              <h1 style={{ fontSize: 36, fontWeight: 800, color: "#F5C518", margin: 0 }}>{preview.app_name}</h1>
              <p style={{ color: "#aaa", fontSize: 18, marginTop: 8 }}>{preview.tagline}</p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ background: "#1a1a1a", border: `1px solid ${complexity.color}`, color: complexity.color, borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>
                Complejidad: {complexity.label}
              </span>
              <span style={{ background: "#1a1a1a", border: "1px solid #F5C518", color: "#F5C518", borderRadius: 6, padding: "4px 12px", fontSize: 13, fontWeight: 600 }}>
                ~{preview.estimated_weeks} semanas
              </span>
            </div>
          </div>
        </div>

        {/* SECCIÓN NEGOCIO */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#F5C518", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Propuesta de Negocio</h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="El Problema">
              <p style={{ color: "#ccc", lineHeight: 1.7, fontSize: 15 }}>{preview.problem_statement}</p>
            </Card>
            <Card title="La Solución">
              <p style={{ color: "#ccc", lineHeight: 1.7, fontSize: 15 }}>{preview.solution_summary}</p>
            </Card>
            <Card title="ROI Proyectado">
              <p style={{ color: "#22c55e", lineHeight: 1.7, fontSize: 15, fontWeight: 500 }}>{preview.roi_projection}</p>
            </Card>
            <Card title="Ventaja Competitiva">
              <p style={{ color: "#ccc", lineHeight: 1.7, fontSize: 15 }}>{preview.competitive_advantage}</p>
            </Card>
          </div>
        </section>

        {/* SECCIÓN TÉCNICA */}
        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 13, fontWeight: 700, color: "#F5C518", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16 }}>Propuesta Técnica</h2>

          {/* Stack */}
          <Card title="Stack Tecnológico" style={{ marginBottom: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
              {[
                { label: "Frontend", value: preview.tech_stack.frontend },
                { label: "Backend", value: preview.tech_stack.backend },
                { label: "Base de Datos", value: preview.tech_stack.database },
                { label: "Autenticación", value: preview.tech_stack.auth },
              ].map((item) => (
                <div key={item.label} style={{ background: "#111", borderRadius: 8, padding: 12 }}>
                  <p style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>{item.label}</p>
                  <p style={{ color: "#fff", fontSize: 14, fontWeight: 600 }}>{item.value}</p>
                </div>
              ))}
            </div>
            {preview.tech_stack.integrations?.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <p style={{ color: "#888", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Integraciones</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {preview.tech_stack.integrations.map((int) => (
                    <span key={int} style={{ background: "#1a1a2e", border: "1px solid #3b82f6", color: "#93c5fd", borderRadius: 6, padding: "4px 10px", fontSize: 13 }}>{int}</span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Módulos */}
          <Card title="Módulos de la App" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {preview.modules.map((mod) => {
                const style = PRIORITY_STYLES[mod.priority] || PRIORITY_STYLES["nice-to-have"];
                return (
                  <div key={mod.name} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: style.bg, border: `1px solid ${style.border}`, borderRadius: 8, padding: "12px 16px" }}>
                    <span style={{ color: style.text, fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", minWidth: 90, paddingTop: 2 }}>{style.label}</span>
                    <div>
                      <p style={{ color: "#fff", fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{mod.name}</p>
                      <p style={{ color: "#aaa", fontSize: 13 }}>{mod.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Flujos y Riesgos */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Card title="Flujos de Usuario">
              {preview.user_flows.map((flow) => (
                <div key={flow.actor} style={{ marginBottom: 12 }}>
                  <p style={{ color: "#F5C518", fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{flow.actor}</p>
                  <p style={{ color: "#ccc", fontSize: 14 }}>{flow.flow}</p>
                </div>
              ))}
            </Card>
            <Card title="Riesgos Identificados">
              {preview.risks.map((risk, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <span style={{ color: "#f59e0b", fontSize: 16, flexShrink: 0 }}>⚠</span>
                  <p style={{ color: "#ccc", fontSize: 14 }}>{risk}</p>
                </div>
              ))}
            </Card>
          </div>
        </section>

        {/* ACCIONES */}
        {error && <p style={{ color: "#ef4444", marginBottom: 16, fontSize: 14 }}>{error}</p>}

        {showAdjust && (
          <div style={{ background: "#111", border: "1px solid #333", borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <p style={{ color: "#aaa", fontSize: 14, marginBottom: 12 }}>¿Qué quieres ajustar en la propuesta?</p>
            <textarea
              value={adjustText}
              onChange={(e) => setAdjustText(e.target.value)}
              placeholder="Ej: Quiero que el frontend sea React Native para móvil, y agregar un módulo de facturación electrónica..."
              style={{ width: "100%", background: "#0A0A0A", border: "1px solid #333", borderRadius: 8, padding: 12, color: "#fff", fontSize: 14, minHeight: 100, resize: "vertical", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
              <button onClick={handleAdjust} disabled={!adjustText.trim()} style={{ background: "#F5C518", color: "#0A0A0A", border: "none", borderRadius: 8, padding: "10px 20px", fontWeight: 700, cursor: "pointer", opacity: adjustText.trim() ? 1 : 0.5 }}>
                Regenerar propuesta
              </button>
              <button onClick={() => setShowAdjust(false)} style={{ background: "none", border: "1px solid #333", color: "#aaa", borderRadius: 8, padding: "10px 20px", cursor: "pointer" }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div style={{ display: "flex", gap: 16, justifyContent: "flex-end" }}>
          <button onClick={() => setShowAdjust(!showAdjust)} style={{ background: "none", border: "1px solid rgba(245,197,24,0.4)", color: "#F5C518", borderRadius: 10, padding: "14px 28px", fontWeight: 600, cursor: "pointer", fontSize: 15 }}>
            Solicitar ajustes
          </button>
          <button onClick={handleApprove} disabled={approving} style={{ background: "#F5C518", color: "#0A0A0A", border: "none", borderRadius: 10, padding: "14px 36px", fontWeight: 800, cursor: approving ? "not-allowed" : "pointer", fontSize: 15, opacity: approving ? 0.7 : 1 }}>
            {approving ? "Iniciando construcción..." : "✓ Aprobar y Construir App"}
          </button>
        </div>

      </div>
    </div>
  );
}

function Card({ title, children, style }: { title: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20, ...style }}>
      <p style={{ color: "#888", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>{title}</p>
      {children}
    </div>
  );
}
