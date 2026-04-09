import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = createServerClient();

    const { data: client, error } = await supabase
      .from("clients")
      .select(
        `id, created_at, status, business_name, sector, years_operating, team_size,
         main_product, business_description, main_problem, problem_duration,
         tried_solutions, monthly_cost, impact_if_solved, client_management,
         time_consuming_process, has_team, daily_metrics, current_software,
         six_month_goal, competitors, differentiator, willingness_to_pay,
         additional_info, agent_outputs, github_url, vercel_url, error_message,
         current_pipeline_job_id,
         app_user_type, user_profile, concurrent_users, process_to_automate,
         app_name_idea, required_features, needs_auth, user_roles, integrations,
         handles_payments, needs_dashboard, needs_mobile, goal_90_days,
         budget_range, has_tech_team, revenue_model, avg_ticket, active_clients`
      )
      .eq("id", id)
      .single();

    if (error || !client) {
      console.error("[API /dashboard/[id]] Error:", error);
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    return Response.json({ client });
  } catch (error) {
    console.error(
      "[API /dashboard/[id]] Unexpected error:",
      JSON.stringify(error, Object.getOwnPropertyNames(error as object))
    );
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
