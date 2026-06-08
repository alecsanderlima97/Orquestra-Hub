"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Section } from "@/components/ui/Section";
import { TextField } from "@/components/ui/TextField";
import { AccountsPayableTable } from "@/features/accounts-payable/components/AccountsPayableTable";
import { listAccountsPayable, markAccountAsPaid } from "@/features/accounts-payable/services/accountPayableService";
import type { AccountPayable } from "@/features/accounts-payable/types/accountPayableTypes";
import { SummaryCard } from "@/features/dashboard/components/SummaryCard";
import type { FinancialSummary } from "@/features/dashboard/types/dashboardTypes";
import { PurchaseForm } from "@/features/purchases/components/PurchaseForm";
import type { PurchaseFormState } from "@/features/purchases/components/PurchaseForm";
import { createPurchaseWithAccounts } from "@/features/purchases/services/purchaseService";
import type { Purchase } from "@/features/purchases/types/purchaseTypes";
import { StoresPanel } from "@/features/stores/components/StoresPanel";
import { SuppliersTable } from "@/features/suppliers/components/SuppliersTable";
import { createSupplier, listSuppliers } from "@/features/suppliers/services/supplierService";
import type { Supplier } from "@/features/suppliers/types/supplierTypes";
import { accountsPayable, purchases, stores, suppliers } from "@/lib/data/mockData";
import { firebaseReady } from "@/lib/firebase/config";
import { defaultTenantId } from "@/lib/tenant/tenant";

const money = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

function parseMoney(value: string) {
  return Number(value.replace(/\D/g, "")) / 100;
}

function addMonths(date: string, months: number) {
  const [year, month, day] = date.split("-").map(Number);
  const next = new Date(year, month - 1 + months, day);
  return next.toLocaleDateString("pt-BR");
}

