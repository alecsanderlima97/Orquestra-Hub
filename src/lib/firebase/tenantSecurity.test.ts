import { describe, expect, it } from "vitest";
import { tenantFromAttachmentPath } from "./tenantSecurity";

describe("tenantFromAttachmentPath", () => {
  it("extrai a empresa proprietária do arquivo", () => expect(tenantFromAttachmentPath("empresa-a/compra/notas/arquivo.pdf")).toBe("empresa-a"));
  it("rejeita tentativa de navegar entre pastas", () => expect(tenantFromAttachmentPath("empresa-a/../empresa-b/arquivo.pdf")).toBeNull());
  it("rejeita caminho absoluto", () => expect(tenantFromAttachmentPath("/empresa-a/arquivo.pdf")).toBeNull());
});
