import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { buildOrquestraPortalSnapshot, connectorEndpointIsValid } from "@/lib/connectors/orquestraPortalServer";
import { firebaseAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const platformAdminEmail = "orquestracs@gmail.com";

type SyncClient = {
  externalCustomerId: string;
  id: string;
};

type PortalSyncStatus = "success" | "error";

async function persistPortalSyncMetadata(admin: NonNullable<ReturnType<typeof firebaseAdmin>>, clients: SyncClient[], status: PortalSyncStatus, error = "") {
  const timestamp = new Date();
  for (let index = 0; index < clients.length; index += 400) {
    const batch = admin.db.batch();
    clients.slice(index, index + 400).forEach((client) => {
      batch.set(admin.db.doc(`tenants/${client.id}`), {
        externalCustomerId: client.externalCustomerId,
        portalDataVersion: 1,
        portalLastSyncedAt: timestamp,
        portalSyncError: error,
        portalSyncStatus: status,
      }, { merge: true });
    });
    await batch.commit();
  }
}

async function authorizePlatformAdmin(request: Request) {
  const admin = firebaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin || !token) return null;
  const decoded = await admin.auth.verifyIdToken(token);
  if (String(decoded.email || "").trim().toLowerCase() !== platformAdminEmail) return null;
  return admin;
}

async function authorizeSyncRequest(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim() || "";
  const authorization = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const receivedBuffer = Buffer.from(authorization);
  const expectedBuffer = Buffer.from(cronSecret);
  if (cronSecret && receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer)) {
    return firebaseAdmin();
  }
  return authorizePlatformAdmin(request);
}

async function runSync(request: Request) {
  let syncClients: SyncClient[] = [];
  try {
    const admin = await authorizeSyncRequest(request);
    if (!admin) return NextResponse.json({ error: "Acesso negado para sincronizar o Portal Orquestra.cs." }, { status: 403 });

    const endpoint = String(process.env.ORQUESTRA_PORTAL_CONNECTOR_URL || "").trim();
    const sharedSecret = String(process.env.ORQUESTRA_CONNECTOR_SHARED_SECRET || "").trim();
    if (!endpoint || !sharedSecret || !connectorEndpointIsValid(endpoint)) {
      return NextResponse.json({ error: "Conector do Portal Orquestra.cs não configurado neste ambiente." }, { status: 503 });
    }

    const snapshot = await buildOrquestraPortalSnapshot();
    const { serializedPayload, summary } = snapshot;
    syncClients = snapshot.payload.clients.map((client) => ({ externalCustomerId: client.externalCustomerId, id: client.id }));
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
      const errorMessage = `Portal recusou a sincronização (HTTP ${portalResponse.status}).`;
      await persistPortalSyncMetadata(admin, syncClients, "error", errorMessage);
      console.error("orquestra_portal_connector_failed", { status: portalResponse.status, summary });
      return NextResponse.json({ error: "O Portal Orquestra.cs recusou a sincronização.", summary }, { status: 502 });
    }

    await persistPortalSyncMetadata(admin, syncClients, "success");
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    const errorMessage = "Falha de comunicação com o Portal Orquestra.cs.";
    const admin = firebaseAdmin();
    if (admin && syncClients.length) {
      await persistPortalSyncMetadata(admin, syncClients, "error", errorMessage).catch((metadataError) => {
        console.error("orquestra_portal_sync_metadata_failed", metadataError instanceof Error ? metadataError.message : "unknown-error");
      });
    }
    console.error("orquestra_portal_connector_error", error instanceof Error ? error.message : "unknown-error");
    return NextResponse.json({ error: "Não foi possível sincronizar o Portal Orquestra.cs agora." }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return runSync(request);
}

export async function POST(request: Request) {
  return runSync(request);
}
