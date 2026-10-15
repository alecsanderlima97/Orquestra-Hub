import { describe, expect, it } from "vitest";
import { buildGoogleMapsUrl } from "./commercialProfile";

describe("perfil comercial", () => {
  it("gera um link do Google Maps com o endereco completo", () => {
    const url = buildGoogleMapsUrl({ address: "Rua Central", addressNumber: "100", city: "Sorocaba", state: "SP", cep: "18000-000" });
    expect(url).toContain("google.com/maps/search/");
    expect(url).toContain(encodeURIComponent("Rua Central, 100, Sorocaba, SP, 18000-000"));
  });
});
