"use client";

import { CheckCircle2, Clipboard, ExternalLink, LoaderCircle, QrCode, RefreshCw, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { createPixCharge, getPixChargeStatus, type PixCharge } from "../services/billingService";

function qrImage(encodedImage?: string) {
  if (!encodedImage) return "";
  return encodedImage.startsWith("data:") ? encodedImage : `data:image/png;base64,${encodedImage}`;
}

export function SubscriptionPaymentPanel({ amount, nextBillingDate, onPaid, planLabel, tenantId }: { amount: string; nextBillingDate: string; onPaid?: () => void; planLabel: string; tenantId: string }) {
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const image = useMemo(() => qrImage(charge?.pixEncodedImage), [charge?.pixEncodedImage]);

  async function createCharge() {
    setLoading(true);
    setMessage("");
    try {
      setCharge(await createPixCharge(tenantId));
      setOpen(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível gerar o PIX.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!open || !charge || charge.status === "paid") return;
    const timer = window.setInterval(() => {
      void getPixChargeStatus(tenantId).then((latest) => {
        if (!latest) return;
        setCharge(latest);
        if (latest.status === "paid") onPaid?.();
      }).catch(() => undefined);
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [charge, onPaid, open, tenantId]);

  async function copyPayload() {
    if (!charge?.pixPayload) return;
    await navigator.clipboard.writeText(charge.pixPayload);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="rounded-lg border border-cyan-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Pagamento online</p>
          <strong className="mt-1 block text-slate-950">{planLabel} · {amount}</strong>
          <p className="mt-1 text-sm text-slate-600">Pague por PIX pelo Mercado Pago e aguarde a confirmação automática.</p>
        </div>
        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-wait disabled:opacity-70" disabled={loading} onClick={() => { if (charge) setOpen((current) => !current); else void createCharge(); }} type="button">
          {loading ? <LoaderCircle className="animate-spin" size={16} /> : charge ? <QrCode size={16} /> : <QrCode size={16} />}
          {loading ? "Gerando..." : charge && !open ? "Mostrar PIX" : charge ? "Ocultar PIX" : "Pagar com PIX"}
        </button>
      </div>
      {open && charge ? <div className="mt-4 grid gap-4 border-t border-cyan-100 pt-4 md:grid-cols-[180px_1fr]">
        {image ? <Image alt="QR Code PIX da cobrança" className="mx-auto size-44 rounded-md border border-slate-200 p-2" height={176} src={image} unoptimized width={176} /> : <div className="flex size-44 items-center justify-center rounded-md bg-slate-50 text-center text-xs text-slate-500">QR Code indisponível. Use o código copia e cola.</div>}
        <div className="min-w-0 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700"><ShieldCheck size={16} />Cobrança identificada e protegida pelo Mercado Pago</div>
          {charge.status === "paid" ? <p className="flex items-center gap-2 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><CheckCircle2 size={17} />Pagamento recebido. Atualizando seu acesso.</p> : <p className="text-sm text-slate-600">Depois do pagamento, a confirmação será recebida automaticamente. Não é necessário enviar comprovante.</p>}
          {charge.pixPayload ? <div><label className="text-xs font-semibold uppercase text-slate-500" htmlFor="pix-copy-paste">PIX copia e cola</label><textarea className="mt-1 min-h-20 w-full resize-none rounded-md border border-slate-300 bg-slate-50 p-2 text-xs text-slate-700" id="pix-copy-paste" readOnly value={charge.pixPayload} /></div> : null}
          <div className="flex flex-wrap gap-2">
            {charge.pixPayload ? <button className="inline-flex h-9 items-center gap-2 rounded-md border border-cyan-200 px-3 text-xs font-semibold text-cyan-800 hover:bg-cyan-50" onClick={() => void copyPayload()} type="button"><Clipboard size={14} />{copied ? "Copiado" : "Copiar código"}</button> : null}
            {charge.invoiceUrl ? <a className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={charge.invoiceUrl} rel="noreferrer" target="_blank"><ExternalLink size={14} />Abrir cobrança</a> : null}
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => void createCharge()} type="button"><RefreshCw size={14} />Atualizar cobrança</button>
          </div>
          <p className="text-xs text-slate-500">Vencimento atual: {nextBillingDate || "conforme cobrança"} · Referência: {charge.referenceMonth}</p>
        </div>
      </div> : null}
      {message ? <p className="mt-3 rounded-md bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{message}</p> : null}
    </div>
  );
}
