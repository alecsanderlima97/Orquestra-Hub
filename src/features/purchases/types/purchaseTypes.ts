export type Purchase = {
  id: string;
  invoiceNumber: string;
  description: string;
  supplier: string;
  store: string;
  issueDate: string;
  total: string;
  installments: number;
};
