/**
 * Calcula a idade em anos completos baseado na data de nascimento
 * @param dataNascimento - Data de nascimento (string ou Date)
 * @returns Idade em anos ou null se data inválida
 */
export function calcularIdade(dataNascimento: string | Date | null | undefined): number | null {
  if (!dataNascimento) return null;
  
  try {
    const nascimento = typeof dataNascimento === 'string' 
      ? new Date(dataNascimento) 
      : dataNascimento;
    
    if (isNaN(nascimento.getTime())) return null;
    
    const hoje = new Date();
    let idade = hoje.getFullYear() - nascimento.getFullYear();
    const mes = hoje.getMonth() - nascimento.getMonth();
    
    // Ajustar se ainda não fez aniversário este ano
    if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
      idade--;
    }
    
    return idade >= 0 ? idade : null;
  } catch {
    return null;
  }
}

/**
 * Adiciona campo de idade calculada aos pacientes
 */
export function adicionarIdadeAoPaciente<T extends { dataNascimento?: string | Date | null }>(
  paciente: T
): T & { idade: number | null } {
  return {
    ...paciente,
    idade: calcularIdade(paciente.dataNascimento),
  };
}

/**
 * Adiciona campo de idade calculada a uma lista de pacientes
 */
export function adicionarIdadeAosPacientes<T extends { dataNascimento?: string | Date | null }>(
  pacientes: T[]
): Array<T & { idade: number | null }> {
  return pacientes.map(adicionarIdadeAoPaciente);
}
