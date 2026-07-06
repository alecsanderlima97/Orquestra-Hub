export type FinancialSummary = {
  label: string;
  value: string;
  helper: string;
  tone: "neutral" | "success" | "danger" | "warning";
  tooltip?: string;
};

export type UpcomingPayment = {
  supplier: string;
  store: string;
  dueDate: string;
  amount: string;
  status: "Aberto" | "Vence hoje" | "Atrasado";
};
