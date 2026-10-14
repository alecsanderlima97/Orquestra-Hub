import { describe, expect, it } from "vitest";
import { formatBRL, formatCep, formatCnpj, formatDateInputBR, formatFirebaseDateTime, formatPhone, normalizeDateInput, parseBRL, toTitleCaseBR } from "./br";
describe("formatadores brasileiros", () => {
  it("formata e interpreta valores em reais", () => { expect(formatBRL("123456")).toContain("1.234,56"); expect(parseBRL("R$ 1.234,56")).toBe(1234.56); });
  it("aplica máscaras cadastrais", () => { expect(formatCep("12345678")).toBe("12345-678"); expect(formatCnpj("12345678000190")).toBe("12.345.678/0001-90"); expect(formatPhone("11988881020")).toBe("(11) 98888-1020"); });
  it("normaliza nomes", () => { expect(toTitleCaseBR("LOJA DO CENTRO")).toBe("Loja do Centro"); });
  it("converte Timestamp do Firestore antes de exibir ou salvar uma data", () => {
    const timestamp = { nanoseconds: 0, seconds: Date.UTC(2026, 9, 14, 15) / 1000 };
    expect(normalizeDateInput(timestamp)).toBe("2026-10-14");
    expect(formatDateInputBR(timestamp)).toBe("14/10/2026");
    expect(formatFirebaseDateTime(timestamp)).toContain("14/10/2026");
  });
});
