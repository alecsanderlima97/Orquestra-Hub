import { describe, expect, it } from "vitest";
import { nextMonthDate, parseServerMoney } from "./billingServer";

describe("billingServer", () => {
  it("converte valores brasileiros no servidor", () => {
    expect(parseServerMoney("R$ 1.299,90")).toBe(1299.9);
    expect(parseServerMoney("R$ 120,00")).toBe(120);
  });

  it("preserva o ultimo dia valido ao avancar a mensalidade", () => {
    expect(nextMonthDate("2026-01-31")).toBe("2026-02-28");
    expect(nextMonthDate("2028-01-31")).toBe("2028-02-29");
    expect(nextMonthDate("2026-12-15")).toBe("2027-01-15");
  });
});
