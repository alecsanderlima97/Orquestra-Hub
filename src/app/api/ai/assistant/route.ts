import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "OPENAI_API_KEY não configurada na Vercel." }, { status: 500 });

  try {
    const body = await request.json();
    const question = String(body.question || "").trim();
    if (!question) return NextResponse.json({ error: "Pergunta obrigatória." }, { status: 400 });

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
    if (!response.ok) return NextResponse.json({ error: data.error?.message || "Falha ao consultar a OpenAI." }, { status: response.status });

    const answer = extractText(data);
    if (!answer) return NextResponse.json({ error: "A IA respondeu, mas não retornou texto." }, { status: 502 });
    return NextResponse.json({ answer, model: payload.model, usage: usageCost(data.usage) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Erro interno no assistente." }, { status: 500 });
  }
}
