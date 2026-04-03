import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "crypto";

function generateSessionToken(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET not configured");
  const payload = `auth:${Date.now()}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return `${Buffer.from(payload).toString("base64")}.${sig}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password } = body;

    const expectedPassword = process.env.DASHBOARD_PASSWORD;
    if (!expectedPassword) {
      return Response.json({ success: false, error: "Auth not configured" }, { status: 503 });
    }

    if (password !== expectedPassword) {
      return Response.json({ success: false, error: "Invalid password" }, { status: 401 });
    }

    const token = generateSessionToken();
    const cookieStore = await cookies();
    cookieStore.set("dashboard_auth", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return Response.json({ success: true });
  } catch {
    return Response.json({ success: false, error: "Internal error" }, { status: 500 });
  }
}
