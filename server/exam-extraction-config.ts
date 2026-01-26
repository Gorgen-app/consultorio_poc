/**
 * Configuração do Algoritmo de Extração de Exames Laboratoriais
 * Versão: 1.3.0
 * Última atualização: 2026-01-26 (Sessão 8)
 * 
 * Este arquivo contém as configurações e aprendizados do algoritmo de extração
 * de dados de exames laboratoriais de PDFs.
 */

/**
 * Mapeamento de sinônimos de exames para padronização
 * Chave: nome padronizado | Valor: array de variações encontradas
 */
export const EXAM_SYNONYMS: Record<string, string[]> = {
  // Hemograma
  "HEMÁCIAS": ["ERITRÓCITOS", "GLÓBULOS VERMELHOS", "RBC", "HEMÁCIAS"],
  "HEMOGLOBINA": ["HB", "HGB", "HEMOGLOBINA"],
  "HEMATÓCRITO": ["HT", "HCT", "HEMATÓCRITO"],
  "VCM": ["VOLUME CORPUSCULAR MÉDIO", "VCM", "MCV"],
  "HCM": ["HEMOGLOBINA CORPUSCULAR MÉDIA", "HCM", "MCH"],
  "CHCM": ["CONCENTRAÇÃO DE HEMOGLOBINA CORPUSCULAR MÉDIA", "CHCM", "MCHC"],
  "RDW": ["AMPLITUDE DE DISTRIBUIÇÃO DOS ERITRÓCITOS", "RDW", "RDW-CV"],
  "LEUCÓCITOS": ["LEUCÓCITOS GLOBAL", "GLÓBULOS BRANCOS", "WBC", "LEUCÓCITOS"],
  "PLAQUETAS": ["CONTAGEM DE PLAQUETAS", "PLT", "PLAQUETAS"],
  
  // Leucograma
  "NEUTRÓFILOS SEGMENTADOS": ["SEGMENTADOS", "NEUTRÓFILOS SEG", "NEUTRÓFILOS SEGMENTADOS"],
  "NEUTRÓFILOS BASTONETES": ["BASTONETES", "BASTÕES", "NEUTRÓFILOS BASTONETES"],
  "LINFÓCITOS": ["LINFÓCITOS TÍPICOS", "LINFÓCITOS"],
  "MONÓCITOS": ["MONÓCITOS"],
  "EOSINÓFILOS": ["EOSINÓFILOS"],
  "BASÓFILOS": ["BASÓFILOS"],
  
  // Função Hepática
  "TGO/AST": ["TGO", "AST", "TRANSAMINASE OXALACÉTICA", "ASPARTATO AMINOTRANSFERASE", "TGO/AST"],
  "TGP/ALT": ["TGP", "ALT", "TRANSAMINASE PIRÚVICA", "ALANINA AMINOTRANSFERASE", "TGP/ALT"],
  "GAMA GT": ["GGT", "GAMA GLUTAMIL TRANSFERASE", "GAMA GT", "GAMA-GT"],
  "FOSFATASE ALCALINA": ["FA", "ALP", "FOSFATASE ALCALINA"],
  "BILIRRUBINA TOTAL": ["BT", "BILIRRUBINA TOTAL"],
  "BILIRRUBINA DIRETA": ["BD", "BILIRRUBINA CONJUGADA", "BILIRRUBINA DIRETA"],
  "BILIRRUBINA INDIRETA": ["BI", "BILIRRUBINA NÃO CONJUGADA", "BILIRRUBINA INDIRETA"],
  "ALBUMINA": ["ALB", "ALBUMINA"],
  "AMILASE": ["AMILASE", "AMILASE SÉRICA"],
  "LIPASE": ["LIPASE", "LIPASE SÉRICA"],
  
  // Função Renal
  "UREIA": ["URÉIA", "BUN", "UREIA"],
  "CREATININA": ["CR", "CREAT", "CREATININA"],
  "RITMO FILTRAÇÃO GLOMERULAR": ["RFG", "TFG", "GFR", "CKD-EPI", "RITMO DE FILTRAÇÃO GLOMERULAR"],
  
  // Eletrólitos
  "SÓDIO": ["NA", "NA+", "SÓDIO"],
  "POTÁSSIO": ["K", "K+", "POTÁSSIO"],
  "CÁLCIO IÔNICO": ["CA++", "CAI", "CÁLCIO IONIZADO", "CÁLCIO IÔNICO"],
  "CÁLCIO TOTAL": ["CA", "CÁLCIO TOTAL"],
  
  // Perfil Lipídico
  "COLESTEROL TOTAL": ["CT", "COLESTEROL TOTAL"],
  "COLESTEROL HDL": ["HDL", "HDL-C", "COLESTEROL HDL"],
  "COLESTEROL LDL": ["LDL", "LDL-C", "COLESTEROL LDL"],
  "TRIGLICÉRIDES": ["TG", "TRIGLICERÍDEOS", "TRIGLICÉRIDES"],
  
  // Metabolismo do Ferro
  "FERRITINA": ["FERRITINA SÉRICA", "FERRITINA"],
  "FERRO SÉRICO": ["FE", "FERRO", "FERRO SÉRICO"],
  "TRANSFERRINA": ["TRANSFERRINA"],
  "CAPACIDADE TOTAL COMBINAÇÃO FERRO": ["CTLF", "TIBC", "CAPACIDADE TOTAL DE COMBINAÇÃO DO FERRO"],
  "ÍNDICE SATURAÇÃO TRANSFERRINA": ["IST", "SAT. TRANSFERRINA", "ÍNDICE DE SATURAÇÃO DA TRANSFERRINA"],
  
  // Coagulação
  "TEMPO PROTROMBINA": ["TP", "TAP", "TEMPO DE PROTROMBINA", "TEMPO ATIVIDADE PROTROMBINA"],
  "RNI": ["INR", "R.N.I.", "RNI"],
  "TTPA": ["TTPa", "TEMPO DE TROMBOPLASTINA PARCIAL ATIVADO", "TTPA"],
  
  // Glicemia
  "GLICOSE JEJUM": ["GLICEMIA", "GLICOSE", "GLICOSE - JEJUM", "GLICOSE JEJUM"],
  "HEMOGLOBINA GLICADA": ["HBA1C", "A1C", "HEMOGLOBINA GLICADA", "HEMOGLOBINA GLICOSILADA"],
  
  // Marcadores
  "PCR": ["PROTEÍNA C REATIVA", "PCR QUANTITATIVA", "PCR ULTRA SENSÍVEL", "PCR"],
  "ALFA FETOPROTEÍNA": ["AFP", "ALFA-FETOPROTEÍNA", "ALFA FETOPROTEÍNA"],
  
  // Sorologias
  "ANTI-HBC IGG": ["HBC IGG", "ANTI-HBC", "ANTI HBC IGG"],
  "ANTI-HBS": ["HBS", "ANTI-HBS"],
  "HBSAG": ["ANTÍGENO HBS", "HBSAG"],
};

