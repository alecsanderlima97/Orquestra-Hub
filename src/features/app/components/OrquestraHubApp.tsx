"use client";

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Plus, X } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { EditModal, type EditField } from "@/components/ui/EditModal";
import { FormAlert } from "@/components/ui/FormAlert";
import { Section } from "@/components/ui/Section";
import { TextField } from "@/components/ui/TextField";
import { AccountsPayableFilters } from "@/features/accounts-payable/components/AccountsPayableFilters";
import type { AccountFilters } from "@/features/accounts-payable/components/AccountsPayableFilters";
import { AccountsPayableExport } from "@/features/accounts-payable/components/AccountsPayableExport";
import { AccountsPayableSummary } from "@/features/accounts-payable/components/AccountsPayableSummary";
import type { AccountsPayableSummaryItem } from "@/features/accounts-payable/components/AccountsPayableSummary";
import { AccountsPayableTable } from "@/features/accounts-payable/components/AccountsPayableTable";
import { PaymentConfirmModal } from "@/features/accounts-payable/components/PaymentConfirmModal";
import { createAccountPayable, deleteAccountPayable, listAccountsByFixedExpense, listAccountsPayable, markAccountAsPaid, updateAccountPayable } from "@/features/accounts-payable/services/accountPayableService";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import { PlatformAdminPanel } from "@/features/admin/components/PlatformAdminPanel";
import { isPlatformAdmin } from "@/features/admin/services/platformAdminService";
import { FinancialAssistant } from "@/features/ai/components/FinancialAssistant";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { completeGoogleOnboarding, listenAuth, listUserCompanies, logoutUser, touchTenantPresence, verifyCurrentPassword } from "@/features/auth/services/authService";
import type { AppUser } from "@/features/auth/types/authTypes";
import type { CompanyMembership } from "@/features/auth/types/authTypes";
import { AuditPanel } from "@/features/audit/components/AuditPanel";
import { BackupPanel } from "@/features/backup/components/BackupPanel";
import { restoreBackup, type BackupPayload, type BackupRestoreMode } from "@/features/backup/services/backupRestoreService";
import { listAuditLogs, recordAudit } from "@/features/audit/services/auditService";
import type { AuditLog } from "@/features/audit/types/auditTypes";
import { MonthlyCashFlow } from "@/features/dashboard/components/MonthlyCashFlow";
import { CompaniesPanel } from "@/features/companies/components/CompaniesPanel";
import { createCompany } from "@/features/companies/services/companyService";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard";
import { FinancialAlertsPanel } from "@/features/dashboard/components/FinancialAlertsPanel";
import { buildFinancialAlerts, type FinancialAlert } from "@/features/dashboard/utils/financialAlerts";
import type { FinancialSummary } from "@/features/dashboard/types/dashboardTypes";
import { FixedExpensesPanel, type FixedExpenseForm } from "@/features/fixed-expenses/components/FixedExpensesPanel";
import { createFixedExpense, deactivateFixedExpense, listFixedExpenses, updateFixedExpense } from "@/features/fixed-expenses/services/fixedExpenseService";
import type { FixedExpense } from "@/features/fixed-expenses/types/fixedExpenseTypes";
import { createFinancialCategory, listFinancialCategories } from "@/features/financial-categories/services/financialCategoryService";
import type { FinancialCategory } from "@/features/financial-categories/types/financialCategoryTypes";
import { PurchaseForm } from "@/features/purchases/components/PurchaseForm";
import type { PurchaseFormState } from "@/features/purchases/components/PurchaseForm";
import { PurchasesTable } from "@/features/purchases/components/PurchasesTable";
import { createPurchaseWithAccounts, listPurchases, updatePurchase } from "@/features/purchases/services/purchaseService";
import { deletePurchaseAttachment, uploadPurchaseAttachment } from "@/features/purchases/services/purchaseAttachmentService";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import type { PurchaseAttachment } from "@/features/purchases/types/purchaseTypes";
import { FinancialReports } from "@/features/reports/components/FinancialReports";
import { PrivacyPanel } from "@/features/privacy/components/PrivacyPanel";
import { getPlanRules } from "@/features/plans/planRules";
import { UserProfile } from "@/features/profile/components/UserProfile";
import { updateCompanyName, updateUserProfile } from "@/features/profile/services/profileService";
import { SystemSettings } from "@/features/settings/components/SystemSettings";
import { FirstAccessOnboarding } from "@/features/onboarding/components/FirstAccessOnboarding";
import { GuideAssistant } from "@/features/onboarding/components/GuideAssistant";
import { StoreForm } from "@/features/stores/components/StoreForm";
import type { StoreFormState } from "@/features/stores/components/StoreForm";
import { StoresPanel } from "@/features/stores/components/StoresPanel";
import { createStore, listStores, updateStore } from "@/features/stores/services/storeService";
import type { Store } from "@/features/stores/types/storeTypes";
import { UsersPanel } from "@/features/users/components/UsersPanel";
import { listTenantUsers, updateTenantUserRole } from "@/features/users/services/userService";
import { cancelInvite, createInvite, listInvites, type Invite } from "@/features/users/services/inviteService";
import { canManageUsers, canWrite as roleCanWrite, wouldRemoveLastOwner } from "@/features/users/utils/accessRules";
import { SuppliersTable } from "@/features/suppliers/components/SuppliersTable";
import { createSupplier, deleteSupplier, listSuppliers, updateSupplier } from "@/features/suppliers/services/supplierService";
import type { Supplier } from "@/features/suppliers/types/supplierTypes";
import { accountsPayable, fixedExpenses as demoFixedExpenses, purchases, stores, suppliers } from "@/lib/data/mockData";
import { firebaseReady } from "@/lib/firebase/config";
import { compareDateBR, formatCnpj, formatPhone, nowDateTimeBR, parseBRL, parseDateBR, todaySaoPaulo, toTitleCaseBR } from "@/lib/formatters/br";
import { defaultTenantId as legacyTenantId } from "@/lib/tenant/tenant";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
const demoUserId = "demo-user";
const salesWhatsapp = (process.env.NEXT_PUBLIC_SALES_WHATSAPP || "5515998478705").replace(/\D/g, "");
const subscriptionGraceDays = 5;
type EditTarget = { kind: "store"; item: Store } | { kind: "supplier"; item: Supplier } | { kind: "purchase"; item: Purchase } | { kind: "account"; item: AccountPayable } | { kind: "fixedExpense"; item: FixedExpense };

function CollapsibleSettingsBlock({ children, defaultOpen = false, description, storageKey, title }: { children: ReactNode; defaultOpen?: boolean; description: string; storageKey: string; title: string }) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return defaultOpen;
    const saved = window.localStorage.getItem(storageKey);
    return saved ? saved === "open" : defaultOpen;
  });

  function toggle() {
    setOpen((current) => {
      const next = !current;
      window.localStorage.setItem(storageKey, next ? "open" : "closed");
      return next;
    });
  }

  return (
    <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition hover:bg-slate-50"
        onClick={toggle}
        title={open ? "Ocultar esta seção" : "Mostrar esta seção"}
        type="button"
      >
        <span>
          <strong className="block text-base text-slate-950">{title}</strong>
          <span className="mt-1 block text-sm text-slate-500">{description}</span>
        </span>
        <ChevronDown className={`shrink-0 text-slate-500 transition ${open ? "rotate-180" : ""}`} size={20} />
      </button>
      {open ? <div className="border-t border-slate-200 p-5">{children}</div> : null}
    </section>
  );
}

function parseMoney(value: string) {
  return parseBRL(value);
}

function addMonths(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month - 1 + months, day);
  return next.toLocaleDateString("pt-BR");
}

function accountDueTime(dueDate: string) {
  return dueDate.includes("-") ? new Date(`${dueDate}T00:00:00`).getTime() : parseDateBR(dueDate).getTime();
}

function dateInputToBR(date: string) {
  if (!date.includes("-")) return date;
  const [year, month, day] = date.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR");
}

function daysUntilInputDate(date: string) {
  if (!date) return null;
  const dueTime = accountDueTime(dateInputToBR(date));
  return Math.round((dueTime - todaySaoPaulo().getTime()) / 86_400_000);
}

function businessDaysAfterInputDate(date: string) {
  if (!date) return 0;
  const due = parseDateBR(dateInputToBR(date));
  const today = todaySaoPaulo();
  if (due.getTime() >= today.getTime()) return 0;
  let count = 0;
  const current = new Date(due);
  current.setDate(current.getDate() + 1);
  while (current.getTime() <= today.getTime()) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count += 1;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

function isBlockedByBillingDate(user: AppUser) {
  return businessDaysAfterInputDate(user.nextBillingDate || "") > subscriptionGraceDays;
}

function fixedExpenseAccountForMonth(expense: FixedExpense, referenceDate = todaySaoPaulo()): Omit<AccountPayable, "id"> {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const dueDate = new Date(year, month, Math.min(expense.dueDay, lastDay)).toLocaleDateString("pt-BR");
  const referenceMonth = `${year}-${String(month + 1).padStart(2, "0")}`;
  return {
    amount: expense.amount,
    categoryName: expense.category,
    dueDate,
    fixedExpenseId: expense.id,
    installment: "Mensal",
    referenceMonth,
    status: "Aberto",
    store: expense.store,
    supplier: expense.payee,
  };
}

function sameName(a: string, b: string) {
  return a.trim().toLocaleLowerCase("pt-BR") === b.trim().toLocaleLowerCase("pt-BR");
}

function SubscriptionBlocked({ user }: { user: AppUser }) {
  const status = user.subscriptionStatus || "ativo";
  const message = `Olá, preciso regularizar a assinatura do Orquestra Hub. Empresa: ${user.companyName}. Status: ${status}.`;
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <section className="w-full max-w-lg rounded-lg border border-amber-200 bg-white p-7 text-center shadow-xl">
        <h1 className="text-2xl font-bold text-slate-950">Acesso pendente</h1>
        <p className="mt-3 text-slate-600">Sua assinatura está com status <strong>{status}</strong>. Regularize para continuar usando o sistema.</p>
        <a className="mt-5 inline-flex h-11 items-center justify-center rounded-md bg-slate-950 px-5 text-sm font-semibold text-white" href={`https://wa.me/${salesWhatsapp}?text=${encodeURIComponent(message)}`} target="_blank">Regularizar pelo WhatsApp</a>
      </section>
    </main>
  );
}

