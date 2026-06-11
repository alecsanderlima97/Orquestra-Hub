import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import type { Store } from "@/features/stores/types/storeTypes";
import type { Supplier } from "@/features/suppliers/types/supplierTypes";

export const stores: Store[] = [
  {
    id: "loja-baixo",
    name: "Loja de Baixo",
    manager: "Equipe principal",
    monthlyGoal: "R$ 85.000,00",
    balance: "R$ 18.750,00",
  },
  {
    id: "loja-cima",
    name: "Loja de Cima",
    manager: "Equipe apoio",
    monthlyGoal: "R$ 62.000,00",
    balance: "R$ 12.420,00",
  },
];

export const suppliers: Supplier[] = [
  {
    id: "mister-multimarcas",
    name: "Mister Multimarcas",
    document: "12.345.678/0001-90",
    phone: "(11) 98888-1020",
    openAmount: "R$ 15.000,00",
    status: "Ativo",
  },
  {
    id: "mister-conceito",
    name: "Mister Conceito",
    document: "98.765.432/0001-10",
    phone: "(11) 97777-3030",
    openAmount: "R$ 7.800,00",
    status: "Ativo",
  },
  {
    id: "moda-sul",
    name: "Fornecedor Moda Sul",
    document: "23.456.789/0001-11",
    phone: "(47) 96666-4040",
    openAmount: "R$ 3.200,00",
    status: "Atenção",
  },
];

export const purchases: Purchase[] = [
  {
    id: "nf-1003",
    invoiceNumber: "NF 1003",
    description: "Vestidos, conjuntos e acessórios femininos",
    supplier: "Mister Multimarcas",
    store: "Loja de Baixo",
    issueDate: "02/06/2026",
    total: "R$ 15.000,00",
    installments: 3,
  },
  {
    id: "nf-884",
    invoiceNumber: "NF 884",
    description: "Calças jeans, blusas e peças básicas",
    supplier: "Mister Conceito",
    store: "Loja de Cima",
    issueDate: "04/06/2026",
    total: "R$ 7.800,00",
    installments: 2,
  },
];

export const accountsPayable: AccountPayable[] = [
  {
    id: "bol-1003-1",
    supplier: "Mister Multimarcas",
    store: "Loja de Baixo",
    dueDate: "10/06/2026",
    amount: "R$ 5.000,00",
    installment: "1/3",
    status: "Aberto",
  },
  {
    id: "bol-884-1",
    supplier: "Mister Conceito",
    store: "Loja de Cima",
    dueDate: "08/06/2026",
    amount: "R$ 3.900,00",
    installment: "1/2",
    status: "Pago",
  },
  {
    id: "bol-sul-1",
    supplier: "Fornecedor Moda Sul",
    store: "Loja de Baixo",
    dueDate: "05/06/2026",
    amount: "R$ 3.200,00",
    installment: "1/1",
    status: "Atrasado",
  },
];
