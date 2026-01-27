/**
 * PatientIntegrationService
 * 
 * Serviço responsável por:
 * 1. Identificar o nome do paciente no PDF
 * 2. Localizar o paciente no banco de dados do Gorgen
 * 3. Inserir os resultados extraídos no prontuário (examesLaboratoriais)
 * 
 * @version 1.0.0
 * @author Gorgen - Aplicativo de Gestão em Saúde
 */

import { ExtractionResult, ExamResult } from './types';

/**
 * Configuração do serviço de integração
 */
export interface PatientIntegrationConfig {
  /** ID do tenant (multi-tenant) */
  tenantId: number;
  /** Threshold mínimo de similaridade para match de nome (0-1) */
  nameMatchThreshold: number;
  /** Se true, cria paciente automaticamente se não encontrado */
  autoCreatePatient: boolean;
  /** ID do usuário que está fazendo a operação */
  userId: number;
}

/**
 * Resultado da busca de paciente
 */
export interface PatientSearchResult {
  found: boolean;
  patient?: {
    id: number;
    idPaciente: string;
    nome: string;
    dataNascimento?: string;
    cpf?: string;
  };
  candidates?: Array<{
    id: number;
    idPaciente: string;
    nome: string;
    similarity: number;
  }>;
  confidence: number;
}

/**
 * Resultado da inserção no prontuário
 */
export interface ProntuarioInsertResult {
  success: boolean;
  pacienteId: number;
  pacienteNome: string;
  examesInseridos: number;
  examesAtualizados: number;
  examesDuplicados: number;
  erros: string[];
  ids: number[];
}

/**
 * Interface do banco de dados (injetada)
 */
export interface DatabaseAdapter {
  /** Busca pacientes por nome (case/accent insensitive) */
  searchPatientsByName(tenantId: number, name: string): Promise<Array<{
    id: number;
    idPaciente: string;
    nome: string;
    dataNascimento: string | null;
  }>>;
  
  /** Busca paciente por ID */
  getPatientById(tenantId: number, patientId: number): Promise<{
    id: number;
    idPaciente: string;
    nome: string;
    dataNascimento: string | null;
  } | null>;
  
  /** Verifica se exame já existe (evita duplicatas) */
  checkExamExists(
    tenantId: number,
    pacienteId: number,
    exame: string,
    dataColeta: string
  ): Promise<{ exists: boolean; id?: number }>;
  
  /** Insere exame laboratorial no prontuário */
  insertExameLaboratorial(data: {
    tenantId: number;
    pacienteId: number;
    dataColeta: string;
    dataResultado?: string;
    laboratorio?: string;
    tipoExame: string;
    exame: string;
    resultado: string;
    valorReferencia?: string;
    unidade?: string;
    alterado: boolean;
    observacoes?: string;
    arquivoUrl?: string;
    arquivoNome?: string;
  }): Promise<{ id: number }>;
  
  /** Atualiza exame laboratorial existente */
  updateExameLaboratorial(id: number, data: {
    resultado: string;
    valorReferencia?: string;
    unidade?: string;
    alterado: boolean;
    observacoes?: string;
  }): Promise<void>;
}

/**
 * Serviço de Integração com Prontuário
 */
export class PatientIntegrationService {
  private config: PatientIntegrationConfig;
  private db: DatabaseAdapter;

  constructor(config: PatientIntegrationConfig, db: DatabaseAdapter) {
    this.config = {
      nameMatchThreshold: 0.8,
      autoCreatePatient: false,
      ...config,
    };
    this.db = db;
  }

