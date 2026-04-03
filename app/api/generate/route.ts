import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { runFactory } from "@/lib/orchestrator";
import { isValidSessionToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get("dashboard_auth");
    if (!isValidSessionToken(authCookie?.value)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return Response.json({ error: "clientId is required" }, { status: 400 });
    }

    // Start the orchestrator without awaiting — fire and forget
    runFactory(clientId).catch((err) => {
      console.error(`[API /generate] Orchestrator error for client ${clientId}:`, err);
    });

    return Response.json({ started: true, clientId }, { status: 200 });
  } catch (err) {
    console.error("[API /generate] Unexpected error:", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
