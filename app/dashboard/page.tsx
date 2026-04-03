import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { isValidSessionToken } from "@/lib/auth";
import DashboardClient from "./DashboardClient";
import LoginForm from "./LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — App Factory 360",
  description: "Panel de control interno de App Factory 360.",
};

export const dynamic = "force-dynamic";

const STATUS_ORDER = ["pending", "generating", "qa_review", "deploying", "live", "error"];

type Client = {
  id: string;
  business_name: string;
  sector: string;
  created_at: string;
  status: string;
  vercel_url: string | null;
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("dashboard_auth");
  const isAuthenticated = isValidSessionToken(authCookie?.value);

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Load clients
  let clients: Client[] = [];
  let loadError: string | null = null;

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from("clients")
      .select("id, business_name, sector, created_at, status, vercel_url")
      .order("created_at", { ascending: false });

    if (error) {
      loadError = error.message;
    } else {
      clients = (data as Client[]) || [];
    }
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Unknown error";
  }

  // Count by status
  const statusCounts: Record<string, number> = {};
  for (const status of STATUS_ORDER) statusCounts[status] = 0;
  for (const client of clients) {
    if (client.status in statusCounts) statusCounts[client.status]++;
    else statusCounts[client.status] = 1;
  }

  return (
    <DashboardClient
      clients={clients}
      statusCounts={statusCounts}
      loadError={loadError}
    />
  );
}
