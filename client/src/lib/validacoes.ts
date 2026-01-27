/**
 * Valida CPF brasileiro verificando os dígitos verificadores
 * @param cpf - CPF com ou sem formatação (xxx.xxx.xxx-xx ou xxxxxxxxxxx)
 * @returns true se o CPF é válido, false caso contrário
 */
export function validarCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cpfLimpo.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais (CPFs inválidos conhecidos)
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }
  
  // Calcula o primeiro dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (10 - i);
  }
  let resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpfLimpo.charAt(9))) {
    return false;
  }
  
  // Calcula o segundo dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(cpfLimpo.charAt(i)) * (11 - i);
  }
  resto = (soma * 10) % 11;
  if (resto === 10 || resto === 11) {
    resto = 0;
  }
  if (resto !== parseInt(cpfLimpo.charAt(10))) {
    return false;
  }
  
  return true;
}

/**
 * Formata CPF para exibição (xxx.xxx.xxx-xx)
 * @param cpf - CPF sem formatação
 * @returns CPF formatado
 */
export function formatarCPF(cpf: string): string {
  const cpfLimpo = cpf.replace(/\D/g, '');
  if (cpfLimpo.length !== 11) {
    return cpf;
  }
  return cpfLimpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Valida formato de email
 * @param email - Email a ser validado
 * @returns true se o email tem formato válido, false caso contrário
 */
export function validarEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return true; // Email vazio é permitido (campo opcional)
  }
  
  // Regex para validação de email conforme RFC 5322 (simplificada)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email.trim());
}

/**
 * Valida formato de telefone brasileiro
 * @param telefone - Telefone a ser validado (com ou sem formatação)
 * @returns true se o telefone tem formato válido, false caso contrário
 */
export function validarTelefone(telefone: string): boolean {
  if (!telefone || telefone.trim() === '') {
    return true; // Telefone vazio é permitido (campo opcional)
  }
  
  // Remove caracteres não numéricos
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  // Telefone deve ter 10 ou 11 dígitos (com DDD)
  // 10 dígitos: telefone fixo (XX) XXXX-XXXX
  // 11 dígitos: celular (XX) 9XXXX-XXXX
  return telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
}

/**
 * Formata telefone para link do WhatsApp
 * @param telefone - Telefone com ou sem formatação
 * @returns Telefone formatado para WhatsApp (55 + DDD + número)
 */
export function formatarTelefoneWhatsApp(telefone: string): string {
  // Remove caracteres não numéricos
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  // Se já começa com 55, retorna como está
  if (telefoneLimpo.startsWith('55')) {
    return telefoneLimpo;
  }
  
  // Adiciona código do Brasil (55)
  return `55${telefoneLimpo}`;
}

/**
 * Gera link do WhatsApp para um número de telefone
 * @param telefone - Telefone do destinatário
 * @param mensagem - Mensagem pré-definida (opcional)
 * @returns URL do WhatsApp Web/App
 */
export function gerarLinkWhatsApp(telefone: string, mensagem?: string): string {
  const numeroFormatado = formatarTelefoneWhatsApp(telefone);
  const baseUrl = 'https://wa.me/';
  
  if (mensagem) {
    return `${baseUrl}${numeroFormatado}?text=${encodeURIComponent(mensagem)}`;
  }
  
  return `${baseUrl}${numeroFormatado}`;
}
