import { NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createServerClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !client) {
    return Response.json({ error: "Client not found" }, { status: 404 });
  }

  return Response.json({ client });
}
