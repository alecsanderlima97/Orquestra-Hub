export type PlanId = "inicial" | "medio" | "premium";

export type PlanRules = {
  aiEnabled: boolean;
  emailAutomation: boolean;
  id: PlanId;
  initialAiCredits: number;
  label: string;
  monthlyAiCredits: number;
  price: string;
  storeLimit: number;
  whatsappEnabled: boolean;
};

export const defaultPlanId: PlanId = "medio";

export const plans: Record<PlanId, PlanRules> = {
  inicial: {
    aiEnabled: false,
    emailAutomation: false,
    id: "inicial",
    initialAiCredits: 0,
    label: "Plano Inicial",
    monthlyAiCredits: 0,
    price: "R$ 70,00",
    storeLimit: 1,
    whatsappEnabled: false,
  },
  medio: {
    aiEnabled: true,
    emailAutomation: false,
    id: "medio",
    initialAiCredits: 10,
    label: "Plano Médio",
    monthlyAiCredits: 10,
    price: "R$ 100,00",
    storeLimit: 3,
    whatsappEnabled: true,
  },
  premium: {
    aiEnabled: true,
    emailAutomation: true,
    id: "premium",
    initialAiCredits: 20,
    label: "Plano Premium",
    monthlyAiCredits: 20,
    price: "R$ 250,00",
    storeLimit: 5,
    whatsappEnabled: true,
  },
};

export function normalizePlanId(planId?: string): PlanId {
  return planId === "inicial" || planId === "premium" || planId === "medio" ? planId : defaultPlanId;
}

export function getPlanRules(planId?: string) {
  return plans[normalizePlanId(planId)];
}

export function currentRenewalMonth(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
