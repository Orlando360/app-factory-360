-- Link the legacy `clients` intake table to the new `pipeline_jobs` runs.
alter table public.clients
  add column if not exists current_pipeline_job_id uuid references public.pipeline_jobs(id) on delete set null;

create index if not exists clients_current_pipeline_job_idx
  on public.clients (current_pipeline_job_id);
