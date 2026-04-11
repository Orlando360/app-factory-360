import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function parseJsonSafe(text: string): Record<string, unknown> | null {
  // Try direct parse first
  try { return JSON.parse(text); } catch { /* continue */ }
  // Strip markdown fences
  let cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
  // Extract outermost JSON object
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  cleaned = match[0];
  // Fix trailing commas
  cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
  try { return JSON.parse(cleaned); } catch { return null; }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return Response.json({ error: "clientId is required" }, { status: 400 });
    }

    const supabase = createServerClient();

    const { data: client, error: fetchError } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();

    if (fetchError || !client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    // v2 fields may be in direct columns (after migration 003) or in agent_outputs.intake (before)
    const v2 = (client.agent_outputs as Record<string, Record<string, string>>)?.intake ?? {};
    const f = (key: string) => (client[key as keyof typeof client] as string) || v2[key] || "No especificado";

    const briefText = `
NEGOCIO: ${client.business_name}
SECTOR: ${client.sector || "No especificado"}
AÑOS OPERANDO: ${client.years_operating || "No especificado"}
EQUIPO: ${client.team_size || "No especificado"}
PRODUCTO PRINCIPAL: ${client.main_product || "No especificado"}
DESCRIPCIÓN: ${client.business_description || "No especificado"}
MODELO DE INGRESOS: ${f("revenue_model")}
TICKET PROMEDIO: ${f("avg_ticket")}
CLIENTES ACTIVOS: ${f("active_clients")}

PROBLEMA PRINCIPAL: ${client.main_problem}
DURACIÓN DEL PROBLEMA: ${client.problem_duration || "No especificado"}
SOLUCIONES INTENTADAS: ${client.tried_solutions || "No especificado"}
COSTO MENSUAL DEL PROBLEMA: ${client.monthly_cost || "No especificado"}
IMPACTO SI SE RESUELVE: ${client.impact_if_solved || "No especificado"}

USUARIO PRINCIPAL DE LA APP: ${f("app_user_type")}
PERFIL DEL USUARIO: ${f("user_profile")}
USUARIOS SIMULTÁNEOS ESTIMADOS: ${f("concurrent_users")}
PROCESO A AUTOMATIZAR: ${f("process_to_automate")}

NOMBRE DE APP DESEADO: ${f("app_name_idea")}
FUNCIONES REQUERIDAS: ${client.required_features || "No especificado"}
NECESITA LOGIN: ${client.needs_auth || "No especificado"}
ROLES DE USUARIO: ${client.user_roles || "No especificado"}
INTEGRACIONES: ${client.integrations || "No especificado"}
MANEJA PAGOS: ${client.handles_payments || "No especificado"}
NECESITA DASHBOARD: ${client.needs_dashboard || "No especificado"}
VERSIÓN MÓVIL: ${client.needs_mobile || "No especificado"}

META EN 90 DÍAS: ${client.goal_90_days || client.six_month_goal || "No especificado"}
PRESUPUESTO: ${client.budget_range || client.willingness_to_pay || "No especificado"}
EQUIPO TÉCNICO PROPIO: ${client.has_tech_team || "No especificado"}
COMPETIDORES: ${client.competitors || "No especificado"}
DIFERENCIADOR: ${client.differentiator || "No especificado"}
INFO ADICIONAL: ${client.additional_info || "No especificado"}
    `.trim();

    // Use prefill technique: start assistant response with "{" to force pure JSON
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [
        {
          role: "user",
          content: `Eres un arquitecto de software senior. Analiza este brief y genera una propuesta JSON.

BRIEF:
${briefText}

Responde SOLO con JSON valido. Sin markdown, sin code fences, sin texto extra.
IMPORTANTE: Cada valor string debe ser corto (max 150 chars). No uses comillas dobles dentro de strings.
Estructura exacta:
{
  "app_name": "string",
  "tagline": "max 10 palabras",
  "problem_statement": "2 oraciones max",
  "solution_summary": "3 oraciones max",
  "roi_projection": "2 oraciones con numeros",
  "tech_stack": {
    "frontend": "tech + razon breve",
    "backend": "tech + razon breve",
    "database": "tech + razon breve",
    "auth": "solucion recomendada",
    "integrations": ["integracion1", "integracion2"]
  },
  "modules": [
    {"name": "modulo", "description": "que hace", "priority": "core|important|nice-to-have"}
  ],
  "user_flows": [
    {"actor": "usuario", "flow": "flujo en una oracion"}
  ],
  "complexity": "simple|medium|complex",
  "estimated_weeks": 6,
  "risks": ["riesgo1", "riesgo2"],
  "competitive_advantage": "2 oraciones max"
}`
        },
        {
          role: "assistant",
          content: "{"
        }
      ]
    });

    const rawText = "{" + (message.content[0].type === "text" ? message.content[0].text : "");

    const preview = parseJsonSafe(rawText);
    if (!preview) {
      // Fallback: ask Claude to fix the broken JSON
      console.error("Preview: first parse failed, attempting repair. Raw length:", rawText.length);
      const repairMsg = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 3000,
        messages: [
          {
            role: "user",
            content: `Fix this broken JSON. Return ONLY valid JSON, nothing else:\n${rawText.slice(0, 6000)}`
          },
          { role: "assistant", content: "{" }
        ]
      });
      const repairedText = "{" + (repairMsg.content[0].type === "text" ? repairMsg.content[0].text : "");
      const repaired = parseJsonSafe(repairedText);
      if (!repaired) {
        console.error("Preview: repair also failed. Repaired:", repairedText.slice(0, 1000));
        throw new Error("Could not parse AI response as JSON even after repair attempt");
      }
      var previewData = repaired;
    } else {
      var previewData = preview;
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        agent_outputs: { preview: previewData },
        status: "preview_ready"
      })
      .eq("id", clientId);

    if (updateError) {
      console.error("Failed to save preview:", updateError);
    }

    return Response.json({ success: true, preview: previewData }, { status: 200 });

  } catch (error) {
    console.error("Preview error details:", JSON.stringify(error, Object.getOwnPropertyNames(error as object)));
    return Response.json({ error: "Failed to generate preview", details: String(error) }, { status: 500 });
  }
}
