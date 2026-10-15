import { NextResponse } from "next/server";
import { parseGoogleMapsLink } from "@/features/admin/types/commercialProfile";

function digits(value: string) {
  return value.replace(/\D/g, "");
}

async function fetchJson(url: string) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error("lookup-unavailable");
  return response.json() as Promise<Record<string, unknown>>;
}

function isGoogleMapsHost(hostname: string) {
  const host = hostname.toLowerCase();
  return host === "google.com" || host.endsWith(".google.com") || host === "goo.gl" || host.endsWith(".goo.gl");
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
      const data = await fetchJson(`https://brasilapi.com.br/api/cnpj/v1/${value}`);
      return NextResponse.json({
        address: String(data.logradouro || ""),
        addressComplement: String(data.complemento || ""),
        addressNumber: String(data.numero || ""),
        cep: String(data.cep || ""),
        city: String(data.municipio || ""),
        document: value,
        documentType: "CNPJ",
        legalName: String(data.razao_social || ""),
        neighborhood: String(data.bairro || ""),
        state: String(data.uf || ""),
        tradeName: String(data.nome_fantasia || ""),
      });
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
      return NextResponse.json(parseGoogleMapsLink(resolvedUrl));
    }

    return NextResponse.json({ error: "Tipo de consulta inválido." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Não foi possível consultar os dados agora. Confira e preencha manualmente." }, { status: 502 });
  }
}
