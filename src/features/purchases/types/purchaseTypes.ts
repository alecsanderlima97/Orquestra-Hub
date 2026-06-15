export type Purchase = {
  id: string;
  invoiceNumber: string;
  description: string;
  supplier: string;
  store: string;
  issueDate: string;
  total: string;
  installments: number;
  invoiceAttachment?: PurchaseAttachment | null;
  boletoAttachments?: PurchaseAttachment[];
};

export type PurchaseAttachment = {
  name: string;
  type: string;
  size: number;
  url: string;
  path?: string;
};
