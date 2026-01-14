/**
 * Matriz de Permissões por Perfil - Gorgen v2.5
 * 
 * Baseado nos Pilares Fundamentais do Gorgen:
 * - Pilar 5: Controle de Acesso Baseado em Perfis
 * 
 * Perfis:
 * - admin_master: Acesso total ao sistema
 * - medico: Acesso clínico completo
 * - secretaria: Acesso administrativo (agenda, pacientes)
 * - auditor: Acesso para auditoria (visualização ampla, sem edição)
 * - paciente: Acesso limitado aos próprios dados
 */

export type PerfilType = 'admin_master' | 'medico' | 'secretaria' | 'auditor' | 'paciente';

export type Funcionalidade = 
  | 'dashboard'
  | 'agenda'
  | 'agenda.criar'
  | 'agenda.editar'
  | 'agenda.cancelar'
  | 'pacientes'
  | 'pacientes.criar'
  | 'pacientes.editar'
  | 'prontuario'
  | 'prontuario.editar'
  | 'atendimentos'
  | 'atendimentos.criar'
  | 'atendimentos.editar'
  | 'faturamento'
  | 'faturamento.criar'
  | 'faturamento.editar'
  | 'relatorios'
  | 'relatorios.financeiro'
  | 'configuracoes'
  | 'configuracoes.sistema'
  | 'configuracoes.backup'
  | 'usuarios'
  | 'usuarios.criar'
  | 'usuarios.editar'
  | 'admin_tenants'
  | 'compartilhamento'
  | 'compartilhamento.solicitar'
  | 'compartilhamento.aprovar'
  | 'compartilhamento.revogar';

// Matriz de permissões: true = permitido, false = negado
export const permissoesPorPerfil: Record<PerfilType, Record<Funcionalidade, boolean>> = {
  admin_master: {
    dashboard: true,
    agenda: true,
    'agenda.criar': true,
    'agenda.editar': true,
    'agenda.cancelar': true,
    pacientes: true,
    'pacientes.criar': true,
    'pacientes.editar': true,
    prontuario: true,
    'prontuario.editar': true,
    atendimentos: true,
    'atendimentos.criar': true,
    'atendimentos.editar': true,
    faturamento: true,
    'faturamento.criar': true,
    'faturamento.editar': true,
    relatorios: true,
    'relatorios.financeiro': true,
    configuracoes: true,
    'configuracoes.sistema': true,
    'configuracoes.backup': true,
    usuarios: true,
    'usuarios.criar': true,
    'usuarios.editar': true,
    admin_tenants: true,
    compartilhamento: true,
    'compartilhamento.solicitar': true,
    'compartilhamento.aprovar': true,
    'compartilhamento.revogar': true,
  },
  medico: {
    dashboard: true,
    agenda: true,
    'agenda.criar': true,
    'agenda.editar': true,
    'agenda.cancelar': true,
    pacientes: true,
    'pacientes.criar': true,
    'pacientes.editar': true,
    prontuario: true,
    'prontuario.editar': true,
    atendimentos: true,
    'atendimentos.criar': true,
    'atendimentos.editar': true,
    faturamento: false, // Médico não acessa faturamento
    'faturamento.criar': false,
    'faturamento.editar': false,
    relatorios: true,
    'relatorios.financeiro': false, // Médico não vê relatórios financeiros
    configuracoes: true,
    'configuracoes.sistema': false,
    'configuracoes.backup': false, // Backup apenas para Admin Master
    usuarios: false,
    'usuarios.criar': false,
    'usuarios.editar': false,
    admin_tenants: false,
    compartilhamento: true,
    'compartilhamento.solicitar': true,
    'compartilhamento.aprovar': true,
    'compartilhamento.revogar': true,
  },
  secretaria: {
    dashboard: true,
    agenda: true,
    'agenda.criar': true,
    'agenda.editar': true,
    'agenda.cancelar': true,
    pacientes: true,
    'pacientes.criar': true,
    'pacientes.editar': true,
    prontuario: false, // Secretária não acessa prontuário
    'prontuario.editar': false,
    atendimentos: true,
    'atendimentos.criar': true,
    'atendimentos.editar': false, // Pode criar mas não editar
    faturamento: false, // Secretária não acessa faturamento
    'faturamento.criar': false,
    'faturamento.editar': false,
    relatorios: true,
    'relatorios.financeiro': false,
    configuracoes: true,
    'configuracoes.sistema': false,
    'configuracoes.backup': false, // Backup apenas para Admin Master
    usuarios: false,
    'usuarios.criar': false,
    'usuarios.editar': false,
    admin_tenants: false,
    compartilhamento: false,
    'compartilhamento.solicitar': false,
    'compartilhamento.aprovar': false,
    'compartilhamento.revogar': false,
  },
  auditor: {
    dashboard: true,
    agenda: true, // Pode ver agenda para auditoria
    'agenda.criar': false,
    'agenda.editar': false,
    'agenda.cancelar': false,
    pacientes: true, // Pode ver dados do paciente para auditoria
    'pacientes.criar': false,
    'pacientes.editar': false,
    prontuario: true, // Auditor pode ver prontuário para auditoria
    'prontuario.editar': false, // Mas não pode editar
    atendimentos: true, // Pode ver atendimentos para auditoria
    'atendimentos.criar': false,
    'atendimentos.editar': false,
    faturamento: true, // Pode ver faturamento para auditoria
    'faturamento.criar': false,
    'faturamento.editar': false,
    relatorios: true,
    'relatorios.financeiro': true, // Pode ver relatórios financeiros
    configuracoes: true,
    'configuracoes.sistema': false,
    'configuracoes.backup': false, // Backup apenas para Admin Master
    usuarios: false,
    'usuarios.criar': false,
    'usuarios.editar': false,
    admin_tenants: false,
    compartilhamento: true, // Auditor pode ver compartilhamentos para auditoria
    'compartilhamento.solicitar': false,
    'compartilhamento.aprovar': false,
    'compartilhamento.revogar': false,
  },
  paciente: {
    dashboard: false, // Paciente não vê dashboard geral
    agenda: true, // Pode ver sua própria agenda
    'agenda.criar': false,
    'agenda.editar': false,
    'agenda.cancelar': false,
    pacientes: false, // Não vê lista de pacientes
    'pacientes.criar': false,
    'pacientes.editar': false,
    prontuario: true, // Pode ver seu próprio prontuário
    'prontuario.editar': false,
    atendimentos: true, // Pode ver seus próprios atendimentos
    'atendimentos.criar': false,
    'atendimentos.editar': false,
    faturamento: true, // Pode ver suas próprias faturas
    'faturamento.criar': false,
    'faturamento.editar': false,
    relatorios: false,
    'relatorios.financeiro': false,
    configuracoes: true, // Pode acessar suas configurações
    'configuracoes.sistema': false,
    'configuracoes.backup': false, // Backup apenas para Admin Master
    usuarios: false,
    'usuarios.criar': false,
    'usuarios.editar': false,
    admin_tenants: false,
    compartilhamento: true, // Paciente pode ver seus compartilhamentos
    'compartilhamento.solicitar': false,
    'compartilhamento.aprovar': true, // Paciente pode aprovar compartilhamento de seus dados
    'compartilhamento.revogar': true, // Paciente pode revogar compartilhamento de seus dados
  },
};

