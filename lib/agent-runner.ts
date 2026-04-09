/**
 * Thin runner that loads a subagent markdown file from .claude/agents/
 * and executes it against the Claude API. The markdown frontmatter provides
 * the name/description/model; the body is used as the system prompt.
 *
 * Keeping this as a single-turn wrapper (rather than the full claude-agent-sdk
 * `query()` loop) is intentional: each pipeline step is a pure
 * input → structured output transformation and doesn't need an agentic loop.
 * The `@anthropic-ai/claude-agent-sdk` package is still installed so that
 * individual sub-agents can opt into full agentic behavior in the future.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { callClaude, getTextFromResponse } from "./claude";

const DEFAULT_MODEL = "claude-opus-4-5-20250514";
const MAX_TOKENS = 16384;

type Frontmatter = {
  name?: string;
  description?: string;
  model?: string;
};

function parseFrontmatter(raw: string): { meta: Frontmatter; body: string } {
  if (!raw.startsWith("---")) return { meta: {}, body: raw };
  const end = raw.indexOf("\n---", 3);
  if (end === -1) return { meta: {}, body: raw };
  const header = raw.slice(3, end).trim();
  const body = raw.slice(end + 4).trimStart();
  const meta: Frontmatter = {};
  for (const line of header.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k === "name" || k === "description" || k === "model") {
      meta[k] = v;
    }
  }
  return { meta, body };
}

const cache = new Map<string, { meta: Frontmatter; body: string }>();

async function loadSubagent(fileName: string) {
  if (cache.has(fileName)) return cache.get(fileName)!;
  const fullPath = path.join(process.cwd(), ".claude", "agents", fileName);
  const raw = await readFile(fullPath, "utf-8");
  const parsed = parseFrontmatter(raw);
  cache.set(fileName, parsed);
  return parsed;
}

export type RunSubagentOptions = {
  subagentFile: string; // e.g. "01-diagnosticador.md"
  userInput: unknown;   // any JSON-serializable payload
  expectJSON?: boolean; // default true
};

function stripCodeFence(text: string): string {
  let t = text.trim();
  if (t.startsWith("```")) {
    const firstNl = t.indexOf("\n");
    if (firstNl !== -1) t = t.slice(firstNl + 1);
  }
  if (t.endsWith("```")) t = t.slice(0, -3);
  return t.trim();
}

export async function runSubagent<T = unknown>(opts: RunSubagentOptions): Promise<T> {
  const { subagentFile, userInput, expectJSON = true } = opts;
  const { meta, body } = await loadSubagent(subagentFile);

  const system = body;
  const userMessage =
    typeof userInput === "string"
      ? userInput
      : `Entrada JSON:\n\n${JSON.stringify(userInput, null, 2)}`;

  const response = await callClaude({
    model: meta.model || DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    system,
    messages: [{ role: "user", content: userMessage }],
  });

  const text = getTextFromResponse(response);

  if (!expectJSON) return text as unknown as T;

  const cleaned = stripCodeFence(text);
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(
      `[agent-runner:${subagentFile}] Failed to parse JSON output: ${(err as Error).message}\n---raw---\n${text.slice(0, 500)}`
    );
  }
}
