import { describe, expect, it } from "vitest";
import { buildGoogleMapsUrl, parseGoogleMapsLink } from "./commercialProfile";

describe("perfil comercial", () => {
  it("gera um link do Google Maps com o endereco completo", () => {
    const url = buildGoogleMapsUrl({ address: "Rua Central", addressNumber: "100", city: "Sorocaba", state: "SP", cep: "18000-000" });
    expect(url).toContain("google.com/maps/search/");
    expect(url).toContain(encodeURIComponent("Rua Central, 100, Sorocaba, SP, 18000-000"));
  });

  it("aproveita nome e endereco de um link completo do Maps", () => {
    const profile = parseGoogleMapsLink("https://www.google.com/maps/search/?api=1&query=Mercado+Central%2C+Rua+Central%2C+100%2C+Centro%2C+Sorocaba%2C+SP%2C+18000-000");
    expect(profile).toMatchObject({ address: "Rua Central", addressNumber: "100", city: "Sorocaba", cep: "18000-000", neighborhood: "Centro", state: "SP", tradeName: "Mercado Central" });
  });
});
