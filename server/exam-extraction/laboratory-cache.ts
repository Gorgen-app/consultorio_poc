/**
 * Laboratory Cache - Cache de formatos de laboratórios conhecidos
 * Gorgen System - Módulo de Extração de Exames
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface LaboratoryFormat {
  id: string;
  name: string;
  aliases: string[];
  location?: string;
  
  // Padrões de layout do documento
  layout: {
    header_pattern: RegExp;
    patient_name_pattern: RegExp;
    date_pattern: RegExp;
    exam_section_start: RegExp;
    exam_row_pattern: RegExp;
    reference_pattern: RegExp;
    has_laudo_evolutivo: boolean;
    laudo_evolutivo_pattern?: RegExp;
  };
  
  // Mapeamento de nomes de exames específicos do laboratório
  exam_name_mapping: Record<string, string>;
  
  // Unidades específicas usadas
  unit_mapping: Record<string, string>;
  
  // Valores de referência padrão (quando não especificados)
  default_references: Record<string, { min?: number; max?: number; unit: string }>;
  
  // Metadados de performance
  stats: {
    documents_processed: number;
    avg_extraction_time_ms: number;
    success_rate: number;
    last_updated: string;
  };
}

// ============================================================================
// CACHE DE LABORATÓRIOS CONHECIDOS
// ============================================================================

export const LABORATORY_CACHE: Record<string, LaboratoryFormat> = {
  
  // -------------------------------------------------------------------------
  // WEINMANN
  // -------------------------------------------------------------------------
  'weinmann': {
    id: 'weinmann',
    name: 'Weinmann Laboratório',
    aliases: ['weinmann', 'weinmann laboratório', 'lab weinmann'],
    location: 'Porto Alegre - RS',
    
    layout: {
      header_pattern: /weinmann/i,
      patient_name_pattern: /cliente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
      date_pattern: /data da ficha[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
      exam_section_start: /resultado/i,
      exam_row_pattern: /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s,()-]+)[:\s]+(\d+[.,]?\d*)\s*([a-zA-Z/%³]+)/,
      reference_pattern: /valores?\s+de\s+referência[:\s]+(.+)/i,
      has_laudo_evolutivo: true,
      laudo_evolutivo_pattern: /laudo evolutivo|fluxograma/i
    },
    
    exam_name_mapping: {
      'TRANSAMINASE GLUTAMICO-OXALACETICA (TGO)': 'TGO/AST',
      'ASPARTATO AMINO TRANSFERASE (AST)': 'TGO/AST',
      'TRANSAMINASE GLUTAMICO-PIRUVICA (TGP)': 'TGP/ALT',
      'ALANINA AMINO TRANSFERASE (ALT)': 'TGP/ALT',
      'GAMA GLUTAMIL TRANSFERASE (GAMA-GT)': 'GAMA GT',
      'PROTEINA C REATIVA ULTRASSENSIVEL': 'PCR ULTRASSENSÍVEL',
      'HEMOGLOBINA GLICADA (HBA1C)': 'HEMOGLOBINA GLICADA',
      'ESTIMATIVA DA FILTRAÇÃO GLOMERULAR': 'TFG CKD-EPI',
      'VOLUME CORPUSCULAR MEDIO': 'VCM',
      'HEMOGLOBINA CORPUSCULAR MEDIA': 'HCM',
      'CONCENTRAÇÃO DE HEMOGLOBINA CORPUSCULAR MEDIA': 'CHCM'
    },
    
    unit_mapping: {
      'milhões/mm3': 'milhões/mm³',
      '/mm3': '/mm³',
      'U/L': 'U/L',
      'mg/dL': 'mg/dL',
      'g/dL': 'g/dL',
      'mEq/L': 'mEq/L',
      'fL': 'fL',
      'pg': 'pg',
      '%': '%'
    },
    
    default_references: {
      'ERITRÓCITOS': { min: 4.32, max: 5.67, unit: 'milhões/mm³' },
      'HEMOGLOBINA': { min: 13.3, max: 16.5, unit: 'g/dL' },
      'HEMATÓCRITO': { min: 39.2, max: 49.0, unit: '%' },
      'VCM': { min: 81.7, max: 95.3, unit: 'fL' },
      'LEUCÓCITOS': { min: 3650, max: 8120, unit: '/mm³' },
      'PLAQUETAS': { min: 151000, max: 304000, unit: '/mm³' },
      'GLICOSE': { max: 99, unit: 'mg/dL' },
      'CREATININA': { min: 0.70, max: 1.30, unit: 'mg/dL' },
      'TGO/AST': { max: 40, unit: 'U/L' },
      'TGP/ALT': { max: 41, unit: 'U/L' },
      'GAMA GT': { min: 12, max: 73, unit: 'U/L' }
    },
    
    stats: {
      documents_processed: 45,
      avg_extraction_time_ms: 1200,
      success_rate: 0.98,
      last_updated: '2026-01-25'
    }
  },
  
  // -------------------------------------------------------------------------
  // IBERLEO
  // -------------------------------------------------------------------------
  'iberleo': {
    id: 'iberleo',
    name: 'IBERLEO Laboratório',
    aliases: ['iberleo', 'lab iberleo'],
    location: 'Osório - RS',
    
    layout: {
      header_pattern: /iberleo/i,
      patient_name_pattern: /paciente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
      date_pattern: /data[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
      exam_section_start: /exame|resultado/i,
      exam_row_pattern: /^([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)[:\s]+(\d+[.,]?\d*)\s*([a-zA-Z/%]+)/,
      reference_pattern: /ref[.:]?\s*(.+)/i,
      has_laudo_evolutivo: false
    },
    
    exam_name_mapping: {
      'AST (TGO)': 'TGO/AST',
      'ALT (TGP)': 'TGP/ALT',
      'GGT': 'GAMA GT'
    },
    
    unit_mapping: {},
    
    default_references: {
      'GLICOSE': { max: 100, unit: 'mg/dL' },
      'HEMOGLOBINA GLICADA': { max: 5.7, unit: '%' }
    },
    
    stats: {
      documents_processed: 5,
      avg_extraction_time_ms: 1500,
      success_rate: 0.95,
      last_updated: '2026-01-25'
    }
  },
  
  // -------------------------------------------------------------------------
  // UNILAB / UNIRAD
  // -------------------------------------------------------------------------
  'unilab': {
    id: 'unilab',
    name: 'UNILAB/UNIRAD',
    aliases: ['unilab', 'unirad', 'unidade diagnóstica'],
    location: 'Cachoeira do Sul / Capão da Canoa - RS',
    
    layout: {
      header_pattern: /unilab|unirad/i,
      patient_name_pattern: /([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ\s]+)\s+\d+\s+ano/i,
      date_pattern: /(\d{2}\/\d{2}\/\d{4})/,
      exam_section_start: /ecografia|ultrassonografia|resultado/i,
      exam_row_pattern: /^([A-Za-záéíóúâêîôûãõç\s]+)[\s:]+(.+)/,
      reference_pattern: /normal|habitual|sem alterações/i,
      has_laudo_evolutivo: true,
      laudo_evolutivo_pattern: /laudo evolutivo|fluxograma/i
    },
    
    exam_name_mapping: {},
    unit_mapping: {},
    default_references: {},
    
    stats: {
      documents_processed: 8,
      avg_extraction_time_ms: 1800,
      success_rate: 0.92,
      last_updated: '2026-01-25'
    }
  },
  
  // -------------------------------------------------------------------------
  // INSTITUTO DE PATOLOGIA
  // -------------------------------------------------------------------------
  'instituto_patologia': {
    id: 'instituto_patologia',
    name: 'Instituto de Patologia',
    aliases: ['instituto de patologia', 'patologia', 'anatomia patológica'],
    location: 'Porto Alegre - RS',
    
    layout: {
      header_pattern: /instituto\s+de\s+patologia/i,
      patient_name_pattern: /paciente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
      date_pattern: /data[:\s]+(\d{2}\/\d{2}\/\d{4})/i,
      exam_section_start: /diagnóstico|espécime|macroscopia/i,
      exam_row_pattern: /^(I{1,3}V?\.?\s*)?([A-Za-záéíóúâêîôûãõç\s]+)/,
      reference_pattern: /(?!.)/,  // Não aplicável para anatomopatológico
      has_laudo_evolutivo: false
    },
    
    exam_name_mapping: {},
    unit_mapping: {},
    default_references: {},
    
    stats: {
      documents_processed: 3,
      avg_extraction_time_ms: 2500,
      success_rate: 0.90,
      last_updated: '2026-01-25'
    }
  },
  
  // -------------------------------------------------------------------------
  // DAL PONT
  // -------------------------------------------------------------------------
  'dal_pont': {
    id: 'dal_pont',
    name: 'Laboratório Dal Pont',
    aliases: ['dal pont', 'lab dal pont'],
    location: 'Criciúma - SC',
    
    layout: {
      header_pattern: /dal\s*pont/i,
      patient_name_pattern: /paciente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
      date_pattern: /(\d{2}\/\d{2}\/\d{4})/,
      exam_section_start: /resultado|exame/i,
      exam_row_pattern: /^([A-Za-záéíóúâêîôûãõç\s]+)[:\s]+(\d+[.,]?\d*)/,
      reference_pattern: /ref[.:]?\s*(.+)/i,
      has_laudo_evolutivo: false
    },
    
    exam_name_mapping: {},
    unit_mapping: {},
    default_references: {},
    
    stats: {
      documents_processed: 2,
      avg_extraction_time_ms: 1400,
      success_rate: 0.95,
      last_updated: '2026-01-25'
    }
  },
  
  // -------------------------------------------------------------------------
  // UNIMED POA
  // -------------------------------------------------------------------------
  'unimed_poa': {
    id: 'unimed_poa',
    name: 'Unimed Porto Alegre',
    aliases: ['unimed', 'unimed poa', 'unimed porto alegre'],
    location: 'Porto Alegre - RS',
    
    layout: {
      header_pattern: /unimed/i,
      patient_name_pattern: /paciente[:\s]+([A-ZÁÉÍÓÚÂÊÎÔÛÃÕÇ][A-Za-záéíóúâêîôûãõç\s]+)/i,
      date_pattern: /(\d{2}\/\d{2}\/\d{4})/,
      exam_section_start: /resultado|exame/i,
      exam_row_pattern: /^([A-Za-záéíóúâêîôûãõç\s]+)[:\s]+(\d+[.,]?\d*)/,
      reference_pattern: /referência[:\s]+(.+)/i,
      has_laudo_evolutivo: false
    },
    
    exam_name_mapping: {},
    unit_mapping: {},
    default_references: {},
    
    stats: {
      documents_processed: 3,
      avg_extraction_time_ms: 1300,
      success_rate: 0.96,
      last_updated: '2026-01-25'
    }
  }
};

// ============================================================================
// FUNÇÕES DE CACHE
// ============================================================================

/**
 * Detecta o laboratório baseado no texto do documento
 */
