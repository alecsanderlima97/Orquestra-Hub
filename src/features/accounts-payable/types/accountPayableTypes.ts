export type AccountPayable = {
  id: string;
  supplier: string;
  store: string;
  dueDate: string;
  amount: string;
  installment: string;
  status: "Aberto" | "Pago" | "Atrasado";
};
