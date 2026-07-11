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
  userLimit: number;
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
    price: "R$ 75,00",
    storeLimit: 1,
    userLimit: 1,
    whatsappEnabled: false,
  },
  medio: {
    aiEnabled: true,
    emailAutomation: false,
    id: "medio",
    initialAiCredits: 15,
    label: "Plano Médio",
    monthlyAiCredits: 15,
    price: "R$ 120,00",
    storeLimit: 3,
    userLimit: 3,
    whatsappEnabled: true,
  },
  premium: {
    aiEnabled: true,
    emailAutomation: true,
    id: "premium",
    initialAiCredits: 100,
    label: "Plano Premium",
    monthlyAiCredits: 100,
    price: "R$ 299,00",
    storeLimit: 5,
    userLimit: 10,
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