export function detectLaboratory(text: string): LaboratoryFormat | null {
  const normalizedText = text.toLowerCase();
  
  for (const lab of Object.values(LABORATORY_CACHE)) {
    for (const alias of lab.aliases) {
      if (normalizedText.includes(alias)) {
        return lab;
      }
    }
  }
  
  return null;
}

/**
 * Obtém formato de laboratório pelo ID
 */
export function getLaboratoryFormat(labId: string): LaboratoryFormat | null {
  return LABORATORY_CACHE[labId] || null;
}

/**
 * Normaliza nome de exame usando mapeamento do laboratório
 */
export function normalizeExamName(examName: string, lab: LaboratoryFormat): string {
  const upperName = examName.toUpperCase().trim();
  
  // Primeiro, tentar mapeamento específico do laboratório
  if (lab.exam_name_mapping[upperName]) {
    return lab.exam_name_mapping[upperName];
  }
  
  // Segundo, tentar mapeamento genérico
  return GENERIC_EXAM_MAPPING[upperName] || upperName;
}

/**
 * Obtém valor de referência padrão
 */
export function getDefaultReference(
  examName: string, 
  lab: LaboratoryFormat
): { min?: number; max?: number; unit: string } | null {
  const normalizedName = normalizeExamName(examName, lab);
  return lab.default_references[normalizedName] || GENERIC_REFERENCES[normalizedName] || null;
}

