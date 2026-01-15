export const TIPOS_ATENDIMENTO = [
  "Cirurgia",
  "Consulta",
  "Visita internado",
  "Procedimento em consultório",
  "Exame"
];

export const LOCAIS_ATENDIMENTO = [
  "Consultorio",
  "On-line",
  "HMV",
  "Santa Casa",
  "HMD",
  "HMD CG"
];

// Estrutura para vincular procedimentos ao CBHPM
// TODO: Usuário fornecerá a tabela completa posteriormente
export const PROCEDIMENTOS_CBHPM: Record<string, string> = {
  "Consulta médica": "10101012",
  "Consulta de retorno": "10101020",
  // Adicionar mais procedimentos conforme tabela do usuário
};

// Estrutura para honorários
// TODO: Usuário fornecerá a tabela completa posteriormente
export const TABELA_HONORARIOS: Record<string, number> = {
  "Consulta médica": 500.00,
  "Consulta de retorno": 300.00,
  // Adicionar mais valores conforme tabela do usuário
};
