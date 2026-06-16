import type { AssistantContext } from "../types/assistantTypes";

function limitList<T>(list: T[], limit: number) {
  return Array.isArray(list) ? list.slice(0, limit) : [];
}

export function limitAssistantContext(context: AssistantContext) {
  return {
    accounts: limitList(context.accounts, 80),
    fixedExpenses: limitList(context.fixedExpenses, 50),
    purchases: limitList(context.purchases, 60),
    stores: limitList(context.stores, 30),
    suppliers: limitList(context.suppliers, 60),
  };
}

export function buildAssistantSnapshot(context: AssistantContext) {
  const openAccounts = context.accounts.filter((item) => item.status !== "Pago");
  const paidAccounts = context.accounts.filter((item) => item.status === "Pago");
  const overdueAccounts = context.accounts.filter((item) => item.status === "Atrasado");

  return {
    totals: {
      accounts: context.accounts.length,
      fixedExpenses: context.fixedExpenses.length,
      openAccounts: openAccounts.length,
      overdueAccounts: overdueAccounts.length,
      paidAccounts: paidAccounts.length,
      purchases: context.purchases.length,
      stores: context.stores.length,
      suppliers: context.suppliers.length,
    },
    recentData: limitAssistantContext(context),
  };
}
