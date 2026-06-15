"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, X } from "lucide-react";
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
import { createAccountPayable, listAccountsPayable, markAccountAsPaid, updateAccountPayable } from "@/features/accounts-payable/services/accountPayableService";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { listenAuth, listUserCompanies, logoutUser, verifyCurrentPassword } from "@/features/auth/services/authService";
import type { AppUser } from "@/features/auth/types/authTypes";
import type { CompanyMembership } from "@/features/auth/types/authTypes";
import { AuditPanel } from "@/features/audit/components/AuditPanel";
import { BackupPanel } from "@/features/backup/components/BackupPanel";
import { listAuditLogs, recordAudit } from "@/features/audit/services/auditService";
import type { AuditLog } from "@/features/audit/types/auditTypes";
import { PaymentsTable } from "@/features/dashboard/components/PaymentsTable";
import { MonthlyCashFlow } from "@/features/dashboard/components/MonthlyCashFlow";
import { CompaniesPanel } from "@/features/companies/components/CompaniesPanel";
import { createCompany } from "@/features/companies/services/companyService";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard";
import { FinancialAlertsPanel } from "@/features/dashboard/components/FinancialAlertsPanel";
import { buildFinancialAlerts, type FinancialAlert } from "@/features/dashboard/utils/financialAlerts";
import type { FinancialSummary } from "@/features/dashboard/types/dashboardTypes";
import { FixedExpensesPanel, type FixedExpenseForm } from "@/features/fixed-expenses/components/FixedExpensesPanel";
import { createFixedExpense, listFixedExpenses } from "@/features/fixed-expenses/services/fixedExpenseService";
import type { FixedExpense } from "@/features/fixed-expenses/types/fixedExpenseTypes";
import { PurchaseForm } from "@/features/purchases/components/PurchaseForm";
import type { PurchaseFormState } from "@/features/purchases/components/PurchaseForm";
import { PurchasesTable } from "@/features/purchases/components/PurchasesTable";
import { createPurchaseWithAccounts, listPurchases, updatePurchase } from "@/features/purchases/services/purchaseService";
import { deletePurchaseAttachment, uploadPurchaseAttachment } from "@/features/purchases/services/purchaseAttachmentService";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import { FinancialReports } from "@/features/reports/components/FinancialReports";
import { PrivacyPanel } from "@/features/privacy/components/PrivacyPanel";
import { UserProfile } from "@/features/profile/components/UserProfile";
import { SystemSettings } from "@/features/settings/components/SystemSettings";
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
import { accountsPayable, purchases, stores, suppliers } from "@/lib/data/mockData";
import { firebaseReady } from "@/lib/firebase/config";
import { compareDateBR, formatCnpj, formatPhone, nowDateTimeBR, parseBRL, toTitleCaseBR } from "@/lib/formatters/br";
import { defaultTenantId as legacyTenantId } from "@/lib/tenant/tenant";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
const demoUserId = "demo-user";
type EditTarget = { kind: "store"; item: Store } | { kind: "supplier"; item: Supplier } | { kind: "purchase"; item: Purchase } | { kind: "account"; item: AccountPayable };

function parseMoney(value: string) {
  return parseBRL(value);
}

function addMonths(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month - 1 + months, day);
  return next.toLocaleDateString("pt-BR");
}

