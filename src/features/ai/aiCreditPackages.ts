export const AI_CREDIT_PACKAGES = {
  essencial_100: { credits: 100, helper: "Para uso leve e validações rápidas.", label: "Essencial", price: "R$ 29,90" },
  mais_escolhido_300: { credits: 300, helper: "Boa margem para rotina financeira semanal.", label: "Mais escolhido", price: "R$ 69,90" },
  performance_1000: { credits: 1000, helper: "Para equipes que usam IA no dia a dia.", label: "Performance", price: "R$ 189,90" },
} as const;

export type AiCreditPackageId = keyof typeof AI_CREDIT_PACKAGES;

export function getAiCreditPackage(value: unknown) {
  if (typeof value !== "string" || !(value in AI_CREDIT_PACKAGES)) return null;
  return AI_CREDIT_PACKAGES[value as AiCreditPackageId];
}

