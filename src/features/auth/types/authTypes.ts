export type AppUser = {
  email: string;
  graceDays?: number;
  id: string;
  name: string;
  role: "Proprietário" | "Dono" | "Financeiro" | "Consulta";
  tenantId: string;
  companyName: string;
  authProvider?: "google" | "password";
  planId?: "inicial" | "medio" | "premium";
  nextBillingDate?: string;
  subscriptionStatus?: "trial" | "ativo" | "pausado" | "vencido" | "bloqueado" | "cancelado";
  photoUrl?: string;
  needsOnboarding?: boolean;
};

export type CompanyMembership = { companyName: string; graceDays?: number; nextBillingDate?: string; planId?: AppUser["planId"]; role: AppUser["role"]; subscriptionStatus?: AppUser["subscriptionStatus"]; tenantId: string };
