import { createHmac } from "node:crypto";
import { NextResponse } from "next/server";
import { firebaseAdmin } from "@/lib/firebase/admin";
import { getAiCreditPackage, type AiCreditPackageId } from "@/features/ai/aiCreditPackages";

export const runtime = "nodejs";

const portalUrl = process.env.ORQUESTRA_PORTAL_URL?.trim() || "https://portal.orquestracs.com";

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

export async function POST(request: Request) {
  try {
    const admin = firebaseAdmin();
    const secret = process.env.ORQUESTRA_CONNECTOR_SHARED_SECRET?.trim();
    const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!admin || !secret || !bearer) return NextResponse.json({ error: "Pagamento pelo Portal ainda não está configurado neste sistema." }, { status: 503 });

    const decoded = await admin.auth.verifyIdToken(bearer);
    const body = await request.json() as Record<string, unknown>;
    const tenantId = String(body.tenantId || "").trim();
    const packageId = String(body.packageId || "").trim();
    if (!tenantId || !getAiCreditPackage(packageId)) return NextResponse.json({ error: "Empresa ou pacote de créditos inválido." }, { status: 400 });

    const member = await admin.db.doc(`tenants/${tenantId}/users/${decoded.uid}`).get();
    if (!member.exists) return NextResponse.json({ error: "Usuário sem acesso a esta empresa." }, { status: 403 });

    const encodedPayload = base64UrlEncode(JSON.stringify({
      externalTenantId: `orquestra_hub_${tenantId}`,
      exp: Date.now() + 15 * 60 * 1000,
      sourceSystem: "orquestra_hub",
      version: 1,
    }));
    const signature = createHmac("sha256", secret).update(encodedPayload).digest("base64url");
    const token = `${encodedPayload}.${signature}`;
    const safePackageId = packageId as AiCreditPackageId;
    return NextResponse.json({
      ok: true,
      packageId: safePackageId,
      url: `${portalUrl.replace(/\/$/, "")}/pagar/creditos/${encodeURIComponent(token)}?package=${encodeURIComponent(safePackageId)}`,
    });
  } catch (error) {
    console.error("ai_credit_payment_link_failed", error instanceof Error ? error.message : "unknown-error");
    return NextResponse.json({ error: "Não foi possível preparar o link de pagamento." }, { status: 500 });
  }
}

