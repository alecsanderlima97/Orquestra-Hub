export type ReleaseNote = {
  description: string;
  title: string;
};

export type ReleaseNotes = {
  id: string;
  intro: string;
  items: ReleaseNote[];
  publishedAt: string;
  title: string;
};

// Troque o id sempre que uma nova versão relevante for publicada.
export const currentReleaseNotes: ReleaseNotes = {
  id: "2026-10-10-financeiro-corporativo",
  intro: "O Orquestra Hub recebeu melhorias para deixar os lançamentos financeiros mais rastreáveis e práticos.",
  items: [
    { description: "Cada parcela agora pode ter seu próprio vencimento.", title: "Vencimento individual por parcela" },
    { description: "Boletos podem ser anexados e consultados diretamente na parcela correspondente.", title: "Anexos por boleto" },
    { description: "O número da nota aparece nas contas, filtros, relatórios e exportações.", title: "Identificação por nota fiscal" },
    { description: "A empresa pode exigir comprovante ao dar baixa em uma conta paga.", title: "Baixa financeira configurável" },
    { description: "Edições, baixas e exclusões financeiras ficam registradas com usuário, data e motivo quando necessário.", title: "Histórico e auditoria" },
    { description: "Relatórios ganharam filtros, visões por status e exportação compatível com Excel.", title: "Relatórios mais completos" },
    { description: "Backup e restauração passaram a incluir categorias e preservam o histórico de auditoria.", title: "Backup aprimorado" },
  ],
  publishedAt: "10/10/2026",
  title: "Novidades do Orquestra Hub",
};
