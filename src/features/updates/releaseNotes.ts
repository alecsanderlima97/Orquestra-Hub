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
  id: "2026-10-14-valor-plano-profissional",
  intro: "O Orquestra Hub recebeu uma nova atualização de estabilidade e de comunicação comercial do Plano Profissional.",
  items: [
    { description: "O valor padrão atualizado do Plano Profissional passa a ser R$ 120,00.", title: "Atualização do Plano Profissional" },
    { description: "Datas vindas do banco agora são convertidas corretamente antes de aparecer na tela.", title: "Abertura mais estável" },
    { description: "Histórico financeiro e auditoria passam a tratar registros antigos e novos com o mesmo formato.", title: "Históricos mais confiáveis" },
    { description: "O vencimento da assinatura também é normalizado para evitar falhas em contas específicas.", title: "Datas de assinatura corrigidas" },
    { description: "Listas extensas continuam mostrando somente os oito primeiros itens ao abrir a tela.", title: "Listas mais objetivas" },
  ],
  publishedAt: "14/10/2026",
  releaseLabel: "Plano Profissional atualizado",
  title: "Novidades do Orquestra Hub",
  version: "0.2.3",
};
