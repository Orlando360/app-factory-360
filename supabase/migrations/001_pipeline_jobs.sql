-- Pipeline jobs table for Inngest-orchestrated Claude Agent SDK pipeline
create extension if not exists "pgcrypto";

create table if not exists public.pipeline_jobs (
  id uuid primary key default gen_random_uuid(),
  inngest_run_id text,
  client_brief jsonb not null,
  status text not null default 'pending',
  current_step text,
  agents_outputs jsonb not null default '{}'::jsonb,
  final_report text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists pipeline_jobs_status_idx on public.pipeline_jobs (status);
create index if not exists pipeline_jobs_created_at_idx on public.pipeline_jobs (created_at desc);

-- Enable Realtime for this table (Supabase handles replication slot via publication)
alter publication supabase_realtime add table public.pipeline_jobs;
