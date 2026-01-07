import { describe, it, expect, beforeAll } from 'vitest';
import { listAtendimentos } from './db';

describe('listAtendimentos', () => {
  it('deve retornar atendimentos com estrutura flat (campos no nível raiz)', async () => {
    const result = await listAtendimentos({ limit: 2 });
    
    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      const primeiro = result[0];
      
      // Verificar que os campos de atendimento estão no nível raiz (não aninhados)
      expect(primeiro).toHaveProperty('id');
      expect(primeiro).toHaveProperty('atendimento');
      expect(primeiro).toHaveProperty('dataAtendimento');
      expect(primeiro).toHaveProperty('tipoAtendimento');
      expect(primeiro).toHaveProperty('local');
      expect(primeiro).toHaveProperty('convenio');
      expect(primeiro).toHaveProperty('pacienteId');
      
      // Verificar que os dados do paciente estão em um objeto aninhado
      expect(primeiro).toHaveProperty('pacientes');
      expect(primeiro.pacientes).toHaveProperty('id');
      expect(primeiro.pacientes).toHaveProperty('nome');
      expect(primeiro.pacientes).toHaveProperty('idPaciente');
      
      // Verificar que NÃO existe uma estrutura aninhada incorreta
      expect(primeiro).not.toHaveProperty('atendimentos');
      
      // Verificar tipos dos campos principais
      expect(typeof primeiro.id).toBe('number');
      expect(typeof primeiro.atendimento).toBe('string');
      expect(primeiro.dataAtendimento).toBeInstanceOf(Date);
      
      console.log('✅ Estrutura correta:', {
        id: primeiro.id,
        atendimento: primeiro.atendimento,
        tipoAtendimento: primeiro.tipoAtendimento,
        local: primeiro.local,
        convenio: primeiro.convenio,
        pacienteNome: primeiro.pacientes?.nome
      });
    }
  });
  
  it('deve retornar nome do paciente vinculado via LEFT JOIN', async () => {
    const result = await listAtendimentos({ limit: 10 });
    
    if (result.length > 0) {
      const comPaciente = result.find(atd => atd.pacienteId && atd.pacientes?.nome);
      
      expect(comPaciente).toBeDefined();
      expect(comPaciente?.pacientes?.nome).toBeTruthy();
      expect(typeof comPaciente?.pacientes?.nome).toBe('string');
      
      console.log('✅ Paciente vinculado:', comPaciente?.pacientes?.nome);
    }
  });
  
  it('deve filtrar por tipo de atendimento', async () => {
    const result = await listAtendimentos({ tipo: 'consulta', limit: 5 });
    
    if (result.length > 0) {
      result.forEach(atd => {
        expect(atd.tipoAtendimento?.toLowerCase()).toBe('consulta');
      });
      
      console.log(`✅ Filtro por tipo funcionando: ${result.length} consultas encontradas`);
    }
  });
});
