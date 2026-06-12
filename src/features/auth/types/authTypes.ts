export type AppUser = {
  email: string;
  id: string;
  name: string;
  role: "Dono" | "Financeiro" | "Consulta";
  tenantId: string;
  companyName: string;
};

export type CompanyMembership = { companyName: string; role: AppUser["role"]; tenantId: string };
