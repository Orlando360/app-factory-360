import { callClaude, getTextFromResponse } from "../claude";
import { ClientData } from "../supabase";

export type ArquitectoOutput = {
  app_name: string;
  tagline: string;
  modules: string[];
  user_flows: string[];
  data_schema: string[];
  views: string[];
  primary_cta: string;
  tech_complexity: string;
};

function parseJSONSafely(text: string): ArquitectoOutput {
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

export async function runAgent2(
  clientData: ClientData,
  agent1Output: unknown
): Promise<ArquitectoOutput> {
  const systemPrompt = `Eres un Product Architect especializado en startups YC y SaaS B2B. Defines la arquitectura de producto perfecta para resolver el dolor del cliente en la forma más simple y efectiva posible.
Tu output es JSON puro (sin markdown):
{
  "app_name": string,
  "tagline": string,
  "modules": string[],
  "user_flows": string[],
  "data_schema": string[],
  "views": string[],
  "primary_cta": string,
  "tech_complexity": string
}`;

  const userMessage = `Cliente: ${clientData.business_name} (${clientData.sector})
Problema: ${clientData.main_problem}
Meta: ${clientData.six_month_goal}

Diagnóstico previo:
${JSON.stringify(agent1Output, null, 2)}

Define la arquitectura completa de la app para este cliente. JSON puro.`;

  const response = await callClaude({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return parseJSONSafely(getTextFromResponse(response));
}
