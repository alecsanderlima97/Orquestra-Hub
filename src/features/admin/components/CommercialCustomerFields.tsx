"use client";

import { ExternalLink, LoaderCircle, MapPinned, Search } from "lucide-react";
import { useState } from "react";
import { TextField } from "@/components/ui/TextField";
import { formatCep, formatDocument, toTitleCaseBR } from "@/lib/formatters/br";
import { buildGoogleMapsUrl, type CommercialDocumentType, type CommercialProfile } from "../types/commercialProfile";

type Props = {
  onChange: (updates: Partial<CommercialProfile>) => void;
  value: CommercialProfile;
};

const inputClass = "h-10 rounded-md border border-slate-300 bg-white px-3 text-sm";

export function CommercialCustomerFields({ onChange, value }: Props) {
  const [loading, setLoading] = useState<"cep" | "cnpj" | "" >("");
  const [message, setMessage] = useState("");

  function update(key: keyof CommercialProfile, next: string) {
    onChange({ [key]: next });
  }

  async function lookup(type: "cep" | "cnpj") {
    const raw = type === "cep" ? value.cep || "" : value.document || "";
    const expectedLength = type === "cep" ? 8 : 14;
    const clean = raw.replace(/\D/g, "");
    if (clean.length !== expectedLength) {
      setMessage(type === "cep" ? "Informe um CEP com 8 números." : "Informe um CNPJ com 14 números.");
      return;
    }
    setLoading(type);
    setMessage("");
    try {
      const response = await fetch(`/api/lookup?type=${type}&value=${clean}`);
      const data = await response.json() as CommercialProfile & { error?: string };
      if (!response.ok) throw new Error(data.error || "lookup-failed");
      onChange(data);
      setMessage(type === "cep" ? "Endereço preenchido. Confira antes de salvar." : "Dados da empresa encontrados. Confira antes de salvar.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível consultar os dados.");
    } finally {
      setLoading("");
    }
  }

  function generateMapLink() {
    const mapUrl = buildGoogleMapsUrl(value);
    if (!mapUrl) {
      setMessage("Preencha o endereço antes de gerar o link do Maps.");
      return;
    }
    onChange({ mapUrl });
    setMessage("Link do Google Maps gerado.");
  }

  const mapUrl = value.mapUrl || buildGoogleMapsUrl(value);
  const documentDigits = value.document?.replace(/\D/g, "") || "";
  const documentType = value.documentType || (documentDigits.length === 11 ? "CPF" : "CNPJ");

  return (
    <div className="mt-4 rounded-md border border-cyan-100 bg-cyan-50/40 p-4">
      <div>
        <h4 className="font-semibold text-slate-950">Dados cadastrais e localização</h4>
        <p className="mt-1 text-xs text-slate-600">Consulte os dados quando desejar e confirme antes de salvar. Todos os campos continuam editáveis.</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <div className="md:col-span-2">
          <span className="text-sm font-medium text-slate-700">Documento</span>
          <div className="mt-2 flex gap-2">
            <select aria-label="Tipo de documento" className={inputClass} onChange={(event) => onChange({ documentType: event.target.value as CommercialDocumentType })} value={documentType}>
              <option value="CPF">CPF</option>
              <option value="CNPJ">CNPJ</option>
            </select>
            <input aria-label={documentType} className={`${inputClass} min-w-0 flex-1`} onChange={(event) => onChange({ document: formatDocument(event.target.value), documentType })} placeholder={documentType === "CNPJ" ? "00.000.000/0000-00" : "000.000.000-00"} value={value.document || ""} />
            {documentType === "CNPJ" ? <button aria-label="Consultar CNPJ" className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-md border border-cyan-200 bg-white px-3 text-xs font-semibold text-cyan-800 hover:bg-cyan-50" disabled={loading === "cnpj"} onClick={() => void lookup("cnpj")} title="Consultar dados públicos do CNPJ" type="button">{loading === "cnpj" ? <LoaderCircle className="animate-spin" size={15} /> : <Search size={15} />}Consultar</button> : null}
          </div>
        </div>
        <TextField autoCapitalizeWords={false} label="Razão social" onChange={(event) => update("legalName", event.target.value)} placeholder="Razão social" value={value.legalName || ""} />
        <TextField autoCapitalizeWords={false} label="Nome fantasia" onChange={(event) => update("tradeName", event.target.value)} placeholder="Nome fantasia" value={value.tradeName || ""} />
        <div className="md:col-span-2">
          <span className="text-sm font-medium text-slate-700">CEP</span>
          <div className="mt-2 flex gap-2">
            <input aria-label="CEP" className={`${inputClass} min-w-0 flex-1`} onChange={(event) => update("cep", formatCep(event.target.value))} onBlur={() => { if ((value.cep || "").replace(/\D/g, "").length === 8) void lookup("cep"); }} placeholder="00.000-000" value={value.cep || ""} />
            <button aria-label="Consultar CEP" className="inline-flex h-10 shrink-0 items-center justify-center gap-1 rounded-md border border-cyan-200 bg-white px-3 text-xs font-semibold text-cyan-800 hover:bg-cyan-50" disabled={loading === "cep"} onClick={() => void lookup("cep")} title="Preencher endereço pelo CEP" type="button">{loading === "cep" ? <LoaderCircle className="animate-spin" size={15} /> : <Search size={15} />}Buscar CEP</button>
          </div>
        </div>
        <TextField autoCapitalizeWords={false} label="Endereço" onBlur={(event) => update("address", toTitleCaseBR(event.target.value))} onChange={(event) => update("address", event.target.value)} placeholder="Rua ou avenida" value={value.address || ""} />
        <TextField autoCapitalizeWords={false} label="Número" onChange={(event) => update("addressNumber", event.target.value)} placeholder="Número" value={value.addressNumber || ""} />
        <TextField autoCapitalizeWords={false} label="Complemento" onChange={(event) => update("addressComplement", event.target.value)} placeholder="Complemento" value={value.addressComplement || ""} />
        <TextField autoCapitalizeWords={false} label="Bairro" onBlur={(event) => update("neighborhood", toTitleCaseBR(event.target.value))} onChange={(event) => update("neighborhood", event.target.value)} placeholder="Bairro" value={value.neighborhood || ""} />
        <TextField autoCapitalizeWords={false} label="Cidade" onBlur={(event) => update("city", toTitleCaseBR(event.target.value))} onChange={(event) => update("city", event.target.value)} placeholder="Cidade" value={value.city || ""} />
        <label className="block">
          <span className="text-sm font-medium text-slate-700">UF</span>
          <input aria-label="UF" className={`${inputClass} mt-2 w-full uppercase`} maxLength={2} onChange={(event) => update("state", event.target.value.toUpperCase())} placeholder="UF" value={value.state || ""} />
        </label>
        <div className="flex flex-wrap items-center gap-2 md:col-span-2">
          <button className="inline-flex h-10 items-center gap-2 rounded-md border border-cyan-200 bg-white px-3 text-xs font-semibold text-cyan-800 hover:bg-cyan-50" onClick={generateMapLink} type="button"><MapPinned size={15} />Gerar link do Maps</button>
          {mapUrl ? <a className="inline-flex max-w-full items-center gap-1 truncate text-xs font-semibold text-cyan-700 underline" href={mapUrl} rel="noreferrer" target="_blank" title="Abrir localização no Google Maps"><ExternalLink size={14} />Abrir localização</a> : null}
        </div>
      </div>
      {message ? <p className="mt-3 text-xs font-medium text-cyan-900">{message}</p> : null}
    </div>
  );
}
