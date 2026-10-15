export type CommercialDocumentType = "CPF" | "CNPJ";

export type CommercialProfile = {
  address?: string;
  addressComplement?: string;
  addressNumber?: string;
  cep?: string;
  city?: string;
  document?: string;
  documentType?: CommercialDocumentType;
  legalName?: string;
  mapUrl?: string;
  neighborhood?: string;
  state?: string;
  tradeName?: string;
};

export function buildGoogleMapsUrl(profile: CommercialProfile) {
  const query = [
    profile.address,
    profile.addressNumber,
    profile.addressComplement,
    profile.neighborhood,
    profile.city,
    profile.state,
    profile.cep,
  ].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

function decodeMapsText(value: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, " ")).replace(/\s+/g, " ").trim();
  } catch {
    return value.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
  }
}

export function parseGoogleMapsLink(rawUrl: string): Partial<CommercialProfile> {
  const parsed = new URL(rawUrl);
  const query = parsed.searchParams.get("query") || parsed.searchParams.get("q");
  const place = parsed.pathname.match(/\/place\/([^/]+)/)?.[1];
  const source = decodeMapsText(query || place || "").replace(/\/@.*$/, "");
  if (!source) return { mapUrl: rawUrl };

  const parts = source.split(",").map((part) => part.trim()).filter(Boolean);
  const cep = source.match(/\b\d{5}-?\d{3}\b/)?.[0] || "";
  const stateIndex = parts.findIndex((part) => /^[-\s]*[A-Za-z]{2}[-\s]*$/.test(part));
  const state = stateIndex >= 0 ? parts[stateIndex].replace(/[^A-Za-z]/g, "").toUpperCase() : "";
  const city = stateIndex > 0 ? parts[stateIndex - 1].replace(/\s+-\s+[A-Za-z]{2}\s*$/i, "").trim() : "";
  const firstLooksAddress = /\b(rua|r\.|avenida|av\.|rodovia|estrada|pra[cç]a|alameda|travessa)\b/i.test(parts[0] || "");
  const hasMultipleParts = parts.length > 1;
  const tradeName = hasMultipleParts && !firstLooksAddress ? parts[0] : "";
  const detailParts = parts.slice(tradeName ? 1 : 0).filter((part) => part !== state && part !== city && !/\b\d{5}-?\d{3}\b/.test(part));
  const numberIndex = detailParts.findIndex((part) => /^\d+[A-Za-z]?$/.test(part));
  const address = detailParts.slice(0, numberIndex >= 0 ? numberIndex : 1).join(", ");
  const addressNumber = numberIndex >= 0 ? detailParts[numberIndex] : "";
  const neighborhood = numberIndex >= 0 ? detailParts[numberIndex + 1] || "" : "";

  return {
    address: address || (tradeName ? "" : source),
    addressNumber,
    cep,
    city,
    mapUrl: rawUrl,
    neighborhood,
    state,
    tradeName: tradeName || undefined,
  };
}