/**
 * Atualiza estatísticas de performance do laboratório
 */
export function updateLabStats(
  labId: string, 
  extractionTimeMs: number, 
  success: boolean
): void {
  const lab = LABORATORY_CACHE[labId];
  if (!lab) return;
  
  const oldCount = lab.stats.documents_processed;
  const oldAvg = lab.stats.avg_extraction_time_ms;
  const oldSuccessRate = lab.stats.success_rate;
  
  // Atualizar média móvel
  lab.stats.documents_processed = oldCount + 1;
  lab.stats.avg_extraction_time_ms = (oldAvg * oldCount + extractionTimeMs) / (oldCount + 1);
  lab.stats.success_rate = (oldSuccessRate * oldCount + (success ? 1 : 0)) / (oldCount + 1);
  lab.stats.last_updated = new Date().toISOString().split('T')[0];
}

// ============================================================================
// MAPEAMENTOS GENÉRICOS
// ============================================================================

const GENERIC_EXAM_MAPPING: Record<string, string> = {
  'AST': 'TGO/AST',
  'ALT': 'TGP/ALT',
  'GGT': 'GAMA GT',
  'GAMMA GT': 'GAMA GT',
  'HB': 'HEMOGLOBINA',
  'HT': 'HEMATÓCRITO',
  'HBA1C': 'HEMOGLOBINA GLICADA',
  'GLICEMIA': 'GLICOSE',
  'NA': 'SÓDIO',
  'K': 'POTÁSSIO',
  'CA': 'CÁLCIO',
  'MG': 'MAGNÉSIO',
  'P': 'FÓSFORO',
  'CL': 'CLORO',
  'BT': 'BILIRRUBINA TOTAL',
  'BD': 'BILIRRUBINA DIRETA',
  'BI': 'BILIRRUBINA INDIRETA',
  'CT': 'COLESTEROL TOTAL',
  'TG': 'TRIGLICERÍDEOS',
  'HDL': 'COLESTEROL HDL',
  'LDL': 'COLESTEROL LDL',
  'VLDL': 'COLESTEROL VLDL',
  'TP': 'TEMPO DE PROTROMBINA',
  'TTPA': 'TEMPO DE TROMBOPLASTINA',
  'INR': 'INR',
  'VHS': 'VHS',
  'PCR': 'PCR',
  'TSH': 'TSH',
  'T4L': 'T4 LIVRE',
  'T3L': 'T3 LIVRE'
};

