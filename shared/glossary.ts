/**
 * GORGEN v3.0 - Glossário e Definição de Termos
 * 
 * Este arquivo contém as definições oficiais de termos e formatações
 * utilizadas em todo o sistema Gorgen. Qualquer alteração neste arquivo
 * requer aprovação do Dr. André Gorgen.
 * 
 * REGRA FUNDAMENTAL: Não usamos uma mesma palavra para dois contextos
 * diferentes e não usamos diferentes formatações para o mesmo tipo de variável.
 */

// =============================================================================
// DEFINIÇÕES DE TERMOS
// =============================================================================

export const GLOSSARIO = {
  /**
   * CADASTRO: Conjunto de dados de caráter pessoal e imutável ou dificilmente
   * mutável. São dados como nome, número de documentos oficiais, endereço
   * residencial e profissional, dados de contato.
   */
  CADASTRO: 'cadastro',

  /**
   * CLIENTE: É o usuário com assinatura ativa do sistema.
   */
  CLIENTE: 'cliente',

  /**
   * PERFIL: Tipo de interação do usuário com o sistema. Elimina funções
   * desnecessárias ao perfil e salienta os prováveis maiores interesses
   * do usuário. Pode ser: médico, administrador, paciente, auditor ou secretária.
   */
  PERFIL: 'perfil',

  /**
   * USUÁRIO: É o ser humano que interage com o Gorgen.
   */
  USUARIO: 'usuário',

  /**
   * AGENDAMENTO: Compromisso com data e hora marcados entre médico e paciente.
   * Pode ter qualquer finalidade.
   */
  AGENDAMENTO: 'agendamento',

  /**
   * EXAME LABORATORIAL: Exame realizado em setor de bioquímica e/ou hematologia
   * do hospital. São exames que usam fluidos corporais como amostra.
   */
  EXAME_LABORATORIAL: 'exame laboratorial',

  /**
   * EXAME DE IMAGEM: Exames que têm como base de interpretação uma imagem
   * radiológica.
   */
  EXAME_IMAGEM: 'exame de imagem',

  /**
   * CARDIOLOGIA: São exames de avaliação cardiovascular, tais como
   * eletrocardiograma (ECG), ecocardiografia, HOLTER, MAPA, ergometria.
   */
  CARDIOLOGIA: 'cardiologia',

  /**
   * ATENDIMENTO: Qualquer interação entre médico e paciente que gere ato
   * médico e resulte em compromisso de honorário médico.
   */
  ATENDIMENTO: 'atendimento',

  /**
   * ESPECIALIDADE MÉDICA: São subgrupos de ato médico reconhecido pelo
   * Conselho Federal de Medicina do Brasil. Existem 55 opções e cada
   * médico pode ter no máximo duas.
   */
  ESPECIALIDADE_MEDICA: 'especialidade médica',

  /**
   * ÁREA DE ATUAÇÃO: É uma subdivisão de uma especialidade. Existem 62
   * opções e cada médico pode ter no máximo uma.
   */
  AREA_ATUACAO: 'área de atuação',

  /**
   * CONTA: Equivalente a tenant. Representa uma instância isolada de dados
   * no sistema multi-tenant.
   */
  CONTA: 'conta',

  /**
   * ID DE PACIENTE: Código que identifica um paciente único dentro do sistema.
   * É de uso único e imutável. Caso o paciente seja excluído do banco de dados,
   * o número é descartado e não voltará a ser usado por outro paciente.
   * Caso o mesmo paciente volte um dia a figurar no sistema, ele volta a
   * receber o mesmo ID de paciente inicialmente atribuído a ele.
   * Formato: aaaa-xxxxxxx (ex: 2026-0000001)
   */
  ID_PACIENTE: 'ID de paciente',

  /**
   * ID DE ATENDIMENTO: Código que identifica um atendimento único. É imutável
   * e único. Formato: ID do paciente seguido de "-aaaannnn"
   * (ex: 2026-0000001-20260001)
   */
  ID_ATENDIMENTO: 'ID de atendimento',
} as const;

// =============================================================================
// FORMATAÇÕES
// =============================================================================

/**
 * Dias da semana - Formato oficial
 */
export const DIAS_SEMANA = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
] as const;

/**
 * Formata número no padrão brasileiro: xx.xxx.xxx,xx
 * Separador de milhares: "."
 * Separador decimal: ","
 */
export function formatarNumero(valor: number, casasDecimais: number = 2): string {
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: casasDecimais,
    maximumFractionDigits: casasDecimais,
  });
}

/**
 * Formata valor monetário no padrão brasileiro: R$ xx.xxx,xx
 */
