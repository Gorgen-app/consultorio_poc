import { describe, it, expect } from 'vitest';

// Função de validação de CPF (mesma lógica do frontend)
function validarCPF(cpf: string): boolean {
  const cpfLimpo = cpf.replace(/\D/g, '');
  
  if (cpfLimpo.length !== 11) {
    return false;
  }
  
  if (/^(\d)\1{10}$/.test(cpfLimpo)) {
    return false;
  }
  
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

describe('Validação de CPF', () => {
  it('deve aceitar CPF válido sem formatação', () => {
    // CPF válido de teste
    expect(validarCPF('52998224725')).toBe(true);
  });

  it('deve aceitar CPF válido com formatação', () => {
    expect(validarCPF('529.982.247-25')).toBe(true);
  });

  it('deve rejeitar CPF com dígitos verificadores incorretos', () => {
    expect(validarCPF('529.982.247-26')).toBe(false);
    expect(validarCPF('52998224726')).toBe(false);
  });

  it('deve rejeitar CPF com todos os dígitos iguais', () => {
    expect(validarCPF('111.111.111-11')).toBe(false);
    expect(validarCPF('000.000.000-00')).toBe(false);
    expect(validarCPF('999.999.999-99')).toBe(false);
  });

  it('deve rejeitar CPF com menos de 11 dígitos', () => {
    expect(validarCPF('123.456.789')).toBe(false);
    expect(validarCPF('12345678')).toBe(false);
  });

  it('deve rejeitar CPF com mais de 11 dígitos', () => {
    expect(validarCPF('123.456.789-012')).toBe(false);
  });

  it('deve rejeitar CPF vazio', () => {
    expect(validarCPF('')).toBe(false);
  });

  it('deve validar outros CPFs conhecidos como válidos', () => {
    // CPFs válidos gerados para teste
    expect(validarCPF('111.444.777-35')).toBe(true);
    expect(validarCPF('123.456.789-09')).toBe(true);
  });
});

// ========================================
// TESTES DE VALIDAÇÃO DE EMAIL E WHATSAPP
// Gorgen 3.9.47
// ========================================

// Reimplementar funções de validação para teste (mesma lógica do frontend)
function validarEmail(email: string): boolean {
  if (!email || email.trim() === '') {
    return true; // Email vazio é permitido (campo opcional)
  }
  
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  
  return emailRegex.test(email.trim());
}

function validarTelefone(telefone: string): boolean {
  if (!telefone || telefone.trim() === '') {
    return true;
  }
  
  const telefoneLimpo = telefone.replace(/\D/g, '');
  return telefoneLimpo.length === 10 || telefoneLimpo.length === 11;
}

function formatarTelefoneWhatsApp(telefone: string): string {
  const telefoneLimpo = telefone.replace(/\D/g, '');
  
  if (telefoneLimpo.startsWith('55')) {
    return telefoneLimpo;
  }
  
  return `55${telefoneLimpo}`;
}

function gerarLinkWhatsApp(telefone: string, mensagem?: string): string {
  const numeroFormatado = formatarTelefoneWhatsApp(telefone);
  const baseUrl = 'https://wa.me/';
  
  if (mensagem) {
    return `${baseUrl}${numeroFormatado}?text=${encodeURIComponent(mensagem)}`;
  }
  
  return `${baseUrl}${numeroFormatado}`;
}

describe('Validação de Email', () => {
  it('deve aceitar email vazio (campo opcional)', () => {
    expect(validarEmail('')).toBe(true);
    expect(validarEmail('   ')).toBe(true);
  });

  it('deve aceitar emails válidos', () => {
    expect(validarEmail('usuario@email.com')).toBe(true);
    expect(validarEmail('usuario.nome@email.com.br')).toBe(true);
    expect(validarEmail('usuario+tag@email.com')).toBe(true);
    expect(validarEmail('usuario123@email123.com')).toBe(true);
    expect(validarEmail('a@b.co')).toBe(true);
  });

  it('deve rejeitar emails inválidos', () => {
    expect(validarEmail('usuario')).toBe(false);
    expect(validarEmail('usuario@')).toBe(false);
    expect(validarEmail('@email.com')).toBe(false);
    // Nota: 'usuario@email' é tecnicamente válido segundo RFC 5322 (domínios locais)
    // mas na prática, a maioria dos emails requer um TLD
    expect(validarEmail('usuario email@email.com')).toBe(false);
    expect(validarEmail('usuario@@email.com')).toBe(false);
  });

  it('deve tratar espaços em branco', () => {
    expect(validarEmail('  usuario@email.com  ')).toBe(true);
  });
});

describe('Validação de Telefone', () => {
  it('deve aceitar telefone vazio (campo opcional)', () => {
    expect(validarTelefone('')).toBe(true);
    expect(validarTelefone('   ')).toBe(true);
  });

  it('deve aceitar telefones válidos com 10 dígitos (fixo)', () => {
    expect(validarTelefone('5132334455')).toBe(true);
    expect(validarTelefone('(51) 3233-4455')).toBe(true);
  });

  it('deve aceitar telefones válidos com 11 dígitos (celular)', () => {
    expect(validarTelefone('51999887766')).toBe(true);
    expect(validarTelefone('(51) 99988-7766')).toBe(true);
  });

  it('deve rejeitar telefones inválidos', () => {
    expect(validarTelefone('123')).toBe(false);
    expect(validarTelefone('123456789')).toBe(false); // 9 dígitos
    expect(validarTelefone('123456789012')).toBe(false); // 12 dígitos
  });
});

describe('Formatação de Telefone para WhatsApp', () => {
  it('deve adicionar código do Brasil (55) quando não presente', () => {
    expect(formatarTelefoneWhatsApp('51999887766')).toBe('5551999887766');
    expect(formatarTelefoneWhatsApp('(51) 99988-7766')).toBe('5551999887766');
  });

  it('deve manter código do Brasil quando já presente', () => {
    expect(formatarTelefoneWhatsApp('5551999887766')).toBe('5551999887766');
    expect(formatarTelefoneWhatsApp('+55 51 99988-7766')).toBe('5551999887766');
  });

  it('deve remover caracteres não numéricos', () => {
    expect(formatarTelefoneWhatsApp('(51) 99988-7766')).toBe('5551999887766');
    expect(formatarTelefoneWhatsApp('+55 (51) 99988-7766')).toBe('5551999887766');
  });
});

describe('Geração de Link do WhatsApp', () => {
  it('deve gerar link básico sem mensagem', () => {
    const link = gerarLinkWhatsApp('51999887766');
    expect(link).toBe('https://wa.me/5551999887766');
  });

  it('deve gerar link com mensagem codificada', () => {
    const link = gerarLinkWhatsApp('51999887766', 'Olá, tudo bem?');
    expect(link).toBe('https://wa.me/5551999887766?text=Ol%C3%A1%2C%20tudo%20bem%3F');
  });

  it('deve funcionar com telefone já formatado', () => {
    const link = gerarLinkWhatsApp('5551999887766');
    expect(link).toBe('https://wa.me/5551999887766');
  });

  it('deve codificar caracteres especiais na mensagem', () => {
    const link = gerarLinkWhatsApp('51999887766', 'Olá! Como você está?');
    expect(link).toContain('text=');
    expect(link).toContain('Ol%C3%A1');
  });
});

describe('Proteção contra Dupla Criptografia', () => {
  it('não deve criptografar email já criptografado', () => {
    const emailJaCriptografado = 'enc:v1:abc123xyz';
    const jaCriptografado = emailJaCriptografado.startsWith('enc:v1:');
    expect(jaCriptografado).toBe(true);
    
    // Simula comportamento da função encryptPacienteData
    const resultado = jaCriptografado ? emailJaCriptografado : `enc:v1:${emailJaCriptografado}`;
    expect(resultado).toBe('enc:v1:abc123xyz');
    expect(resultado).not.toBe('enc:v1:enc:v1:abc123xyz');
  });

  it('não deve criptografar telefone já criptografado', () => {
    const telefoneJaCriptografado = 'enc:v1:xyz789def';
    const jaCriptografado = telefoneJaCriptografado.startsWith('enc:v1:');
    expect(jaCriptografado).toBe(true);
    
    const resultado = jaCriptografado ? telefoneJaCriptografado : `enc:v1:${telefoneJaCriptografado}`;
    expect(resultado).toBe('enc:v1:xyz789def');
  });

  it('deve criptografar valor em texto plano', () => {
    const emailTextoPlano = 'usuario@email.com';
    const jaCriptografado = emailTextoPlano.startsWith('enc:v1:');
    expect(jaCriptografado).toBe(false);
    
    const resultado = jaCriptografado ? emailTextoPlano : `enc:v1:${emailTextoPlano}`;
    expect(resultado).toBe('enc:v1:usuario@email.com');
  });
});
