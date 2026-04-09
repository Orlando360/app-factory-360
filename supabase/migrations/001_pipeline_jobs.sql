-- App Factory 360 — Pipeline Jobs
-- Tabla para Inngest-orchestrated 8-agent pipeline
-- Corre esta migración en el SQL Editor de Supabase

CREATE TABLE pipeline_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inngest_run_id TEXT,
  client_brief JSONB,
  status TEXT DEFAULT 'pending',       -- pending | running | completed | failed
  current_step TEXT,                   -- 01-diagnosticador … 08-growth | completed
  agents_outputs JSONB DEFAULT '{}',
  final_report TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Índices para queries frecuentes
CREATE INDEX idx_pipeline_jobs_status ON pipeline_jobs (status);
CREATE INDEX idx_pipeline_jobs_created ON pipeline_jobs (created_at DESC);

-- RLS: el browser con anon key puede leer sus propios jobs
ALTER TABLE pipeline_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_select" ON pipeline_jobs FOR SELECT USING (true);

-- Función atómica para actualizar agents_outputs sin race condition
-- Usada por los steps paralelos de Inngest
CREATE OR REPLACE FUNCTION append_agent_output(
  job_id UUID,
  agent_id TEXT,
  output TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE pipeline_jobs
  SET agents_outputs = agents_outputs || jsonb_build_object(agent_id, to_jsonb(output))
  WHERE id = job_id;
END;
$$;

-- Habilitar Realtime para que el frontend reciba updates en tiempo real
-- (requiere que la tabla esté en la publicación de Supabase)
ALTER PUBLICATION supabase_realtime ADD TABLE pipeline_jobs;
