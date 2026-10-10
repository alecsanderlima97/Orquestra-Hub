import type { PurchaseAttachment } from "@/features/purchases/types/purchaseTypes";

export type AccountPayable = {
  id: string;
  supplier: string;
  store: string;
  dueDate: string;
  amount: string;
  boletoAttachment?: PurchaseAttachment | null;
  categoryColor?: string;
  categoryId?: string;
  categoryName?: string;
  installment: string;
  invoiceNumber?: string;
  dailyInterestAmount?: string;
  dailyInterestPercent?: string;
  lateFeeAmount?: string;
  lateFeePercent?: string;
  protestAfterDays?: string;
  paidAt?: string;
  purchaseId?: string;
  receiptName?: string;
  receiptPath?: string;
  receiptUrl?: string;
  status: "Aberto" | "Pago" | "Atrasado";
  fixedExpenseId?: string;
  referenceMonth?: string;
};