/**
 * Categorias de exames para agrupamento na visualização
 */
export const EXAM_CATEGORIES: Record<string, string[]> = {
  "Hemograma": [
    "HEMÁCIAS", "HEMOGLOBINA", "HEMATÓCRITO", "VCM", "HCM", "CHCM", "RDW",
    "LEUCÓCITOS", "NEUTRÓFILOS SEGMENTADOS", "NEUTRÓFILOS BASTONETES",
    "LINFÓCITOS", "MONÓCITOS", "EOSINÓFILOS", "BASÓFILOS", "PLAQUETAS"
  ],
  "Função Hepática": [
    "TGO/AST", "TGP/ALT", "GAMA GT", "FOSFATASE ALCALINA",
    "BILIRRUBINA TOTAL", "BILIRRUBINA DIRETA", "BILIRRUBINA INDIRETA", "ALBUMINA"
  ],
  "Função Renal": ["UREIA", "CREATININA", "RITMO FILTRAÇÃO GLOMERULAR"],
  "Eletrólitos": ["SÓDIO", "POTÁSSIO", "CÁLCIO IÔNICO", "CÁLCIO TOTAL"],
  "Perfil Lipídico": ["COLESTEROL TOTAL", "COLESTEROL HDL", "COLESTEROL LDL", "TRIGLICÉRIDES"],
  "Metabolismo do Ferro": [
    "FERRITINA", "FERRO SÉRICO", "TRANSFERRINA",
    "CAPACIDADE TOTAL COMBINAÇÃO FERRO", "ÍNDICE SATURAÇÃO TRANSFERRINA"
  ],
  "Coagulação": ["TEMPO PROTROMBINA", "RNI", "TTPA"],
  "Glicemia": ["GLICOSE JEJUM", "HEMOGLOBINA GLICADA"],
  "Marcadores": ["PCR", "ALFA FETOPROTEÍNA"],
  "Sorologias": ["ANTI-HBC IGG", "ANTI-HBS", "HBSAG"],
};

