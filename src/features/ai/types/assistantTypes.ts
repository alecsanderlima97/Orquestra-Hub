import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import type { FixedExpense } from "@/features/fixed-expenses/types/fixedExpenseTypes";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import type { Store } from "@/features/stores/types/storeTypes";
import type { Supplier } from "@/features/suppliers/types/supplierTypes";

export type AssistantContext = {
  accounts: AccountPayable[];
  fixedExpenses: FixedExpense[];
  purchases: Purchase[];
  stores: Store[];
  suppliers: Supplier[];
};

export type AssistantUsage = {
  estimatedCostUsd: number;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};
