import { describe, expect, it } from "vitest";
import { formatBRL, formatCep, formatCnpj, formatPhone, parseBRL, toTitleCaseBR } from "./br";
describe("formatadores brasileiros", () => {
  it("formata e interpreta valores em reais", () => { expect(formatBRL("123456")).toContain("1.234,56"); expect(parseBRL("R$ 1.234,56")).toBe(1234.56); });
  it("aplica máscaras cadastrais", () => { expect(formatCep("12345678")).toBe("12345-678"); expect(formatCnpj("12345678000190")).toBe("12.345.678/0001-90"); expect(formatPhone("11988881020")).toBe("(11) 98888-1020"); });
  it("normaliza nomes", () => { expect(toTitleCaseBR("LOJA DO CENTRO")).toBe("Loja do Centro"); });
});