/**
 * Verifica se um perfil tem permissão para uma funcionalidade
 */
export function temPermissao(perfil: PerfilType | null | undefined, funcionalidade: Funcionalidade): boolean {
  if (!perfil) return false;
  return permissoesPorPerfil[perfil]?.[funcionalidade] ?? false;
}

/**
 * Retorna lista de funcionalidades permitidas para um perfil
 */
export function getFuncionalidadesPermitidas(perfil: PerfilType): Funcionalidade[] {
  const permissoes = permissoesPorPerfil[perfil];
  return Object.entries(permissoes)
    .filter(([_, permitido]) => permitido)
    .map(([func, _]) => func as Funcionalidade);
}

/**
 * Labels amigáveis para os perfis
 */
export const perfilLabels: Record<PerfilType, string> = {
  admin_master: 'Administrador Master',
  medico: 'Médico',
  secretaria: 'Secretária',
  auditor: 'Auditor',
  paciente: 'Paciente',
};

/**
 * Itens do menu com suas funcionalidades correspondentes
 */
export const menuItems = [
  { path: '/', label: 'Dashboard', funcionalidade: 'dashboard' as Funcionalidade },
  { path: '/agenda', label: 'Agenda', funcionalidade: 'agenda' as Funcionalidade },
  { path: '/pacientes', label: 'Pacientes', funcionalidade: 'pacientes' as Funcionalidade },
  { path: '/pacientes/novo', label: 'Novo Paciente', funcionalidade: 'pacientes.criar' as Funcionalidade },
  { path: '/atendimentos', label: 'Atendimentos', funcionalidade: 'atendimentos' as Funcionalidade },
  { path: '/atendimentos/novo', label: 'Novo Atendimento', funcionalidade: 'atendimentos.criar' as Funcionalidade },
  { path: '/configuracoes', label: 'Configurações', funcionalidade: 'configuracoes' as Funcionalidade },
];
