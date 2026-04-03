import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";
import { isValidSessionToken } from "@/lib/auth";
import ClientDetailClient from "./ClientDetailClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ clientId: string }>;
}): Promise<Metadata> {
  const { clientId } = await params;
  return {
    title: `Cliente ${clientId.slice(0, 8)} — App Factory 360`,
  };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ clientId: string }>;
}) {
  const { clientId } = await params;

  // Auth check
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("dashboard_auth");
  if (!isValidSessionToken(authCookie?.value)) {
    redirect("/dashboard");
  }

  // Load client
  const supabase = createServerClient();
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .single();

  if (error || !client) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center text-white">
        <div className="text-center">
          <h1 className="text-2xl font-black mb-2">Cliente no encontrado</h1>
          <a href="/dashboard" className="text-[#F5C518] hover:underline">
            ← Volver al dashboard
          </a>
        </div>
      </div>
    );
  }

  return <ClientDetailClient client={client} />;
}
