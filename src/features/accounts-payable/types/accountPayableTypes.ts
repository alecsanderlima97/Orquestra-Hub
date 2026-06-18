export type AccountPayable = {
  id: string;
  supplier: string;
  store: string;
  dueDate: string;
  amount: string;
  interestAmount?: string;
  installment: string;
  lateFeeAmount?: string;
  paidAt?: string;
  receiptName?: string;
  receiptPath?: string;
  receiptUrl?: string;
  status: "Aberto" | "Pago" | "Atrasado";
  fixedExpenseId?: string;
  referenceMonth?: string;
};
