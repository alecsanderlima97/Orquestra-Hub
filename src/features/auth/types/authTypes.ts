export type AppUser = {
  email: string;
  id: string;
  name: string;
  role: "Proprietário" | "Dono" | "Financeiro" | "Consulta";
  tenantId: string;
  companyName: string;
  planId?: "inicial" | "medio" | "premium";
  nextBillingDate?: string;
  subscriptionStatus?: "trial" | "ativo" | "vencido" | "bloqueado" | "cancelado";
  photoUrl?: string;
  needsOnboarding?: boolean;
};

export type CompanyMembership = { companyName: string; nextBillingDate?: string; planId?: AppUser["planId"]; role: AppUser["role"]; subscriptionStatus?: AppUser["subscriptionStatus"]; tenantId: string };