  /**
   * Extrai o nome do paciente do texto do PDF
   */
  extractPatientName(pdfText: string): string | null {
    // Padrões comuns de identificação de paciente em laudos
    const patterns = [
      // Padrão: "Paciente: NOME COMPLETO"
      /Paciente\s*:\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]+)/i,
      // Padrão: "Nome: NOME COMPLETO"
      /Nome\s*:\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]+)/i,
      // Padrão: "NOME COMPLETO" em maiúsculas no início
      /^([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]{10,50})\s*$/m,
      // Padrão Weinmann: "Paciente NOME COMPLETO"
      /Paciente\s+([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]+?)(?:\s+Idade|\s+Sexo|\s+Data|\s+\d)/i,
      // Padrão Unimed: "Nome do Paciente: NOME"
      /Nome\s+do\s+Paciente\s*:\s*([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑa-záàâãéèêíïóôõöúçñ\s]+)/i,
      // Padrão genérico: linha com nome em maiúsculas seguido de dados
      /([A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ][A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇÑ\s]{5,40})\s+(?:Nascimento|DN|Data Nasc)/i,
    ];

    for (const pattern of patterns) {
      const match = pdfText.match(pattern);
      if (match && match[1]) {
        const name = match[1].trim();
        // Validar que parece um nome (mínimo 2 palavras, sem números)
        if (this.isValidName(name)) {
          return this.normalizeName(name);
        }
      }
    }

    return null;
  }

  /**
   * Valida se a string parece um nome válido
   */
  private isValidName(name: string): boolean {
    // Deve ter pelo menos 2 palavras
    const words = name.split(/\s+/).filter(w => w.length > 1);
    if (words.length < 2) return false;
    
    // Não deve conter números
    if (/\d/.test(name)) return false;
    
    // Não deve ser muito curto ou muito longo
    if (name.length < 5 || name.length > 100) return false;
    
    // Não deve conter palavras-chave de laboratório
    const blacklist = ['laboratório', 'hospital', 'clínica', 'resultado', 'exame', 'laudo'];
    const nameLower = name.toLowerCase();
    if (blacklist.some(word => nameLower.includes(word))) return false;
    
    return true;
  }

  /**
   * Normaliza o nome (capitalização, remoção de espaços extras)
   */
  private normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => {
        // Preposições em minúsculo
        const prepositions = ['de', 'da', 'do', 'das', 'dos', 'e'];
        if (prepositions.includes(word.toLowerCase())) {
          return word.toLowerCase();
        }
        // Capitalizar primeira letra
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  /**
   * Remove acentos para comparação
   */
  private removeAccents(str: string): string {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Calcula similaridade entre dois nomes (Levenshtein normalizado)
   */
  private calculateNameSimilarity(name1: string, name2: string): number {
    const s1 = this.removeAccents(name1.toLowerCase().trim());
    const s2 = this.removeAccents(name2.toLowerCase().trim());
    
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    // Matriz de distância de Levenshtein
    const matrix: number[][] = [];
    
    for (let i = 0; i <= len1; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= len2; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    
    return 1 - distance / maxLen;
  }

  /**
   * Busca paciente no banco de dados pelo nome
   */
  async searchPatient(patientName: string): Promise<PatientSearchResult> {
    if (!patientName) {
      return { found: false, confidence: 0 };
    }

    // Buscar pacientes com nome similar
    const candidates = await this.db.searchPatientsByName(
      this.config.tenantId,
      patientName
    );

    if (candidates.length === 0) {
      return { found: false, confidence: 0 };
    }

    // Calcular similaridade para cada candidato
    const rankedCandidates = candidates.map(candidate => ({
      ...candidate,
      similarity: this.calculateNameSimilarity(patientName, candidate.nome),
    })).sort((a, b) => b.similarity - a.similarity);

    const bestMatch = rankedCandidates[0];

    // Se o melhor match está acima do threshold, considerar encontrado
    if (bestMatch.similarity >= this.config.nameMatchThreshold) {
      return {
        found: true,
        patient: {
          id: bestMatch.id,
          idPaciente: bestMatch.idPaciente,
          nome: bestMatch.nome,
          dataNascimento: bestMatch.dataNascimento || undefined,
        },
        confidence: bestMatch.similarity,
      };
    }

    // Se não encontrou com certeza, retornar candidatos para seleção manual
    return {
      found: false,
      candidates: rankedCandidates.slice(0, 5).map(c => ({
        id: c.id,
        idPaciente: c.idPaciente,
        nome: c.nome,
        similarity: c.similarity,
      })),
      confidence: bestMatch.similarity,
    };
  }

  /**
   * Classifica o tipo de exame baseado no nome
   */
  private classifyExamType(examName: string): string {
    const name = examName.toLowerCase();
    
    const categories: Record<string, string[]> = {
      'Hemograma': ['hemograma', 'hemácias', 'leucócitos', 'plaquetas', 'hematócrito', 'hemoglobina', 'vcm', 'hcm', 'chcm', 'rdw'],
      'Bioquímica': ['glicose', 'ureia', 'creatinina', 'ácido úrico', 'sódio', 'potássio', 'cálcio', 'magnésio', 'fósforo', 'cloro'],
      'Perfil Hepático': ['tgo', 'tgp', 'ast', 'alt', 'gama gt', 'fosfatase alcalina', 'bilirrubina', 'albumina', 'proteínas totais'],
      'Perfil Lipídico': ['colesterol', 'hdl', 'ldl', 'vldl', 'triglicérides', 'triglicerídeos'],
      'Coagulação': ['tp', 'inr', 'ttpa', 'fibrinogênio', 'tempo de protrombina'],
      'Hormônios': ['tsh', 't3', 't4', 'testosterona', 'estradiol', 'progesterona', 'fsh', 'lh', 'prolactina', 'cortisol'],
      'Marcadores Tumorais': ['cea', 'ca 19-9', 'ca 125', 'ca 15-3', 'afp', 'psa', 'alfa-fetoproteína'],
      'Vitaminas e Minerais': ['vitamina', 'ferro', 'ferritina', 'transferrina', 'zinco', 'b12', 'ácido fólico', 'vitamina d'],
      'Sorologias': ['anti-hbs', 'hbsag', 'anti-hcv', 'anti-hiv', 'vdrl', 'fta-abs'],
      'Urina': ['eas', 'urina tipo 1', 'urina rotina', 'urocultura'],
      'Fezes': ['parasitológico', 'coprocultura', 'sangue oculto'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => name.includes(kw))) {
        return category;
      }
    }

    return 'Outros';
  }

  /**
   * Insere os resultados extraídos no prontuário do paciente
   */
  async insertIntoProntuario(
    pacienteId: number,
    extraction: ExtractionResult,
    pdfUrl?: string,
    pdfName?: string
  ): Promise<ProntuarioInsertResult> {
    const result: ProntuarioInsertResult = {
      success: false,
      pacienteId,
      pacienteNome: '',
      examesInseridos: 0,
      examesAtualizados: 0,
      examesDuplicados: 0,
      erros: [],
      ids: [],
    };

    // Buscar dados do paciente
    const patient = await this.db.getPatientById(this.config.tenantId, pacienteId);
    if (!patient) {
      result.erros.push(`Paciente ID ${pacienteId} não encontrado`);
      return result;
    }
    result.pacienteNome = patient.nome;

    // Processar cada exame
    for (const exam of extraction.exams) {
      try {
        // Verificar se já existe (evitar duplicatas)
        const existsCheck = await this.db.checkExamExists(
          this.config.tenantId,
          pacienteId,
          exam.name,
          extraction.collectionDate || new Date().toISOString().split('T')[0]
        );

        if (existsCheck.exists && existsCheck.id) {
          // Atualizar exame existente
          await this.db.updateExameLaboratorial(existsCheck.id, {
            resultado: exam.value,
            valorReferencia: exam.reference,
            unidade: exam.unit,
            alterado: exam.isAltered,
            observacoes: exam.observation,
          });
          result.examesAtualizados++;
          result.ids.push(existsCheck.id);
        } else {
          // Inserir novo exame
          const inserted = await this.db.insertExameLaboratorial({
            tenantId: this.config.tenantId,
            pacienteId,
            dataColeta: extraction.collectionDate || new Date().toISOString().split('T')[0],
            dataResultado: extraction.resultDate,
            laboratorio: extraction.laboratory,
            tipoExame: this.classifyExamType(exam.name),
            exame: exam.name,
            resultado: exam.value,
            valorReferencia: exam.reference,
            unidade: exam.unit,
            alterado: exam.isAltered,
            observacoes: exam.observation,
            arquivoUrl: pdfUrl,
            arquivoNome: pdfName,
          });
          result.examesInseridos++;
          result.ids.push(inserted.id);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.erros.push(`Erro ao inserir ${exam.name}: ${errorMessage}`);
      }
    }

    result.success = result.erros.length === 0 || result.examesInseridos > 0;
    return result;
  }

  /**
   * Fluxo completo: Extrai nome do PDF, busca paciente, insere no prontuário
   */
  async processExtractionForPatient(
    pdfText: string,
    extraction: ExtractionResult,
    pdfUrl?: string,
    pdfName?: string
  ): Promise<{
    patientSearch: PatientSearchResult;
    insertResult?: ProntuarioInsertResult;
  }> {
    // 1. Extrair nome do paciente do PDF
    const patientName = extraction.patientName || this.extractPatientName(pdfText);
    
    if (!patientName) {
      return {
        patientSearch: {
          found: false,
          confidence: 0,
        },
      };
    }

    // 2. Buscar paciente no banco de dados
    const patientSearch = await this.searchPatient(patientName);

    // 3. Se encontrou com confiança, inserir no prontuário
    if (patientSearch.found && patientSearch.patient) {
      const insertResult = await this.insertIntoProntuario(
        patientSearch.patient.id,
        extraction,
        pdfUrl,
        pdfName
      );

      return {
        patientSearch,
        insertResult,
      };
    }

    // Se não encontrou, retornar apenas a busca para seleção manual
    return {
      patientSearch,
    };
  }

  /**
   * Insere exames para um paciente selecionado manualmente
   */
  async insertForSelectedPatient(
    patientId: number,
    extraction: ExtractionResult,
    pdfUrl?: string,
    pdfName?: string
  ): Promise<ProntuarioInsertResult> {
    return this.insertIntoProntuario(patientId, extraction, pdfUrl, pdfName);
  }
}

/**
 * Implementação do DatabaseAdapter usando Drizzle ORM
 * Esta implementação será usada no servidor
 */
export function createDrizzleAdapter(db: any, schema: any): DatabaseAdapter {
  return {
    async searchPatientsByName(tenantId: number, name: string) {
      const { pacientes } = schema;
      const { like, eq, and, isNull } = await import('drizzle-orm');
      
      // Busca case-insensitive com LIKE
      const normalizedName = name.replace(/\s+/g, '%');
      
      const results = await db
        .select({
          id: pacientes.id,
          idPaciente: pacientes.idPaciente,
          nome: pacientes.nome,
          dataNascimento: pacientes.dataNascimento,
        })
        .from(pacientes)
        .where(
          and(
            eq(pacientes.tenantId, tenantId),
            like(pacientes.nome, `%${normalizedName}%`),
            isNull(pacientes.deletedAt)
          )
        )
        .limit(20);
      
      return results;
    },

    async getPatientById(tenantId: number, patientId: number) {
      const { pacientes } = schema;
      const { eq, and, isNull } = await import('drizzle-orm');
      
      const results = await db
        .select({
          id: pacientes.id,
          idPaciente: pacientes.idPaciente,
          nome: pacientes.nome,
          dataNascimento: pacientes.dataNascimento,
        })
        .from(pacientes)
        .where(
          and(
            eq(pacientes.tenantId, tenantId),
            eq(pacientes.id, patientId),
            isNull(pacientes.deletedAt)
          )
        )
        .limit(1);
      
      return results[0] || null;
    },

    async checkExamExists(tenantId: number, pacienteId: number, exame: string, dataColeta: string) {
      const { examesLaboratoriais } = schema;
      const { eq, and } = await import('drizzle-orm');
      
      const results = await db
        .select({ id: examesLaboratoriais.id })
        .from(examesLaboratoriais)
        .where(
          and(
            eq(examesLaboratoriais.tenantId, tenantId),
            eq(examesLaboratoriais.pacienteId, pacienteId),
            eq(examesLaboratoriais.exame, exame),
            eq(examesLaboratoriais.dataColeta, dataColeta)
          )
        )
        .limit(1);
      
      return {
        exists: results.length > 0,
        id: results[0]?.id,
      };
    },

    async insertExameLaboratorial(data) {
      const { examesLaboratoriais } = schema;
      
      const result = await db.insert(examesLaboratoriais).values(data);
      
      return { id: result[0].insertId };
    },

    async updateExameLaboratorial(id: number, data) {
      const { examesLaboratoriais } = schema;
      const { eq } = await import('drizzle-orm');
      
      await db
        .update(examesLaboratoriais)
        .set(data)
        .where(eq(examesLaboratoriais.id, id));
    },
  };
}
