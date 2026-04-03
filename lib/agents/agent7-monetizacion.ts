import { callClaude, getTextFromResponse } from "../claude";
import { ClientData } from "../supabase";

export type MonetizacionOutput = {
  monetization_model: string;
  pricing_tiers: Array<{
    name: string;
    price: string;
    features: string[];
  }>;
  roi_calculation: string;
  value_proposition: string;
  upsell_opportunities: string[];
  competitive_advantage: string;
};

function parseJSONSafely(text: string): MonetizacionOutput {
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

export async function runAgent7(
  clientData: ClientData,
  previousOutputs: Record<string, unknown>
): Promise<MonetizacionOutput> {
  const systemPrompt = `Eres un Revenue Strategy Advisor especializado en SaaS B2B para América Latina. Defines modelos de monetización que maximizan el valor para el cliente y el crecimiento del negocio en mercados LATAM.
Tu output es JSON puro (sin markdown):
{
  "monetization_model": string,
  "pricing_tiers": [{"name": string, "price": string, "features": string[]}],
  "roi_calculation": string,
  "value_proposition": string,
  "upsell_opportunities": string[],
  "competitive_advantage": string
}`;

  const userMessage = `Cliente: ${clientData.business_name} (${clientData.sector})
Problema resuelto: ${clientData.main_problem}
Disposición a pagar: ${clientData.willingness_to_pay}
Costo mensual del problema: ${clientData.monthly_cost}
Competidores: ${clientData.competitors}
Diferenciador: ${clientData.differentiator}

App construida: ${JSON.stringify((previousOutputs.agent2 as Record<string, unknown>)?.app_name)}
Features: ${JSON.stringify((previousOutputs.agent2 as Record<string, unknown>)?.modules)}

Define la estrategia de monetización óptima para este mercado LATAM. JSON puro.`;

  const response = await callClaude({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return parseJSONSafely(getTextFromResponse(response));
}
