import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || "";

// Server-side client with service role key (bypasses RLS)
export function createServerClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase server environment variables");
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Client-side client with anon key
export function createBrowserClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase public environment variables");
  }
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Default server client export
export const supabase = supabaseUrl && supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

export type ClientData = {
  id: string;
  created_at: string;
  status: string;
  business_name: string;
  sector: string;
  years_operating: string;
  team_size: string;
  main_product: string;
  business_description: string;
  main_problem: string;
  problem_duration: string;
  tried_solutions: string;
  monthly_cost: string;
  impact_if_solved: string;
  client_management: string;
  time_consuming_process: string;
  has_team: string;
  daily_metrics: string;
  current_software: string;
  six_month_goal: string;
  competitors: string;
  differentiator: string;
  willingness_to_pay: string;
  additional_info: string;
  agent_outputs: Record<string, unknown>;
  github_url: string | null;
  vercel_url: string | null;
  error_message: string | null;
  current_pipeline_job_id: string | null;
};
