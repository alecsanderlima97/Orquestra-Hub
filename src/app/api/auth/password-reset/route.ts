import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { NextResponse } from "next/server";

const attempts = new Map<string, number>();

function adminAuth() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let parsed: unknown = JSON.parse(raw.trim());
  if (typeof parsed === "string") parsed = JSON.parse(parsed);
  const serviceAccount = parsed as { client_email: string; private_key: string; project_id: string };
  const app = getApps()[0] || initializeApp({ credential: cert({ clientEmail: serviceAccount.client_email, privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"), projectId: serviceAccount.project_id }) });
  return getAuth(app);
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
  const lastAttempt = attempts.get(ip) || 0;
  if (Date.now() - lastAttempt < 60_000) return NextResponse.json({ error: "Aguarde um minuto antes de tentar novamente." }, { status: 429 });
  attempts.set(ip, Date.now());

  const { email } = await request.json();
  if (!email || typeof email !== "string") return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  let auth;
  try { auth = adminAuth(); } catch (error) {
    console.error("firebase-service-account", error);
    return NextResponse.json({ error: "A credencial do Firebase está com formato inválido na Vercel." }, { status: 503 });
  }
  const resendKey = process.env.RESEND_API_KEY;
  if (!auth || !resendKey) return NextResponse.json({ error: "Recuperação de senha ainda não configurada." }, { status: 503 });

  try {
    const link = await auth.generatePasswordResetLink(email.trim().toLowerCase(), { url: "https://orquestra-hub.vercel.app" });
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "Orquestra Hub <onboarding@resend.dev>",
        to: [email.trim().toLowerCase()],
        subject: "Redefinição de senha | Orquestra Hub",
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a"><h1 style="font-size:24px">Orquestra Hub</h1><p>Recebemos uma solicitação para redefinir sua senha.</p><p><a href="${link}" style="display:inline-block;background:#087ec1;color:white;text-decoration:none;padding:12px 18px;border-radius:6px;font-weight:bold">Criar nova senha</a></p><p style="color:#64748b;font-size:13px">Se você não solicitou esta alteração, ignore este e-mail.</p></div>`,
      }),
    });
    if (!response.ok) throw new Error(await response.text());
  } catch (error) {
    const code = (error as { code?: string }).code || "";
    if (!code.includes("user-not-found")) console.error("password-reset", error);
  }
  return NextResponse.json({ ok: true });
}
