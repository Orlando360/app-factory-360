"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FormData = Record<string, string>;

const SECTIONS = [
  {
    id: 1,
    title: "Tu negocio",
    subtitle: "Cuéntanos quién eres y qué haces",
    required: ["business_name", "sector"],
    fields: [
      { key: "business_name", label: "Nombre del negocio", type: "text", placeholder: "Ej: Ferretería García" },
      { key: "sector", label: "Sector / industria", type: "text", placeholder: "Ej: Retail, Salud, Logística..." },
      { key: "years_operating", label: "¿Cuántos años llevas operando?", type: "text", placeholder: "Ej: 5 años" },
      {
        key: "revenue_model",
        label: "Modelo de ingresos",
        type: "select",
        options: ["Venta directa", "Suscripción mensual", "Comisión por transacción", "Freemium", "Marketplaces", "Otro"],
      },
      { key: "avg_ticket", label: "Ticket promedio por cliente (en USD o COP)", type: "text", placeholder: "Ej: $150.000 COP" },
      { key: "active_clients", label: "¿Cuántos clientes activos tienes hoy?", type: "text", placeholder: "Ej: 80 clientes" },
      { key: "business_description", label: "Describe tu negocio en 2-3 frases", type: "textarea", placeholder: "Qué haces, a quién le vendes, cómo generas dinero..." },
    ],
  },
  {
    id: 2,
    title: "El problema",
    subtitle: "Dinos exactamente qué te está frenando",
    required: ["main_problem"],
    fields: [
      { key: "main_problem", label: "¿Cuál es el problema principal que quieres resolver con esta app? Sé específico.", type: "textarea", placeholder: "Qué pasa hoy, cuándo ocurre, qué consecuencias tiene..." },
      { key: "problem_duration", label: "¿Hace cuánto tiempo existe este problema?", type: "text", placeholder: "Ej: 2 años" },
      { key: "tried_solutions", label: "¿Qué soluciones has intentado antes y por qué no funcionaron?", type: "textarea", placeholder: "Excel, contratar personas, otras apps..." },
      { key: "monthly_cost", label: "¿Cuánto te cuesta este problema al mes? (tiempo + dinero)", type: "text", placeholder: "Ej: 20 horas + $500 USD en errores" },
      { key: "impact_if_solved", label: "Si lo resuelves, ¿qué cambia concretamente en tu negocio?", type: "textarea", placeholder: "Ej: Podría atender 3x más clientes sin contratar nadie" },
    ],
  },
  {
    id: 3,
    title: "Los usuarios",
    subtitle: "¿Quién va a usar esta app y cómo?",
    required: ["app_user_type"],
    fields: [
      {
        key: "app_user_type",
        label: "¿Quién va a usar esta app?",
        type: "select",
        options: ["Solo mi equipo interno", "Solo mis clientes externos", "Ambos — equipo y clientes"],
      },
      { key: "user_profile", label: "Describe el usuario principal: cargo, nivel técnico, dispositivo que usa", type: "textarea", placeholder: "Ej: Vendedor de campo, poca experiencia técnica, usa celular Android" },
      {
        key: "concurrent_users",
        label: "¿Cuántos usuarios simultáneos estimas?",
        type: "select",
        options: ["1-10", "11-50", "51-200", "200+"],
      },
      { key: "process_to_automate", label: "¿Qué proceso hace HOY ese usuario manualmente que la app debe automatizar?", type: "textarea", placeholder: "Ej: Llena un Excel con pedidos y luego lo manda por WhatsApp al bodeguero" },
    ],
  },
  {
    id: 4,
    title: "La app",
    subtitle: "Qué debe hacer y cómo debe funcionar",
    required: ["required_features"],
    fields: [
      { key: "app_name_idea", label: "¿Tienes nombre o idea de nombre para la app?", type: "text", placeholder: "Opcional — si no, Claude lo propone" },
      { key: "required_features", label: "¿Qué debe poder HACER la app? Lista mínimo 3 funciones concretas", type: "textarea", placeholder: "1. Registrar pedidos en tiempo real\n2. Ver inventario actualizado\n3. Generar reportes diarios..." },
      { key: "needs_auth", label: "¿Necesita login / autenticación?", type: "radio", options: ["Sí", "No"] },
      { key: "user_roles", label: "¿Qué roles necesita? (ej: admin, operador, cliente)", type: "text", placeholder: "Opcional si no hay roles" },
      { key: "integrations", label: "¿Debe integrarse con algún sistema existente?", type: "textarea", placeholder: "WhatsApp, Shopify, MercadoPago, Siigo, Google Sheets, ninguno..." },
      { key: "handles_payments", label: "¿Maneja pagos dentro de la app?", type: "radio", options: ["Sí", "No"] },
      { key: "needs_dashboard", label: "¿Necesita dashboard con métricas?", type: "radio", options: ["Sí", "No"] },
      { key: "needs_mobile", label: "¿Necesita versión móvil o solo web?", type: "radio", options: ["Solo web", "Móvil prioritario", "Ambos"] },
    ],
  },
  {
    id: 5,
    title: "Objetivos",
    subtitle: "Qué define el éxito de esta solución",
    required: ["goal_90_days"],
    fields: [
      { key: "goal_90_days", label: "¿Qué define el éxito de esta app en 90 días? Sé concreto con números si puedes", type: "textarea", placeholder: "Ej: Reducir 70% el tiempo en cotizaciones y cerrar 20 clientes nuevos" },
      {
        key: "budget_range",
        label: "¿Cuál es tu presupuesto estimado?",
        type: "select",
        options: ["Menos de $1.000 USD", "$1.000–$3.000 USD", "$3.000–$8.000 USD", "$8.000–$20.000 USD", "Más de $20.000 USD"],
      },
      { key: "has_tech_team", label: "¿Tienes equipo técnico propio?", type: "radio", options: ["Sí, tengo devs", "No, dependo 100% de esta solución"] },
      { key: "competitors", label: "¿Hay competidores que ya tienen algo similar? ¿Cuáles?", type: "text", placeholder: "Ej: Siigo, Alegra, herramientas genéricas de CRM" },
      { key: "additional_info", label: "¿Algo más que debamos saber antes de diseñar tu solución?", type: "textarea", placeholder: "Opcional" },
    ],
  },
];

