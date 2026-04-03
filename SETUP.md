# App Factory 360 — Setup Guide

## Required API Keys

### 1. Anthropic (Claude AI)
- Go to: https://console.anthropic.com/settings/keys
- Create a new API key
- Set: `ANTHROPIC_API_KEY=your_key_here`

### 2. Supabase
- Go to: https://supabase.com and create a new project
- Settings → API → Copy:
  - Project URL → `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL`
  - anon/public key → `SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - service_role key → `SUPABASE_SERVICE_KEY`

#### Create the database table
Run this SQL in the Supabase SQL Editor:

```sql
CREATE TABLE clients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'pending',
  current_agent TEXT,
  business_name TEXT,
  sector TEXT,
  years_operating TEXT,
  team_size TEXT,
  main_product TEXT,
  business_description TEXT,
  main_problem TEXT,
  problem_duration TEXT,
  tried_solutions TEXT,
  monthly_cost TEXT,
  impact_if_solved TEXT,
  client_management TEXT,
  time_consuming_process TEXT,
  has_team TEXT,
  daily_metrics TEXT,
  current_software TEXT,
  six_month_goal TEXT,
  competitors TEXT,
  differentiator TEXT,
  willingness_to_pay TEXT,
  additional_info TEXT,
  agent_outputs JSONB DEFAULT '{}',
  github_url TEXT,
  vercel_url TEXT,
  error_message TEXT
);

-- Enable RLS
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for server-side operations)
CREATE POLICY "Service role full access" ON clients
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 3. GitHub Personal Access Token
- Go to: https://github.com/settings/tokens
- Create a token with scopes: `repo` (full control)
- Set: `GITHUB_TOKEN=ghp_your_token_here`

### 4. Vercel API Token
- Go to: https://vercel.com/account/tokens
- Create a new token
- Set: `VERCEL_TOKEN=your_token_here`
- If using a team: `VERCEL_TEAM_ID=team_xxxxx`
  - Find it at: https://vercel.com/teams → Settings → Team ID

### 5. Resend (Email)
- Go to: https://resend.com and create account
- API Keys → Create API Key
- Set: `RESEND_API_KEY=re_your_key_here`

## Local Development

```bash
# Install dependencies
npm install

# Copy env file and fill in your keys
cp .env.local.example .env.local

# Run dev server
npm run dev
```

Open http://localhost:3000

## Pages

- `/` — Public landing page
- `/intake` — Client intake form (20 questions)
- `/dashboard` — Private dashboard (password: orlando360)
- `/dashboard/[clientId]` — Client detail + agent progress

## Architecture

```
app/
  page.tsx              — Landing page
  intake/page.tsx       — Intake form
  dashboard/
    page.tsx            — Dashboard (auth protected)
    [clientId]/page.tsx — Client detail page
  api/
    intake/route.ts     — Save intake form
    generate/route.ts   — Start agent pipeline
    progress/[clientId] — SSE progress stream
    dashboard/login/    — Auth cookie

lib/
  supabase.ts           — Supabase client
  orchestrator.ts       — Main pipeline runner
  github.ts             — GitHub API helpers
  vercel-deploy.ts      — Vercel API helpers
  agents/
    agent1-diagnostico.ts
    agent2-arquitecto.ts
    agent3-uiux.ts
    agent4-builder.ts
    agent5-qa.ts
    agent6-deploy.ts
    agent7-monetizacion.ts
    agent8-growth.ts

components/
  IntakeForm.tsx         — Multi-step intake form
  ClientCard.tsx         — Dashboard client row
  AgentProgress.tsx      — Real-time SSE progress
  AppPreview.tsx         — Deployed app preview
```

## Deployment to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard or:
vercel env add ANTHROPIC_API_KEY
# ... etc for each key
```

## Notes

- The orchestrator runs agents sequentially (1→2→3→4→5→6→7→8)
- Each agent retries once on failure before marking error
- Real-time updates via SSE (Server-Sent Events) at `/api/progress/[clientId]`
- Agent 6 creates GitHub repo + Vercel project and deploys automatically
- Dashboard password is set via `DASHBOARD_PASSWORD` env var (default: orlando360)