export function OrquestraHubApp() {
  const [supplierList, setSupplierList] = useState<Supplier[]>(suppliers);
  const [purchaseList, setPurchaseList] = useState<Purchase[]>(purchases);
  const [accountList, setAccountList] = useState<AccountPayable[]>(accountsPayable);
  const [supplierForm, setSupplierForm] = useState({ document: "", name: "", phone: "" });
  const [purchaseForm, setPurchaseForm] = useState<PurchaseFormState>({
    dueDate: "2026-06-10",
    installments: "3",
    invoiceNumber: "NF 1003",
    issueDate: "2026-06-08",
    store: "Loja de baixo",
    supplier: "Mister Multimarcas",
    total: "R$ 15.000,00",
  });

  useEffect(() => {
    if (!firebaseReady) return;
    async function loadFirebaseData() {
      const [firebaseSuppliers, firebaseAccounts] = await Promise.all([
        listSuppliers(defaultTenantId),
        listAccountsPayable(defaultTenantId),
      ]);
      if (firebaseSuppliers.length) setSupplierList(firebaseSuppliers);
      if (firebaseAccounts.length) setAccountList(firebaseAccounts);
    }
    void loadFirebaseData();
  }, []);

  const openTotal = accountList.filter((item) => item.status !== "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const paidTotal = accountList.filter((item) => item.status === "Pago").reduce((total, item) => total + parseMoney(item.amount), 0);
  const overdueTotal = accountList.filter((item) => item.status === "Atrasado").reduce((total, item) => total + parseMoney(item.amount), 0);

  const summary = useMemo<FinancialSummary[]>(
    () => [
      { helper: "Boletos ainda em aberto", label: "A pagar", tone: "warning", value: money.format(openTotal) },
      { helper: "Baixas confirmadas", label: "Pago", tone: "success", value: money.format(paidTotal) },
      { helper: "Exigem atencao", label: "Vencidos", tone: "danger", value: money.format(overdueTotal) },
      { helper: "Com cadastro ativo", label: "Fornecedores", tone: "neutral", value: String(supplierList.length) },
    ],
    [openTotal, overdueTotal, paidTotal, supplierList.length],
  );

  async function addSupplier() {
    if (!supplierForm.name.trim()) return;
    const newSupplier: Omit<Supplier, "id"> = {
      document: supplierForm.document || "00.000.000/0000-00",
      name: supplierForm.name.trim(),
      openAmount: "R$ 0,00",
      phone: supplierForm.phone || "(00) 00000-0000",
      status: "Ativo",
    };
    if (firebaseReady) await createSupplier(defaultTenantId, newSupplier);
    setSupplierList((current) => [{ id: crypto.randomUUID(), ...newSupplier }, ...current]);
    setSupplierForm({ document: "", name: "", phone: "" });
  }

  async function addPurchase() {
    const installments = Math.max(Number(purchaseForm.installments), 1);
    const total = parseMoney(purchaseForm.total);
    const installmentAmount = total / installments;
    const purchaseId = crypto.randomUUID();
    const newPurchase: Omit<Purchase, "id"> = {
      installments,
      invoiceNumber: purchaseForm.invoiceNumber,
      issueDate: new Date(purchaseForm.issueDate).toLocaleDateString("pt-BR"),
      store: purchaseForm.store,
      supplier: purchaseForm.supplier,
      total: money.format(total),
    };
    const newAccounts: Omit<AccountPayable, "id">[] = Array.from({ length: installments }, (_, index) => ({
      amount: money.format(installmentAmount),
      dueDate: addMonths(purchaseForm.dueDate, index),
      installment: `${index + 1}/${installments}`,
      status: "Aberto" as const,
      store: purchaseForm.store,
      supplier: purchaseForm.supplier,
    }));
    if (firebaseReady) await createPurchaseWithAccounts(defaultTenantId, newPurchase, newAccounts);
    setPurchaseList((current) => [{ id: purchaseId, ...newPurchase }, ...current]);
    setAccountList((current) => [
      ...newAccounts.map((account, index) => ({ id: `${purchaseId}-${index + 1}`, ...account })),
      ...current,
    ]);
  }

  async function handleMarkPaid(id: string) {
    if (firebaseReady) await markAccountAsPaid(defaultTenantId, id);
    setAccountList((current) => current.map((account) => (account.id === id ? { ...account, status: "Pago" } : account)));
  }

  return (
    <AppShell>
      <div className="space-y-8 px-5 py-6 sm:px-8">
        <Section description="Visao rapida do mes e dos pagamentos." id="dashboard" title="Dashboard">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {summary.map((item) => (
              <SummaryCard item={item} key={item.label} />
            ))}
          </div>
        </Section>

        <Section description="Separacao financeira por unidade." id="lojas" title="Lojas">
          <StoresPanel stores={stores} />
        </Section>

        <Section description="Cadastro central de fornecedores." id="fornecedores" title="Fornecedores">
          <div className="mb-4 grid gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-4">
            <TextField label="Nome" onChange={(event) => setSupplierForm((form) => ({ ...form, name: event.target.value }))} placeholder="Nome Do Fornecedor" value={supplierForm.name} />
            <TextField label="CNPJ" onChange={(event) => setSupplierForm((form) => ({ ...form, document: event.target.value }))} placeholder="00.000.000/0000-00" value={supplierForm.document} />
            <TextField label="Telefone" onChange={(event) => setSupplierForm((form) => ({ ...form, phone: event.target.value }))} placeholder="(00) 00000-0000" value={supplierForm.phone} />
            <button className="mt-7 h-11 rounded-md bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800" onClick={addSupplier} type="button">
              Salvar fornecedor
            </button>
          </div>
          <div className="overflow-x-auto">
            <SuppliersTable suppliers={supplierList} />
          </div>
        </Section>

        <Section description="Lance a nota e gere parcelas automaticamente." id="compras" title="Compras e notas">
          <PurchaseForm form={purchaseForm} onChange={setPurchaseForm} onSubmit={addPurchase} />
        </Section>

        <Section description="Controle vencimento, baixa e status." id="contas-a-pagar" title="Contas a pagar">
          <div className="overflow-x-auto">
            <AccountsPayableTable accounts={accountList} onMarkPaid={handleMarkPaid} />
          </div>
        </Section>

        <Section description="Resumo simples para decisao." id="relatorios" title="Relatorios">
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Compras lancadas</p>
              <strong className="mt-2 block text-xl">{purchaseList.length}</strong>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Saldo em aberto</p>
              <strong className="mt-2 block text-xl">{money.format(openTotal)}</strong>
            </article>
            <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total pago</p>
              <strong className="mt-2 block text-xl">{money.format(paidTotal)}</strong>
            </article>
          </div>
        </Section>
      </div>
    </AppShell>
  );
}
