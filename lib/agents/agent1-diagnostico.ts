import { callClaude, getTextFromResponse } from "../claude";
import { ClientData } from "../supabase";

export type DiagnosticoOutput = {
  pain_level: number;
  root_cause: string;
  symptom_vs_reality: string;
  kpis: string[];
  user_profile: {
    role: string;
    tech_level: string;
    daily_tasks: string[];
  };
  business_type: string;
  priority_features: string[];
  complexity_estimate: "low" | "mid" | "high";
};

function parseJSONSafely(text: string): DiagnosticoOutput {
  // Strip markdown code blocks
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith("```")) {
    cleaned = cleaned.slice(0, -3);
  }
  return JSON.parse(cleaned.trim());
}

export async function runAgent1(clientData: ClientData): Promise<DiagnosticoOutput> {
  const systemPrompt = `Eres un consultor empresarial senior con metodología McKinsey + Jobs To Be Done. Tu único trabajo es leer las respuestas del cliente y producir un diagnóstico estructurado. Analiza síntomas vs causa raíz, urgencia real del problema, y el perfil exacto del usuario que va a usar la app a diario.
Output obligatorio en JSON (sin markdown, solo JSON puro):
{
  "pain_level": number 1-10,
  "root_cause": string,
  "symptom_vs_reality": string,
  "kpis": string[],
  "user_profile": { "role": string, "tech_level": string, "daily_tasks": string[] },
  "business_type": string,
  "priority_features": string[],
  "complexity_estimate": "low" | "mid" | "high"
}`;

  const userMessage = `Aquí están las respuestas del cliente:

IDENTIDAD DEL NEGOCIO:
- Nombre y sector: ${clientData.business_name} — ${clientData.sector}
- Años operando: ${clientData.years_operating}
- Tamaño del equipo: ${clientData.team_size}
- Producto/servicio principal: ${clientData.main_product}
- Descripción del negocio: ${clientData.business_description}

EL DOLOR:
- Problema principal: ${clientData.main_problem}
- Tiempo con el problema: ${clientData.problem_duration}
- Lo que han intentado: ${clientData.tried_solutions}
- Costo mensual estimado: ${clientData.monthly_cost}
- Impacto si se resuelve: ${clientData.impact_if_solved}

OPERACIÓN ACTUAL:
- Gestión de clientes: ${clientData.client_management}
- Proceso más lento: ${clientData.time_consuming_process}
- Equipo necesita acceso: ${clientData.has_team}
- Métricas diarias: ${clientData.daily_metrics}
- Software actual: ${clientData.current_software}

VISIÓN:
- Meta 6 meses: ${clientData.six_month_goal}
- Competidores: ${clientData.competitors}
- Diferenciador: ${clientData.differentiator}
- Disposición a pagar: ${clientData.willingness_to_pay}
- Información adicional: ${clientData.additional_info}

Produce el diagnóstico JSON.`;

  const response = await callClaude({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return parseJSONSafely(getTextFromResponse(response));
}
