import Anthropic from "@anthropic-ai/sdk";

const RETRYABLE_STATUS_CODES = [429, 500, 502, 503, 529];

export function createClaudeClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

export async function callClaude(
  params: Anthropic.MessageCreateParamsNonStreaming,
  retries = 3
): Promise<Anthropic.Message> {
  const client = createClaudeClient();
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await client.messages.create(params);
    } catch (error: unknown) {
      const status = (error as { status?: number })?.status;
      const isRetryable = status ? RETRYABLE_STATUS_CODES.includes(status) : true;
      const isLastAttempt = attempt === retries - 1;

      if (isLastAttempt || !isRetryable) {
        console.error(`[Claude] Failed after ${attempt + 1} attempts:`, error);
        throw error;
      }

      const delay = Math.pow(2, attempt) * 1000;
      console.warn(
        `[Claude] Attempt ${attempt + 1} failed (status: ${status}), retrying in ${delay}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("[Claude] Unexpected: exhausted retries");
}

export function getTextFromResponse(response: Anthropic.Message): string {
  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type");
  return block.text;
}
