"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const BLOCKS = [
  {
    title: "Identidad del negocio",
    subtitle: "Cuéntanos sobre tu empresa",
    questions: [
      { key: "business_name", label: "Nombre del negocio y sector", placeholder: "Ej: Ferretería García — Retail ferretero" },
      { key: "years_operating", label: "¿Cuántos años llevas operando?", placeholder: "Ej: 5 años" },
      { key: "team_size", label: "¿Cuántas personas trabajan contigo?", placeholder: "Ej: 8 empleados" },
      { key: "main_product", label: "¿Cuál es tu producto o servicio principal?", placeholder: "Ej: Venta al por mayor de materiales de construcción" },
      { key: "business_description", label: "¿Cómo describes tu negocio en una frase?", placeholder: "Ej: Somos el proveedor de confianza de ferretería industrial en la región" },
    ],
  },
  {
    title: "El dolor",
    subtitle: "Dinos qué te está frenando",
    questions: [
      { key: "main_problem", label: "¿Cuál es el problema más grande que tiene tu negocio HOY?", placeholder: "Sé específico. ¿Qué te quita el sueño?" },
      { key: "problem_duration", label: "¿Cuánto tiempo llevas con ese problema?", placeholder: "Ej: 2 años" },
      { key: "tried_solutions", label: "¿Qué has intentado para resolverlo y no funcionó?", placeholder: "Ej: Contratar asistente, usar Excel, probar apps..." },
      { key: "monthly_cost", label: "¿Cuánto dinero o clientes crees que ese problema te está costando al mes?", placeholder: "Ej: Pierdo 3 clientes al mes, unos $5,000" },
      { key: "impact_if_solved", label: "Si resolvieras ese problema, ¿qué cambiaría en tu negocio?", placeholder: "Ej: Podría atender el doble de clientes sin contratar más personal" },
    ],
  },
  {
    title: "Operación actual",
    subtitle: "Cómo funciona tu negocio hoy",
    questions: [
      { key: "client_management", label: "¿Cómo gestionas hoy tus clientes?", placeholder: "Excel, papel, WhatsApp, ninguna herramienta..." },
      { key: "time_consuming_process", label: "¿Qué proceso de tu negocio consume más tiempo innecesariamente?", placeholder: "Ej: Generar cotizaciones manuales cada vez" },
      { key: "has_team", label: "¿Tienes equipo que necesite acceder a información del negocio?", placeholder: "Ej: Sí, 3 vendedores necesitan ver inventario en tiempo real" },
      { key: "daily_metrics", label: "¿Qué información necesitas ver todos los días para saber si el negocio va bien?", placeholder: "Ej: Ventas del día, clientes nuevos, inventario bajo" },
      { key: "current_software", label: "¿Usas algún software ahora? ¿Cuál y qué problema tiene?", placeholder: "Ej: QuickBooks para facturación, pero no se conecta con mi tienda online" },
    ],
  },
  {
    title: "Visión",
    subtitle: "A dónde quieres llegar",
    questions: [
      { key: "six_month_goal", label: "¿Qué quieres lograr en los próximos 6 meses?", placeholder: "Ej: Duplicar ventas y reducir tiempo en administración 50%" },
      { key: "competitors", label: "¿Quiénes son tus competidores principales?", placeholder: "Ej: Ferretería Central, Home Depot zona norte" },
      { key: "differentiator", label: "¿Qué te diferencia de ellos?", placeholder: "Ej: Servicio personalizado y entrega el mismo día" },
      { key: "willingness_to_pay", label: "¿Cuánto estarías dispuesto a pagar mensualmente por una herramienta que resuelva tu problema principal?", placeholder: "Ej: Entre $100 y $300 al mes" },
      { key: "additional_info", label: "¿Hay algo más que quieras que sepa antes de diseñar tu solución?", placeholder: "Cualquier contexto adicional que consideres importante..." },
    ],
  },
];

type FormData = Record<string, string>;

