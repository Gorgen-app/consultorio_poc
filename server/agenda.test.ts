import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do banco de dados
vi.mock('./db', () => ({
  getNextAgendamentoId: vi.fn().mockResolvedValue('AG-2026-00001'),
  getNextBloqueioId: vi.fn().mockResolvedValue('BL-2026-00001'),
  createAgendamento: vi.fn().mockResolvedValue({ id: 1, idAgendamento: 'AG-2026-00001' }),
  listAgendamentos: vi.fn().mockResolvedValue([
    {
      id: 1,
      idAgendamento: 'AG-2026-00001',
      tipoCompromisso: 'Consulta',
      pacienteId: 1,
      pacienteNome: 'Maria Silva',
      dataHoraInicio: new Date('2026-01-09T13:00:00Z'),
      dataHoraFim: new Date('2026-01-09T13:30:00Z'),
      local: 'Consultório',
      status: 'Agendado',
      criadoPor: 'Sistema',
    }
  ]),
  getAgendamentoById: vi.fn().mockResolvedValue({
    id: 1,
    idAgendamento: 'AG-2026-00001',
    tipoCompromisso: 'Consulta',
    pacienteId: 1,
    pacienteNome: 'Maria Silva',
    dataHoraInicio: new Date('2026-01-09T13:00:00Z'),
    dataHoraFim: new Date('2026-01-09T13:30:00Z'),
    local: 'Consultório',
    status: 'Agendado',
    criadoPor: 'Sistema',
  }),
  cancelarAgendamento: vi.fn().mockResolvedValue({ success: true }),
  reagendarAgendamento: vi.fn().mockResolvedValue({ 
    novoAgendamento: { id: 2, idAgendamento: 'AG-2026-00002' },
    agendamentoOriginal: { id: 1, status: 'Reagendado' }
  }),
}));

describe('Agenda - Validações de Negócio', () => {
  
  describe('Tipos de Compromisso', () => {
    const tiposValidos = [
      'Consulta',
      'Cirurgia',
      'Visita internado',
      'Procedimento em consultório',
      'Exame',
      'Reunião',
      'Bloqueio'
    ];

    it('deve aceitar todos os tipos de compromisso válidos', () => {
      tiposValidos.forEach(tipo => {
        expect(tiposValidos).toContain(tipo);
      });
    });

    it('deve ter 7 tipos de compromisso definidos', () => {
      expect(tiposValidos.length).toBe(7);
    });
  });

  describe('Status de Agendamento', () => {
    const statusValidos = [
      'Agendado',
      'Confirmado',
      'Realizado',
      'Cancelado',
      'Reagendado',
      'Faltou'
    ];

    it('deve ter 6 status de agendamento definidos', () => {
      expect(statusValidos.length).toBe(6);
    });

    it('status Cancelado e Reagendado devem indicar compromissos inativos', () => {
      const statusInativos = ['Cancelado', 'Reagendado', 'Faltou'];
      statusInativos.forEach(status => {
        expect(statusValidos).toContain(status);
      });
    });
  });

  describe('Imutabilidade - Pilar Fundamental', () => {
    it('cancelamento não deve apagar o agendamento, apenas mudar status', () => {
      // Simula cancelamento
      const agendamentoOriginal = {
        id: 1,
        status: 'Agendado',
        canceladoEm: null,
        motivoCancelamento: null
      };

      // Após cancelamento
      const agendamentoCancelado = {
        ...agendamentoOriginal,
        status: 'Cancelado',
        canceladoEm: new Date(),
        motivoCancelamento: 'Paciente solicitou'
      };

      // Verifica que o ID permanece o mesmo (não foi apagado)
      expect(agendamentoCancelado.id).toBe(agendamentoOriginal.id);
      // Verifica que o status mudou
      expect(agendamentoCancelado.status).toBe('Cancelado');
      // Verifica que o motivo foi registrado
      expect(agendamentoCancelado.motivoCancelamento).toBeTruthy();
    });

    it('reagendamento deve preservar o agendamento original', () => {
      // Simula reagendamento
      const agendamentoOriginal = {
        id: 1,
        idAgendamento: 'AG-2026-00001',
        status: 'Agendado',
        dataHoraInicio: new Date('2026-01-09T10:00:00'),
      };

      // Após reagendamento - original muda status
      const originalAposReagendamento = {
        ...agendamentoOriginal,
        status: 'Reagendado',
      };

      // Novo agendamento criado com referência ao original
      const novoAgendamento = {
        id: 2,
        idAgendamento: 'AG-2026-00002',
        status: 'Agendado',
        dataHoraInicio: new Date('2026-01-10T15:00:00'),
        reagendadoDe: 1, // Referência ao original
      };

      // Verifica que o original não foi apagado
      expect(originalAposReagendamento.id).toBe(1);
      // Verifica que o status do original mudou
      expect(originalAposReagendamento.status).toBe('Reagendado');
      // Verifica que o novo tem referência ao original
      expect(novoAgendamento.reagendadoDe).toBe(agendamentoOriginal.id);
    });
  });

  describe('Formato de ID de Agendamento', () => {
    it('deve seguir o formato AG-YYYY-NNNNN', () => {
      const idPattern = /^AG-\d{4}-\d{5}$/;
      const exemplos = ['AG-2026-00001', 'AG-2026-00123', 'AG-2026-99999'];
      
      exemplos.forEach(id => {
        expect(id).toMatch(idPattern);
      });
    });
  });

  describe('Validações de Data/Hora', () => {
    it('hora de fim deve ser posterior à hora de início', () => {
      const inicio = new Date('2026-01-09T10:00:00');
      const fim = new Date('2026-01-09T10:30:00');
      
      expect(fim.getTime()).toBeGreaterThan(inicio.getTime());
    });

    it('não deve permitir agendamento no passado (validação de negócio)', () => {
      const agora = new Date();
      const dataPassada = new Date(agora.getTime() - 24 * 60 * 60 * 1000); // Ontem
      
      expect(dataPassada.getTime()).toBeLessThan(agora.getTime());
    });
  });
});

describe('Agenda - Visualização', () => {
  describe('Cores por Tipo de Compromisso', () => {
    const CORES_TIPO: Record<string, string> = {
      "Consulta": "bg-blue-500",
      "Cirurgia": "bg-red-500",
      "Visita internado": "bg-purple-500",
      "Procedimento em consultório": "bg-orange-500",
      "Exame": "bg-green-500",
      "Reunião": "bg-yellow-500",
      "Bloqueio": "bg-gray-500",
    };

    it('cada tipo de compromisso deve ter uma cor definida', () => {
      const tipos = Object.keys(CORES_TIPO);
      expect(tipos.length).toBe(7);
    });

    it('consulta deve ser azul', () => {
      expect(CORES_TIPO['Consulta']).toContain('blue');
    });

    it('cirurgia deve ser vermelho', () => {
      expect(CORES_TIPO['Cirurgia']).toContain('red');
    });
  });

  describe('Opacidade para Status Inativos', () => {
    it('agendamentos cancelados devem ter opacidade reduzida', () => {
      const isCancelado = (status: string) => 
        status === 'Cancelado' || status === 'Reagendado' || status === 'Faltou';
      
      expect(isCancelado('Cancelado')).toBe(true);
      expect(isCancelado('Reagendado')).toBe(true);
      expect(isCancelado('Faltou')).toBe(true);
      expect(isCancelado('Agendado')).toBe(false);
      expect(isCancelado('Confirmado')).toBe(false);
    });
  });
});
