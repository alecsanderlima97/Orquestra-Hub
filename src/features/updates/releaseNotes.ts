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
  id: "2026-10-15-cadastro-comercial-clientes",
  intro: "O Orquestra Hub recebeu uma nova atualização para organizar melhor o cadastro das empresas e facilitar a localização dos clientes.",
  items: [
    { description: "O cadastro comercial agora permite registrar CPF ou CNPJ, com máscara adequada para cada documento.", title: "Documentos da empresa" },
    { description: "O CNPJ pode ser consultado e o CEP pode preencher o endereço automaticamente, sempre permitindo revisão antes de salvar.", title: "Consultas de cadastro" },
    { description: "O endereço pode gerar um link direto para abrir a localização no Google Maps.", title: "Localização mais fácil" },
    { description: "Os novos dados ficam vinculados à empresa no Hub e também podem ser editados pela Central Administrativa.", title: "Cadastro integrado" },
    { description: "Os fluxos financeiros, planos, convites e permissões existentes continuam preservados.", title: "Operação mantida" },
  ],
  publishedAt: "15/10/2026",
  releaseLabel: "Cadastro comercial aprimorado",
  title: "Novidades do Orquestra Hub",
  version: "0.2.4",
};