/**
 * Valores de referência padrão por exame (para homens adultos)
 * Usado quando o PDF não fornece valores de referência
 */
export const DEFAULT_REFERENCE_VALUES: Record<string, { min?: number; max?: number; unit: string; text: string }> = {
  "HEMÁCIAS": { min: 4.5, max: 5.5, unit: "milhões/mm³", text: "4,5 a 5,5 milhões/mm³" },
  "HEMOGLOBINA": { min: 13.0, max: 17.5, unit: "g/dL", text: "13,0 a 17,5 g/dL" },
  "HEMATÓCRITO": { min: 40, max: 50, unit: "%", text: "40 a 50%" },
  "VCM": { min: 80, max: 100, unit: "fL", text: "80 a 100 fL" },
  "HCM": { min: 26, max: 32, unit: "pg", text: "26 a 32 pg" },
  "CHCM": { min: 32, max: 36, unit: "g/dL", text: "32 a 36 g/dL" },
  "RDW": { min: 11.5, max: 14.8, unit: "%", text: "11,5 a 14,8%" },
  "LEUCÓCITOS": { min: 4000, max: 11000, unit: "/mm³", text: "4.000 a 11.000/mm³" },
  "PLAQUETAS": { min: 150000, max: 450000, unit: "/mm³", text: "150.000 a 450.000/mm³" },
  "FERRITINA": { min: 22, max: 299, unit: "ng/mL", text: "22 a 299 ng/mL" },
  "SÓDIO": { min: 136, max: 145, unit: "mEq/L", text: "136 a 145 mEq/L" },
  "POTÁSSIO": { min: 3.5, max: 5.1, unit: "mEq/L", text: "3,5 a 5,1 mEq/L" },
  "UREIA": { min: 15, max: 55, unit: "mg/dL", text: "15 a 55 mg/dL" },
  "CREATININA": { min: 0.6, max: 1.3, unit: "mg/dL", text: "0,6 a 1,3 mg/dL" },
  "TGO/AST": { max: 40, unit: "U/L", text: "≤40 U/L" },
  "TGP/ALT": { max: 45, unit: "U/L", text: "≤45 U/L" },
  "GAMA GT": { max: 73, unit: "U/L", text: "≤73 U/L" },
  "FOSFATASE ALCALINA": { min: 56, max: 167, unit: "U/L", text: "56 a 167 U/L" },
  "BILIRRUBINA TOTAL": { min: 0.2, max: 1.2, unit: "mg/dL", text: "0,2 a 1,2 mg/dL" },
  "BILIRRUBINA DIRETA": { max: 0.4, unit: "mg/dL", text: "≤0,4 mg/dL" },
  "BILIRRUBINA INDIRETA": { max: 0.8, unit: "mg/dL", text: "≤0,8 mg/dL" },
  "ALBUMINA": { min: 3.5, max: 5.2, unit: "g/dL", text: "3,5 a 5,2 g/dL" },
  "GLICOSE JEJUM": { min: 60, max: 99, unit: "mg/dL", text: "60 a 99 mg/dL" },
  "HEMOGLOBINA GLICADA": { max: 5.7, unit: "%", text: "<5,7%" },
  "COLESTEROL TOTAL": { max: 190, unit: "mg/dL", text: "<190 mg/dL" },
  "COLESTEROL HDL": { min: 40, unit: "mg/dL", text: ">40 mg/dL" },
  "TRIGLICÉRIDES": { max: 150, unit: "mg/dL", text: "<150 mg/dL" },
  "PCR": { max: 10, unit: "mg/L", text: "<10 mg/L" },
  "AMILASE": { min: 30, max: 110, unit: "U/L", text: "30 a 110 U/L" },
  "LIPASE": { min: 23, max: 300, unit: "U/L", text: "23 a 300 U/L" },
  "VITAMINA D": { min: 20, max: 60, unit: "ng/mL", text: "20 a 60 ng/mL" },
  "TSH": { min: 0.51, max: 4.30, unit: "µUI/mL", text: "0,51 a 4,30 µUI/mL" },
  "CORTISOL": { min: 4.8, max: 19.5, unit: "µg/dL", text: "4,8 a 19,5 µg/dL" },
  "PTH": { min: 17.3, max: 74.1, unit: "pg/mL", text: "17,3 a 74,1 pg/mL" },
};

