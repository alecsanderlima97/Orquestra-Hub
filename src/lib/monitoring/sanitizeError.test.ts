import { describe, expect, it } from "vitest";
import { errorProtocol, sanitizeError } from "./sanitizeError";

describe("monitoramento seguro", () => {
  it("remove termos sensíveis", () => expect(sanitizeError("Authorization: Bearer abc token senha password API_KEY")).not.toContain("abc"));
  it("gera protocolo rastreável", () => expect(errorProtocol()).toMatch(/^ERR-[A-Z0-9]+$/));
});
