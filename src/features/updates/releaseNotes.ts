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
  id: "2026-10-14-correcao-timestamps",
  intro: "O Orquestra Hub recebeu uma correção de estabilidade para evitar falhas ao abrir contas com datas salvas no banco de dados.",
  items: [
    { description: "Datas vindas do banco agora são convertidas corretamente antes de aparecer na tela.", title: "Abertura mais estável" },
    { description: "Histórico financeiro e auditoria passam a tratar registros antigos e novos com o mesmo formato.", title: "Históricos mais confiáveis" },
    { description: "O vencimento da assinatura também é normalizado para evitar falhas em contas específicas.", title: "Datas de assinatura corrigidas" },
    { description: "Listas extensas continuam mostrando somente os oito primeiros itens ao abrir a tela.", title: "Listas mais objetivas" },
    { description: "O botão Ver mais expande os registros restantes em uma área com rolagem interna.", title: "Ver mais quando necessário" },
  ],
  publishedAt: "14/10/2026",
  releaseLabel: "Correção de estabilidade e datas",
  title: "Novidades do Orquestra Hub",
  version: "0.2.2",
};