export function OrquestraHubApp() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const defaultTenantId = user?.tenantId || legacyTenantId;
  const [authChecked, setAuthChecked] = useState(!firebaseReady);
  const [storeList, setStoreList] = useState<Store[]>([]);
  const [supplierList, setSupplierList] = useState<Supplier[]>([]);
  const [purchaseList, setPurchaseList] = useState<Purchase[]>([]);
  const [accountList, setAccountList] = useState<AccountPayable[]>([]);
  const [financialCategories, setFinancialCategories] = useState<FinancialCategory[]>([]);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [hasSessionChanges, setHasSessionChanges] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tenantUsers, setTenantUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [fixedExpenseForm, setFixedExpenseForm] = useState<FixedExpenseForm>({ alertDays: "5", amount: "R$ 0,00", category: "", dueDay: "10", name: "", payee: "", store: stores[0]?.name || "" });
  const [accountFilters, setAccountFilters] = useState<AccountFilters>({ status: "Todos", store: "Todas", supplier: "Todos" });
  const [paymentToConfirm, setPaymentToConfirm] = useState<AccountPayable | null>(null);
  const [paymentDateTime, setPaymentDateTime] = useState("");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [formErrors, setFormErrors] = useState({ category: "", fixedExpense: "", purchase: "", store: "", supplier: "" });
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [boletoFiles, setBoletoFiles] = useState<File[]>([]);
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierForm, setSupplierForm] = useState({ account: "", address: "", agency: "", bank: "", contactName: "", document: "", email: "", name: "", notes: "", paymentMethod: "PIX" as NonNullable<Supplier["paymentMethod"]>, paymentTerms: "", phone: "", pixKey: "" });
  const [storeForm, setStoreForm] = useState<StoreFormState>({
    address: "",
    balance: "R$ 0,00",
    cep: "",
    city: "",
    manager: "",
    mapsUrl: "",
    monthlyGoal: "R$ 0,00",
    name: "",
    phone: "",
    state: "",
  });
  const [storePhoto, setStorePhoto] = useState<File | null>(null);
  const [showStoreForm, setShowStoreForm] = useState(false);
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [subscriptionPromptDismissedKey, setSubscriptionPromptDismissedKey] = useState("");
  const [newPurchaseCategoryName, setNewPurchaseCategoryName] = useState("");
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>({
    categoryId: "",
    dailyInterestAmount: "R$ 0,00",
    dailyInterestPercent: "",
    description: "",
    dueDate: "2026-06-10",
    installments: "3",
    invoiceNumber: "NF 1003",
    issueDate: "2026-06-08",
    lateFeeAmount: "R$ 0,00",
    lateFeePercent: "",
    protestAfterDays: "",
    store: "Loja de Baixo",
    supplier: "Mister Multimarcas",
    total: "R$ 15.000,00",
  });

  useEffect(() => {
    const accessTimeout = window.setTimeout(() => setAuthChecked(true), 9000);
    const unsubscribe = listenAuth((currentUser) => {
      setUser(currentUser);
      if (currentUser) void listUserCompanies(currentUser.id).then((memberships) => {
        setCompanies(memberships);
        const activeCompany = memberships.find((item) => item.tenantId === currentUser.tenantId) || memberships[0];
        if (activeCompany) {
          setUser((activeUser) => activeUser ? { ...activeUser, ...activeCompany } : activeUser);
          window.localStorage.setItem("orquestra-user", JSON.stringify({ ...currentUser, ...activeCompany }));
        }
      }).catch(() => setCompanies([]));
      setAuthChecked(true);
    });
    return () => {
      window.clearTimeout(accessTimeout);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!user?.tenantId || user.id === demoUserId || isPlatformAdmin(user)) return;
    void touchTenantPresence(user.tenantId);
    const timer = window.setInterval(() => void touchTenantPresence(user.tenantId), 60_000);
    return () => window.clearInterval(timer);
  }, [user]);

  useEffect(() => {
    if (user?.id !== demoUserId) return;
    const demoTimer = window.setTimeout(() => {
      setStoreList(stores);
      setSupplierList(suppliers);
      setPurchaseList(purchases);
      setAccountList(accountsPayable);
      setFixedExpenses(demoFixedExpenses);
    }, 0);
    return () => window.clearTimeout(demoTimer);
  }, [user]);

  useEffect(() => {
    const firstStore = storeList[0]?.name || "";
    const firstSupplier = supplierList[0]?.name || "";
    const timer = window.setTimeout(() => {
      setPurchaseForm((form) => ({
        ...form,
        store: storeList.some((store) => store.name === form.store) ? form.store : firstStore,
        supplier: supplierList.some((supplier) => supplier.name === form.supplier) ? form.supplier : firstSupplier,
      }));
      setFixedExpenseForm((form) => ({
        ...form,
        store: storeList.some((store) => store.name === form.store) ? form.store : firstStore,
      }));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [storeList, supplierList]);

  const userId = user?.id;
  const userTenantId = user?.tenantId;
  const userRole = user?.role;
  const userCompanyName = user?.companyName;

  useEffect(() => {
    if (!firebaseReady || !userId || userId === demoUserId) return;
    const tenantId = userTenantId || legacyTenantId;
    const canManage = userRole ? canManageUsers(userRole) : false;
    const companyName = userCompanyName || "Orquestra Hub";
    let cancelled = false;
    async function loadFirebaseData() {
      try {
        const [firebaseStores, firebaseSuppliers, firebaseAccounts, firebasePurchases, firebaseFixedExpenses, firebaseCategories, firebaseAuditLogs, firebaseUsers, firebaseInvites] = await Promise.all([
          listStores(tenantId),
          listSuppliers(tenantId),
          listAccountsPayable(tenantId),
          listPurchases(tenantId),
          listFixedExpenses(tenantId),
          listFinancialCategories(tenantId),
          canManage ? listAuditLogs(tenantId) : Promise.resolve([]),
          canManage ? listTenantUsers(tenantId, companyName) : Promise.resolve([]),
          canManage ? listInvites(tenantId) : Promise.resolve([]),
        ]);
        if (cancelled) return;
        const today = todaySaoPaulo();
        const currentReferenceMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
        const generatedAccounts = await Promise.all(
          firebaseFixedExpenses
            .filter((expense) => expense.active !== false)
            .filter((expense) => !firebaseAccounts.some((account) => account.fixedExpenseId === expense.id && account.referenceMonth === currentReferenceMonth))
            .map(async (expense) => {
              const account = fixedExpenseAccountForMonth(expense, today);
              const saved = await createAccountPayable(tenantId, account);
              return { id: saved.id, ...account };
            }),
        );
        if (cancelled) return;
        setStoreList(firebaseStores);
        setSupplierList(firebaseSuppliers);
        setAccountList([...generatedAccounts, ...firebaseAccounts]);
        setPurchaseList(firebasePurchases);
        setFixedExpenses(firebaseFixedExpenses);
        setFinancialCategories(firebaseCategories);
        setAuditLogs(firebaseAuditLogs);
        setTenantUsers(firebaseUsers);
        setInvites(firebaseInvites);
      } catch {
        setFormErrors((errors) => ({ ...errors, supplier: "Não foi possível carregar dados do Firebase." }));
      }
    }
    void loadFirebaseData();
    return () => { cancelled = true; };
  }, [userId, userTenantId, userRole, userCompanyName]);

  const todayTime = todaySaoPaulo().getTime();
  const today = todaySaoPaulo();
  const endOfCurrentMonthTime = new Date(today.getFullYear(), today.getMonth() + 1, 0).getTime();
  const dueTodayTotal = accountList.filter((item) => item.status !== "Pago" && accountDueTime(item.dueDate) === todayTime).reduce((total, item) => total + parseMoney(item.amount), 0);
  const upcomingMonthTotal = accountList.filter((item) => item.status !== "Pago" && accountDueTime(item.dueDate) > todayTime && accountDueTime(item.dueDate) <= endOfCurrentMonthTime).reduce((total, item) => total + parseMoney(item.amount), 0);
  const futurePlannedTotal = accountList.filter((item) => item.status !== "Pago" && accountDueTime(item.dueDate) > endOfCurrentMonthTime).reduce((total, item) => total + parseMoney(item.amount), 0);
  const paidTotal = accountList.filter((item) => item.status === "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const totalOpenDebt = accountList.filter((item) => item.status !== "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const openDebtWithoutFixedExpenses = accountList.filter((item) => item.status !== "Pago" && !item.fixedExpenseId).reduce((total, item) => total + parseMoney(item.amount), 0);
  const fixedMonthlyTotal = fixedExpenses.filter((expense) => expense.active !== false).reduce((total, expense) => total + parseMoney(expense.amount), 0);
  const totalOpenDebtWithFixed = openDebtWithoutFixedExpenses + fixedMonthlyTotal;
  const todayPaymentCount = accountList.filter((item) => item.status !== "Pago" && accountDueTime(item.dueDate) === todayTime).length;
  const nextSevenDaysTime = todayTime + 7 * 86_400_000;
  const nextSevenDaysAccounts = accountList.filter((item) => item.status !== "Pago" && accountDueTime(item.dueDate) >= todayTime && accountDueTime(item.dueDate) <= nextSevenDaysTime);
  const nextSevenDaysTotal = nextSevenDaysAccounts.reduce((total, item) => total + parseMoney(item.amount), 0);
  const topSuppliersToPay = Object.values(accountList.filter((item) => item.status !== "Pago").reduce<Record<string, { name: string; total: number; count: number }>>((result, item) => {
    const current = result[item.supplier] || { count: 0, name: item.supplier, total: 0 };
    current.count += 1;
    current.total += parseMoney(item.amount);
    result[item.supplier] = current;
    return result;
  }, {})).toSorted((a, b) => b.total - a.total).slice(0, 5);
  const storeOpenSummary = Object.values(accountList.filter((item) => item.status !== "Pago").reduce<Record<string, { name: string; total: number; count: number }>>((result, item) => {
    const current = result[item.store] || { count: 0, name: item.store, total: 0 };
    current.count += 1;
    current.total += parseMoney(item.amount);
    result[item.store] = current;
    return result;
  }, {})).toSorted((a, b) => b.total - a.total);
  const overdueTotal = accountList.filter((item) => item.status !== "Pago" && accountDueTime(item.dueDate) < todayTime).reduce((total, item) => total + parseMoney(item.amount), 0);
  const financialAlerts = buildFinancialAlerts(accountList, fixedExpenses);
  const filteredAccounts = accountList
    .filter((account) => {
      const statusMatch = accountFilters.status === "Todos" || account.status === accountFilters.status;
      const storeMatch = accountFilters.store === "Todas" || account.store === accountFilters.store;
      const supplierMatch = accountFilters.supplier === "Todos" || account.supplier === accountFilters.supplier;
      return statusMatch && storeMatch && supplierMatch;
    })
    .toSorted((a, b) => compareDateBR(a.dueDate, b.dueDate));
  const filteredOpenTotal = filteredAccounts.filter((item) => item.status === "Aberto").reduce((total, item) => total + parseMoney(item.amount), 0);
  const filteredPaidTotal = filteredAccounts.filter((item) => item.status === "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const filteredOverdueTotal = filteredAccounts.filter((item) => item.status === "Atrasado").reduce((total, item) => total + parseMoney(item.amount), 0);
  const filteredTotal = filteredAccounts.reduce((total, item) => total + parseMoney(item.amount), 0);
  const filteredSuppliers = supplierList.filter((supplier) => {
    const search = supplierSearch.toLocaleLowerCase("pt-BR").trim();
    if (!search) return true;
    return [supplier.name, supplier.document, supplier.phone].some((value) => value.toLocaleLowerCase("pt-BR").includes(search));
  });
  const filteredPurchases = purchaseList.filter((purchase) => {
    const search = purchaseSearch.toLocaleLowerCase("pt-BR").trim();
    if (!search) return true;
    return [purchase.invoiceNumber, purchase.description, purchase.supplier, purchase.store, purchase.issueDate].some((value) =>
      value.toLocaleLowerCase("pt-BR").includes(search),
    );
  });

  const summary = useMemo<FinancialSummary[]>(
    () => [
      { helper: `${todayPaymentCount} vencimento(s) hoje`, label: "A pagar hoje", tone: "warning", tooltip: "Soma somente contas não pagas com vencimento na data de hoje.", value: money.format(dueTodayTotal) },
      { helper: "Até o fim do mês", label: "A vencer no mês", tone: "neutral", tooltip: "Soma contas não pagas que ainda vencem dentro do mês atual.", value: money.format(upcomingMonthTotal) },
      { helper: "Depois deste mês", label: "Futuro previsto", tone: "neutral", tooltip: "Soma contas não pagas com vencimento depois do mês atual.", value: money.format(futurePlannedTotal) },
      { helper: "Baixas confirmadas", label: "Pago", tone: "success", tooltip: "Soma tudo que já foi marcado como pago desde o início dos lançamentos.", value: money.format(paidTotal) },
      { helper: "Exigem atenção", label: "Vencidos", tone: "danger", tooltip: "Soma contas vencidas e ainda não pagas.", value: money.format(overdueTotal) },
    ],
    [dueTodayTotal, futurePlannedTotal, overdueTotal, paidTotal, todayPaymentCount, upcomingMonthTotal],
  );
  const accountSummary = useMemo<AccountsPayableSummaryItem[]>(
    () => [
      { helper: "Resultado da busca atual", label: "Total filtrado", value: money.format(filteredTotal) },
      { helper: `${filteredAccounts.length} boleto(s)`, label: "Quantidade", value: String(filteredAccounts.length) },
      { helper: "Ainda pendente", label: "Em aberto", value: money.format(filteredOpenTotal) },
      { helper: `Pago: ${money.format(filteredPaidTotal)}`, label: "Atrasado", value: money.format(filteredOverdueTotal) },
    ],
    [filteredAccounts.length, filteredOpenTotal, filteredOverdueTotal, filteredPaidTotal, filteredTotal],
  );

  const backupData = { accounts: accountList, auditLogs, financialCategories, fixedExpenses, purchases: purchaseList, stores: storeList, suppliers: supplierList };

  function downloadBackupFile() {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), version: 1, ...backupData }, null, 2);
    const url = URL.createObjectURL(new Blob([payload], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup-orquestra-hub-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function recordChange(tenantId: string, currentUser: AppUser | null, action: Parameters<typeof recordAudit>[2], entity: string, entityId: string) {
    setHasSessionChanges(true);
    await recordAudit(tenantId, currentUser, action, entity, entityId);
  }

  async function addSupplier() {
    if (!user) {
      setFormErrors((errors) => ({ ...errors, supplier: "Entre novamente antes de cadastrar um fornecedor." }));
      return;
    }
    if (user.id !== demoUserId && !firebaseReady) {
      setFormErrors((errors) => ({ ...errors, supplier: "Banco de dados ainda não conectado. Aguarde alguns segundos e tente novamente." }));
      return;
    }
    if (!supplierForm.name.trim()) {
      setFormErrors((errors) => ({ ...errors, supplier: "Informe o nome do fornecedor." }));
      return;
    }
    if (supplierForm.document && formatCnpj(supplierForm.document).length < 18) {
      setFormErrors((errors) => ({ ...errors, supplier: "Informe um CNPJ completo no formato 00.000.000/0000-00." }));
      return;
    }
    const newSupplier: Omit<Supplier, "id"> = {
      document: formatCnpj(supplierForm.document || "00000000000000"),
      account: supplierForm.account,
      address: toTitleCaseBR(supplierForm.address),
      agency: supplierForm.agency,
      bank: toTitleCaseBR(supplierForm.bank),
      contactName: toTitleCaseBR(supplierForm.contactName),
      email: supplierForm.email.trim().toLowerCase(),
      name: toTitleCaseBR(supplierForm.name.trim()),
      notes: toTitleCaseBR(supplierForm.notes),
      openAmount: "R$ 0,00",
      paymentMethod: supplierForm.paymentMethod,
      paymentTerms: toTitleCaseBR(supplierForm.paymentTerms),
      phone: formatPhone(supplierForm.phone || "00000000000"),
      pixKey: supplierForm.pixKey.trim(),
      status: "Ativo",
    };
    try {
      const persist = user.id !== demoUserId;
      const created = persist ? await createSupplier(defaultTenantId, newSupplier) : null;
      if (persist && !created) throw new Error("O fornecedor não retornou confirmação de salvamento.");
      setSupplierList((current) => [{ id: created?.id || crypto.randomUUID(), ...newSupplier }, ...current]);
      setPurchaseForm((form) => ({ ...form, supplier: newSupplier.name }));
      setSupplierForm({ account: "", address: "", agency: "", bank: "", contactName: "", document: "", email: "", name: "", notes: "", paymentMethod: "PIX", paymentTerms: "", phone: "", pixKey: "" });
      setFormErrors((errors) => ({ ...errors, supplier: "" }));
      await recordChange(defaultTenantId, user, "criou", "fornecedor", created?.id || "demo");
      setShowSupplierForm(false);
    } catch {
      setFormErrors((errors) => ({ ...errors, supplier: "Não foi possível salvar o fornecedor. Verifique sua conexão e tente novamente." }));
    }
  }

  async function removeSupplier(supplier: Supplier) {
    const linked = purchaseList.some((item) => item.supplier === supplier.name) || accountList.some((item) => item.supplier === supplier.name);
    if (linked) { setFormErrors((errors) => ({ ...errors, supplier: "Este fornecedor possui compras ou contas vinculadas e não pode ser excluído." })); return; }
    if (!window.confirm(`Excluir o fornecedor ${supplier.name}?`)) return;
    if (firebaseReady && user?.id !== demoUserId) await deleteSupplier(defaultTenantId, supplier.id);
    setSupplierList((items) => items.filter((item) => item.id !== supplier.id));
    setFormErrors((errors) => ({ ...errors, supplier: "" }));
    await recordChange(defaultTenantId, user, "excluiu", "fornecedor", supplier.id);
  }

  async function addStore() {
    if (!user) {
      setFormErrors((errors) => ({ ...errors, store: "Entre novamente antes de cadastrar uma loja." }));
      return;
    }
    if (user.id !== demoUserId && !firebaseReady) {
      setFormErrors((errors) => ({ ...errors, store: "Banco de dados ainda não conectado. Aguarde alguns segundos e tente novamente." }));
      return;
    }
    const currentPlan = getPlanRules(user.planId);
    if (storeList.length >= currentPlan.storeLimit) {
      setFormErrors((errors) => ({ ...errors, store: `Seu ${currentPlan.label} permite cadastrar até ${currentPlan.storeLimit} unidade(s).` }));
      return;
    }
    if (!storeForm.name.trim()) {
      setFormErrors((errors) => ({ ...errors, store: "Informe o nome da loja." }));
      return;
    }
    if (parseMoney(storeForm.monthlyGoal) <= 0) {
      setFormErrors((errors) => ({ ...errors, store: "Informe uma meta mensal maior que R$ 0,00." }));
      return;
    }
    const newStore: Omit<Store, "id"> = {
      address: toTitleCaseBR(storeForm.address),
      balance: storeForm.balance || "R$ 0,00",
      cep: storeForm.cep,
      city: toTitleCaseBR(storeForm.city),
      manager: toTitleCaseBR(storeForm.manager || "Sem Responsável"),
      mapsUrl: storeForm.mapsUrl,
      monthlyGoal: storeForm.monthlyGoal || "R$ 0,00",
      name: toTitleCaseBR(storeForm.name.trim()),
      phone: storeForm.phone,
      state: storeForm.state.toUpperCase(),
    };
    try {
      const persist = user.id !== demoUserId;
      const created = persist ? await createStore(defaultTenantId, newStore) : null;
      if (persist && !created) throw new Error("A loja não retornou confirmação de salvamento.");
      const storeId = created?.id || crypto.randomUUID();
      const photo = storePhoto ? await uploadPurchaseAttachment(defaultTenantId, storeId, "lojas", storePhoto) : null;
      if (created && photo) await updateStore(defaultTenantId, storeId, { photoUrl: photo.url });
      setStoreList((current) => [{ id: storeId, ...newStore, photoUrl: photo?.url }, ...current]);
      setPurchaseForm((form) => ({ ...form, store: newStore.name }));
      setStoreForm({ address: "", balance: "R$ 0,00", cep: "", city: "", manager: "", mapsUrl: "", monthlyGoal: "R$ 0,00", name: "", phone: "", state: "" });
      setStorePhoto(null);
      setFormErrors((errors) => ({ ...errors, store: "" }));
      await recordChange(defaultTenantId, user, "criou", "loja", storeId);
      setShowStoreForm(false);
    } catch {
      setFormErrors((errors) => ({ ...errors, store: "Não foi possível salvar a loja. Verifique sua conexão e tente novamente." }));
    }
  }

  async function addPurchase() {
    if (!user) {
      setFormErrors((errors) => ({ ...errors, purchase: "Entre novamente antes de lançar uma compra." }));
      return;
    }
    if (user.id !== demoUserId && !firebaseReady) {
      setFormErrors((errors) => ({ ...errors, purchase: "Banco de dados ainda não conectado. Aguarde alguns segundos e tente novamente." }));
      return;
    }
    const installments = Math.max(Number(purchaseForm.installments), 1);
    const dailyInterestAmount = parseMoney(purchaseForm.dailyInterestAmount);
    const lateFeeAmount = parseMoney(purchaseForm.lateFeeAmount);
    const total = parseMoney(purchaseForm.total);
    const selectedSupplier = supplierList.find((supplier) => sameName(supplier.name, purchaseForm.supplier));
    const selectedStore = storeList.find((store) => sameName(store.name, purchaseForm.store));
    if (!purchaseForm.supplier || !selectedSupplier) {
      setFormErrors((errors) => ({ ...errors, purchase: "Selecione um fornecedor cadastrado." }));
      return;
    }
    if (!purchaseForm.store || !selectedStore) {
      setFormErrors((errors) => ({ ...errors, purchase: "Selecione uma loja cadastrada." }));
      return;
    }
    if (!purchaseForm.invoiceNumber.trim()) {
      setFormErrors((errors) => ({ ...errors, purchase: "Informe o número da nota." }));
      return;
    }
    if (!purchaseForm.description.trim()) {
      setFormErrors((errors) => ({ ...errors, purchase: "Informe a descrição dos produtos da nota." }));
      return;
    }
    if (total <= 0) {
      setFormErrors((errors) => ({ ...errors, purchase: "Informe um valor total maior que R$ 0,00." }));
      return;
    }
    if (!purchaseForm.issueDate || !purchaseForm.dueDate) {
      setFormErrors((errors) => ({ ...errors, purchase: "Informe a data da compra e o primeiro vencimento." }));
      return;
    }
    if (installments <= 0) {
      setFormErrors((errors) => ({ ...errors, purchase: "Informe pelo menos uma parcela." }));
      return;
    }
    const installmentAmount = total / installments;
    const purchaseId = crypto.randomUUID();
    const selectedCategory = financialCategories.find((category) => category.id === purchaseForm.categoryId);
    const newPurchase: Omit<Purchase, "id"> = {
      description: toTitleCaseBR(purchaseForm.description),
      installments,
      invoiceNumber: purchaseForm.invoiceNumber,
      issueDate: new Date(purchaseForm.issueDate).toLocaleDateString("pt-BR"),
      store: selectedStore.name,
      supplier: selectedSupplier.name,
      total: money.format(total),
    };
    const newAccounts: Omit<AccountPayable, "id">[] = Array.from({ length: installments }, (_, index) => ({
      amount: money.format(installmentAmount),
      categoryColor: selectedCategory?.color,
      categoryId: selectedCategory?.id,
      categoryName: selectedCategory?.name,
      dailyInterestAmount: money.format(dailyInterestAmount),
      dailyInterestPercent: purchaseForm.dailyInterestPercent.trim(),
      dueDate: addMonths(purchaseForm.dueDate, index),
      installment: `${index + 1}/${installments}`,
      lateFeeAmount: money.format(lateFeeAmount),
      lateFeePercent: purchaseForm.lateFeePercent.trim(),
      protestAfterDays: purchaseForm.protestAfterDays.trim(),
      status: "Aberto" as const,
      store: selectedStore.name,
      supplier: selectedSupplier.name,
    }));
    try {
      const persist = firebaseReady && user.id !== demoUserId;
      const saved = persist ? await createPurchaseWithAccounts(defaultTenantId, newPurchase, newAccounts) : null;
      if (persist && !saved) throw new Error("A compra não retornou confirmação de salvamento.");
      const finalId = saved?.purchaseId || purchaseId;
      let attachmentError = false;
      let invoiceAttachment: PurchaseAttachment | undefined;
      let boletoAttachments: PurchaseAttachment[] = [];
      try {
        invoiceAttachment = invoiceFile ? await uploadPurchaseAttachment(defaultTenantId, finalId, "notas-fiscais", invoiceFile) : undefined;
        boletoAttachments = await Promise.all(boletoFiles.map((file) => uploadPurchaseAttachment(defaultTenantId, finalId, "boletos", file)));
      } catch {
        attachmentError = true;
      }
      const attachments = { invoiceAttachment, boletoAttachments };
      if (saved?.purchaseId && (invoiceAttachment || boletoAttachments.length)) await updatePurchase(defaultTenantId, saved.purchaseId, attachments);
      setPurchaseList((current) => [{ id: finalId, ...newPurchase, ...attachments }, ...current]);
      setAccountList((current) => [
        ...newAccounts.map((account, index) => ({ id: saved?.accountIds[index] || `${purchaseId}-${index + 1}`, ...account })),
        ...current,
      ]);
      setInvoiceFile(null);
      setBoletoFiles([]);
      setPurchaseForm((form) => ({ ...form, categoryId: "" }));
      setFormErrors((errors) => ({ ...errors, purchase: attachmentError ? "Compra salva. Alguns anexos não foram enviados; tente anexar novamente pela nota." : "" }));
      if (attachmentError) return;
    } catch {
      setFormErrors((errors) => ({ ...errors, purchase: "A nota foi validada, mas não foi possível salvar os dados ou anexos." }));
      return;
    }
    setFormErrors((errors) => ({ ...errors, purchase: "" }));
    await recordChange(defaultTenantId, user, "criou", "compra", purchaseId);
    setShowPurchaseForm(false);
  }

  async function addFixedExpense() {
    if (!user) {
      setFormErrors((errors) => ({ ...errors, fixedExpense: "Entre novamente antes de cadastrar uma despesa fixa." }));
      return;
    }
    if (user.id !== demoUserId && !firebaseReady) {
      setFormErrors((errors) => ({ ...errors, fixedExpense: "Banco de dados ainda não conectado. Aguarde alguns segundos e tente novamente." }));
      return;
    }
    const amount = parseMoney(fixedExpenseForm.amount);
    const dueDay = Math.min(Math.max(Number(fixedExpenseForm.dueDay), 1), 28);
    if (!fixedExpenseForm.name.trim() || !fixedExpenseForm.payee.trim() || amount <= 0) {
      setFormErrors((errors) => ({ ...errors, fixedExpense: "Informe despesa, favorecido e valor mensal maior que R$ 0,00." }));
      return;
    }
    const expense: Omit<FixedExpense, "id"> = { active: true, alertDays: Math.max(Number(fixedExpenseForm.alertDays), 0), amount: money.format(amount), category: toTitleCaseBR(fixedExpenseForm.category || "Outros"), dueDay, name: toTitleCaseBR(fixedExpenseForm.name), payee: toTitleCaseBR(fixedExpenseForm.payee), store: fixedExpenseForm.store };
    try {
      const persist = user.id !== demoUserId;
      const saved = persist ? await createFixedExpense(defaultTenantId, expense) : null;
      if (persist && !saved) throw new Error("A despesa fixa não retornou confirmação de salvamento.");
      const id = saved?.id || crypto.randomUUID();
      const now = new Date();
      const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay).toLocaleDateString("pt-BR");
      const matchedCategory = financialCategories.find((category) => category.name.toLocaleLowerCase("pt-BR") === expense.category.toLocaleLowerCase("pt-BR"));
      const account: Omit<AccountPayable, "id"> = { amount: expense.amount, categoryColor: matchedCategory?.color, categoryId: matchedCategory?.id, categoryName: expense.category, dueDate, fixedExpenseId: id, installment: "Mensal", referenceMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, status: "Aberto", store: expense.store, supplier: expense.payee };
      const savedAccount = persist ? await createAccountPayable(defaultTenantId, account).catch(() => null) : null;
      setFixedExpenses((items) => [{ id, ...expense }, ...items]);
      if (savedAccount || !persist) setAccountList((items) => [{ id: savedAccount?.id || crypto.randomUUID(), ...account }, ...items]);
      setFixedExpenseForm({ alertDays: "5", amount: "R$ 0,00", category: "", dueDay: "10", name: "", payee: "", store: storeList[0]?.name || "" });
      setFormErrors((errors) => ({ ...errors, fixedExpense: "" }));
      await recordChange(defaultTenantId, user, "criou", "despesa fixa", id);
    } catch {
      setFormErrors((errors) => ({ ...errors, fixedExpense: "Não foi possível salvar a despesa fixa. Verifique sua conexão e tente novamente." }));
    }
  }

  async function addSubscriptionAccount() {
    if (!user?.nextBillingDate) return;
    const plan = getPlanRules(user.planId);
    const dueDate = dateInputToBR(user.nextBillingDate);
    const referenceMonth = `assinatura-${user.nextBillingDate.slice(0, 7)}`;
    const promptKey = `orquestra-subscription-prompt-${user.tenantId}-${user.nextBillingDate}`;
    if (accountList.some((account) => account.supplier === "Orquestra.cs" && account.referenceMonth === referenceMonth)) {
      setSubscriptionPromptDismissedKey(promptKey);
      return;
    }
    const account: Omit<AccountPayable, "id"> = {
      amount: plan.price,
      categoryName: "Sistemas",
      dueDate,
      installment: "Assinatura",
      referenceMonth,
      status: "Aberto",
      store: user.companyName,
      supplier: "Orquestra.cs",
    };
    const saved = user.id !== demoUserId ? await createAccountPayable(defaultTenantId, account) : null;
    setAccountList((items) => [{ id: saved?.id || crypto.randomUUID(), ...account }, ...items]);
    setSubscriptionPromptDismissedKey(promptKey);
    await recordChange(defaultTenantId, user, "criou", "conta", referenceMonth);
  }

  async function addSubscriptionFixedExpense() {
    if (!user?.nextBillingDate) return;
    const plan = getPlanRules(user.planId);
    const promptKey = `orquestra-subscription-prompt-${user.tenantId}-${user.nextBillingDate}`;
    if (fixedExpenses.some((expense) => expense.active !== false && sameName(expense.name, "Sistema Orquestra Hub") && sameName(expense.payee, "Orquestra.cs"))) {
      setSubscriptionPromptDismissedKey(promptKey);
      return;
    }
    const [, , day] = user.nextBillingDate.split("-").map(Number);
    const expense: Omit<FixedExpense, "id"> = {
      active: true,
      alertDays: 5,
      amount: plan.price,
      category: "Sistemas",
      dueDay: Math.min(Math.max(day || 1, 1), 28),
      name: "Sistema Orquestra Hub",
      payee: "Orquestra.cs",
      store: user.companyName,
    };
    const saved = user.id !== demoUserId ? await createFixedExpense(defaultTenantId, expense) : null;
    const id = saved?.id || crypto.randomUUID();
    const dueDate = dateInputToBR(user.nextBillingDate);
    const account: Omit<AccountPayable, "id"> = {
      amount: plan.price,
      categoryName: "Sistemas",
      dueDate,
      fixedExpenseId: id,
      installment: "Mensal",
      referenceMonth: user.nextBillingDate.slice(0, 7),
      status: "Aberto",
      store: user.companyName,
      supplier: "Orquestra.cs",
    };
    const savedAccount = user.id !== demoUserId ? await createAccountPayable(defaultTenantId, account) : null;
    setFixedExpenses((items) => [{ id, ...expense }, ...items]);
    setAccountList((items) => [{ id: savedAccount?.id || crypto.randomUUID(), ...account }, ...items]);
    setSubscriptionPromptDismissedKey(promptKey);
    await recordChange(defaultTenantId, user, "criou", "despesa fixa", id);
  }

  function ignoreSubscriptionPrompt() {
    const promptKey = user?.tenantId && user.nextBillingDate ? `orquestra-subscription-prompt-${user.tenantId}-${user.nextBillingDate}` : "";
    if (promptKey) window.localStorage.setItem(promptKey, "ignored");
    setSubscriptionPromptDismissedKey(promptKey);
  }

  async function addFinancialCategory(category: Omit<FinancialCategory, "id">) {
    if (!user) return null;
    const duplicate = financialCategories.some((item) => item.name.toLocaleLowerCase("pt-BR") === category.name.toLocaleLowerCase("pt-BR"));
    if (duplicate) {
      setFormErrors((errors) => ({ ...errors, category: "Essa categoria já existe." }));
      return null;
    }
    try {
      const persist = firebaseReady && user.id !== demoUserId;
      const saved = persist ? await createFinancialCategory(defaultTenantId, category) : null;
      const id = saved?.id || crypto.randomUUID();
      const created = { id, ...category };
      setFinancialCategories((items) => [created, ...items].toSorted((a, b) => a.name.localeCompare(b.name, "pt-BR")));
      setFormErrors((errors) => ({ ...errors, category: "" }));
      await recordChange(defaultTenantId, user, "criou", "categoria financeira", id);
      return created;
    } catch {
      setFormErrors((errors) => ({ ...errors, category: "Não foi possível salvar a categoria. Tente novamente." }));
      return null;
    }
  }

  async function addPurchaseCategoryFromForm() {
    const name = toTitleCaseBR(newPurchaseCategoryName.trim());
    if (!name) {
      setFormErrors((errors) => ({ ...errors, category: "Informe o nome da categoria." }));
      return;
    }
    const created = await addFinancialCategory({ active: true, color: "#0891b2", name });
    if (!created) return;
    setPurchaseForm((form) => ({ ...form, categoryId: created.id }));
    setNewPurchaseCategoryName("");
  }

  async function removeFixedExpense(expense: FixedExpense) {
    if (!window.confirm(`Excluir a recorrência ${expense.name}? Contas pagas e vencidas serão mantidas. Lançamentos futuros em aberto desta recorrência serão removidos do financeiro.`)) return;
    const today = todaySaoPaulo().getTime();
    const sourceAccounts = firebaseReady && user?.id !== demoUserId
      ? await listAccountsByFixedExpense(defaultTenantId, expense.id)
      : accountList.filter((account) => account.fixedExpenseId === expense.id);
    const futureOpenAccounts = sourceAccounts.filter((account) => {
      const dueDate = account.dueDate.includes("-") ? new Date(`${account.dueDate}T00:00:00`) : parseDateBR(account.dueDate);
      return account.status !== "Pago" && dueDate.getTime() > today;
    });
    if (firebaseReady && user?.id !== demoUserId) {
      await deactivateFixedExpense(defaultTenantId, expense.id);
      await Promise.all(futureOpenAccounts.map((account) => deleteAccountPayable(defaultTenantId, account.id)));
    }
    setFixedExpenses((items) => items.filter((item) => item.id !== expense.id));
    setAccountList((items) => items.filter((item) => !futureOpenAccounts.some((account) => account.id === item.id)));
    await recordChange(defaultTenantId, user, "excluiu", "despesa fixa", expense.id);
  }

  function requestMarkPaid(id: string) {
    const account = accountList.find((item) => item.id === id);
    if (!account || account.status === "Pago") return;
    setPaymentToConfirm(account);
    setPaymentDateTime(nowDateTimeBR());
  }

  async function removeAccountPayable(account: AccountPayable) {
    if (!window.confirm(`Excluir o lançamento de ${account.supplier}, parcela ${account.installment}, no valor de ${account.amount}? Esta ação não apaga a recorrência fixa nem a nota de origem.`)) return;
    if (firebaseReady && user?.id !== demoUserId) await deleteAccountPayable(defaultTenantId, account.id);
    setAccountList((items) => items.filter((item) => item.id !== account.id));
    await recordChange(defaultTenantId, user, "excluiu", "conta", account.id);
  }

  async function confirmMarkPaid() {
    if (!paymentToConfirm) return;
    if (firebaseReady && user?.id !== demoUserId) await markAccountAsPaid(defaultTenantId, paymentToConfirm.id);
    setAccountList((current) =>
      current.map((account) =>
        account.id === paymentToConfirm.id ? { ...account, paidAt: paymentDateTime, status: "Pago" } : account,
      ),
    );
    setPaymentToConfirm(null);
    setPaymentDateTime("");
    await recordChange(defaultTenantId, user, "pagou", "conta", paymentToConfirm.id);
  }

  async function handleReceiptSelected(id: string, file: File) {
    const currentAccount = accountList.find((account) => account.id === id);
    const attachment = await uploadPurchaseAttachment(defaultTenantId, id, "comprovantes", file);
    const updates = { receiptName: attachment.name, receiptPath: attachment.path, receiptUrl: attachment.url };
    if (firebaseReady && user?.id !== demoUserId) await updateAccountPayable(defaultTenantId, id, updates);
    setAccountList((current) => current.map((account) => (account.id === id ? { ...account, ...updates } : account)));
    if (currentAccount?.receiptPath && currentAccount.receiptPath !== attachment.path) await deletePurchaseAttachment(currentAccount.receiptPath);
    await recordChange(defaultTenantId, user, "anexou", "comprovante", id);
  }

  async function replaceInvoiceAttachment(purchase: Purchase, file: File) {
    const attachment = await uploadPurchaseAttachment(defaultTenantId, purchase.id, "notas-fiscais", file);
    if (firebaseReady && user?.id !== demoUserId) await updatePurchase(defaultTenantId, purchase.id, { invoiceAttachment: attachment });
    setPurchaseList((items) => items.map((item) => item.id === purchase.id ? { ...item, invoiceAttachment: attachment } : item));
    if (purchase.invoiceAttachment?.path && purchase.invoiceAttachment.path !== attachment.path) await deletePurchaseAttachment(purchase.invoiceAttachment.path);
    await recordChange(defaultTenantId, user, "editou", "anexo da nota fiscal", purchase.id);
  }

  async function removeInvoiceAttachment(purchase: Purchase) {
    if (!purchase.invoiceAttachment?.path || !window.confirm("Excluir o anexo desta nota fiscal?")) return;
    if (firebaseReady && user?.id !== demoUserId) await updatePurchase(defaultTenantId, purchase.id, { invoiceAttachment: null });
    await deletePurchaseAttachment(purchase.invoiceAttachment.path);
    setPurchaseList((items) => items.map((item) => item.id === purchase.id ? { ...item, invoiceAttachment: null } : item));
    await recordChange(defaultTenantId, user, "excluiu", "anexo da nota fiscal", purchase.id);
  }

  async function removeBoletoAttachment(purchase: Purchase, index: number) {
    const attachment = purchase.boletoAttachments?.[index];
    if (!attachment?.path || !window.confirm(`Excluir o boleto ${index + 1}?`)) return;
    const boletoAttachments = purchase.boletoAttachments?.filter((_, itemIndex) => itemIndex !== index) || [];
    if (firebaseReady && user?.id !== demoUserId) await updatePurchase(defaultTenantId, purchase.id, { boletoAttachments });
    await deletePurchaseAttachment(attachment.path);
    setPurchaseList((items) => items.map((item) => item.id === purchase.id ? { ...item, boletoAttachments } : item));
    await recordChange(defaultTenantId, user, "excluiu", "boleto", purchase.id);
  }

  function sendWhatsApp(account: AccountPayable) {
    if (!getPlanRules(user?.planId).whatsappEnabled) {
      window.alert("WhatsApp não está disponível no Plano Inicial. Faça upgrade para o Plano Médio ou Premium.");
      return;
    }
    const supplier = supplierList.find((item) => item.name === account.supplier);
    const phone = supplier?.phone.replace(/\D/g, "");
    if (!phone) {
      window.alert("Cadastre o telefone do fornecedor antes de enviar uma mensagem pelo WhatsApp.");
      return;
    }
    const message = account.status === "Pago"
      ? `Olá! Confirmamos o pagamento de ${account.amount}, referente a ${account.installment}, com vencimento em ${account.dueDate}.`
      : `Olá! Lembrete de pagamento no valor de ${account.amount}, referente a ${account.installment}, com vencimento em ${account.dueDate}.`;
    window.open(`https://wa.me/55${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  function sendAlertWhatsApp(alert: FinancialAlert) {
    const account = accountList.find((item) => item.id === alert.sourceId);
    if (account) sendWhatsApp(account);
  }

  async function changeUserRole(id: string, role: AppUser["role"]) {
    if (wouldRemoveLastOwner(tenantUsers, id, role)) {
      window.alert("A empresa precisa manter pelo menos um usuário com perfil Proprietário.");
      return;
    }
    await updateTenantUserRole(defaultTenantId, id, role);
    setTenantUsers((items) => items.map((item) => item.id === id ? { ...item, role } : item));
    await recordChange(defaultTenantId, user, "editou", "permissão de usuário", id);
  }

  async function generateInvite(role: Invite["role"]) {
    const planRules = getPlanRules(user?.planId);
    const activeInviteCount = invites.filter((invite) => invite.status === "Ativo").length;
    if (tenantUsers.length + activeInviteCount >= planRules.userLimit) {
      window.alert(`Limite de usuarios do ${planRules.label} atingido.`);
      return;
    }
    const invite = await createInvite(defaultTenantId, user?.companyName || "Empresa", role, user?.planId);
    setInvites((items) => [invite, ...items]);
    setHasSessionChanges(true);
  }

  async function removeInvite(code: string) {
    await cancelInvite(code);
    setInvites((items) => items.map((item) => item.code === code ? { ...item, status: "Cancelado" } : item));
    setHasSessionChanges(true);
  }

  function exportFilteredAccounts() {
    const header = ["Fornecedor", "Categoria", "Loja", "Parcela", "Vencimento", "Valor", "Status", "Pago em", "Comprovante"];
    const rows = filteredAccounts.map((account) => [
      account.supplier,
      account.categoryName || "",
      account.store,
      account.installment,
      account.dueDate,
      account.amount,
      account.status,
      account.paidAt || "",
      account.receiptName || "",
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "contas-a-pagar-orquestra-hub.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function editFields(target: EditTarget): EditField[] {
    if (target.kind === "store") return [{ key: "name", label: "Nome", mask: "title", value: target.item.name }, { key: "manager", label: "Responsável", mask: "title", value: target.item.manager }, { key: "phone", label: "Telefone", mask: "phone", value: target.item.phone || "" }, { key: "cep", label: "CEP", mask: "cep", value: target.item.cep || "" }, { key: "address", label: "Endereço", mask: "title", value: target.item.address || "" }, { key: "city", label: "Cidade", mask: "title", value: target.item.city || "" }, { key: "state", label: "Estado", mask: "upper", value: target.item.state || "" }, { key: "mapsUrl", label: "Google Maps", value: target.item.mapsUrl || "" }, { key: "monthlyGoal", label: "Meta mensal", mask: "currency", value: target.item.monthlyGoal }, { key: "balance", label: "Saldo atual", mask: "currency", value: target.item.balance }];
    if (target.kind === "supplier") return [{ key: "name", label: "Nome", mask: "title", value: target.item.name }, { key: "document", label: "CNPJ", mask: "cnpj", value: target.item.document }, { key: "contactName", label: "Contato", mask: "title", value: target.item.contactName || "" }, { key: "phone", label: "Telefone", mask: "phone", value: target.item.phone }, { key: "email", label: "E-mail", value: target.item.email || "" }, { key: "address", label: "Endereço", mask: "title", value: target.item.address || "" }, { key: "paymentMethod", label: "Forma de pagamento", value: target.item.paymentMethod || "" }, { key: "pixKey", label: "Chave PIX", value: target.item.pixKey || "" }, { key: "bank", label: "Banco", mask: "title", value: target.item.bank || "" }, { key: "agency", label: "Agência", value: target.item.agency || "" }, { key: "account", label: "Conta", value: target.item.account || "" }, { key: "paymentTerms", label: "Condição de pagamento", value: target.item.paymentTerms || "" }, { key: "notes", label: "Observações", value: target.item.notes || "" }];
    if (target.kind === "purchase") return [{ key: "invoiceNumber", label: "Número da nota", mask: "upper", value: target.item.invoiceNumber }, { key: "description", label: "Descrição dos produtos", value: target.item.description }, { key: "supplier", label: "Fornecedor", mask: "title", value: target.item.supplier }, { key: "store", label: "Loja", mask: "title", value: target.item.store }, { key: "issueDate", label: "Data", value: target.item.issueDate }, { key: "total", label: "Valor", mask: "currency", value: target.item.total }, { key: "installments", label: "Parcelas", type: "number", value: String(target.item.installments) }];
    if (target.kind === "fixedExpense") return [{ key: "name", label: "Despesa", mask: "title", value: target.item.name }, { key: "category", label: "Categoria", mask: "title", value: target.item.category }, { key: "payee", label: "Favorecido", mask: "title", value: target.item.payee }, { key: "store", label: "Loja", mask: "title", value: target.item.store }, { key: "amount", label: "Valor mensal", mask: "currency", value: target.item.amount }, { key: "dueDay", label: "Dia do vencimento", type: "number", value: String(target.item.dueDay) }, { key: "alertDays", label: "Alertar com antecedência", type: "number", value: String(target.item.alertDays) }];
    return [{ key: "supplier", label: "Fornecedor", mask: "title", value: target.item.supplier }, { key: "categoryName", label: "Categoria", mask: "title", value: target.item.categoryName || "" }, { key: "store", label: "Loja", mask: "title", value: target.item.store }, { key: "dueDate", label: "Vencimento", value: target.item.dueDate }, { key: "amount", label: "Valor", mask: "currency", value: target.item.amount }, { key: "dailyInterestAmount", label: "Mora diaria (R$)", mask: "currency", value: target.item.dailyInterestAmount || "R$ 0,00" }, { key: "dailyInterestPercent", label: "Mora diaria (%)", value: target.item.dailyInterestPercent || "" }, { key: "lateFeeAmount", label: "Multa (R$)", mask: "currency", value: target.item.lateFeeAmount || "R$ 0,00" }, { key: "lateFeePercent", label: "Multa (%)", value: target.item.lateFeePercent || "" }, { key: "protestAfterDays", label: "Protesto apos dias", type: "number", value: target.item.protestAfterDays || "" }, { key: "installment", label: "Parcela", value: target.item.installment }];
  }

  async function saveEdit(values: Record<string, string>, password: string) {
    if (!editTarget) return;
    try {
      const persist = firebaseReady && user?.id !== demoUserId;
      if (user?.id !== demoUserId && !firebaseReady) throw new Error("Firebase não está pronto para salvar a edição.");
      if (editTarget.kind === "account" && editTarget.item.status === "Pago") await verifyCurrentPassword(password);
      if (editTarget.kind === "store") {
        const updates = { name: toTitleCaseBR(values.name), manager: toTitleCaseBR(values.manager), phone: formatPhone(values.phone), cep: values.cep, address: toTitleCaseBR(values.address), city: toTitleCaseBR(values.city), state: values.state.toUpperCase(), mapsUrl: values.mapsUrl, monthlyGoal: values.monthlyGoal, balance: values.balance };
        if (persist) await updateStore(defaultTenantId, editTarget.item.id, updates);
        setStoreList((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
      } else if (editTarget.kind === "supplier") {
        const updates = { name: toTitleCaseBR(values.name), document: formatCnpj(values.document), contactName: toTitleCaseBR(values.contactName), phone: formatPhone(values.phone), email: values.email.toLowerCase(), address: toTitleCaseBR(values.address), paymentMethod: values.paymentMethod as Supplier["paymentMethod"], pixKey: values.pixKey, bank: toTitleCaseBR(values.bank), agency: values.agency, account: values.account, paymentTerms: toTitleCaseBR(values.paymentTerms), notes: toTitleCaseBR(values.notes) };
        if (persist) await updateSupplier(defaultTenantId, editTarget.item.id, updates);
        setSupplierList((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
      } else if (editTarget.kind === "purchase") {
        const updates = { invoiceNumber: values.invoiceNumber.toUpperCase(), description: toTitleCaseBR(values.description), supplier: toTitleCaseBR(values.supplier), store: toTitleCaseBR(values.store), issueDate: values.issueDate, total: values.total, installments: Number(values.installments) };
        if (persist) await updatePurchase(defaultTenantId, editTarget.item.id, updates);
        setPurchaseList((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
      } else if (editTarget.kind === "fixedExpense") {
        const updates = { alertDays: Math.max(Number(values.alertDays), 0), amount: values.amount, category: toTitleCaseBR(values.category || "Outros"), dueDay: Math.min(Math.max(Number(values.dueDay), 1), 28), name: toTitleCaseBR(values.name), payee: toTitleCaseBR(values.payee), store: toTitleCaseBR(values.store) };
        if (persist) await updateFixedExpense(defaultTenantId, editTarget.item.id, updates);
        setFixedExpenses((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
      } else {
        const matchedCategory = financialCategories.find((category) => category.name.toLocaleLowerCase("pt-BR") === values.categoryName.toLocaleLowerCase("pt-BR"));
        const updates = { supplier: toTitleCaseBR(values.supplier), categoryColor: matchedCategory?.color || editTarget.item.categoryColor, categoryId: matchedCategory?.id || editTarget.item.categoryId, categoryName: toTitleCaseBR(values.categoryName), store: toTitleCaseBR(values.store), dueDate: values.dueDate, amount: values.amount, dailyInterestAmount: values.dailyInterestAmount, dailyInterestPercent: values.dailyInterestPercent, lateFeeAmount: values.lateFeeAmount, lateFeePercent: values.lateFeePercent, protestAfterDays: values.protestAfterDays, installment: values.installment };
        if (persist) await updateAccountPayable(defaultTenantId, editTarget.item.id, updates);
        setAccountList((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
      }
      setEditTarget(null);
      await recordChange(defaultTenantId, user, "editou", editTarget.kind, editTarget.item.id);
    } catch {
      throw new Error("Não foi possível salvar a edição. Verifique sua conexão e tente novamente.");
    }
  }

  async function handleLogout() {
    if (hasSessionChanges && window.confirm("Foram feitas alterações nesta sessão. Deseja baixar um backup antes de sair?")) {
      downloadBackupFile();
    }
    await logoutUser();
    setHasSessionChanges(false);
    setUser(null);
  }

  function activateCompany(company?: CompanyMembership) {
    if (company && company.tenantId !== user?.tenantId) {
      setStoreList([]);
      setSupplierList([]);
      setPurchaseList([]);
      setAccountList([]);
      setFixedExpenses([]);
      setFinancialCategories([]);
      setAuditLogs([]);
      setTenantUsers([]);
      setInvites([]);
      setUser((current) => {
      if (!current) return current;
      const updated = { ...current, ...company };
      window.localStorage.setItem("orquestra-user", JSON.stringify(updated));
      return updated;
      });
    }
  }

  function changeCompany(tenantId: string) {
    const company = companies.find((item) => item.tenantId === tenantId);
    activateCompany(company);
    if (company && user) void recordAudit(company.tenantId, { ...user, ...company }, "editou", "empresa ativa", company.tenantId);
  }

  async function addCompany(name: string) {
    if (!user) return;
    const company = await createCompany(user, name);
    setCompanies((items) => [...items, company]);
    activateCompany(company);
    await recordChange(company.tenantId, { ...user, ...company }, "criou", "empresa", company.tenantId);
  }

  async function importBackup(payload: BackupPayload, mode: BackupRestoreMode, password: string) {
    if (!user || user.id === demoUserId || !canManageUsers(user.role)) throw new Error("Permissão negada.");
    await verifyCurrentPassword(password);
    await restoreBackup(defaultTenantId, payload, mode);
    const [firebaseStores, firebaseSuppliers, firebaseAccounts, firebasePurchases, firebaseFixedExpenses, firebaseCategories, firebaseAuditLogs] = await Promise.all([
      listStores(defaultTenantId),
      listSuppliers(defaultTenantId),
      listAccountsPayable(defaultTenantId),
      listPurchases(defaultTenantId),
      listFixedExpenses(defaultTenantId),
      listFinancialCategories(defaultTenantId),
      listAuditLogs(defaultTenantId),
    ]);
    setStoreList(firebaseStores);
    setSupplierList(firebaseSuppliers);
    setAccountList(firebaseAccounts);
    setPurchaseList(firebasePurchases);
    setFixedExpenses(firebaseFixedExpenses);
    setFinancialCategories(firebaseCategories);
    setAuditLogs(firebaseAuditLogs);
    await recordChange(defaultTenantId, user, mode === "replace" ? "editou" : "criou", "backup", defaultTenantId);
  }

  async function saveProfile(name: string, photoUrl: string) {
    if (!user) return;
    const updated = await updateUserProfile(user, name, photoUrl);
    setUser(updated);
    setTenantUsers((items) => items.map((item) => item.id === updated.id ? { ...item, name: updated.name, photoUrl: updated.photoUrl } : item));
    window.localStorage.setItem("orquestra-user", JSON.stringify(updated));
    await recordChange(defaultTenantId, updated, "editou", "perfil", updated.id);
  }

  async function saveCompanyName(companyName: string) {
    if (!user) return;
    const updated = await updateCompanyName(user, companyName);
    setUser(updated);
    setCompanies((items) => items.map((item) => item.tenantId === updated.tenantId ? { ...item, companyName: updated.companyName } : item));
    setTenantUsers((items) => items.map((item) => item.tenantId === updated.tenantId ? { ...item, companyName: updated.companyName } : item));
    window.localStorage.setItem("orquestra-user", JSON.stringify(updated));
    await recordChange(defaultTenantId, updated, "editou", "empresa", updated.tenantId);
  }

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-600">
        Carregando acesso...
      </main>
    );
  }

  if (!user) return <LoginScreen onLogin={setUser} />;

  if (user.needsOnboarding) return <FirstAccessOnboarding onComplete={async (companyName, userName, inviteCode) => { const completed = await completeGoogleOnboarding(user, companyName, userName, inviteCode); setUser(completed); setCompanies([{ companyName: completed.companyName, nextBillingDate: completed.nextBillingDate, planId: completed.planId, role: completed.role, subscriptionStatus: completed.subscriptionStatus, tenantId: completed.tenantId }]); }} onLogout={handleLogout} user={user} />;

  const blockedByStatus = ["pausado", "vencido", "bloqueado", "cancelado"].includes(user.subscriptionStatus || "");
  const blockedByBillingDate = isBlockedByBillingDate(user);
  if (user.id !== demoUserId && !isPlatformAdmin(user) && (blockedByStatus || blockedByBillingDate)) return <SubscriptionBlocked user={user} />;

  const canWrite = roleCanWrite(user.role);
  const plan = getPlanRules(user.planId);
  const subscriptionDays = daysUntilInputDate(user.nextBillingDate || "");
  const subscriptionReference = user.nextBillingDate?.slice(0, 7) || "";
  const subscriptionPromptKey = user.tenantId && user.nextBillingDate ? `orquestra-subscription-prompt-${user.tenantId}-${user.nextBillingDate}` : "";
  const subscriptionPromptIgnored = Boolean(subscriptionPromptKey) && (subscriptionPromptDismissedKey === subscriptionPromptKey || (typeof window !== "undefined" && window.localStorage.getItem(subscriptionPromptKey) === "ignored"));
  const hasSubscriptionAccount = accountList.some((account) => account.supplier === "Orquestra.cs" && (account.referenceMonth === `assinatura-${subscriptionReference}` || account.referenceMonth === subscriptionReference));
  const subscriptionBusinessDaysLate = businessDaysAfterInputDate(user.nextBillingDate || "");
  const showSubscriptionPrompt = canWrite && user.nextBillingDate && subscriptionDays !== null && subscriptionDays <= 5 && subscriptionBusinessDaysLate <= subscriptionGraceDays && !subscriptionPromptIgnored && !hasSubscriptionAccount;
  const subscriptionPromptTitle = subscriptionDays === null
    ? "Assinatura Orquestra.cs"
    : subscriptionDays < 0
      ? `Assinatura Orquestra.cs vencida ha ${subscriptionBusinessDaysLate} dia(s) uteis`
      : `Assinatura Orquestra.cs vence ${subscriptionDays === 0 ? "hoje" : `em ${subscriptionDays} dia(s)`}`;

  return (
    <AppShell companies={companies} onCompanyChange={changeCompany} onLogout={handleLogout} showPlatformAdmin={isPlatformAdmin(user)} user={user}>
      <div className="space-y-8 px-5 py-6 sm:px-8">
        <Section description="Visao rapida do mes e dos pagamentos." id="dashboard" title="Dashboard">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <SummaryCard item={item} key={item.label} />
            ))}
          </div>
          <div className="mt-4 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3">
            <div title="Soma tudo que já foi marcado como pago desde o início dos lançamentos.">
              <p className="text-xs font-semibold uppercase text-slate-500">Total já pago desde o início</p>
              <strong className="mt-1 block text-xl text-emerald-700">{money.format(paidTotal)}</strong>
            </div>
            <div title="Soma todas as contas ainda não pagas, incluindo vencidas, vencendo hoje, do mês e futuras.">
              <p className="text-xs font-semibold uppercase text-slate-500">Total ainda a pagar</p>
              <strong className="mt-1 block text-xl text-amber-800">{money.format(totalOpenDebt)}</strong>
            </div>
            <div title="Soma lançamentos em aberto sem recorrência fixa mais o valor mensal das despesas fixas ativas, evitando contar a mesma recorrência duas vezes.">
              <p className="text-xs font-semibold uppercase text-slate-500">A pagar + despesas fixas</p>
              <strong className="mt-1 block text-xl text-cyan-800">{money.format(totalOpenDebtWithFixed)}</strong>
            </div>
          </div>
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" title="Soma contas não pagas com vencimento entre hoje e os próximos 7 dias.">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Próximos 7 dias</p>
                  <strong className="mt-1 block text-2xl text-slate-950">{money.format(nextSevenDaysTotal)}</strong>
                </div>
                <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">{nextSevenDaysAccounts.length} vencimento(s)</span>
              </div>
              <div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
                {nextSevenDaysAccounts.length ? nextSevenDaysAccounts.toSorted((a, b) => compareDateBR(a.dueDate, b.dueDate)).slice(0, 6).map((account) => (
                  <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm" key={account.id}>
                    <span className="min-w-0"><strong className="block truncate">{account.supplier}</strong><small className="text-slate-500">{account.dueDate} · {account.store}</small></span>
                    <strong className="shrink-0 text-slate-950">{account.amount}</strong>
                  </div>
                )) : <p className="rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-500">Nenhum vencimento nos próximos 7 dias.</p>}
              </div>
            </section>
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm" title="Lista os fornecedores com maior valor ainda em aberto.">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase text-slate-500">Top fornecedores a pagar</p>
                  <strong className="mt-1 block text-2xl text-slate-950">{topSuppliersToPay.length}</strong>
                </div>
                <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold text-cyan-800">maiores saldos</span>
              </div>
              <div className="mt-4 max-h-44 space-y-2 overflow-y-auto pr-1">
                {topSuppliersToPay.length ? topSuppliersToPay.map((supplier) => (
                  <div className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2 text-sm" key={supplier.name}>
                    <span className="min-w-0"><strong className="block truncate">{supplier.name}</strong><small className="text-slate-500">{supplier.count} conta(s) em aberto</small></span>
                    <strong className="shrink-0 text-slate-950">{money.format(supplier.total)}</strong>
                  </div>
                )) : <p className="rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-500">Nenhum fornecedor com saldo em aberto.</p>}
              </div>
            </section>
          </div>
          {showSubscriptionPrompt ? (
            <div className="mt-4 rounded-lg border border-cyan-200 bg-cyan-50 p-4 text-sm shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <strong className="text-slate-950">{subscriptionPromptTitle}</strong>
                  <p className="mt-1 text-slate-600">{plan.label} · {plan.price} · vencimento {dateInputToBR(user.nextBillingDate || "")}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button className="rounded-md bg-slate-950 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800" onClick={addSubscriptionAccount} type="button">Adicionar em contas a pagar</button>
                  <button className="rounded-md border border-cyan-300 bg-white px-3 py-2 text-xs font-semibold text-cyan-800 hover:bg-cyan-100" onClick={addSubscriptionFixedExpense} type="button">Adicionar como despesa fixa</button>
                  <button className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100" onClick={ignoreSubscriptionPrompt} type="button">Ignorar este mês</button>
                </div>
              </div>
            </div>
          ) : null}
          <FinancialAlertsPanel alerts={financialAlerts} onWhatsApp={sendAlertWhatsApp} />
          <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm" title="Mostra quanto cada loja ainda tem em aberto, sem repetir a lista de próximos vencimentos.">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-950">Resumo por loja</h2>
                <p className="mt-1 text-sm text-slate-500">Valores em aberto separados por unidade.</p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{storeOpenSummary.length} unidade(s)</span>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {storeOpenSummary.length ? storeOpenSummary.map((store) => (
                <div className="rounded-md border border-slate-100 bg-slate-50 px-4 py-3" key={store.name}>
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm text-slate-950">{store.name}</strong>
                    <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-slate-600">{store.count} conta(s)</span>
                  </div>
                  <p className="mt-3 text-xl font-bold text-slate-950">{money.format(store.total)}</p>
                  <small className="text-slate-500">Total ainda pendente nesta unidade</small>
                </div>
              )) : <p className="rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-500">Nenhuma loja com saldo em aberto.</p>}
            </div>
          </section>
          <MonthlyCashFlow accounts={accountList} />
        </Section>

        <Section description="Separacao financeira por unidade." id="lojas" title="Lojas">
          <p className="mb-3 text-sm text-slate-500">{plan.label}: {storeList.length}/{plan.storeLimit} unidade(s) cadastrada(s).</p>
          {canWrite ? <div className="mb-4 flex justify-end">
            <button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-50" disabled={storeList.length >= plan.storeLimit} onClick={() => setShowStoreForm((visible) => !visible)} type="button">
              {showStoreForm ? <X size={18} /> : <Plus size={18} />}
              {showStoreForm ? "Cancelar cadastro" : "Cadastrar nova unidade"}
            </button>
          </div> : null}
          {showStoreForm ? <StoreForm error={formErrors.store} form={storeForm} onChange={setStoreForm} onPhotoChange={setStorePhoto} onSubmit={addStore} photo={storePhoto} /> : null}
          <StoresPanel onEdit={canWrite ? (item) => setEditTarget({ kind: "store", item }) : undefined} stores={storeList} />
        </Section>

        <Section description="Cadastro central de fornecedores." id="fornecedores" title="Fornecedores">
          {canWrite ? <div className="mb-4 flex justify-end"><button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setShowSupplierForm((visible) => !visible)} type="button">{showSupplierForm ? <X size={18} /> : <Plus size={18} />}{showSupplierForm ? "Cancelar cadastro" : "Cadastrar novo fornecedor"}</button></div> : null}
          {showSupplierForm ? <div className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
            <TextField label="Nome" onBlur={() => setSupplierForm((form) => ({ ...form, name: toTitleCaseBR(form.name) }))} onChange={(event) => setSupplierForm((form) => ({ ...form, name: toTitleCaseBR(event.target.value) }))} placeholder="Nome do Fornecedor" value={supplierForm.name} />
            <TextField label="CNPJ" onChange={(event) => setSupplierForm((form) => ({ ...form, document: formatCnpj(event.target.value) }))} placeholder="00.000.000/0000-00" value={supplierForm.document} />
            <TextField label="Pessoa de contato" onBlur={() => setSupplierForm((form) => ({ ...form, contactName: toTitleCaseBR(form.contactName) }))} onChange={(event) => setSupplierForm((form) => ({ ...form, contactName: toTitleCaseBR(event.target.value) }))} placeholder="Nome do contato" value={supplierForm.contactName} />
            <TextField label="Telefone" onChange={(event) => setSupplierForm((form) => ({ ...form, phone: formatPhone(event.target.value) }))} placeholder="(00) 00000-0000" value={supplierForm.phone} />
            <TextField label="E-mail" onChange={(event) => setSupplierForm((form) => ({ ...form, email: event.target.value }))} placeholder="financeiro@fornecedor.com" type="email" value={supplierForm.email} />
            <TextField label="Endereço" onBlur={() => setSupplierForm((form) => ({ ...form, address: toTitleCaseBR(form.address) }))} onChange={(event) => setSupplierForm((form) => ({ ...form, address: toTitleCaseBR(event.target.value) }))} placeholder="Rua, número e cidade" value={supplierForm.address} />
            <label className="block"><span className="text-sm font-medium text-slate-700">Forma de pagamento</span><select className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setSupplierForm((form) => ({ ...form, paymentMethod: event.target.value as NonNullable<Supplier["paymentMethod"]> }))} value={supplierForm.paymentMethod}><option>PIX</option><option>Boleto</option><option>Transferência</option><option>Dinheiro</option><option>Cartão</option></select></label>
            <TextField label="Chave PIX" onChange={(event) => setSupplierForm((form) => ({ ...form, pixKey: event.target.value }))} placeholder="CPF, CNPJ, e-mail ou chave" value={supplierForm.pixKey} />
            <TextField label="Banco" onBlur={() => setSupplierForm((form) => ({ ...form, bank: toTitleCaseBR(form.bank) }))} onChange={(event) => setSupplierForm((form) => ({ ...form, bank: toTitleCaseBR(event.target.value) }))} placeholder="Nome do banco" value={supplierForm.bank} />
            <TextField label="Agência" onChange={(event) => setSupplierForm((form) => ({ ...form, agency: event.target.value }))} placeholder="0000" value={supplierForm.agency} />
            <TextField label="Conta" onChange={(event) => setSupplierForm((form) => ({ ...form, account: event.target.value }))} placeholder="00000-0" value={supplierForm.account} />
            <TextField label="Condição de pagamento" onBlur={() => setSupplierForm((form) => ({ ...form, paymentTerms: toTitleCaseBR(form.paymentTerms) }))} onChange={(event) => setSupplierForm((form) => ({ ...form, paymentTerms: toTitleCaseBR(event.target.value) }))} placeholder="Ex.: 30/60/90 dias" value={supplierForm.paymentTerms} />
            <div className="md:col-span-2"><TextField label="Observações" onBlur={() => setSupplierForm((form) => ({ ...form, notes: toTitleCaseBR(form.notes) }))} onChange={(event) => setSupplierForm((form) => ({ ...form, notes: toTitleCaseBR(event.target.value) }))} placeholder="Dados importantes para compras e pagamentos" value={supplierForm.notes} /></div>
            <button
              className="mt-7 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              onClick={addSupplier}
              title="Cadastrar este fornecedor para lançar compras e controlar boletos."
              type="button"
            >
              Salvar fornecedor
            </button>
            <div className="md:col-span-4">
              <FormAlert message={formErrors.supplier} />
            </div>
          </div> : null}
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <TextField
              label="Buscar fornecedor"
              onChange={(event) => setSupplierSearch(event.target.value)}
              placeholder="Nome, CNPJ ou telefone"
              value={supplierSearch}
            />
          </div>
          <div className="max-h-[520px] overflow-auto">
            <SuppliersTable onDelete={canWrite ? removeSupplier : undefined} onEdit={canWrite ? (item) => setEditTarget({ kind: "supplier", item }) : undefined} suppliers={filteredSuppliers} />
          </div>
        </Section>

        <Section description="Lance a nota e gere parcelas automaticamente." id="compras" title="Compras e notas">
          {canWrite ? <div className="mb-4 flex justify-end"><button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setShowPurchaseForm((visible) => !visible)} type="button">{showPurchaseForm ? <X size={18} /> : <Plus size={18} />}{showPurchaseForm ? "Cancelar lançamento" : "Cadastrar nova compra"}</button></div> : null}
          {showPurchaseForm ? <PurchaseForm
            boletoFiles={boletoFiles}
            categoryError={formErrors.category}
            categoryOptions={financialCategories.filter((category) => category.active).map((category) => ({ id: category.id, name: category.name }))}
            form={purchaseForm}
            invoiceFile={invoiceFile}
            newCategoryName={newPurchaseCategoryName}
            onBoletoFilesChange={setBoletoFiles}
            onCategoryCreate={() => addPurchaseCategoryFromForm()}
            onChange={setPurchaseForm}
            onInvoiceFileChange={setInvoiceFile}
            onNewCategoryNameChange={setNewPurchaseCategoryName}
            onSubmit={addPurchase}
            error={formErrors.purchase}
            storeOptions={storeList.map((store) => store.name)}
            supplierOptions={supplierList.map((supplier) => supplier.name)}
          /> : null}
          <div className="my-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <TextField
              label="Buscar nota"
              onChange={(event) => setPurchaseSearch(event.target.value)}
              placeholder="NF, fornecedor, loja ou data"
              value={purchaseSearch}
            />
          </div>
          <div className="max-h-[560px] overflow-auto">
            <PurchasesTable
              onDeleteBoleto={canWrite ? removeBoletoAttachment : undefined}
              onDeleteInvoice={canWrite ? removeInvoiceAttachment : undefined}
              onEdit={canWrite ? (item) => setEditTarget({ kind: "purchase", item }) : undefined}
              onReplaceInvoice={canWrite ? replaceInvoiceAttachment : undefined}
              purchases={filteredPurchases}
            />
          </div>
        </Section>

        <Section description="Controle vencimento, baixa e status." id="contas-a-pagar" title="Contas a pagar">
          <AccountsPayableFilters
            filters={accountFilters}
            onChange={setAccountFilters}
            storeOptions={storeList.map((store) => store.name)}
            supplierOptions={supplierList.map((supplier) => supplier.name)}
          />
          <AccountsPayableSummary items={accountSummary} />
          <AccountsPayableExport onExport={exportFilteredAccounts} />
          <div className="max-h-[560px] overflow-auto">
            <AccountsPayableTable
              accounts={filteredAccounts}
              onDelete={canWrite ? removeAccountPayable : undefined}
              onEdit={canWrite ? (item) => setEditTarget({ kind: "account", item }) : undefined}
              onMarkPaid={canWrite ? requestMarkPaid : undefined}
              onReceiptSelected={canWrite ? handleReceiptSelected : undefined}
              onWhatsApp={sendWhatsApp}
            />
          </div>
        </Section>

        <Section description="Cadastre despesas recorrentes e gere automaticamente a conta do mês com antecedência de alerta." id="despesas-fixas" title="Despesas fixas">
          <FixedExpensesPanel canWrite={canWrite} error={formErrors.fixedExpense} expenses={fixedExpenses.filter((expense) => expense.active !== false)} form={fixedExpenseForm} onChange={setFixedExpenseForm} onDelete={removeFixedExpense} onEdit={(item) => setEditTarget({ kind: "fixedExpense", item })} onSubmit={addFixedExpense} storeOptions={storeList.map((store) => store.name)} />
        </Section>

        <Section description="Indicadores para decisão financeira." id="relatorios" title="Relatórios">
          <FinancialReports accounts={accountList} purchases={purchaseList} />
        </Section>
        <Section description="Dados, perfil de acesso e identificação do usuário." id="perfil" title="Perfil do usuário"><UserProfile onCompanySave={saveCompanyName} onProfileSave={saveProfile} user={user} /></Section>
        <Section description="Preferências e situação das integrações do Orquestra Hub." id="configuracoes" title="Configurações">
          <div className="space-y-5">
            {canManageUsers(user.role) ? <>
              <CollapsibleSettingsBlock defaultOpen description="Gerencie empresas vinculadas e escolha o ambiente ativo." storageKey="settings-companies-open" title="Empresas e ambientes">
                <CompaniesPanel companies={companies} currentTenantId={user.tenantId} onCreate={addCompany} onSelect={changeCompany} />
              </CollapsibleSettingsBlock>
              <CollapsibleSettingsBlock description="Convide usuários e defina quem pode administrar, lançar ou apenas consultar." storageKey="settings-users-open" title="Usuários e permissões">
                <UsersPanel currentUserId={user.id} invites={invites} onCancelInvite={removeInvite} onCreateInvite={generateInvite} onRoleChange={changeUserRole} userLimit={plan.userLimit} users={tenantUsers} />
              </CollapsibleSettingsBlock>
              <CollapsibleSettingsBlock description="Baixe ou importe dados da empresa atual com cuidado." storageKey="settings-backup-open" title="Backup e exportação">
                <BackupPanel data={backupData} onImport={importBackup} />
              </CollapsibleSettingsBlock>
            </> : null}
            <CollapsibleSettingsBlock defaultOpen description="Preferências visuais, plano contratado, IA financeira e suporte." storageKey="settings-system-open" title="Sistema, planos e suporte">
              <SystemSettings companyName={user.companyName} planId={user.planId} tenantId={defaultTenantId} />
            </CollapsibleSettingsBlock>
            <CollapsibleSettingsBlock description="Privacidade, LGPD, exportação de dados e solicitações do titular." storageKey="settings-privacy-open" title="Privacidade e LGPD">
              <PrivacyPanel exportData={backupData} user={user} />
            </CollapsibleSettingsBlock>
            {canManageUsers(user.role) ? (
              <CollapsibleSettingsBlock description="Histórico das principais ações realizadas no sistema." storageKey="settings-audit-open" title="Últimas alterações">
                <AuditPanel logs={auditLogs} />
              </CollapsibleSettingsBlock>
            ) : null}
          </div>
        </Section>

        {isPlatformAdmin(user) ? (
          <Section description="Central exclusiva da Orquestra.cs para clientes, planos, créditos e bloqueios." id="admin-orquestra" title="Admin Orquestra.cs">
            <PlatformAdminPanel />
          </Section>
        ) : null}
      </div>
      {user.id !== demoUserId ? <GuideAssistant userId={user.id} /> : null}
      {user.id !== demoUserId && plan.aiEnabled ? (
        <FinancialAssistant context={{ accounts: accountList, fixedExpenses, purchases: purchaseList, stores: storeList, suppliers: supplierList }} tenantId={defaultTenantId} />
      ) : null}
      <PaymentConfirmModal
        account={paymentToConfirm}
        onCancel={() => setPaymentToConfirm(null)}
        onConfirm={confirmMarkPaid}
        paidAt={paymentDateTime}
        supplier={supplierList.find((item) => item.name === paymentToConfirm?.supplier)}
      />
      {editTarget ? <EditModal fields={editFields(editTarget)} onClose={() => setEditTarget(null)} onSave={saveEdit} passwordRequired={editTarget.kind === "account" && editTarget.item.status === "Pago"} title={`Editar ${editTarget.kind === "store" ? "loja" : editTarget.kind === "supplier" ? "fornecedor" : editTarget.kind === "purchase" ? "nota" : editTarget.kind === "fixedExpense" ? "despesa fixa" : "conta a pagar"}`} /> : null}
    </AppShell>
  );
}
