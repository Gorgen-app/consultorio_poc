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
