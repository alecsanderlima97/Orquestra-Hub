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
  id: "2026-10-11-listas-organizadas",
  intro: "O Orquestra Hub recebeu uma melhoria de organização para facilitar a leitura e reduzir a rolagem nas telas financeiras.",
  items: [
    { description: "Listas extensas agora mostram somente os oito primeiros itens ao abrir a tela.", title: "Listas mais objetivas" },
    { description: "O botão Ver mais expande os registros restantes sem aumentar indefinidamente a página.", title: "Ver mais quando necessário" },
    { description: "Ao expandir uma lista, os itens ficam em uma área com rolagem interna e o botão Ocultar retorna à visão compacta.", title: "Rolagem interna e ocultar" },
    { description: "Últimas alterações e outros painéis recolhíveis agora deixam claro quando estão abertos ou fechados.", title: "Controles mais claros" },
    { description: "Alertas financeiros continuam exibindo cinco itens inicialmente para preservar a leitura rápida.", title: "Alertas objetivos" },
  ],
  publishedAt: "11/10/2026",
  releaseLabel: "Listas financeiras mais organizadas",
  title: "Novidades do Orquestra Hub",
  version: "0.2.1",
};