export function OrquestraHubApp() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [companies, setCompanies] = useState<CompanyMembership[]>([]);
  const defaultTenantId = user?.tenantId || legacyTenantId;
  const [authChecked, setAuthChecked] = useState(!firebaseReady);
  const [storeList, setStoreList] = useState<Store[]>(stores);
  const [supplierList, setSupplierList] = useState<Supplier[]>(suppliers);
  const [purchaseList, setPurchaseList] = useState<Purchase[]>(purchases);
  const [accountList, setAccountList] = useState<AccountPayable[]>(accountsPayable);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [tenantUsers, setTenantUsers] = useState<AppUser[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [fixedExpenseForm, setFixedExpenseForm] = useState<FixedExpenseForm>({ alertDays: "5", amount: "R$ 0,00", category: "", dueDay: "10", name: "", payee: "", store: stores[0]?.name || "" });
  const [accountFilters, setAccountFilters] = useState<AccountFilters>({ status: "Todos", store: "Todas", supplier: "Todos" });
  const [paymentToConfirm, setPaymentToConfirm] = useState<AccountPayable | null>(null);
  const [paymentDateTime, setPaymentDateTime] = useState("");
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [formErrors, setFormErrors] = useState({ purchase: "", store: "", supplier: "" });
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
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>({
    description: "",
    dueDate: "2026-06-10",
    installments: "3",
    invoiceNumber: "NF 1003",
    issueDate: "2026-06-08",
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
    if (!firebaseReady || !user || user.id === demoUserId) return;
    async function loadFirebaseData() {
      try {
        const [firebaseStores, firebaseSuppliers, firebaseAccounts, firebasePurchases, firebaseFixedExpenses, firebaseAuditLogs, firebaseUsers, firebaseInvites] = await Promise.all([
          listStores(defaultTenantId),
          listSuppliers(defaultTenantId),
          listAccountsPayable(defaultTenantId),
          listPurchases(defaultTenantId),
          listFixedExpenses(defaultTenantId),
          user && canManageUsers(user.role) ? listAuditLogs(defaultTenantId) : Promise.resolve([]),
          user && canManageUsers(user.role) ? listTenantUsers(defaultTenantId, user.companyName) : Promise.resolve([]),
          user && canManageUsers(user.role) ? listInvites(defaultTenantId) : Promise.resolve([]),
        ]);
        setStoreList(firebaseStores);
        setSupplierList(firebaseSuppliers);
        setAccountList(firebaseAccounts);
        setPurchaseList(firebasePurchases);
        setFixedExpenses(firebaseFixedExpenses);
        setAuditLogs(firebaseAuditLogs);
        setTenantUsers(firebaseUsers);
        setInvites(firebaseInvites);
      } catch {
        setFormErrors((errors) => ({ ...errors, supplier: "Não foi possível carregar dados do Firebase." }));
      }
    }
    void loadFirebaseData();
  }, [user, defaultTenantId]);

  const openTotal = accountList.filter((item) => item.status !== "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const paidTotal = accountList.filter((item) => item.status === "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const overdueTotal = accountList.filter((item) => item.status === "Atrasado").reduce((total, item) => total + parseMoney(item.amount), 0);
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
      { helper: "Boletos ainda em aberto", label: "A pagar", tone: "warning", value: money.format(openTotal) },
      { helper: "Baixas confirmadas", label: "Pago", tone: "success", value: money.format(paidTotal) },
      { helper: "Exigem atenção", label: "Vencidos", tone: "danger", value: money.format(overdueTotal) },
      { helper: "Com cadastro ativo", label: "Fornecedores", tone: "neutral", value: String(supplierList.length) },
    ],
    [openTotal, overdueTotal, paidTotal, supplierList.length],
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

  async function addSupplier() {
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
      notes: supplierForm.notes.trim(),
      openAmount: "R$ 0,00",
      paymentMethod: supplierForm.paymentMethod,
      paymentTerms: supplierForm.paymentTerms.trim(),
      phone: formatPhone(supplierForm.phone || "00000000000"),
      pixKey: supplierForm.pixKey.trim(),
      status: "Ativo",
    };
    try {
      const created = firebaseReady && user?.id !== demoUserId ? await createSupplier(defaultTenantId, newSupplier) : null;
      setSupplierList((current) => [{ id: created?.id || crypto.randomUUID(), ...newSupplier }, ...current]);
      setPurchaseForm((form) => ({ ...form, supplier: newSupplier.name }));
      setSupplierForm({ account: "", address: "", agency: "", bank: "", contactName: "", document: "", email: "", name: "", notes: "", paymentMethod: "PIX", paymentTerms: "", phone: "", pixKey: "" });
      setFormErrors((errors) => ({ ...errors, supplier: "" }));
      await recordAudit(defaultTenantId, user, "criou", "fornecedor", created?.id || "demo");
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
    await recordAudit(defaultTenantId, user, "excluiu", "fornecedor", supplier.id);
  }

  async function addStore() {
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
    const created = firebaseReady && user?.id !== demoUserId ? await createStore(defaultTenantId, newStore) : null;
    const storeId = created?.id || crypto.randomUUID();
    const photo = storePhoto ? await uploadPurchaseAttachment(defaultTenantId, storeId, "lojas", storePhoto) : null;
    if (created && photo) await updateStore(defaultTenantId, storeId, { photoUrl: photo.url });
    setStoreList((current) => [{ id: storeId, ...newStore, photoUrl: photo?.url }, ...current]);
    setPurchaseForm((form) => ({ ...form, store: newStore.name }));
    setStoreForm({ address: "", balance: "R$ 0,00", cep: "", city: "", manager: "", mapsUrl: "", monthlyGoal: "R$ 0,00", name: "", phone: "", state: "" });
    setStorePhoto(null);
    setFormErrors((errors) => ({ ...errors, store: "" }));
    await recordAudit(defaultTenantId, user, "criou", "loja", storeId);
    setShowStoreForm(false);
  }

  async function addPurchase() {
    const installments = Math.max(Number(purchaseForm.installments), 1);
    const total = parseMoney(purchaseForm.total);
    if (!purchaseForm.supplier || !supplierList.some((supplier) => supplier.name === purchaseForm.supplier)) {
      setFormErrors((errors) => ({ ...errors, purchase: "Selecione um fornecedor cadastrado." }));
      return;
    }
    if (!purchaseForm.store || !storeList.some((store) => store.name === purchaseForm.store)) {
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
    const newPurchase: Omit<Purchase, "id"> = {
      description: purchaseForm.description.trim(),
      installments,
      invoiceNumber: purchaseForm.invoiceNumber,
      issueDate: new Date(purchaseForm.issueDate).toLocaleDateString("pt-BR"),
      store: toTitleCaseBR(purchaseForm.store),
      supplier: toTitleCaseBR(purchaseForm.supplier),
      total: money.format(total),
    };
    const newAccounts: Omit<AccountPayable, "id">[] = Array.from({ length: installments }, (_, index) => ({
      amount: money.format(installmentAmount),
      dueDate: addMonths(purchaseForm.dueDate, index),
      installment: `${index + 1}/${installments}`,
      status: "Aberto" as const,
      store: toTitleCaseBR(purchaseForm.store),
      supplier: toTitleCaseBR(purchaseForm.supplier),
    }));
    try {
      const saved = firebaseReady && user?.id !== demoUserId ? await createPurchaseWithAccounts(defaultTenantId, newPurchase, newAccounts) : null;
      const finalId = saved?.purchaseId || purchaseId;
      const invoiceAttachment = invoiceFile ? await uploadPurchaseAttachment(defaultTenantId, finalId, "notas-fiscais", invoiceFile) : undefined;
      const boletoAttachments = await Promise.all(boletoFiles.map((file) => uploadPurchaseAttachment(defaultTenantId, finalId, "boletos", file)));
      const attachments = { invoiceAttachment, boletoAttachments };
      if (saved?.purchaseId && (invoiceAttachment || boletoAttachments.length)) await updatePurchase(defaultTenantId, saved.purchaseId, attachments);
      setPurchaseList((current) => [{ id: finalId, ...newPurchase, ...attachments }, ...current]);
      setAccountList((current) => [
        ...newAccounts.map((account, index) => ({ id: saved?.accountIds[index] || `${purchaseId}-${index + 1}`, ...account })),
        ...current,
      ]);
      setInvoiceFile(null);
      setBoletoFiles([]);
    } catch {
      setFormErrors((errors) => ({ ...errors, purchase: "A nota foi validada, mas não foi possível salvar os dados ou anexos." }));
      return;
    }
    setFormErrors((errors) => ({ ...errors, purchase: "" }));
    await recordAudit(defaultTenantId, user, "criou", "compra", purchaseId);
    setShowPurchaseForm(false);
  }

  async function addFixedExpense() {
    const amount = parseMoney(fixedExpenseForm.amount);
    const dueDay = Math.min(Math.max(Number(fixedExpenseForm.dueDay), 1), 28);
    if (!fixedExpenseForm.name.trim() || !fixedExpenseForm.payee.trim() || amount <= 0) return;
    const expense: Omit<FixedExpense, "id"> = { active: true, alertDays: Math.max(Number(fixedExpenseForm.alertDays), 0), amount: money.format(amount), category: toTitleCaseBR(fixedExpenseForm.category || "Outros"), dueDay, name: toTitleCaseBR(fixedExpenseForm.name), payee: toTitleCaseBR(fixedExpenseForm.payee), store: fixedExpenseForm.store };
    const saved = firebaseReady && user?.id !== demoUserId ? await createFixedExpense(defaultTenantId, expense) : null;
    const id = saved?.id || crypto.randomUUID();
    const now = new Date();
    const dueDate = new Date(now.getFullYear(), now.getMonth(), dueDay).toLocaleDateString("pt-BR");
    const account: Omit<AccountPayable, "id"> = { amount: expense.amount, dueDate, fixedExpenseId: id, installment: "Mensal", referenceMonth: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`, status: "Aberto", store: expense.store, supplier: expense.payee };
    const savedAccount = firebaseReady && user?.id !== demoUserId ? await createAccountPayable(defaultTenantId, account) : null;
    setFixedExpenses((items) => [{ id, ...expense }, ...items]);
    setAccountList((items) => [{ id: savedAccount?.id || crypto.randomUUID(), ...account }, ...items]);
    setFixedExpenseForm({ alertDays: "5", amount: "R$ 0,00", category: "", dueDay: "10", name: "", payee: "", store: storeList[0]?.name || "" });
    await recordAudit(defaultTenantId, user, "criou", "despesa fixa", id);
  }

  function requestMarkPaid(id: string) {
    const account = accountList.find((item) => item.id === id);
    if (!account || account.status === "Pago") return;
    setPaymentToConfirm(account);
    setPaymentDateTime(nowDateTimeBR());
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
    await recordAudit(defaultTenantId, user, "pagou", "conta", paymentToConfirm.id);
  }

  async function handleReceiptSelected(id: string, file: File) {
    const currentAccount = accountList.find((account) => account.id === id);
    const attachment = await uploadPurchaseAttachment(defaultTenantId, id, "comprovantes", file);
    const updates = { receiptName: attachment.name, receiptPath: attachment.path, receiptUrl: attachment.url };
    if (firebaseReady && user?.id !== demoUserId) await updateAccountPayable(defaultTenantId, id, updates);
    setAccountList((current) => current.map((account) => (account.id === id ? { ...account, ...updates } : account)));
    if (currentAccount?.receiptPath && currentAccount.receiptPath !== attachment.path) await deletePurchaseAttachment(currentAccount.receiptPath);
    await recordAudit(defaultTenantId, user, "anexou", "comprovante", id);
  }

  async function replaceInvoiceAttachment(purchase: Purchase, file: File) {
    const attachment = await uploadPurchaseAttachment(defaultTenantId, purchase.id, "notas-fiscais", file);
    if (firebaseReady && user?.id !== demoUserId) await updatePurchase(defaultTenantId, purchase.id, { invoiceAttachment: attachment });
    setPurchaseList((items) => items.map((item) => item.id === purchase.id ? { ...item, invoiceAttachment: attachment } : item));
    if (purchase.invoiceAttachment?.path && purchase.invoiceAttachment.path !== attachment.path) await deletePurchaseAttachment(purchase.invoiceAttachment.path);
    await recordAudit(defaultTenantId, user, "editou", "anexo da nota fiscal", purchase.id);
  }

  async function removeInvoiceAttachment(purchase: Purchase) {
    if (!purchase.invoiceAttachment?.path || !window.confirm("Excluir o anexo desta nota fiscal?")) return;
    if (firebaseReady && user?.id !== demoUserId) await updatePurchase(defaultTenantId, purchase.id, { invoiceAttachment: null });
    await deletePurchaseAttachment(purchase.invoiceAttachment.path);
    setPurchaseList((items) => items.map((item) => item.id === purchase.id ? { ...item, invoiceAttachment: null } : item));
    await recordAudit(defaultTenantId, user, "excluiu", "anexo da nota fiscal", purchase.id);
  }

  async function removeBoletoAttachment(purchase: Purchase, index: number) {
    const attachment = purchase.boletoAttachments?.[index];
    if (!attachment?.path || !window.confirm(`Excluir o boleto ${index + 1}?`)) return;
    const boletoAttachments = purchase.boletoAttachments?.filter((_, itemIndex) => itemIndex !== index) || [];
    if (firebaseReady && user?.id !== demoUserId) await updatePurchase(defaultTenantId, purchase.id, { boletoAttachments });
    await deletePurchaseAttachment(attachment.path);
    setPurchaseList((items) => items.map((item) => item.id === purchase.id ? { ...item, boletoAttachments } : item));
    await recordAudit(defaultTenantId, user, "excluiu", "boleto", purchase.id);
  }

  function sendWhatsApp(account: AccountPayable) {
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
    await recordAudit(defaultTenantId, user, "editou", "permissão de usuário", id);
  }

  async function generateInvite(role: Invite["role"]) {
    const invite = await createInvite(defaultTenantId, user?.companyName || "Empresa", role);
    setInvites((items) => [invite, ...items]);
  }

  async function removeInvite(code: string) {
    await cancelInvite(code);
    setInvites((items) => items.map((item) => item.code === code ? { ...item, status: "Cancelado" } : item));
  }

  function exportFilteredAccounts() {
    const header = ["Fornecedor", "Loja", "Parcela", "Vencimento", "Valor", "Status", "Pago em", "Comprovante"];
    const rows = filteredAccounts.map((account) => [
      account.supplier,
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
    return [{ key: "supplier", label: "Fornecedor", mask: "title", value: target.item.supplier }, { key: "store", label: "Loja", mask: "title", value: target.item.store }, { key: "dueDate", label: "Vencimento", value: target.item.dueDate }, { key: "amount", label: "Valor", mask: "currency", value: target.item.amount }, { key: "installment", label: "Parcela", value: target.item.installment }];
  }

  async function saveEdit(values: Record<string, string>, password: string) {
    if (!editTarget) return;
    const persist = firebaseReady && user?.id !== demoUserId;
    if (editTarget.kind === "account" && editTarget.item.status === "Pago") await verifyCurrentPassword(password);
    if (editTarget.kind === "store") {
      const updates = { name: toTitleCaseBR(values.name), manager: toTitleCaseBR(values.manager), phone: formatPhone(values.phone), cep: values.cep, address: toTitleCaseBR(values.address), city: toTitleCaseBR(values.city), state: values.state.toUpperCase(), mapsUrl: values.mapsUrl, monthlyGoal: values.monthlyGoal, balance: values.balance };
      if (persist) await updateStore(defaultTenantId, editTarget.item.id, updates);
      setStoreList((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
    } else if (editTarget.kind === "supplier") {
      const updates = { name: toTitleCaseBR(values.name), document: formatCnpj(values.document), contactName: toTitleCaseBR(values.contactName), phone: formatPhone(values.phone), email: values.email.toLowerCase(), address: toTitleCaseBR(values.address), paymentMethod: values.paymentMethod as Supplier["paymentMethod"], pixKey: values.pixKey, bank: toTitleCaseBR(values.bank), agency: values.agency, account: values.account, paymentTerms: values.paymentTerms, notes: values.notes };
      if (persist) await updateSupplier(defaultTenantId, editTarget.item.id, updates);
      setSupplierList((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
    } else if (editTarget.kind === "purchase") {
      const updates = { invoiceNumber: values.invoiceNumber.toUpperCase(), description: values.description.trim(), supplier: toTitleCaseBR(values.supplier), store: toTitleCaseBR(values.store), issueDate: values.issueDate, total: values.total, installments: Number(values.installments) };
      if (persist) await updatePurchase(defaultTenantId, editTarget.item.id, updates);
      setPurchaseList((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
    } else {
      const updates = { supplier: toTitleCaseBR(values.supplier), store: toTitleCaseBR(values.store), dueDate: values.dueDate, amount: values.amount, installment: values.installment };
      if (persist) await updateAccountPayable(defaultTenantId, editTarget.item.id, updates);
      setAccountList((items) => items.map((item) => item.id === editTarget.item.id ? { ...item, ...updates } : item));
    }
    setEditTarget(null);
    await recordAudit(defaultTenantId, user, "editou", editTarget.kind, editTarget.item.id);
  }

  async function handleLogout() {
    await logoutUser();
    setUser(null);
  }

  function activateCompany(company?: CompanyMembership) {
    if (company && company.tenantId !== user?.tenantId) {
      setStoreList([]);
      setSupplierList([]);
      setPurchaseList([]);
      setAccountList([]);
      setFixedExpenses([]);
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
    await recordAudit(company.tenantId, { ...user, ...company }, "criou", "empresa", company.tenantId);
  }

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-600">
        Carregando acesso...
      </main>
    );
  }

  if (!user) return <LoginScreen onLogin={setUser} />;

  const canWrite = roleCanWrite(user.role);

  return (
    <AppShell companies={companies} onCompanyChange={changeCompany} onLogout={handleLogout} user={user}>
      <div className="space-y-8 px-5 py-6 sm:px-8">
        <Section description="Visao rapida do mes e dos pagamentos." id="dashboard" title="Dashboard">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <SummaryCard item={item} key={item.label} />
            ))}
          </div>
          <FinancialAlertsPanel alerts={financialAlerts} onWhatsApp={sendAlertWhatsApp} />
          <div className="mt-6">
            <PaymentsTable accounts={accountList.toSorted((a, b) => compareDateBR(a.dueDate, b.dueDate))} />
          </div>
          <MonthlyCashFlow accounts={accountList} />
        </Section>

        <Section description="Separacao financeira por unidade." id="lojas" title="Lojas">
          {canWrite ? <div className="mb-4 flex justify-end">
            <button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setShowStoreForm((visible) => !visible)} type="button">
              {showStoreForm ? <X size={18} /> : <Plus size={18} />}
              {showStoreForm ? "Cancelar cadastro" : "Cadastrar nova loja"}
            </button>
          </div> : null}
          {showStoreForm ? <StoreForm error={formErrors.store} form={storeForm} onChange={setStoreForm} onPhotoChange={setStorePhoto} onSubmit={addStore} photo={storePhoto} /> : null}
          <StoresPanel onEdit={canWrite ? (item) => setEditTarget({ kind: "store", item }) : undefined} stores={storeList} />
        </Section>

        <Section description="Cadastro central de fornecedores." id="fornecedores" title="Fornecedores">
          {canWrite ? <div className="mb-4 flex justify-end"><button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setShowSupplierForm((visible) => !visible)} type="button">{showSupplierForm ? <X size={18} /> : <Plus size={18} />}{showSupplierForm ? "Cancelar cadastro" : "Cadastrar novo fornecedor"}</button></div> : null}
          {showSupplierForm ? <div className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
            <TextField label="Nome" onBlur={() => setSupplierForm((form) => ({ ...form, name: toTitleCaseBR(form.name) }))} onChange={(event) => setSupplierForm((form) => ({ ...form, name: event.target.value }))} placeholder="Nome do Fornecedor" value={supplierForm.name} />
            <TextField label="CNPJ" onChange={(event) => setSupplierForm((form) => ({ ...form, document: formatCnpj(event.target.value) }))} placeholder="00.000.000/0000-00" value={supplierForm.document} />
            <TextField label="Pessoa de contato" onChange={(event) => setSupplierForm((form) => ({ ...form, contactName: event.target.value }))} placeholder="Nome do contato" value={supplierForm.contactName} />
            <TextField label="Telefone" onChange={(event) => setSupplierForm((form) => ({ ...form, phone: formatPhone(event.target.value) }))} placeholder="(00) 00000-0000" value={supplierForm.phone} />
            <TextField label="E-mail" onChange={(event) => setSupplierForm((form) => ({ ...form, email: event.target.value }))} placeholder="financeiro@fornecedor.com" type="email" value={supplierForm.email} />
            <TextField label="Endereço" onChange={(event) => setSupplierForm((form) => ({ ...form, address: event.target.value }))} placeholder="Rua, número e cidade" value={supplierForm.address} />
            <label className="block"><span className="text-sm font-medium text-slate-700">Forma de pagamento</span><select className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm" onChange={(event) => setSupplierForm((form) => ({ ...form, paymentMethod: event.target.value as NonNullable<Supplier["paymentMethod"]> }))} value={supplierForm.paymentMethod}><option>PIX</option><option>Boleto</option><option>Transferência</option><option>Dinheiro</option><option>Cartão</option></select></label>
            <TextField label="Chave PIX" onChange={(event) => setSupplierForm((form) => ({ ...form, pixKey: event.target.value }))} placeholder="CPF, CNPJ, e-mail ou chave" value={supplierForm.pixKey} />
            <TextField label="Banco" onChange={(event) => setSupplierForm((form) => ({ ...form, bank: event.target.value }))} placeholder="Nome do banco" value={supplierForm.bank} />
            <TextField label="Agência" onChange={(event) => setSupplierForm((form) => ({ ...form, agency: event.target.value }))} placeholder="0000" value={supplierForm.agency} />
            <TextField label="Conta" onChange={(event) => setSupplierForm((form) => ({ ...form, account: event.target.value }))} placeholder="00000-0" value={supplierForm.account} />
            <TextField label="Condição de pagamento" onChange={(event) => setSupplierForm((form) => ({ ...form, paymentTerms: event.target.value }))} placeholder="Ex.: 30/60/90 dias" value={supplierForm.paymentTerms} />
            <div className="md:col-span-2"><TextField label="Observações" onChange={(event) => setSupplierForm((form) => ({ ...form, notes: event.target.value }))} placeholder="Dados importantes para compras e pagamentos" value={supplierForm.notes} /></div>
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
          <div className="overflow-x-auto">
            <SuppliersTable onDelete={canWrite ? removeSupplier : undefined} onEdit={canWrite ? (item) => setEditTarget({ kind: "supplier", item }) : undefined} suppliers={filteredSuppliers} />
          </div>
        </Section>

        <Section description="Lance a nota e gere parcelas automaticamente." id="compras" title="Compras e notas">
          {canWrite ? <div className="mb-4 flex justify-end"><button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setShowPurchaseForm((visible) => !visible)} type="button">{showPurchaseForm ? <X size={18} /> : <Plus size={18} />}{showPurchaseForm ? "Cancelar lançamento" : "Cadastrar nova compra"}</button></div> : null}
          {showPurchaseForm ? <PurchaseForm
            boletoFiles={boletoFiles}
            form={purchaseForm}
            invoiceFile={invoiceFile}
            onBoletoFilesChange={setBoletoFiles}
            onChange={setPurchaseForm}
            onInvoiceFileChange={setInvoiceFile}
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
          <div className="overflow-x-auto">
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
          <div className="overflow-x-auto">
            <AccountsPayableTable
              accounts={filteredAccounts}
              onEdit={canWrite ? (item) => setEditTarget({ kind: "account", item }) : undefined}
              onMarkPaid={canWrite ? requestMarkPaid : undefined}
              onReceiptSelected={canWrite ? handleReceiptSelected : undefined}
              onWhatsApp={sendWhatsApp}
            />
          </div>
        </Section>

        <Section description="Cadastre despesas recorrentes e gere automaticamente a conta do mês com antecedência de alerta." id="despesas-fixas" title="Despesas fixas">
          <FixedExpensesPanel canWrite={canWrite} expenses={fixedExpenses} form={fixedExpenseForm} onChange={setFixedExpenseForm} onSubmit={addFixedExpense} storeOptions={storeList.map((store) => store.name)} />
        </Section>

        <Section description="Indicadores para decisão financeira." id="relatorios" title="Relatórios">
          <FinancialReports accounts={accountList} purchases={purchaseList} />
        </Section>
        <Section description="Dados, perfil de acesso e identificação do usuário." id="perfil" title="Perfil do usuário"><UserProfile user={user} /></Section>
        <Section description="Preferências e situação das integrações do Orquestra Hub." id="configuracoes" title="Configurações"><SystemSettings /><div className="mt-5"><PrivacyPanel exportData={{ accounts: accountList, fixedExpenses, purchases: purchaseList, stores: storeList, suppliers: supplierList }} user={user} /></div>{canManageUsers(user.role) ? <div className="mt-5 space-y-5"><CompaniesPanel companies={companies} currentTenantId={user.tenantId} onCreate={addCompany} onSelect={changeCompany} /><UsersPanel currentUserId={user.id} invites={invites} onCancelInvite={removeInvite} onCreateInvite={generateInvite} onRoleChange={changeUserRole} users={tenantUsers} /><BackupPanel data={{ accounts: accountList, auditLogs, fixedExpenses, purchases: purchaseList, stores: storeList, suppliers: supplierList }} /><AuditPanel logs={auditLogs} /></div> : null}</Section>
      </div>
      <PaymentConfirmModal
        account={paymentToConfirm}
        onCancel={() => setPaymentToConfirm(null)}
        onConfirm={confirmMarkPaid}
        paidAt={paymentDateTime}
        supplier={supplierList.find((item) => item.name === paymentToConfirm?.supplier)}
      />
      {editTarget ? <EditModal fields={editFields(editTarget)} onClose={() => setEditTarget(null)} onSave={saveEdit} passwordRequired={editTarget.kind === "account" && editTarget.item.status === "Pago"} title={`Editar ${editTarget.kind === "store" ? "loja" : editTarget.kind === "supplier" ? "fornecedor" : editTarget.kind === "purchase" ? "nota" : "conta a pagar"}`} /> : null}
    </AppShell>
  );
}
