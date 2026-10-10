import { describe, expect, it } from "vitest";
import { parseBackupPayload, previewBackupPayload } from "./backupRestoreService";

describe("backupRestoreService", () => {
  it("calcula a prévia completa do backup, incluindo categorias e auditoria", () => {
    const preview = previewBackupPayload({
      accounts: [{ id: "account-1" }],
      auditLogs: [{ id: "log-1" }, { id: "log-2" }],
      financialCategories: [{ id: "category-1" }],
      fixedExpenses: [],
      purchases: [{ id: "purchase-1" }],
      stores: [{ id: "store-1" }],
      suppliers: [{ id: "supplier-1" }],
    });

    expect(preview).toEqual({
      accounts: 1,
      auditLogs: 2,
      financialCategories: 1,
      fixedExpenses: 0,
      purchases: 1,
      stores: 1,
      suppliers: 1,
    });
  });

  it("aceita um backup JSON válido", () => {
    expect(parseBackupPayload('{"version":1,"stores":[]}')).toEqual({ version: 1, stores: [] });
  });

  it("rejeita uma estrutura de backup que não seja um objeto", () => {
    expect(() => parseBackupPayload("[]")).toThrow("Arquivo inválido.");
  });
});
