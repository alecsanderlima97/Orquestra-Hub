export type ReleaseNote = {
  description: string;
  title: string;
};

export type ReleaseNotes = {
  id: string;
  intro: string;
  items: ReleaseNote[];
  publishedAt: string;
  releaseLabel: string;
  title: string;
  version: string;
};

// Troque o id sempre que uma nova versão relevante for publicada.
export const currentReleaseNotes: ReleaseNotes = {
  id: "2026-10-15-controle-financeiro-organizado",
  intro: "O Orquestra Hub recebeu melhorias para deixar o controle financeiro mais claro, organizado e rápido de consultar.",
  items: [
    { description: "A nova tela de detalhamento facilita a consulta por categoria, loja, fornecedor e período.", title: "Detalhamento financeiro" },
    { description: "Novos cards organizam os principais valores e indicadores sem ocupar a tela inteira logo de início.", title: "Dashboard mais claro" },
    { description: "As listas agora podem ser filtradas e ordenadas pelas colunas, como fornecedor, data e valor.", title: "Filtros nas listas" },
    { description: "Listas extensas começam compactas e podem ser ampliadas pelo botão Ver mais ou ocultadas quando necessário.", title: "Mais organização" },
    { description: "Os valores dos cards financeiros podem ser ocultados pelo botão de olho para mais privacidade.", title: "Privacidade dos valores" },
  ],
  publishedAt: "15/10/2026",
  releaseLabel: "Controle financeiro organizado",
  title: "Novidades do Orquestra Hub",
  version: "0.2.5",
};
