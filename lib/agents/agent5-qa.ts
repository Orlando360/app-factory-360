import { callClaude as callClaudeRetry, getTextFromResponse } from "../claude";
import { ClientData } from "../supabase";

export type QAOutput = {
  issues_found: Array<{ severity: string; description: string; fix_applied: string }>;
  files_modified: string[];
  code_quality_score: number;
  approved_for_deploy: boolean;
  files: Record<string, string>;
};

function extractJSON(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim());
}

export async function runAgent5(
  clientData: ClientData,
  previousOutputs: Record<string, unknown>
): Promise<QAOutput> {
  // Uses callClaudeRetry from lib/claude.ts for automatic retries

  const builder = previousOutputs.agent4 as Record<string, unknown>;
  const originalFiles = (builder?.files as Record<string, string>) ?? {};

  // Send files in batches to review, only get back fixed versions
  const fileEntries = Object.entries(originalFiles);
  const fixedFiles: Record<string, string> = { ...originalFiles };
  const allIssues: Array<{ severity: string; description: string; fix_applied: string }> = [];
  const modifiedFilePaths: string[] = [];

  const systemPrompt = `Eres un QA Engineer Senior para apps Next.js 14. Revisas código y devuelves SOLO los archivos que necesitan corrección.

JSON puro sin markdown:
{
  "issues_found": [{ "severity": "critical|medium|low", "description": "...", "fix_applied": "..." }],
  "fixed_files": { "[filepath]": "[contenido corregido completo]" },
  "code_quality_score": 0-100
}

Si un archivo está correcto, NO lo incluyas en fixed_files.
Enfócate en: imports faltantes, 'use client' directives, tipos TypeScript, async/await, variables sin definir.`;

  // Process files in chunks of 5 to avoid token limits
  const chunkSize = 5;
  for (let i = 0; i < fileEntries.length; i += chunkSize) {
    const chunk = fileEntries.slice(i, i + chunkSize);
    const filesContent = chunk
      .map(([path, content]) => `\n=== ${path} ===\n${content}`)
      .join("\n");

    try {
      const response = await callClaudeRetry({
        model: "claude-sonnet-4-20250514",
        max_tokens: 8000,
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Revisa estos archivos de la app "${clientData.business_name}" y corrige solo los que tengan problemas:\n${filesContent}`,
          },
        ],
      });

      const content = response.content[0];
      if (content.type !== "text") continue;

      const result = extractJSON(content.text) as {
        issues_found?: Array<{ severity: string; description: string; fix_applied: string }>;
        fixed_files?: Record<string, string>;
        code_quality_score?: number;
      };

      if (result.issues_found) {
        allIssues.push(...result.issues_found);
      }
      if (result.fixed_files) {
        for (const [path, content] of Object.entries(result.fixed_files)) {
          fixedFiles[path] = content;
          modifiedFilePaths.push(path);
        }
      }
    } catch {
      // If a chunk fails, continue with next chunk
      continue;
    }
  }

  const criticalIssues = allIssues.filter((i) => i.severity === "critical").length;
  const qualityScore = Math.max(0, 100 - criticalIssues * 15 - allIssues.length * 2);

  return {
    issues_found: allIssues,
    files_modified: [...new Set(modifiedFilePaths)],
    code_quality_score: qualityScore,
    approved_for_deploy: criticalIssues === 0,
    files: fixedFiles,
  };
}
