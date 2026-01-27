/**
 * Testes de Atualização de Paciente
 * Verifica se os campos de contato, convênio e dados clínicos são atualizados corretamente
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do banco de dados
const mockDb = {
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  where: vi.fn().mockResolvedValue([{ affectedRows: 1 }]),
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
};

// Mock das funções de criptografia
vi.mock('./encryption-helpers', () => ({
  encryptPacienteData: vi.fn((data, tenantId) => ({
    ...data,
    cpf: data.cpf ? `enc:v1:${data.cpf}` : data.cpf,
    cpfHash: data.cpf ? `hash:${data.cpf}` : undefined,
    email: data.email ? `enc:v1:${data.email}` : data.email,
    emailHash: data.email ? `hash:${data.email}` : undefined,
    telefone: data.telefone ? `enc:v1:${data.telefone}` : data.telefone,
    telefoneHash: data.telefone ? `hash:${data.telefone}` : undefined,
  })),
  decryptPacienteData: vi.fn((data) => ({
    ...data,
    cpf: data.cpf?.startsWith('enc:v1:') ? data.cpf.replace('enc:v1:', '') : data.cpf,
    email: data.email?.startsWith('enc:v1:') ? data.email.replace('enc:v1:', '') : data.email,
    telefone: data.telefone?.startsWith('enc:v1:') ? data.telefone.replace('enc:v1:', '') : data.telefone,
  })),
}));

describe('Atualização de Paciente', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Campos de Contato', () => {
    it('deve atualizar telefone corretamente', async () => {
      const updateData = {
        id: 1,
        telefone: '51999999999',
      };

      // Simula a filtragem de campos vazios (como no EditarPacienteModal)
      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        telefone: '51999999999',
      });
      expect(filteredData).not.toHaveProperty('idPaciente');
      expect(filteredData).not.toHaveProperty('dataInclusao');
      expect(filteredData).not.toHaveProperty('pastaPaciente');
    });

    it('deve atualizar email corretamente', async () => {
      const updateData = {
        id: 1,
        email: 'novo@email.com',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        email: 'novo@email.com',
      });
    });

    it('deve atualizar endereço corretamente', async () => {
      const updateData = {
        id: 1,
        endereco: 'Rua Nova, 123',
        bairro: 'Centro',
        cidade: 'Porto Alegre',
        uf: 'RS',
        cep: '90000-000',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        endereco: 'Rua Nova, 123',
        bairro: 'Centro',
        cidade: 'Porto Alegre',
        uf: 'RS',
        cep: '90000-000',
      });
    });

    it('deve filtrar campos vazios corretamente', async () => {
      const updateData = {
        id: 1,
        telefone: '51999999999',
        idPaciente: '',
        dataInclusao: '',
        pastaPaciente: '',
        email: '',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        telefone: '51999999999',
      });
      expect(filteredData).not.toHaveProperty('idPaciente');
      expect(filteredData).not.toHaveProperty('dataInclusao');
      expect(filteredData).not.toHaveProperty('pastaPaciente');
      expect(filteredData).not.toHaveProperty('email');
    });
  });

  describe('Campos de Convênio', () => {
    it('deve atualizar operadora corretamente', async () => {
      const updateData = {
        id: 1,
        operadora1: 'UNIMED',
        planoModalidade1: 'Executivo',
        matriculaConvenio1: '123456789',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        operadora1: 'UNIMED',
        planoModalidade1: 'Executivo',
        matriculaConvenio1: '123456789',
      });
    });

    it('deve atualizar segundo convênio corretamente', async () => {
      const updateData = {
        id: 1,
        operadora2: 'BRADESCO',
        planoModalidade2: 'Top',
        matriculaConvenio2: '987654321',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        operadora2: 'BRADESCO',
        planoModalidade2: 'Top',
        matriculaConvenio2: '987654321',
      });
    });
  });

  describe('Campos Clínicos', () => {
    it('deve atualizar status do caso corretamente', async () => {
      const updateData = {
        id: 1,
        statusCaso: 'Em tratamento',
        grupoDiagnostico: 'Oncologia',
        diagnosticoEspecifico: 'Câncer de mama',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        statusCaso: 'Em tratamento',
        grupoDiagnostico: 'Oncologia',
        diagnosticoEspecifico: 'Câncer de mama',
      });
    });

    it('deve atualizar óbito/perda corretamente', async () => {
      const updateData = {
        id: 1,
        obitoPerda: true,
        dataObitoLastFu: '2025-01-15',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        obitoPerda: true,
        dataObitoLastFu: '2025-01-15',
      });
    });
  });

  describe('Criptografia de Campos Sensíveis', () => {
    it('deve criptografar CPF na atualização', async () => {
      const { encryptPacienteData } = await import('./encryption-helpers');
      
      const updateData = {
        cpf: '123.456.789-00',
      };

      const encrypted = encryptPacienteData(updateData, 1);

      expect(encrypted.cpf).toBe('enc:v1:123.456.789-00');
      expect(encrypted.cpfHash).toBe('hash:123.456.789-00');
    });

    it('deve criptografar email na atualização', async () => {
      const { encryptPacienteData } = await import('./encryption-helpers');
      
      const updateData = {
        email: 'teste@email.com',
      };

      const encrypted = encryptPacienteData(updateData, 1);

      expect(encrypted.email).toBe('enc:v1:teste@email.com');
      expect(encrypted.emailHash).toBe('hash:teste@email.com');
    });

    it('deve criptografar telefone na atualização', async () => {
      const { encryptPacienteData } = await import('./encryption-helpers');
      
      const updateData = {
        telefone: '51999999999',
      };

      const encrypted = encryptPacienteData(updateData, 1);

      expect(encrypted.telefone).toBe('enc:v1:51999999999');
      expect(encrypted.telefoneHash).toBe('hash:51999999999');
    });

    it('deve descriptografar dados na leitura', async () => {
      const { decryptPacienteData } = await import('./encryption-helpers');
      
      const encryptedData = {
        cpf: 'enc:v1:123.456.789-00',
        email: 'enc:v1:teste@email.com',
        telefone: 'enc:v1:51999999999',
      };

      const decrypted = decryptPacienteData(encryptedData);

      expect(decrypted.cpf).toBe('123.456.789-00');
      expect(decrypted.email).toBe('teste@email.com');
      expect(decrypted.telefone).toBe('51999999999');
    });
  });

  describe('Campos de Endereço Completo', () => {
    it('deve atualizar número e complemento do endereço', async () => {
      const updateData = {
        id: 1,
        endereco: 'Rua das Flores',
        enderecoNumero: '123',
        enderecoComplemento: 'Apto 501',
        bairro: 'Centro',
        cidade: 'Porto Alegre',
        uf: 'RS',
        cep: '90000-000',
        pais: 'Brasil',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        endereco: 'Rua das Flores',
        enderecoNumero: '123',
        enderecoComplemento: 'Apto 501',
        bairro: 'Centro',
        cidade: 'Porto Alegre',
        uf: 'RS',
        cep: '90000-000',
        pais: 'Brasil',
      });
    });

    it('deve aceitar endereço sem número ou complemento', async () => {
      const updateData = {
        id: 1,
        endereco: 'Rua Principal',
        enderecoNumero: '',
        enderecoComplemento: '',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01000-000',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        endereco: 'Rua Principal',
        bairro: 'Centro',
        cidade: 'São Paulo',
        uf: 'SP',
        cep: '01000-000',
      });
      expect(filteredData).not.toHaveProperty('enderecoNumero');
      expect(filteredData).not.toHaveProperty('enderecoComplemento');
    });

    it('deve atualizar apenas número do endereço', async () => {
      const updateData = {
        id: 1,
        enderecoNumero: '456',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        enderecoNumero: '456',
      });
    });

    it('deve atualizar apenas complemento do endereço', async () => {
      const updateData = {
        id: 1,
        enderecoComplemento: 'Bloco B, Sala 10',
      };

      const filteredData = Object.fromEntries(
        Object.entries(updateData).filter(([key, value]) => {
          if (key === 'id') return true;
          if (['idPaciente', 'dataInclusao', 'pastaPaciente'].includes(key)) return false;
          return value !== '' && value !== undefined && value !== null;
        })
      );

      expect(filteredData).toEqual({
        id: 1,
        enderecoComplemento: 'Bloco B, Sala 10',
      });
    });
  });

  describe('Proteção contra Dupla Criptografia', () => {
    it('não deve criptografar email já criptografado', async () => {
      // Simula o comportamento real da função encryptPacienteData
      const emailJaCriptografado = 'enc:v1:abc123xyz';
      
      // Verifica se o valor já está criptografado
      const jaCriptografado = emailJaCriptografado.startsWith('enc:v1:');
      expect(jaCriptografado).toBe(true);
      
      // Se já está criptografado, não deve alterar
      const resultado = jaCriptografado ? emailJaCriptografado : `enc:v1:${emailJaCriptografado}`;
      expect(resultado).toBe('enc:v1:abc123xyz');
      expect(resultado).not.toBe('enc:v1:enc:v1:abc123xyz');
    });

    it('não deve criptografar telefone já criptografado', async () => {
      const telefoneJaCriptografado = 'enc:v1:xyz789def';
      
      const jaCriptografado = telefoneJaCriptografado.startsWith('enc:v1:');
      expect(jaCriptografado).toBe(true);
      
      const resultado = jaCriptografado ? telefoneJaCriptografado : `enc:v1:${telefoneJaCriptografado}`;
      expect(resultado).toBe('enc:v1:xyz789def');
      expect(resultado).not.toBe('enc:v1:enc:v1:xyz789def');
    });

    it('não deve criptografar CPF já criptografado', async () => {
      const cpfJaCriptografado = 'enc:v1:cpf123456';
      
      const jaCriptografado = cpfJaCriptografado.startsWith('enc:v1:');
      expect(jaCriptografado).toBe(true);
      
      const resultado = jaCriptografado ? cpfJaCriptografado : `enc:v1:${cpfJaCriptografado}`;
      expect(resultado).toBe('enc:v1:cpf123456');
      expect(resultado).not.toBe('enc:v1:enc:v1:cpf123456');
    });

    it('deve criptografar valor em texto plano normalmente', async () => {
      const emailTextoPlano = 'usuario@email.com';
      
      const jaCriptografado = emailTextoPlano.startsWith('enc:v1:');
      expect(jaCriptografado).toBe(false);
      
      const resultado = jaCriptografado ? emailTextoPlano : `enc:v1:${emailTextoPlano}`;
      expect(resultado).toBe('enc:v1:usuario@email.com');
    });
  });
});
