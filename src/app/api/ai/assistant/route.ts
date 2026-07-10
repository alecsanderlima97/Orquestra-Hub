import { NextResponse } from "next/server";
import type { Firestore } from "firebase-admin/firestore";
import { currentRenewalMonth, getPlanRules } from "@/features/plans/planRules";
import { firebaseAdmin } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const OPENAI_INPUT_USD_PER_1M = 0.05;
const OPENAI_OUTPUT_USD_PER_1M = 0.4;

function extractText(data: { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> }) {
  if (typeof data.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  return (data.output || [])
    .flatMap((item) => item.content || [])
    .map((content) => content.text || "")
    .filter(Boolean)
    .join("\n\n")
    .trim();
}

function usageCost(usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number }) {
  const inputTokens = Number(usage?.input_tokens || 0);
  const outputTokens = Number(usage?.output_tokens || 0);
  const totalTokens = Number(usage?.total_tokens || inputTokens + outputTokens);
  return {
    estimatedCostUsd: (inputTokens / 1000000) * OPENAI_INPUT_USD_PER_1M + (outputTokens / 1000000) * OPENAI_OUTPUT_USD_PER_1M,
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

async function authorizeCompany(request: Request, tenantId: string) {
  const admin = firebaseAdmin();
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!admin || !token || !tenantId) return null;
  const decoded = await admin.auth.verifyIdToken(token);
  const member = await admin.db.doc(`tenants/${tenantId}/users/${decoded.uid}`).get();
  if (!member.exists) return null;
  return { admin, user: decoded };
}

async function reserveCredit(db: Firestore, tenantId: string) {
  const tenantRef = db.doc(`tenants/${tenantId}`);
  return db.runTransaction(async (transaction) => {
    const tenant = await transaction.get(tenantRef);
    if (!tenant.exists) throw new Error("Empresa não encontrada.");
    const plan = getPlanRules(tenant.data()?.planId);
    if (!plan.aiEnabled) throw new Error("Assistente IA não está disponível no plano atual.");
    const aiCredits = tenant.data()?.aiCredits || {};
    const month = currentRenewalMonth();
    const shouldRenew = aiCredits.renewalMonth !== month;
    const currentBalance = shouldRenew ? plan.monthlyAiCredits : Number.isFinite(Number(aiCredits.balance)) ? Number(aiCredits.balance) : plan.initialAiCredits;
    const currentUsed = shouldRenew ? 0 : Number(aiCredits.used || 0);
    if (currentBalance < 1) throw new Error("IA sem créditos disponíveis. Contrate uma recarga para continuar usando.");
    const nextBalance = currentBalance - 1;
    transaction.update(tenantRef, {
      "aiCredits.balance": nextBalance,
      "aiCredits.included": plan.monthlyAiCredits,
      "aiCredits.lastUsedAt": new Date().toISOString(),
      "aiCredits.renewalMonth": month,
      "aiCredits.status": "Ativo",
      "aiCredits.used": currentUsed + 1,
    });
    return { balance: nextBalance, used: currentUsed + 1 };
  });
}

async function refundCredit(db: Firestore, tenantId: string) {
  const tenantRef = db.doc(`tenants/${tenantId}`);
  await db.runTransaction(async (transaction) => {
    const tenant = await transaction.get(tenantRef);
    if (!tenant.exists) return;
    const aiCredits = tenant.data()?.aiCredits || {};
    transaction.update(tenantRef, {
      "aiCredits.balance": Number(aiCredits.balance || 0) + 1,
      "aiCredits.used": Math.max(Number(aiCredits.used || 0) - 1, 0),
    });
  });
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY não configurada na Vercel." }, { status: 500 });

  let reservedCredit: { balance: number; used: number } | null = null;
  let admin: ReturnType<typeof firebaseAdmin> = null;
  let tenantId = "";
  try {
    const body = await request.json();
    const question = String(body.question || "").trim();
    tenantId = String(body.tenantId || "").trim();
    if (!question) return NextResponse.json({ error: "Pergunta obrigatória." }, { status: 400 });
    if (!tenantId) return NextResponse.json({ error: "Empresa obrigatória para usar a IA." }, { status: 400 });
    const authorized = await authorizeCompany(request, tenantId);
    if (!authorized) return NextResponse.json({ error: "Sessão inválida ou sem acesso a esta empresa." }, { status: 401 });
    admin = authorized.admin;

    try {
      reservedCredit = await reserveCredit(admin.db, tenantId);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Não foi possível validar os créditos da IA." }, { status: 402 });
    }

    const payload = {
      input: [
        {
          content: [
            {
              text: `Pergunta do usuário: ${question}\n\nContexto financeiro do sistema:\n${JSON.stringify(body.context || {}, null, 2)}`,
              type: "input_text",
            },
          ],
          role: "user",
        },
      ],
      instructions: [
        "Você é a IA Financeira do Orquestra Hub, um sistema SaaS de gestão empresarial.",
        "Responda em português do Brasil, com pontuação correta, tom profissional e objetivo.",
        "Use apenas os dados enviados no contexto. Não invente valores, datas, fornecedores ou lojas.",
        "Quando falar de dinheiro, use formato brasileiro em R$.",
        "Se faltar informação, diga exatamente qual cadastro ou lançamento precisa ser conferido.",
        "Organize sempre a resposta em blocos curtos, com titulos em negrito.",
        "Use este padrao quando fizer sentido: **Resumo**, **Pontos de atencao**, **Proximas acoes** e **Mensagem pronta**.",
        "Em **Resumo**, responda direto a pergunta em no maximo 3 linhas.",
        "Em **Pontos de atencao**, liste somente itens realmente importantes encontrados no contexto.",
        "Em **Proximas acoes**, sugira no maximo 3 acoes praticas e simples.",
        "Inclua **Mensagem pronta** apenas se o usuario pedir texto para WhatsApp, cobranca, aviso ou comunicacao.",
        "Nao use tabelas grandes. Nao escreva paragrafos longos. Nao repita a pergunta do usuario.",
        "Se a pergunta for simples, responda em ate 8 linhas.",
      ].join(" "),
      model: process.env.OPENAI_MODEL || "gpt-5-nano",
    };

    const response = await fetch("https://api.openai.com/v1/responses", {
      body: JSON.stringify(payload),
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      method: "POST",
    });
    const rawText = await response.text();
    const data = rawText ? JSON.parse(rawText) : {};
    if (!response.ok) {
      if (reservedCredit && admin) await refundCredit(admin.db, tenantId);
      return NextResponse.json({ error: data.error?.message || "Falha ao consultar a OpenAI." }, { status: response.status });
    }

    const answer = extractText(data);
    if (!answer) {
      if (reservedCredit && admin) await refundCredit(admin.db, tenantId);
      return NextResponse.json({ error: "A IA respondeu, mas não retornou texto." }, { status: 502 });
    }
    const usage = usageCost(data.usage);
    await admin.db.collection(`tenants/${tenantId}/aiUsageLogs`).add({
      answerChars: answer.length,
      costUsd: usage.estimatedCostUsd,
      createdAt: new Date().toISOString(),
      creditsCharged: 1,
      model: payload.model,
      questionChars: question.length,
      totalTokens: usage.totalTokens,
      userEmail: authorized.user.email || "",
      userId: authorized.user.uid,
    });
    return NextResponse.json({ answer, credits: reservedCredit, model: payload.model, usage });
  } catch (error) {
    if (reservedCredit && admin && tenantId) await refundCredit(admin.db, tenantId);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno no assistente." }, { status: 500 });
  }
}
