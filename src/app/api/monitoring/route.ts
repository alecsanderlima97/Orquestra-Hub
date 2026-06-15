import { NextResponse } from "next/server";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { errorProtocol, sanitizeError } from "@/lib/monitoring/sanitizeError";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const protocol = errorProtocol();
  try {
    const body = await request.json();
    const admin = firebaseAdmin();
    if (admin) await admin.db.collection("systemErrors").doc(protocol).set({ createdAt: new Date(), digest: sanitizeError(String(body.digest || ""), 120), message: sanitizeError(String(body.message || "Erro inesperado")), path: sanitizeError(String(body.path || ""), 200), protocol, userAgent: sanitizeError(request.headers.get("user-agent") || "", 250) });
  } catch {}
  return NextResponse.json({ protocol });
}
