import { NextResponse } from "next/server";
import { buildOrquestraPortalSnapshot, connectorEndpointIsValid } from "@/lib/connectors/orquestraPortalServer";
import { firebaseAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const platformAdminEmail = "orquestracs@gmail.com";

async function authorizePlatformAdmin(request: Request) {
  const admin = firebaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin || !token) return null;
  const decoded = await admin.auth.verifyIdToken(token);
  if (String(decoded.email || "").trim().toLowerCase() !== platformAdminEmail) return null;
  return admin;
}

export async function POST(request: Request) {
  try {
    const admin = await authorizePlatformAdmin(request);
    if (!admin) return NextResponse.json({ error: "Acesso negado para sincronizar o Portal Orquestra.cs." }, { status: 403 });

    const endpoint = String(process.env.ORQUESTRA_PORTAL_CONNECTOR_URL || "").trim();
    const sharedSecret = String(process.env.ORQUESTRA_CONNECTOR_SHARED_SECRET || "").trim();
    if (!endpoint || !sharedSecret || !connectorEndpointIsValid(endpoint)) {
      return NextResponse.json({ error: "Conector do Portal Orquestra.cs não configurado neste ambiente." }, { status: 503 });
    }

    const { serializedPayload, summary } = await buildOrquestraPortalSnapshot();
    const portalResponse = await fetch(endpoint, {
      body: serializedPayload,
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${sharedSecret}`,
        "Content-Type": "application/json",
        "X-Orquestra-Contract-Version": summary.contractVersion,
        "X-Orquestra-Source-System": "orquestra_hub",
      },
      method: "POST",
    });

    if (!portalResponse.ok) {
      console.error("orquestra_portal_connector_failed", { status: portalResponse.status, summary });
      return NextResponse.json({ error: "O Portal Orquestra.cs recusou a sincronização.", summary }, { status: 502 });
    }

    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    console.error("orquestra_portal_connector_error", error instanceof Error ? error.message : "unknown-error");
    return NextResponse.json({ error: "Não foi possível sincronizar o Portal Orquestra.cs agora." }, { status: 500 });
  }
}
