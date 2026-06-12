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
import { SummaryCard } from "@/features/dashboard/components/SummaryCard";
import type { FinancialSummary } from "@/features/dashboard/types/dashboardTypes";
import { FixedExpensesPanel, type FixedExpenseForm } from "@/features/fixed-expenses/components/FixedExpensesPanel";
import { createFixedExpense, listFixedExpenses } from "@/features/fixed-expenses/services/fixedExpenseService";
import type { FixedExpense } from "@/features/fixed-expenses/types/fixedExpenseTypes";
import { PurchaseForm } from "@/features/purchases/components/PurchaseForm";
import type { PurchaseFormState } from "@/features/purchases/components/PurchaseForm";
import { PurchasesTable } from "@/features/purchases/components/PurchasesTable";
import { createPurchaseWithAccounts, listPurchases, updatePurchase } from "@/features/purchases/services/purchaseService";
import { uploadPurchaseAttachment } from "@/features/purchases/services/purchaseAttachmentService";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import { FinancialReports } from "@/features/reports/components/FinancialReports";
import { UserProfile } from "@/features/profile/components/UserProfile";
import { SystemSettings } from "@/features/settings/components/SystemSettings";
import { StoreForm } from "@/features/stores/components/StoreForm";
import type { StoreFormState } from "@/features/stores/components/StoreForm";
import { StoresPanel } from "@/features/stores/components/StoresPanel";
import { createStore, listStores, updateStore } from "@/features/stores/services/storeService";
import type { Store } from "@/features/stores/types/storeTypes";
import { UsersPanel } from "@/features/users/components/UsersPanel";
import { listTenantUsers, updateTenantUserRole } from "@/features/users/services/userService";
import { createInvite } from "@/features/users/services/inviteService";
import { SuppliersTable } from "@/features/suppliers/components/SuppliersTable";
import { createSupplier, listSuppliers, updateSupplier } from "@/features/suppliers/services/supplierService";
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
  const [supplierForm, setSupplierForm] = useState({ document: "", name: "", phone: "" });
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
      if (currentUser) void listUserCompanies(currentUser.id).then(setCompanies).catch(() => setCompanies([]));
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
        const [firebaseStores, firebaseSuppliers, firebaseAccounts, firebasePurchases, firebaseFixedExpenses, firebaseAuditLogs, firebaseUsers] = await Promise.all([
          listStores(defaultTenantId),
          listSuppliers(defaultTenantId),
          listAccountsPayable(defaultTenantId),
          listPurchases(defaultTenantId),
          listFixedExpenses(defaultTenantId),
          user?.role === "Dono" ? listAuditLogs(defaultTenantId) : Promise.resolve([]),
          user?.role === "Dono" ? listTenantUsers(defaultTenantId, user.companyName) : Promise.resolve([]),
        ]);
        setStoreList(firebaseStores);
        setSupplierList(firebaseSuppliers);
        setAccountList(firebaseAccounts);
        setPurchaseList(firebasePurchases);
        setFixedExpenses(firebaseFixedExpenses);
        setAuditLogs(firebaseAuditLogs);
        setTenantUsers(firebaseUsers);
      } catch {
        setFormErrors((errors) => ({ ...errors, supplier: "Não foi possível carregar dados do Firebase." }));
      }
    }
    void loadFirebaseData();
  }, [user, defaultTenantId]);

  const openTotal = accountList.filter((item) => item.status !== "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const paidTotal = accountList.filter((item) => item.status === "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const overdueTotal = accountList.filter((item) => item.status === "Atrasado").reduce((total, item) => total + parseMoney(item.amount), 0);
  const today = new Date();
  const fixedExpenseAlerts = fixedExpenses.filter((item) => item.active && item.dueDay - today.getDate() <= item.alertDays && item.dueDay >= today.getDate());
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
      name: toTitleCaseBR(supplierForm.name.trim()),
      openAmount: "R$ 0,00",
      phone: formatPhone(supplierForm.phone || "00000000000"),
      status: "Ativo",
    };
    try {
      const created = firebaseReady && user?.id !== demoUserId ? await createSupplier(defaultTenantId, newSupplier) : null;
      setSupplierList((current) => [{ id: created?.id || crypto.randomUUID(), ...newSupplier }, ...current]);
      setPurchaseForm((form) => ({ ...form, supplier: newSupplier.name }));
      setSupplierForm({ document: "", name: "", phone: "" });
      setFormErrors((errors) => ({ ...errors, supplier: "" }));
      await recordAudit(defaultTenantId, user, "criou", "fornecedor", created?.id || "demo");
      setShowSupplierForm(false);
    } catch {
      setFormErrors((errors) => ({ ...errors, supplier: "Não foi possível salvar o fornecedor. Verifique sua conexão e tente novamente." }));
    }
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
    const attachment = await uploadPurchaseAttachment(defaultTenantId, id, "comprovantes", file);
    const updates = { receiptName: attachment.name, receiptUrl: attachment.url };
    if (firebaseReady && user?.id !== demoUserId) await updateAccountPayable(defaultTenantId, id, updates);
    setAccountList((current) => current.map((account) => (account.id === id ? { ...account, ...updates } : account)));
    await recordAudit(defaultTenantId, user, "anexou", "comprovante", id);
  }

  function sendWhatsApp(account: AccountPayable) {
    const supplier = supplierList.find((item) => item.name === account.supplier);
    const phone = supplier?.phone.replace(/\D/g, "");
    const message = account.status === "Pago"
      ? `Olá! Confirmamos o pagamento de ${account.amount}, referente a ${account.installment}, com vencimento em ${account.dueDate}.`
      : `Olá! Lembrete de pagamento no valor de ${account.amount}, referente a ${account.installment}, com vencimento em ${account.dueDate}.`;
    window.open(`https://wa.me/${phone ? `55${phone}` : ""}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  }

  async function changeUserRole(id: string, role: AppUser["role"]) {
    await updateTenantUserRole(defaultTenantId, id, role);
    setTenantUsers((items) => items.map((item) => item.id === id ? { ...item, role } : item));
    await recordAudit(defaultTenantId, user, "editou", "permissão de usuário", id);
  }

  async function generateInvite(role: AppUser["role"]) {
    return createInvite(defaultTenantId, user?.companyName || "Empresa", role);
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
    if (target.kind === "supplier") return [{ key: "name", label: "Nome", mask: "title", value: target.item.name }, { key: "document", label: "CNPJ", mask: "cnpj", value: target.item.document }, { key: "phone", label: "Telefone", mask: "phone", value: target.item.phone }];
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
      const updates = { name: toTitleCaseBR(values.name), document: formatCnpj(values.document), phone: formatPhone(values.phone) };
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

  function changeCompany(tenantId: string) {
    const company = companies.find((item) => item.tenantId === tenantId);
    if (company) setUser((current) => current ? { ...current, ...company } : current);
  }

  if (!authChecked) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-sm font-medium text-slate-600">
        Carregando acesso...
      </main>
    );
  }

  if (!user) return <LoginScreen onLogin={setUser} />;

  return (
    <AppShell companies={companies} onCompanyChange={changeCompany} onLogout={handleLogout} user={user}>
      <div className="space-y-8 px-5 py-6 sm:px-8">
        <Section description="Visao rapida do mes e dos pagamentos." id="dashboard" title="Dashboard">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <SummaryCard item={item} key={item.label} />
            ))}
          </div>
          {fixedExpenseAlerts.length ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4"><strong className="text-sm text-amber-950">Lembretes de despesas fixas</strong><div className="mt-2 grid gap-2 md:grid-cols-2">{fixedExpenseAlerts.map((item) => <div className="text-sm text-amber-900" key={item.id}>{item.name} · {item.amount} · vence dia {item.dueDay}</div>)}</div></div> : null}
          <div className="mt-6">
            <PaymentsTable accounts={accountList.toSorted((a, b) => compareDateBR(a.dueDate, b.dueDate))} />
          </div>
          <MonthlyCashFlow accounts={accountList} />
        </Section>

        <Section description="Separacao financeira por unidade." id="lojas" title="Lojas">
          <div className="mb-4 flex justify-end">
            <button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setShowStoreForm((visible) => !visible)} type="button">
              {showStoreForm ? <X size={18} /> : <Plus size={18} />}
              {showStoreForm ? "Cancelar cadastro" : "Cadastrar nova loja"}
            </button>
          </div>
          {showStoreForm ? <StoreForm error={formErrors.store} form={storeForm} onChange={setStoreForm} onPhotoChange={setStorePhoto} onSubmit={addStore} photo={storePhoto} /> : null}
          <StoresPanel onEdit={(item) => setEditTarget({ kind: "store", item })} stores={storeList} />
        </Section>

        <Section description="Cadastro central de fornecedores." id="fornecedores" title="Fornecedores">
          <div className="mb-4 flex justify-end"><button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setShowSupplierForm((visible) => !visible)} type="button">{showSupplierForm ? <X size={18} /> : <Plus size={18} />}{showSupplierForm ? "Cancelar cadastro" : "Cadastrar novo fornecedor"}</button></div>
          {showSupplierForm ? <div className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
            <TextField label="Nome" onBlur={() => setSupplierForm((form) => ({ ...form, name: toTitleCaseBR(form.name) }))} onChange={(event) => setSupplierForm((form) => ({ ...form, name: event.target.value }))} placeholder="Nome do Fornecedor" value={supplierForm.name} />
            <TextField label="CNPJ" onChange={(event) => setSupplierForm((form) => ({ ...form, document: formatCnpj(event.target.value) }))} placeholder="00.000.000/0000-00" value={supplierForm.document} />
            <TextField label="Telefone" onChange={(event) => setSupplierForm((form) => ({ ...form, phone: formatPhone(event.target.value) }))} placeholder="(00) 00000-0000" value={supplierForm.phone} />
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
            <SuppliersTable onEdit={(item) => setEditTarget({ kind: "supplier", item })} suppliers={filteredSuppliers} />
          </div>
        </Section>

        <Section description="Lance a nota e gere parcelas automaticamente." id="compras" title="Compras e notas">
          <div className="mb-4 flex justify-end"><button className="inline-flex h-11 items-center gap-2 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={() => setShowPurchaseForm((visible) => !visible)} type="button">{showPurchaseForm ? <X size={18} /> : <Plus size={18} />}{showPurchaseForm ? "Cancelar lançamento" : "Cadastrar nova compra"}</button></div>
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
            <PurchasesTable onEdit={(item) => setEditTarget({ kind: "purchase", item })} purchases={filteredPurchases} />
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
              onEdit={(item) => setEditTarget({ kind: "account", item })}
              onMarkPaid={requestMarkPaid}
              onReceiptSelected={handleReceiptSelected}
              onWhatsApp={sendWhatsApp}
            />
          </div>
        </Section>

        <Section description="Cadastre despesas recorrentes e gere automaticamente a conta do mês com antecedência de alerta." id="despesas-fixas" title="Despesas fixas">
          <FixedExpensesPanel expenses={fixedExpenses} form={fixedExpenseForm} onChange={setFixedExpenseForm} onSubmit={addFixedExpense} storeOptions={storeList.map((store) => store.name)} />
        </Section>

        <Section description="Indicadores para decisão financeira." id="relatorios" title="Relatórios">
          <FinancialReports accounts={accountList} purchases={purchaseList} />
        </Section>
        <Section description="Dados, perfil de acesso e identificação do usuário." id="perfil" title="Perfil do usuário"><UserProfile user={user} /></Section>
        <Section description="Preferências e situação das integrações do Orquestra Hub." id="configuracoes" title="Configurações"><SystemSettings />{user.role === "Dono" ? <div className="mt-5 space-y-5"><UsersPanel onCreateInvite={generateInvite} onRoleChange={changeUserRole} users={tenantUsers} /><BackupPanel data={{ accounts: accountList, auditLogs, fixedExpenses, purchases: purchaseList, stores: storeList, suppliers: supplierList }} /><AuditPanel logs={auditLogs} /></div> : null}</Section>
      </div>
      <PaymentConfirmModal
        account={paymentToConfirm}
        onCancel={() => setPaymentToConfirm(null)}
        onConfirm={confirmMarkPaid}
        paidAt={paymentDateTime}
      />
      {editTarget ? <EditModal fields={editFields(editTarget)} onClose={() => setEditTarget(null)} onSave={saveEdit} passwordRequired={editTarget.kind === "account" && editTarget.item.status === "Pago"} title={`Editar ${editTarget.kind === "store" ? "loja" : editTarget.kind === "supplier" ? "fornecedor" : editTarget.kind === "purchase" ? "nota" : "conta a pagar"}`} /> : null}
    </AppShell>
  );
}
