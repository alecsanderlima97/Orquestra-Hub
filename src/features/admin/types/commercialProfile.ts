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
