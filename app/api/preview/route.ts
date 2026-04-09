import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: `Eres un arquitecto de software senior especializado en apps de negocio para PYMES latinoamericanas. Analiza este brief y genera una propuesta profesional estructurada.

BRIEF DEL CLIENTE:
${briefText}

Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin bloques de código, sin explicaciones. El JSON debe tener exactamente esta estructura:
{
  "app_name": "nombre comercial atractivo para la app",
  "tagline": "frase de valor en máximo 10 palabras",
  "problem_statement": "el problema real en 2 oraciones directas",
  "solution_summary": "qué hace la app y cómo resuelve el problema en 3 oraciones",
  "roi_projection": "retorno estimado concreto con números en 2 oraciones",
  "tech_stack": {
    "frontend": "tecnología frontend recomendada con justificación breve",
    "backend": "tecnología backend recomendada con justificación breve",
    "database": "base de datos recomendada con justificación breve",
    "auth": "solución de autenticación recomendada",
    "integrations": ["integración 1", "integración 2", "integración 3"]
  },
  "modules": [
    { "name": "nombre del módulo", "description": "qué hace en una oración", "priority": "core" },
    { "name": "nombre del módulo", "description": "qué hace en una oración", "priority": "important" },
    { "name": "nombre del módulo", "description": "qué hace en una oración", "priority": "nice-to-have" }
  ],
  "user_flows": [
    { "actor": "tipo de usuario", "flow": "descripción del flujo principal en una oración" }
  ],
  "complexity": "simple|medium|complex",
  "estimated_weeks": 6,
  "risks": ["riesgo técnico o de negocio 1", "riesgo 2", "riesgo 3"],
  "competitive_advantage": "qué hace única esta app vs soluciones genéricas en 2 oraciones"
}`
        }
      ]
    });

    const rawText = message.content[0].type === "text" ? message.content[0].text : "";

    let preview;
    try {
      preview = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        preview = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not parse AI response as JSON");
      }
    }

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        agent_outputs: { preview },
        status: "preview_ready"
      })
      .eq("id", clientId);

    if (updateError) {
      console.error("Failed to save preview:", updateError);
    }

    return Response.json({ success: true, preview }, { status: 200 });

  } catch (error) {
    console.error("Preview error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return Response.json({ error: "Failed to generate preview", details: String(error) }, { status: 500 });
  }
}
