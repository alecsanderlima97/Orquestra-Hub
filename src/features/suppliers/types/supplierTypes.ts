export type Supplier = {
  id: string;
  name: string;
  document: string;
  phone: string;
  email?: string;
  contactName?: string;
  address?: string;
  paymentMethod?: "PIX" | "Boleto" | "Transferência" | "Dinheiro" | "Cartão";
  pixKey?: string;
  bank?: string;
  agency?: string;
  account?: string;
  paymentTerms?: string;
  notes?: string;
  openAmount: string;
  status: "Ativo" | "Atenção";
};