export function formatarMoeda(valor: number): string {
  return valor.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

/**
 * Formata CPF no padrão: xxx.xxx.xxx-xx
 */
export function formatarCPF(cpf: string): string {
  const numeros = cpf.replace(/\D/g, '');
  if (numeros.length !== 11) return cpf;
  return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Máscara de CPF para inputs: xxx.xxx.xxx-xx
 */
export const MASCARA_CPF = '###.###.###-##';

/**
 * Formata telefone no padrão: (xx) xxxxx-xxxx
 */
export function formatarTelefone(telefone: string): string {
  const numeros = telefone.replace(/\D/g, '');
  if (numeros.length === 11) {
    return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  }
  if (numeros.length === 10) {
    return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  return telefone;
}

/**
 * Máscara de telefone para inputs: (xx) xxxxx-xxxx
 */
export const MASCARA_TELEFONE = '(##) #####-####';

/**
 * Formata CEP no padrão brasileiro: xxxxx-xxx
 */
export function formatarCEP(cep: string): string {
  const numeros = cep.replace(/\D/g, '');
  if (numeros.length !== 8) return cep;
  return numeros.replace(/(\d{5})(\d{3})/, '$1-$2');
}

/**
 * Máscara de CEP para inputs: xxxxx-xxx
 */
export const MASCARA_CEP = '#####-###';

/**
 * Gera ID de paciente no formato: aaaa-xxxxxxx
 * @param ano Ano do cadastro (4 dígitos)
 * @param sequencia Número sequencial (será formatado com 7 dígitos)
 */
export function gerarIdPaciente(ano: number, sequencia: number): string {
  return `${ano}-${sequencia.toString().padStart(7, '0')}`;
}

/**
 * Gera ID de atendimento no formato: idPaciente-aaaannnn
 * @param idPaciente ID do paciente (ex: 2026-0000001)
 * @param anoAtendimento Ano do atendimento (4 dígitos)
 * @param sequenciaAtendimento Sequência de atendimentos do paciente (será formatado com 4 dígitos)
 */
export function gerarIdAtendimento(
  idPaciente: string,
  anoAtendimento: number,
  sequenciaAtendimento: number
): string {
  return `${idPaciente}-${anoAtendimento}${sequenciaAtendimento.toString().padStart(4, '0')}`;
}

/**
 * Formata data no padrão brasileiro: dd/mm/aaaa
 */
export function formatarData(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Formata data e hora no padrão brasileiro: dd/mm/aaaa às hh:mm
 */
export function formatarDataHora(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  return `${d.toLocaleDateString('pt-BR')} às ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
}

/**
 * Retorna o dia da semana por extenso
 */
export function obterDiaSemana(data: Date | string): string {
  const d = typeof data === 'string' ? new Date(data) : data;
  return DIAS_SEMANA[d.getDay()];
}

// =============================================================================
// CONVÊNIOS RECONHECIDOS
// =============================================================================

/**
 * Lista completa de convênios reconhecidos pelo sistema
 * Atualizada em 11/01/2026 com base na migração de 21.644 pacientes
 */
export const CONVENIOS = [
  'AFRAFEP',
  'AMIL',
  'ASSEFAZ',
  'BRADESCO SAÚDE',
  'CABERGS',
  'CAMED',
  'CASSI',
  'CCG',
  'CORTESIA',
  'DOCTORCLIN',
  'EMBRATEL',
  'FAPES',
  'FUNDAFFEMG',
  'GEAP',
  'GKN',
  'HAPVIDA',
  'IPE SAÚDE',
  'MEDISERVICE',
  'NOTRE DAME',
  'PARTICULAR',
  'PARTICULAR COM 25% DESCONTO',
  'PETROBRAS',
  'POSTAL SAUDE',
  'RETORNO DE PARTICULAR',
  'SAUDE BNDES',
  'SAÚDE CAIXA',
  'SAÚDE PAS',
  'SULAMÉRICA',
  'SULMED',
  'SUS',
  'TELOS',
  'UNAFISCO',
  'UNIMED',
] as const;

export type Convenio = typeof CONVENIOS[number];

// =============================================================================
// TIPOS DE ATENDIMENTO
// =============================================================================

export const TIPOS_ATENDIMENTO = {
  /**
   * CONSULTA: Consulta médica com horário pré-determinado, realizada em consultório.
   */
  CONSULTA: 'Consulta',

  /**
   * CIRURGIA: Compreende procedimentos invasivos, anestesias, parto,
   * realizados em ambiente hospitalar.
   */
  CIRURGIA: 'Cirurgia',

  /**
   * PROCEDIMENTO EM CONSULTÓRIO: São procedimentos que geram honorários
   * separados, geralmente de pequeno porte, sem anestesia geral,
   * realizado em consultório.
   */
  PROCEDIMENTO_CONSULTORIO: 'Procedimento em consultório',

  /**
   * VISITA HOSPITALAR: Visita realizada em paciente internado em hospital.
   */
  VISITA_HOSPITALAR: 'Visita hospitalar',
} as const;

export type TipoAtendimento = typeof TIPOS_ATENDIMENTO[keyof typeof TIPOS_ATENDIMENTO];

export const LISTA_TIPOS_ATENDIMENTO = Object.values(TIPOS_ATENDIMENTO);

// =============================================================================
// PERFIS DE USUÁRIO
// =============================================================================

export const PERFIS = {
  MEDICO: 'médico',
  ADMINISTRADOR: 'administrador',
  PACIENTE: 'paciente',
  AUDITOR: 'auditor',
  SECRETARIA: 'secretária',
} as const;

export type PerfilUsuario = typeof PERFIS[keyof typeof PERFIS];

// =============================================================================
// TIPOS DE EXAME
// =============================================================================

export const TIPOS_EXAME = {
  LABORATORIAL: 'Exame laboratorial',
  IMAGEM: 'Exame de imagem',
  CARDIOLOGIA: 'Cardiologia',
} as const;

export type TipoExame = typeof TIPOS_EXAME[keyof typeof TIPOS_EXAME];

// =============================================================================
// VALIDAÇÕES
// =============================================================================

/**
 * Valida formato de CPF (apenas formato, não valida dígitos verificadores)
 */
export function validarFormatoCPF(cpf: string): boolean {
  const numeros = cpf.replace(/\D/g, '');
  return numeros.length === 11;
}

/**
 * Valida formato de ID de paciente: aaaa-xxxxxxx
 */
export function validarIdPaciente(id: string): boolean {
  return /^\d{4}-\d{7}$/.test(id);
}

/**
 * Valida formato de ID de atendimento: aaaa-xxxxxxx-aaaannnn
 */
export function validarIdAtendimento(id: string): boolean {
  return /^\d{4}-\d{7}-\d{8}$/.test(id);
}