/**
 * Laboratórios conhecidos e seus padrões de formatação
 */
export const KNOWN_LABORATORIES = [
  "Hermes Pardini",
  "Lab-to-Lab Pardini",
  "Hospital Padre Jeremias",
  "AmorSaúde",
  "Weinmann",
  "Fleury",
  "DASA",
  "UNILAB",
  "UNIRAD",
  "Unimed Porto Alegre",
  "Unimed Pelotas",
  "Solução Laboratório",
  "Raio Som",
  "Moinhos de Vento",
  "Diagnósticos do Brasil",
  "Instituto de Patologia",
  "DB Diagnósticos",
  "Laboratório Galle",
  "Serdil",
  "Imagem da Confiança",
  "Saúde Medicina",
];

/**
 * Padrões de data encontrados em laudos brasileiros
 */
export const DATE_PATTERNS = [
  /(\d{2})\/(\d{2})\/(\d{4})/,  // DD/MM/YYYY
  /(\d{2})\/(\d{2})\/(\d{2})/,  // DD/MM/YY
  /(\d{4})-(\d{2})-(\d{2})/,    // YYYY-MM-DD
  /(\d{2})-(\d{2})-(\d{4})/,    // DD-MM-YYYY
];

/**
 * Prompt otimizado para extração de exames laboratoriais
 * Baseado em aprendizados de treinamento com PDFs reais
 */
export const OPTIMIZED_EXTRACTION_PROMPT = `Você é um especialista em extração de dados de exames laboratoriais brasileiros.
Analise o documento e extraia TODOS os resultados de exames laboratoriais.

REGRAS CRÍTICAS DE EXTRAÇÃO:

1. PRIORIDADE DE EXTRAÇÃO:
   - SEMPRE priorize o "LAUDO EVOLUTIVO", "FLUXOGRAMA" ou "HISTÓRICO" se existir (geralmente nas últimas páginas)
   - Estes contêm dados consolidados de múltiplas datas para o mesmo exame
   - Se houver múltiplas datas para o mesmo exame, crie UMA ENTRADA SEPARADA para cada data

2. PADRONIZAÇÃO DE NOMES:
   - Use nomes padronizados: "TGO/AST" (não apenas "TGO" ou "AST")
   - "HEMOGLOBINA" (não "Hb" ou "HGB")
   - "LEUCÓCITOS" (não "Glóbulos Brancos")
   - Mantenha consistência entre diferentes laboratórios

3. TRATAMENTO DE VALORES:
   - Para valores como ">90", "<0,1", "Não reagente": mantenha em "resultado" como texto
   - Coloque null em "resultado_numerico" para valores não numéricos
   - Converta vírgulas para pontos em números (ex: "14,2" → 14.2)
   - Preserve unidades exatamente como aparecem

4. DATAS:
   - Converta TODAS as datas para formato YYYY-MM-DD
   - Se apenas dia/mês disponível, use o ano do documento
   - Data de coleta tem prioridade sobre data de emissão

5. VALORES DE REFERÊNCIA:
   - Extraia min e max separadamente quando possível
   - Para referências como "≤40", use null para min e 40 para max
   - Para referências como ">40", use 40 para min e null para max

6. LABORATÓRIO:
   - Identifique o laboratório pelo cabeçalho do documento
   - Laboratórios comuns: Hermes Pardini, Weinmann, Fleury, DASA, AmorSaúde

Para cada exame, extraia:
- nome_exame: nome padronizado do exame
- resultado: valor do resultado (texto)
- resultado_numerico: valor numérico (number ou null)
- unidade: unidade de medida
- valor_referencia_texto: faixa de referência original
- valor_referencia_min: valor mínimo (number ou null)
- valor_referencia_max: valor máximo (number ou null)
- data_coleta: data no formato YYYY-MM-DD
- laboratorio: nome do laboratório

Retorne um JSON válido com a estrutura:
{
  "exames": [...],
  "laboratorio_principal": "string",
  "data_principal": "YYYY-MM-DD",
  "paciente_nome": "string ou null",
  "total_paginas_analisadas": number
}`;

