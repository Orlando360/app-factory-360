import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      business_name,
      sector,
      years_operating,
      team_size,
      main_product,
      business_description,
      main_problem,
      problem_duration,
      tried_solutions,
      monthly_cost,
      impact_if_solved,
      client_management,
      time_consuming_process,
      has_team,
      daily_metrics,
      current_software,
      six_month_goal,
      competitors,
      differentiator,
      willingness_to_pay,
      additional_info,
      // New v2 fields — stored in agent_outputs until migration 003 is applied
      revenue_model,
      avg_ticket,
      active_clients,
      app_user_type,
      user_profile,
      concurrent_users,
      process_to_automate,
      app_name_idea,
      required_features,
      needs_auth,
      user_roles,
      integrations,
      handles_payments,
      needs_dashboard,
      needs_mobile,
      goal_90_days,
      budget_range,
      has_tech_team,
    } = body;

    if (!business_name || !main_problem) {
      return Response.json(
        { error: "business_name and main_problem are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // v2 fields stored in agent_outputs.intake until migration 003 adds the columns
    const intakeV2 = {
      revenue_model: revenue_model || "",
      avg_ticket: avg_ticket || "",
      active_clients: active_clients || "",
      app_user_type: app_user_type || "",
      user_profile: user_profile || "",
      concurrent_users: concurrent_users || "",
      process_to_automate: process_to_automate || "",
      app_name_idea: app_name_idea || "",
      required_features: required_features || "",
      needs_auth: needs_auth || "",
      user_roles: user_roles || "",
      integrations: integrations || "",
      handles_payments: handles_payments || "",
      needs_dashboard: needs_dashboard || "",
      needs_mobile: needs_mobile || "",
      goal_90_days: goal_90_days || "",
      budget_range: budget_range || "",
      has_tech_team: has_tech_team || "",
    };

    const { data, error } = await supabase
      .from("clients")
      .insert({
        business_name: business_name || "",
        sector: sector || "",
        years_operating: years_operating || "",
        team_size: team_size || "",
        main_product: main_product || "",
        business_description: business_description || "",
        main_problem: main_problem || "",
        problem_duration: problem_duration || "",
        tried_solutions: tried_solutions || "",
        monthly_cost: monthly_cost || "",
        impact_if_solved: impact_if_solved || "",
        client_management: client_management || "",
        time_consuming_process: time_consuming_process || "",
        has_team: has_team || "",
        daily_metrics: daily_metrics || "",
        current_software: current_software || "",
        six_month_goal: six_month_goal || goal_90_days || "",
        competitors: competitors || "",
        differentiator: differentiator || "",
        willingness_to_pay: willingness_to_pay || budget_range || "",
        additional_info: additional_info || "",
        status: "pending",
        agent_outputs: { intake: intakeV2 },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[API /intake] Supabase insert error:", error);
      return Response.json(
        { error: "Failed to save intake form. Please try again." },
        { status: 500 }
      );
    }

    return Response.json({ success: true, clientId: data.id }, { status: 201 });
  } catch (err) {
    console.error("[API /intake] Unexpected error:", err);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
