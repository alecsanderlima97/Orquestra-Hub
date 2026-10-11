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
  id: "2026-10-10-ux-financeiro-corporativo",
  intro: "O Orquestra Hub recebeu uma atualização ampla de organização financeira, identidade visual, segurança e experiência em diferentes dispositivos.",
  items: [
    { description: "Cada parcela agora pode ter seu próprio vencimento.", title: "Vencimento individual por parcela" },
    { description: "Boletos podem ser anexados e consultados diretamente na parcela correspondente.", title: "Anexos por boleto" },
    { description: "O número da nota aparece nas contas, filtros, relatórios e exportações.", title: "Identificação por nota fiscal" },
    { description: "A empresa pode exigir comprovante ao dar baixa em uma conta paga.", title: "Baixa financeira configurável" },
    { description: "Edições, baixas e exclusões financeiras ficam registradas com usuário, data e motivo quando necessário.", title: "Histórico e auditoria" },
    { description: "Relatórios ganharam filtros, detalhamentos por categoria, loja e fornecedor, ordenação por coluna e exportação compatível com Excel.", title: "Relatórios mais completos" },
    { description: "Os formulários de relatório e despesa fixa ficam ocultos até serem solicitados, reduzindo a rolagem e a poluição visual.", title: "Telas mais organizadas" },
    { description: "Listas extensas ganharam rolagem interna, responsividade para notebook, tablet e celular e ações mais fáceis de localizar.", title: "Experiência responsiva" },
    { description: "Valores financeiros podem ser ocultados pelo botão de olho quando houver pessoas por perto.", title: "Privacidade financeira" },
    { description: "Alertas financeiros exibem inicialmente cinco itens, com opção de ver mais quando necessário.", title: "Alertas objetivos" },
    { description: "A auditoria e o histórico financeiro foram reunidos em uma seção própria logo abaixo de Relatórios.", title: "Auditoria mais acessível" },
    { description: "O login Google não exige senha do Orquestra Hub; o acesso por e-mail continua protegido por senha.", title: "Acesso mais claro" },
    { description: "A identidade Orquestra.cs foi aplicada à logo, ao cabeçalho, ao sidebar e à tela de login, com microinterações em cards e botões.", title: "Nova identidade visual" },
    { description: "Backup e restauração passaram a incluir categorias e preservam o histórico de auditoria.", title: "Backup aprimorado" },
  ],
  publishedAt: "10/10/2026",
  releaseLabel: "UX financeira e identidade corporativa",
  title: "Novidades do Orquestra Hub",
  version: "0.2.0",
};
