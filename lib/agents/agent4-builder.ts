import { callClaude as callClaudeRetry, getTextFromResponse } from "../claude";
import { ClientData } from "../supabase";

export type BuilderOutput = {
  files: Record<string, string>;
  env_vars_needed: string[];
  supabase_schema_sql: string;
  install_command: string;
};

async function callClaude(
  system: string,
  user: string,
  maxTokens = 4000
): Promise<string> {
  const response = await callClaudeRetry({
    model: "claude-sonnet-4-20250514",
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return getTextFromResponse(response).trim();
}

function parseManifest(text: string): Array<{ path: string; description: string }> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
  else if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
  if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);
  return JSON.parse(cleaned.trim());
}

export async function runAgent4(
  clientData: ClientData,
  previousOutputs: Record<string, unknown>
): Promise<BuilderOutput> {
  const arch = previousOutputs.agent2 as Record<string, unknown>;
  const design = previousOutputs.agent3 as Record<string, unknown>;

  const appName = (arch?.app_name as string) ?? clientData.business_name;
  const modules = JSON.stringify(arch?.modules ?? []);
  const views = JSON.stringify(arch?.views ?? []);
  const schema = JSON.stringify(arch?.data_schema ?? []);
  const designSystem = JSON.stringify(design?.design_system ?? {});
  const flows = JSON.stringify(arch?.user_flows ?? []);

  const context = `
App: ${appName} | Cliente: ${clientData.business_name} (${clientData.sector})
Problema: ${clientData.main_problem}
Módulos: ${modules}
Vistas: ${views}
Schema DB: ${schema}
Diseño: ${designSystem}
`.trim();

  // Step 1: Generate manifest of files to create
  const manifestText = await callClaude(
    `Eres un arquitecto de software. Devuelves SOLO un array JSON sin markdown.`,
    `Lista exacta de archivos necesarios para una app Next.js 14 completa para: ${appName}
Módulos: ${modules}
Vistas: ${views}
Schema: ${schema}

Devuelve SOLO este JSON (sin markdown):
[
  { "path": "package.json", "description": "deps" },
  { "path": "app/layout.tsx", "description": "root layout" },
  ...
]

Incluye: package.json, tsconfig.json, next.config.ts, tailwind.config.ts, app/globals.css, app/layout.tsx, app/page.tsx, middleware.ts si aplica, lib/supabase.ts, lib/types.ts, todas las páginas (app/*/page.tsx), todos los componentes, todas las rutas API (app/api/*/route.ts).
Máximo 20 archivos. Solo los esenciales.`,
    1500
  );

  let manifest: Array<{ path: string; description: string }> = [];
  try {
    manifest = parseManifest(manifestText);
  } catch {
    // Fallback manifest
    manifest = [
      { path: "package.json", description: "dependencies" },
      { path: "tsconfig.json", description: "typescript config" },
      { path: "next.config.ts", description: "next config" },
      { path: "tailwind.config.ts", description: "tailwind config" },
      { path: "app/globals.css", description: "global styles" },
      { path: "app/layout.tsx", description: "root layout" },
      { path: "app/page.tsx", description: "landing page" },
      { path: "lib/supabase.ts", description: "supabase client" },
      { path: "lib/types.ts", description: "typescript types" },
    ];
  }

  // Step 2: Generate each file individually in plain text
  const files: Record<string, string> = {};

  const fileSysPrompt = `Eres un Full Stack Engineer Senior. Generas código de producción para Next.js 14 App Router + TypeScript + Tailwind + Supabase.
REGLAS:
- Código completo y funcional, sin placeholders ni TODOs
- Manejo de errores en cada async
- 'use client' donde sea necesario
- Responde SOLO con el código del archivo, sin explicaciones ni markdown`;

  for (const file of manifest) {
    try {
      const code = await callClaude(
        fileSysPrompt,
        `Genera el archivo completo: ${file.path}
Propósito: ${file.description}

CONTEXTO:
${context}
Flujos: ${flows}

Responde SOLO con el código, sin markdown ni explicaciones.`,
        3500
      );

      // Strip markdown code fences if Claude added them
      let cleanCode = code;
      if (cleanCode.startsWith("```")) {
        cleanCode = cleanCode.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "");
      }
      files[file.path] = cleanCode.trim();
    } catch {
      // Skip failed file, don't block the whole pipeline
      files[file.path] = `// Error generating ${file.path} - needs manual implementation`;
    }
  }

  // Step 3: Generate Supabase SQL schema
  let supabase_schema_sql = "";
  try {
    const sql = await callClaude(
      `Eres un DBA. Generas SQL PostgreSQL para Supabase. Responde SOLO con SQL, sin markdown.`,
      `Genera el SQL completo para crear todas las tablas de: ${appName}
Schema requerido: ${schema}
Incluye: CREATE TABLE, índices, RLS policies (enable RLS + policy para service role).
Solo SQL, sin explicaciones.`,
      2000
    );
    supabase_schema_sql = sql.replace(/^```sql\n?/, "").replace(/\n?```$/, "").trim();
  } catch {
    supabase_schema_sql = `-- Error generating schema for ${appName}`;
  }

  // Extract env vars from files
  const envVarPattern = /process\.env\.([A-Z_]+)/g;
  const envVarsFound = new Set<string>();
  for (const content of Object.values(files)) {
    let match;
    while ((match = envVarPattern.exec(content)) !== null) {
      envVarsFound.add(match[1]);
    }
  }

  return {
    files,
    env_vars_needed: Array.from(envVarsFound),
    supabase_schema_sql,
    install_command: "npm install",
  };
}