const inputBase: React.CSSProperties = {
  width: "100%",
  background: "#111",
  border: "1px solid #333",
  borderRadius: 10,
  padding: "12px 16px",
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.2s",
  fontFamily: "Inter, sans-serif",
};

export default function IntakeForm() {
  const router = useRouter();
  const [currentSection, setCurrentSection] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [generatingPreview, setGeneratingPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  const section = SECTIONS[currentSection];
  const progress = ((currentSection) / SECTIONS.length) * 100;
  const isLastSection = currentSection === SECTIONS.length - 1;

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isSectionValid = () =>
    section.required.every((key) => (formData[key] || "").trim().length > 0);

  const handleNext = () => {
    if (!isSectionValid()) return;
    setCurrentSection((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    setCurrentSection((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (!isSectionValid()) return;
    setLoading(true);
    setError(null);

    const sector = formData.sector ||
      (formData.business_name?.includes("—")
        ? formData.business_name.split("—")[1]?.trim()
        : formData.business_name || "");

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, sector }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Error al enviar el formulario");

      const { clientId } = data;
      setLoading(false);
      setGeneratingPreview(true);

      try {
        await fetch("/api/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        });
      } catch {
        // preview page handles generation on its own
      }

      router.push(`/preview/${clientId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado. Intenta de nuevo.");
      setLoading(false);
    }
  };

  if (generatingPreview) {
    return (
      <div style={{ minHeight: "100vh", background: "#0A0A0A", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
        <div style={{ width: 48, height: 48, border: "3px solid #F5C518", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <p style={{ color: "#F5C518", fontSize: 16, fontFamily: "Inter, sans-serif", fontWeight: 500 }}>
          Claude está analizando tu negocio...
        </p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const renderField = (field: typeof section.fields[0]) => {
    const isFocused = focused === field.key;
    const borderColor = isFocused ? "#F5C518" : "#333";

    if (field.type === "textarea") {
      return (
        <textarea
          key={field.key}
          value={formData[field.key] || ""}
          onChange={(e) => handleChange(field.key, e.target.value)}
          onFocus={() => setFocused(field.key)}
          onBlur={() => setFocused(null)}
          placeholder={field.placeholder}
          rows={4}
          style={{ ...inputBase, borderColor, resize: "vertical" }}
        />
      );
    }

    if (field.type === "select") {
      return (
        <select
          key={field.key}
          value={formData[field.key] || ""}
          onChange={(e) => handleChange(field.key, e.target.value)}
          onFocus={() => setFocused(field.key)}
          onBlur={() => setFocused(null)}
          style={{ ...inputBase, borderColor, cursor: "pointer" }}
        >
          <option value="" disabled>Selecciona una opción</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === "radio") {
      return (
        <div key={field.key} style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {field.options?.map((opt) => {
            const selected = formData[field.key] === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleChange(field.key, opt)}
                style={{
                  background: selected ? "rgba(245,197,24,0.1)" : "#111",
                  border: `1px solid ${selected ? "#F5C518" : "#333"}`,
                  color: selected ? "#F5C518" : "#aaa",
                  borderRadius: 8,
                  padding: "10px 18px",
                  fontSize: 14,
                  fontWeight: selected ? 600 : 400,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  fontFamily: "Inter, sans-serif",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      );
    }

    return (
      <input
        key={field.key}
        type="text"
        value={formData[field.key] || ""}
        onChange={(e) => handleChange(field.key, e.target.value)}
        onFocus={() => setFocused(field.key)}
        onBlur={() => setFocused(null)}
        placeholder={field.placeholder}
        style={{ ...inputBase, borderColor }}
      />
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0A0A0A", fontFamily: "Inter, sans-serif", color: "#fff" }}>

      {/* Progress bar */}
      <div style={{ position: "sticky", top: 0, zIndex: 10, background: "rgba(10,10,10,0.95)", backdropFilter: "blur(8px)", borderBottom: "1px solid #1a1a1a", padding: "16px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, background: "#F5C518", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#0A0A0A", fontWeight: 900, fontSize: 11 }}>360</span>
              </div>
              <span style={{ fontWeight: 700, fontSize: 14 }}>App Factory</span>
            </div>
            <span style={{ color: "#555", fontSize: 13 }}>
              {currentSection + 1} / {SECTIONS.length}
            </span>
          </div>
          <div style={{ width: "100%", height: 3, background: "#1a1a1a", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progress}%`, background: "#F5C518", borderRadius: 99, transition: "width 0.4s ease" }} />
          </div>
          <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
            {SECTIONS.map((s, i) => (
              <div key={s.id} style={{ flex: 1, textAlign: "center", fontSize: 11, color: i === currentSection ? "#F5C518" : i < currentSection ? "rgba(245,197,24,0.4)" : "#333", fontWeight: i === currentSection ? 600 : 400, transition: "color 0.2s", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {s.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Section content */}
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "48px 24px 120px" }}>
        <div style={{ marginBottom: 36 }}>
          <p style={{ color: "#F5C518", fontSize: 12, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 8 }}>
            Sección {currentSection + 1}
          </p>
          <h2 style={{ fontSize: 32, fontWeight: 800, margin: "0 0 8px" }}>{section.title}</h2>
          <p style={{ color: "#666", fontSize: 16 }}>{section.subtitle}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {section.fields.map((field) => (
            <div key={field.key}>
              <label style={{ display: "block", fontSize: 14, fontWeight: 600, color: "#ccc", marginBottom: 8 }}>
                {section.required.includes(field.key) && (
                  <span style={{ color: "#F5C518", marginRight: 4 }}>*</span>
                )}
                {field.label}
              </label>
              {renderField(field)}
            </div>
          ))}
        </div>

        {error && (
          <div style={{ marginTop: 24, padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, color: "#f87171", fontSize: 14 }}>
            {error}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "rgba(10,10,10,0.97)", borderTop: "1px solid #1a1a1a", padding: "16px 24px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {currentSection > 0 ? (
            <button
              onClick={handleBack}
              style={{ background: "none", border: "1px solid #333", color: "#888", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "Inter, sans-serif" }}
            >
              ← Anterior
            </button>
          ) : (
            <div />
          )}

          {isLastSection ? (
            <button
              onClick={handleSubmit}
              disabled={!isSectionValid() || loading}
              style={{
                background: isSectionValid() && !loading ? "#F5C518" : "#333",
                color: isSectionValid() && !loading ? "#0A0A0A" : "#666",
                border: "none",
                borderRadius: 10,
                padding: "12px 32px",
                fontSize: 15,
                fontWeight: 800,
                cursor: isSectionValid() && !loading ? "pointer" : "not-allowed",
                display: "flex",
                alignItems: "center",
                gap: 8,
                transition: "all 0.2s",
                fontFamily: "Inter, sans-serif",
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: 16, height: 16, border: "2px solid #0A0A0A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite", display: "inline-block" }} />
                  Enviando...
                </>
              ) : (
                "Generar propuesta →"
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isSectionValid()}
              style={{
                background: isSectionValid() ? "#F5C518" : "#333",
                color: isSectionValid() ? "#0A0A0A" : "#666",
                border: "none",
                borderRadius: 10,
                padding: "12px 32px",
                fontSize: 15,
                fontWeight: 800,
                cursor: isSectionValid() ? "pointer" : "not-allowed",
                transition: "all 0.2s",
                fontFamily: "Inter, sans-serif",
              }}
            >
              Siguiente →
            </button>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
