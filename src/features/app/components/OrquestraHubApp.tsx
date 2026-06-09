"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
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
import { listAccountsPayable, markAccountAsPaid } from "@/features/accounts-payable/services/accountPayableService";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import { LoginScreen } from "@/features/auth/components/LoginScreen";
import { listenAuth, logoutUser } from "@/features/auth/services/authService";
import type { AppUser } from "@/features/auth/types/authTypes";
import { PaymentsTable } from "@/features/dashboard/components/PaymentsTable";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard";
import type { FinancialSummary } from "@/features/dashboard/types/dashboardTypes";
import { PurchaseForm } from "@/features/purchases/components/PurchaseForm";
import type { PurchaseFormState } from "@/features/purchases/components/PurchaseForm";
import { PurchasesTable } from "@/features/purchases/components/PurchasesTable";
import { createPurchaseWithAccounts } from "@/features/purchases/services/purchaseService";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import { FinancialReports } from "@/features/reports/components/FinancialReports";
import { StoreForm } from "@/features/stores/components/StoreForm";
import type { StoreFormState } from "@/features/stores/components/StoreForm";
import { StoresPanel } from "@/features/stores/components/StoresPanel";
import { createStore, listStores } from "@/features/stores/services/storeService";
import type { Store } from "@/features/stores/types/storeTypes";
import { SuppliersTable } from "@/features/suppliers/components/SuppliersTable";
import { createSupplier, listSuppliers } from "@/features/suppliers/services/supplierService";
import type { Supplier } from "@/features/suppliers/types/supplierTypes";
import { accountsPayable, purchases, stores, suppliers } from "@/lib/data/mockData";
import { firebaseReady } from "@/lib/firebase/config";
import { compareDateBR, formatCnpj, formatPhone, nowDateTimeBR, parseBRL, toTitleCaseBR } from "@/lib/formatters/br";
import { defaultTenantId } from "@/lib/tenant/tenant";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });
const demoUserId = "demo-user";

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
  const [authChecked, setAuthChecked] = useState(!firebaseReady);
  const [storeList, setStoreList] = useState<Store[]>(stores);
  const [supplierList, setSupplierList] = useState<Supplier[]>(suppliers);
  const [purchaseList, setPurchaseList] = useState<Purchase[]>(purchases);
  const [accountList, setAccountList] = useState<AccountPayable[]>(accountsPayable);
  const [accountFilters, setAccountFilters] = useState<AccountFilters>({ status: "Todos", store: "Todas", supplier: "Todos" });
  const [paymentToConfirm, setPaymentToConfirm] = useState<AccountPayable | null>(null);
  const [paymentDateTime, setPaymentDateTime] = useState("");
  const [formErrors, setFormErrors] = useState({ purchase: "", store: "", supplier: "" });
  const [purchaseSearch, setPurchaseSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [supplierForm, setSupplierForm] = useState({ document: "", name: "", phone: "" });
  const [storeForm, setStoreForm] = useState<StoreFormState>({
    balance: "R$ 0,00",
    manager: "",
    monthlyGoal: "R$ 0,00",
    name: "",
  });
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>({
    dueDate: "2026-06-10",
    installments: "3",
    invoiceNumber: "NF 1003",
    issueDate: "2026-06-08",
    store: "Loja de Baixo",
    supplier: "Mister Multimarcas",
    total: "R$ 15.000,00",
  });

  useEffect(() => {
    const unsubscribe = listenAuth((currentUser) => {
      setUser(currentUser);
      setAuthChecked(true);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!firebaseReady || !user || user.id === demoUserId) return;
    async function loadFirebaseData() {
      try {
        const [firebaseStores, firebaseSuppliers, firebaseAccounts] = await Promise.all([
          listStores(defaultTenantId),
          listSuppliers(defaultTenantId),
          listAccountsPayable(defaultTenantId),
        ]);
        if (firebaseStores.length) setStoreList(firebaseStores);
        if (firebaseSuppliers.length) setSupplierList(firebaseSuppliers);
        if (firebaseAccounts.length) setAccountList(firebaseAccounts);
      } catch {
        setFormErrors((errors) => ({ ...errors, supplier: "Não foi possível carregar dados do Firebase." }));
      }
    }
    void loadFirebaseData();
  }, [user]);

  const openTotal = accountList.filter((item) => item.status !== "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const paidTotal = accountList.filter((item) => item.status === "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const overdueTotal = accountList.filter((item) => item.status === "Atrasado").reduce((total, item) => total + parseMoney(item.amount), 0);
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
    return [purchase.invoiceNumber, purchase.supplier, purchase.store, purchase.issueDate].some((value) =>
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
    if (firebaseReady && user?.id !== demoUserId) await createSupplier(defaultTenantId, newSupplier);
    setSupplierList((current) => [{ id: crypto.randomUUID(), ...newSupplier }, ...current]);
    setPurchaseForm((form) => ({ ...form, supplier: newSupplier.name }));
    setSupplierForm({ document: "", name: "", phone: "" });
    setFormErrors((errors) => ({ ...errors, supplier: "" }));
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
      balance: storeForm.balance || "R$ 0,00",
      manager: toTitleCaseBR(storeForm.manager || "Sem Responsável"),
      monthlyGoal: storeForm.monthlyGoal || "R$ 0,00",
      name: toTitleCaseBR(storeForm.name.trim()),
    };
    if (firebaseReady && user?.id !== demoUserId) await createStore(defaultTenantId, newStore);
    setStoreList((current) => [{ id: crypto.randomUUID(), ...newStore }, ...current]);
    setPurchaseForm((form) => ({ ...form, store: newStore.name }));
    setStoreForm({ balance: "R$ 0,00", manager: "", monthlyGoal: "R$ 0,00", name: "" });
    setFormErrors((errors) => ({ ...errors, store: "" }));
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
    if (firebaseReady && user?.id !== demoUserId) await createPurchaseWithAccounts(defaultTenantId, newPurchase, newAccounts);
    setPurchaseList((current) => [{ id: purchaseId, ...newPurchase }, ...current]);
    setAccountList((current) => [
      ...newAccounts.map((account, index) => ({ id: `${purchaseId}-${index + 1}`, ...account })),
      ...current,
    ]);
    setFormErrors((errors) => ({ ...errors, purchase: "" }));
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
  }

  function handleReceiptSelected(id: string, fileName: string) {
    setAccountList((current) => current.map((account) => (account.id === id ? { ...account, receiptName: fileName } : account)));
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

  async function handleLogout() {
    await logoutUser();
    setUser(null);
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
    <AppShell onLogout={handleLogout} user={user}>
      <div className="space-y-8 px-5 py-6 sm:px-8">
        <Section description="Visao rapida do mes e dos pagamentos." id="dashboard" title="Dashboard">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <SummaryCard item={item} key={item.label} />
            ))}
          </div>
          <div className="mt-6">
            <PaymentsTable accounts={accountList.toSorted((a, b) => compareDateBR(a.dueDate, b.dueDate))} />
          </div>
        </Section>

        <Section description="Separacao financeira por unidade." id="lojas" title="Lojas">
          <StoreForm error={formErrors.store} form={storeForm} onChange={setStoreForm} onSubmit={addStore} />
          <StoresPanel stores={storeList} />
        </Section>

        <Section description="Cadastro central de fornecedores." id="fornecedores" title="Fornecedores">
          <div className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
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
          </div>
          <div className="mb-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <TextField
              label="Buscar fornecedor"
              onChange={(event) => setSupplierSearch(event.target.value)}
              placeholder="Nome, CNPJ ou telefone"
              value={supplierSearch}
            />
          </div>
          <div className="overflow-x-auto">
            <SuppliersTable suppliers={filteredSuppliers} />
          </div>
        </Section>

        <Section description="Lance a nota e gere parcelas automaticamente." id="compras" title="Compras e notas">
          <PurchaseForm
            form={purchaseForm}
            onChange={setPurchaseForm}
            onSubmit={addPurchase}
            error={formErrors.purchase}
            storeOptions={storeList.map((store) => store.name)}
            supplierOptions={supplierList.map((supplier) => supplier.name)}
          />
          <div className="my-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <TextField
              label="Buscar nota"
              onChange={(event) => setPurchaseSearch(event.target.value)}
              placeholder="NF, fornecedor, loja ou data"
              value={purchaseSearch}
            />
          </div>
          <div className="overflow-x-auto">
            <PurchasesTable purchases={filteredPurchases} />
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
              onMarkPaid={requestMarkPaid}
              onReceiptSelected={handleReceiptSelected}
            />
          </div>
        </Section>

        <Section description="Indicadores para decisão financeira." id="relatorios" title="Relatórios">
          <FinancialReports accounts={accountList} purchases={purchaseList} />
        </Section>
      </div>
      <PaymentConfirmModal
        account={paymentToConfirm}
        onCancel={() => setPaymentToConfirm(null)}
        onConfirm={confirmMarkPaid}
        paidAt={paymentDateTime}
      />
    </AppShell>
  );
}
