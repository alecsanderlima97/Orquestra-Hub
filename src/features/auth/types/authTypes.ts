export type AppUser = {
  email: string;
  id: string;
  name: string;
  role: "Proprietário" | "Dono" | "Financeiro" | "Consulta";
  tenantId: string;
  companyName: string;
  needsOnboarding?: boolean;
};

export type CompanyMembership = { companyName: string; role: AppUser["role"]; tenantId: string };
