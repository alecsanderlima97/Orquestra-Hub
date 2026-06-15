import { describe, expect, it } from "vitest";
import { buildFinancialAlerts, daysUntil } from "./financialAlerts";
describe("financialAlerts", () => {
  it("calcula a antecedência", () => expect(daysUntil(new Date(2026, 5, 20), new Date(2026, 5, 15))).toBe(5));
  it("identifica conta atrasada", () => { const alerts = buildFinancialAlerts([{ amount: "R$ 100,00", dueDate: "14/06/2026", id: "1", installment: "1/1", status: "Aberto", store: "Loja", supplier: "Fornecedor" }], [], 5, new Date(2026, 5, 15)); expect(alerts[0].kind).toBe("Atrasada"); });
});
