import { NextResponse } from "next/server";
import { parseGoogleMapsLink } from "@/features/admin/types/commercialProfile";

function digits(value: string) {
  return value.replace(/\D/g, "");
}

async function fetchJson(url: string) {
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("lookup-unavailable");
  return response.json() as Promise<Record<string, unknown>>;
}

function isValidCnpj(value: string) {
  if (value.length !== 14 || /^([0-9])\1+$/.test(value)) return false;
  const calculateDigit = (source: string) => {
    let factor = source.length - 7;
    let total = 0;
    for (const character of source) {
      total += Number(character) * factor;
      factor -= 1;
      if (factor === 1) factor = 9;
    }
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };
  return calculateDigit(value.slice(0, 12)) === Number(value[12])
    && calculateDigit(value.slice(0, 13)) === Number(value[13]);
}

function normalizeCnpjData(data: Record<string, unknown>, source: "brasilapi" | "receitaws", document: string) {
  if (source === "receitaws" && String(data.status || "").toUpperCase() === "ERROR") throw new Error("cnpj-not-found");
  const legalName = source === "brasilapi" ? data.razao_social : data.nome;
  const tradeName = source === "brasilapi" ? data.nome_fantasia : data.fantasia;
  return {
    address: String(data.logradouro || ""),
    addressComplement: String(data.complemento || ""),
    addressNumber: String(data.numero || ""),
    cep: String(data.cep || ""),
    city: String(data.municipio || ""),
    document,
    documentType: "CNPJ",
    legalName: String(legalName || ""),
    neighborhood: String(data.bairro || ""),
    state: String(data.uf || ""),
    tradeName: String(tradeName || ""),
  };
}

async function fetchCnpj(document: string) {
  const sources = [
    {
      name: "brasilapi" as const,
      url: `https://brasilapi.com.br/api/cnpj/v1/${document}`,
    },
    {
      name: "receitaws" as const,
      url: `https://www.receitaws.com.br/v1/cnpj/${document}`,
    },
  ];
  let lastError: unknown;
  for (const source of sources) {
    try {
      const data = await fetchJson(source.url);
      const normalized = normalizeCnpjData(data, source.name, document);
      if (normalized.legalName || normalized.tradeName || normalized.address) return normalized;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError || new Error("cnpj-not-found");
}

function isGoogleMapsHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "google.com" || host.endsWith(".google.com") || host === "share.google" || host === "goo.gl" || host.endsWith(".goo.gl");
}

function isGoogleMapsLocation(url: URL) {
  const host = url.hostname.toLowerCase();
  return (host === "google.com" || host.endsWith(".google.com")) && (host.startsWith("maps.") || url.pathname === "/maps" || url.pathname.startsWith("/maps/"));
}

async function resolveMapsUrl(rawUrl: string) {
  let current = new URL(rawUrl);
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (!isGoogleMapsHost(current.hostname)) throw new Error("maps-host-invalid");
    const response = await fetch(current, { redirect: "manual", signal: AbortSignal.timeout(8000) });
    if (response.status < 300 || response.status >= 400) return current.toString();
    const location = response.headers.get("location");
    if (!location) return current.toString();
    current = new URL(location, current);
  }
  return current.toString();
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  const rawValue = url.searchParams.get("value") || "";
  const value = digits(rawValue);

  try {
    if (type === "cep") {
      if (value.length !== 8) return NextResponse.json({ error: "CEP inválido." }, { status: 400 });
      const data = await fetchJson(`https://viacep.com.br/ws/${value}/json/`);
      if (data.erro) return NextResponse.json({ error: "CEP não encontrado." }, { status: 404 });
      return NextResponse.json({
        address: String(data.logradouro || ""),
        cep: String(data.cep || value),
        city: String(data.localidade || ""),
        neighborhood: String(data.bairro || ""),
        state: String(data.uf || ""),
      });
    }

    if (type === "cnpj") {
      if (value.length !== 14) return NextResponse.json({ error: "CNPJ inválido." }, { status: 400 });
      if (!isValidCnpj(value)) return NextResponse.json({ error: "CNPJ inválido. Confira os números informados." }, { status: 400 });
      try {
        return NextResponse.json(await fetchCnpj(value));
      } catch (error) {
        if (error instanceof Error && error.message === "cnpj-not-found") {
          return NextResponse.json({ error: "CNPJ não encontrado nas bases públicas. Confira os números e preencha manualmente." }, { status: 404 });
        }
        throw error;
      }
    }

    if (type === "maps") {
      let mapsUrl: URL;
      try {
        mapsUrl = new URL(rawValue);
      } catch {
        return NextResponse.json({ error: "Cole um link válido do Google Maps." }, { status: 400 });
      }
      if (!isGoogleMapsHost(mapsUrl.hostname)) return NextResponse.json({ error: "Use um link do Google Maps." }, { status: 400 });
      const resolvedUrl = await resolveMapsUrl(rawValue);
      if (!isGoogleMapsLocation(new URL(resolvedUrl))) {
        return NextResponse.json({ error: "Esse link veio da Pesquisa Google e não contém os dados da ficha. Abra o local no Google Maps e copie o link da localização." }, { status: 422 });
      }
      return NextResponse.json(parseGoogleMapsLink(resolvedUrl));
    }

    return NextResponse.json({ error: "Tipo de consulta inválido." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar os dados agora. Confira e preencha manualmente." }, { status: 502 });
  }
}