export default function IntakeForm() {
  const router = useRouter();
  const [currentBlock, setCurrentBlock] = useState(0);
  const [formData, setFormData] = useState<FormData>({});
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalBlocks = BLOCKS.length;
  const block = BLOCKS[currentBlock];
  const progress = ((currentBlock + (submitted ? 1 : 0)) / totalBlocks) * 100;

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isBlockComplete = () => {
    return block.questions.every((q) => (formData[q.key] || "").trim().length > 0);
  };

  const handleNext = () => {
    if (currentBlock < totalBlocks - 1) {
      setCurrentBlock((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentBlock > 0) {
      setCurrentBlock((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    // Derive sector from business_name if not separate
    const sector = formData.business_name?.includes("—")
      ? formData.business_name.split("—")[1]?.trim()
      : formData.business_name || "";

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, sector }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el formulario");
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-6">
        <div className="max-w-lg w-full text-center">
          <div className="w-20 h-20 rounded-full bg-[rgba(245,197,24,0.1)] border-2 border-[#F5C518] flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✓</span>
          </div>
          <h2 className="text-3xl font-black mb-4">¡Diagnóstico recibido!</h2>
          <p className="text-[rgba(255,255,255,0.6)] text-lg leading-relaxed mb-8">
            Tu diagnóstico está en manos de Orlando. En 24 horas recibirás tu solución personalizada.
          </p>
          <div className="p-6 rounded-xl border border-[rgba(245,197,24,0.2)] bg-[rgba(245,197,24,0.05)] text-left mb-8">
            <p className="text-[#F5C518] font-bold text-sm mb-2">¿Qué pasa ahora?</p>
            <ul className="space-y-2 text-sm text-[rgba(255,255,255,0.6)]">
              <li>• 8 agentes de IA analizarán tu negocio</li>
              <li>• Diseñarán y construirán tu app personalizada</li>
              <li>• Recibirás un link a tu app en producción</li>
              <li>• Todo en menos de 24 horas</li>
            </ul>
          </div>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-[rgba(255,255,255,0.4)] hover:text-white transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[rgba(10,10,10,0.9)] backdrop-blur-md border-b border-[rgba(245,197,24,0.1)] px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-[#F5C518] flex items-center justify-center">
                <span className="text-[#0A0A0A] font-black text-xs">360</span>
              </div>
              <span className="font-bold text-sm">Diagnóstico</span>
            </div>
            <span className="text-xs text-[rgba(255,255,255,0.4)]">
              Bloque {currentBlock + 1} de {totalBlocks}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1 bg-[rgba(255,255,255,0.08)] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#F5C518] rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Block indicators */}
          <div className="flex gap-2 mt-2">
            {BLOCKS.map((b, i) => (
              <div
                key={b.title}
                className="flex-1 text-center text-xs truncate"
                style={{
                  color: i === currentBlock
                    ? "#F5C518"
                    : i < currentBlock
                    ? "rgba(245,197,24,0.5)"
                    : "rgba(255,255,255,0.25)"
                }}
              >
                {b.title}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form content */}
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Block header */}
        <div className="mb-8">
          <div className="text-[#F5C518] text-xs font-bold uppercase tracking-wider mb-1">
            Bloque {currentBlock + 1}
          </div>
          <h2 className="text-3xl font-black mb-2">{block.title}</h2>
          <p className="text-[rgba(255,255,255,0.5)]">{block.subtitle}</p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {block.questions.map((question, qIndex) => (
            <div key={question.key} className="animate-fade-in">
              <label className="block text-sm font-semibold mb-2 text-[rgba(255,255,255,0.85)]">
                <span className="text-[#F5C518] text-xs mr-2">
                  {String(currentBlock * 5 + qIndex + 1).padStart(2, "0")}
                </span>
                {question.label}
              </label>
              <textarea
                value={formData[question.key] || ""}
                onChange={(e) => handleChange(question.key, e.target.value)}
                placeholder={question.placeholder}
                rows={3}
                className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl p-4 text-white placeholder-[rgba(255,255,255,0.3)] text-sm resize-none focus:outline-none focus:border-[rgba(245,197,24,0.5)] focus:bg-[rgba(255,255,255,0.07)] transition-all duration-200"
              />
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          {currentBlock > 0 ? (
            <button
              onClick={handleBack}
              className="px-6 py-3 text-sm font-semibold text-[rgba(255,255,255,0.6)] hover:text-white transition-colors border border-[rgba(255,255,255,0.1)] rounded-xl hover:border-[rgba(255,255,255,0.2)]"
            >
              ← Anterior
            </button>
          ) : (
            <div />
          )}

          {currentBlock < totalBlocks - 1 ? (
            <button
              onClick={handleNext}
              disabled={!isBlockComplete()}
              className="bg-[#F5C518] text-[#0A0A0A] font-bold px-8 py-3 text-sm rounded-xl hover:bg-[#e6b515] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!isBlockComplete() || loading}
              className="bg-[#F5C518] text-[#0A0A0A] font-bold px-8 py-3 text-sm rounded-xl hover:bg-[#e6b515] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-[#0A0A0A] border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar diagnóstico →"
              )}
            </button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[rgba(255,255,255,0.25)]">
          Tus respuestas son confidenciales y solo serán usadas para diseñar tu solución.
        </p>
      </div>
    </div>
  );
}
