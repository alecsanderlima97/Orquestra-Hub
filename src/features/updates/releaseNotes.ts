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
  id: "2026-10-29-previsao-proximo-mes",
  intro: "O relatório financeiro agora ajuda a planejar o próximo mês reunindo despesas fixas e outras contas previstas.",
  items: [
    { description: "Consulte as despesas fixas ativas que deverão ser pagas no próximo mês.", title: "Despesas fixas no relatório" },
    { description: "Veja separadamente outras contas já lançadas para o mês seguinte.", title: "Contas previstas" },
    { description: "O sistema soma os compromissos sem duplicar despesas recorrentes já lançadas.", title: "Total previsto do mês" },
    { description: "A previsão também acompanha a exportação para Excel e a impressão em PDF.", title: "Exportação completa" },
  ],
  publishedAt: "29/10/2026",
  releaseLabel: "Previsão financeira mensal",
  title: "Novidades do Orquestra Hub",
  version: "0.2.6",
};