const GENERIC_REFERENCES: Record<string, { min?: number; max?: number; unit: string }> = {
  'GLICOSE': { max: 99, unit: 'mg/dL' },
  'HEMOGLOBINA GLICADA': { max: 5.7, unit: '%' },
  'CREATININA': { min: 0.7, max: 1.3, unit: 'mg/dL' },
  'UREIA': { min: 10, max: 50, unit: 'mg/dL' },
  'TGO/AST': { max: 40, unit: 'U/L' },
  'TGP/ALT': { max: 41, unit: 'U/L' },
  'GAMA GT': { min: 12, max: 73, unit: 'U/L' },
  'FOSFATASE ALCALINA': { min: 40, max: 129, unit: 'U/L' },
  'BILIRRUBINA TOTAL': { min: 0.2, max: 1.1, unit: 'mg/dL' },
  'COLESTEROL TOTAL': { max: 190, unit: 'mg/dL' },
  'COLESTEROL HDL': { min: 40, unit: 'mg/dL' },
  'COLESTEROL LDL': { max: 130, unit: 'mg/dL' },
  'TRIGLICERÍDEOS': { max: 150, unit: 'mg/dL' },
  'SÓDIO': { min: 136, max: 145, unit: 'mEq/L' },
  'POTÁSSIO': { min: 3.5, max: 5.1, unit: 'mEq/L' },
  'TSH': { min: 0.4, max: 4.0, unit: 'µUI/mL' },
  'T4 LIVRE': { min: 0.8, max: 1.8, unit: 'ng/dL' },
  'FERRITINA': { min: 30, max: 300, unit: 'ng/mL' },
  'PCR ULTRASSENSÍVEL': { max: 0.3, unit: 'mg/dL' }
};

export default {
  LABORATORY_CACHE,
  detectLaboratory,
  getLaboratoryFormat,
  normalizeExamName,
  getDefaultReference,
  updateLabStats
};
