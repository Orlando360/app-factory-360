import { callClaude, getTextFromResponse } from "../claude";
import { ClientData } from "../supabase";

export type GrowthOutput = {
  onboarding_flow: string[];
  email_sequences: Array<{
    trigger: string;
    subject: string;
    timing: string;
    goal: string;
  }>;
  analytics_events: string[];
  files_added: Record<string, string>;
  activation_checklist: string[];
  growth_levers: string[];
};

function parseJSONSafely(text: string): GrowthOutput {
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

export async function runAgent8(
  clientData: ClientData,
  previousOutputs: Record<string, unknown>
): Promise<GrowthOutput> {
  const systemPrompt = `Eres un Growth Engineer especializado en activación y retención de usuarios B2B. Diseñas flujos de onboarding, secuencias de email y eventos de analytics que maximizan la activación y reducen el churn.
Tu output es JSON puro (sin markdown):
{
  "onboarding_flow": string[],
  "email_sequences": [{"trigger": string, "subject": string, "timing": string, "goal": string}],
  "analytics_events": string[],
  "files_added": { "[filepath]": string },
  "activation_checklist": string[],
  "growth_levers": string[]
}`;

  const userMessage = `Cliente: ${clientData.business_name} (${clientData.sector})
App: ${JSON.stringify((previousOutputs.agent2 as Record<string, unknown>)?.app_name)}
Módulos: ${JSON.stringify((previousOutputs.agent2 as Record<string, unknown>)?.modules)}
Perfil usuario: ${JSON.stringify((previousOutputs.agent1 as Record<string, unknown>)?.user_profile)}
Meta 6 meses: ${clientData.six_month_goal}
Modelo monetización: ${JSON.stringify((previousOutputs.agent7 as Record<string, unknown>)?.monetization_model)}

Define la estrategia de growth completa para activar y retener usuarios. JSON puro.`;

  const response = await callClaude({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return parseJSONSafely(getTextFromResponse(response));
}
