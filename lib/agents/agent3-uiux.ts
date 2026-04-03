import { callClaude, getTextFromResponse } from "../claude";
import { ClientData } from "../supabase";

export type UIUXOutput = {
  design_system: {
    primary_color: string;
    secondary_color: string;
    background: string;
    typography: string;
    spacing_scale: string;
  };
  components: string[];
  layout_per_view: Record<string, string>;
  interaction_states: string[];
  mobile_breakpoints: string[];
};

function parseJSONSafely(text: string): UIUXOutput {
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

export async function runAgent3(
  clientData: ClientData,
  previousOutputs: Record<string, unknown>
): Promise<UIUXOutput> {
  const systemPrompt = `Eres un Senior UI/UX Engineer especializado en dashboards B2B de alto rendimiento. Diseñas sistemas de diseño que maximizan la productividad del usuario y minimizan la curva de aprendizaje.
Tu output es JSON puro (sin markdown):
{
  "design_system": {
    "primary_color": string,
    "secondary_color": string,
    "background": string,
    "typography": string,
    "spacing_scale": string
  },
  "components": string[],
  "layout_per_view": { [viewName]: string },
  "interaction_states": string[],
  "mobile_breakpoints": string[]
}`;

  const userMessage = `Cliente: ${clientData.business_name}
Sector: ${clientData.sector}
Perfil de usuario: ${JSON.stringify((previousOutputs.agent1 as Record<string, unknown>)?.user_profile)}
Módulos: ${JSON.stringify((previousOutputs.agent2 as Record<string, unknown>)?.modules)}
Vistas: ${JSON.stringify((previousOutputs.agent2 as Record<string, unknown>)?.views)}

Define el sistema de diseño y UI/UX completo. JSON puro.`;

  const response = await callClaude({
    model: "claude-sonnet-4-20250514",
    max_tokens: 3000,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return parseJSONSafely(getTextFromResponse(response));
}