/**
 * Função para normalizar nome de exame usando sinônimos
 */
export function normalizeExamName(rawName: string): string {
  const upperName = rawName.toUpperCase().trim();
  
  for (const [standardName, synonyms] of Object.entries(EXAM_SYNONYMS)) {
    if (synonyms.some(syn => upperName.includes(syn.toUpperCase()))) {
      return standardName;
    }
  }
  
  return upperName;
}

/**
 * Função para determinar categoria de um exame
 */
export function getExamCategory(examName: string): string {
  const normalizedName = normalizeExamName(examName);
  
  for (const [category, exams] of Object.entries(EXAM_CATEGORIES)) {
    if (exams.includes(normalizedName)) {
      return category;
    }
  }
  
  return "Outros";
}

/**
 * Função para verificar se valor está fora da referência
 */
export function isOutOfRange(
  value: number | null,
  refMin: number | null,
  refMax: number | null
): boolean {
  if (value === null) return false;
  if (refMin !== null && value < refMin) return true;
  if (refMax !== null && value > refMax) return true;
  return false;
}

/**
 * Função para converter data brasileira para ISO
 */
export function parseBrazilianDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  // DD/MM/YYYY ou DD/MM/YY
  const match1 = dateStr.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (match1) {
    const day = match1[1];
    const month = match1[2];
    let year = match1[3];
    if (year.length === 2) {
      year = parseInt(year) > 50 ? `19${year}` : `20${year}`;
    }
    return `${year}-${month}-${day}`;
  }
  
  // YYYY-MM-DD (já está no formato correto)
  const match2 = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (match2) {
    return dateStr;
  }
  
  return null;
}

/**
 * Novos exames identificados na Sessão 3 (2026-01-23)
 */
export const SESSION3_NEW_EXAMS = [
  "ELASTASE PANCREÁTICA",
  "CERULOPLASMINA", 
  "COBRE",
  "OSMOLALIDADE SORO",
  "OSMOLALIDADE URINA",
  "ACTH",
  "PEPTÍDEO C",
  "INSULINA",
  "ANTI-TRANSGLUTAMINASE IgG",
  "ALFA-1 GLOBULINAS",
  "ALFA-2 GLOBULINAS",
  "BETA-1 GLOBULINAS",
  "BETA-2 GLOBULINAS",
  "GAMA GLOBULINAS",
];

/**
 * Métricas de performance do algoritmo
 * Atualizado após cada sessão de treinamento
 */
export const PERFORMANCE_METRICS = {
  sessao1: { pdfs: 3, paginas: 41, exames: 44, tempoMin: 15, paginasPorMin: 2.7 },
  sessao2: { pdfs: 3, paginas: 34, exames: 47, tempoMin: 10, paginasPorMin: 3.4 },
  sessao3: { pdfs: 13, paginas: 170, exames: 284, tempoMin: 25, paginasPorMin: 6.8 },
};
