export type AccountPayable = {
  id: string;
  supplier: string;
  store: string;
  dueDate: string;
  amount: string;
  installment: string;
  paidAt?: string;
  receiptName?: string;
  status: "Aberto" | "Pago" | "Atrasado";
};
