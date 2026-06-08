import type { FinancialSummary, UpcomingPayment } from "../types/dashboardTypes";

export const financialSummary: FinancialSummary[] = [
  {
    label: "A pagar no mês",
    value: "R$ 42.850,00",
    helper: "Notas e boletos em aberto",
    tone: "warning",
  },
  {
    label: "Pago no mês",
    value: "R$ 18.400,00",
    helper: "Baixas já confirmadas",
    tone: "success",
  },
  {
    label: "Vencidos",
    value: "R$ 3.200,00",
    helper: "Exigem atenção hoje",
    tone: "danger",
  },
  {
    label: "Fornecedores ativos",
    value: "27",
    helper: "Com compras lançadas",
    tone: "neutral",
  },
];

export const upcomingPayments: UpcomingPayment[] = [
  {
    supplier: "Mister Multimarcas",
    store: "Loja de Baixo",
    dueDate: "10/06/2026",
    amount: "R$ 5.000,00",
    status: "Aberto",
  },
  {
    supplier: "Mister Conceito",
    store: "Loja de Cima",
    dueDate: "08/06/2026",
    amount: "R$ 2.800,00",
    status: "Vence hoje",
  },
  {
    supplier: "Fornecedor Moda Sul",
    store: "Loja de Baixo",
    dueDate: "05/06/2026",
    amount: "R$ 3.200,00",
    status: "Atrasado",
  },
];
