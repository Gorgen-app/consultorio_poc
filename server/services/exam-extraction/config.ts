/**
 * Configuração do Algoritmo de Extração de Exames
 * Gorgen - Aplicativo de Gestão em Saúde
 * 
 * Versão: 2.0.0
 * Última atualização: 2026-01-27
 * 
 * Baseado em 16 sessões de treinamento com ~350 PDFs e ~2.500 exames
 */

/**
 * Mapeamento de sinônimos de exames para padronização
 */
export const EXAM_SYNONYMS: Record<string, string[]> = {
  // ==================== HEMOGRAMA ====================
  "HEMÁCIAS": ["ERITRÓCITOS", "GLÓBULOS VERMELHOS", "RBC", "HEMÁCIAS", "ERITROCITOS"],
  "HEMOGLOBINA": ["HB", "HGB", "HEMOGLOBINA"],
  "HEMATÓCRITO": ["HT", "HCT", "HEMATÓCRITO", "HEMATOCRITO"],
  "VCM": ["VOLUME CORPUSCULAR MÉDIO", "VCM", "MCV"],
  "HCM": ["HEMOGLOBINA CORPUSCULAR MÉDIA", "HCM", "MCH"],
  "CHCM": ["CONCENTRAÇÃO DE HEMOGLOBINA CORPUSCULAR MÉDIA", "CHCM", "MCHC"],
  "RDW": ["AMPLITUDE DE DISTRIBUIÇÃO DOS ERITRÓCITOS", "RDW", "RDW-CV", "RDW-SD"],
  "LEUCÓCITOS": ["LEUCÓCITOS GLOBAL", "GLÓBULOS BRANCOS", "WBC", "LEUCÓCITOS", "LEUCOCITOS"],
  "PLAQUETAS": ["CONTAGEM DE PLAQUETAS", "PLT", "PLAQUETAS"],
  "VPM": ["VOLUME PLAQUETÁRIO MÉDIO", "VPM", "MPV"],
  
  // ==================== LEUCOGRAMA ====================
  "NEUTRÓFILOS": ["NEUTRÓFILOS SEGMENTADOS", "SEGMENTADOS", "NEUTRÓFILOS SEG", "NEUTROFILOS"],
  "BASTONETES": ["NEUTRÓFILOS BASTONETES", "BASTÕES", "BASTONETES"],
  "LINFÓCITOS": ["LINFÓCITOS TÍPICOS", "LINFÓCITOS", "LINFOCITOS"],
  "MONÓCITOS": ["MONÓCITOS", "MONOCITOS"],
  "EOSINÓFILOS": ["EOSINÓFILOS", "EOSINOFILOS"],
  "BASÓFILOS": ["BASÓFILOS", "BASOFILOS"],
  
  // ==================== FUNÇÃO HEPÁTICA ====================
  "TGO/AST": ["TGO", "AST", "TRANSAMINASE OXALACÉTICA", "ASPARTATO AMINOTRANSFERASE", "TGO/AST", "AST (TGO)"],
  "TGP/ALT": ["TGP", "ALT", "TRANSAMINASE PIRÚVICA", "ALANINA AMINOTRANSFERASE", "TGP/ALT", "ALT (TGP)"],
  "GAMA GT": ["GGT", "GAMA GLUTAMIL TRANSFERASE", "GAMA GT", "GAMA-GT", "GAMA-GLUTAMILTRANSFERASE"],
  "FOSFATASE ALCALINA": ["FA", "ALP", "FOSFATASE ALCALINA", "FOSFATASE ALCALINA (ALP)"],
  "BILIRRUBINA TOTAL": ["BT", "BILIRRUBINA TOTAL", "BILIRRUBINAS TOTAL"],
  "BILIRRUBINA DIRETA": ["BD", "BILIRRUBINA CONJUGADA", "BILIRRUBINA DIRETA"],
  "BILIRRUBINA INDIRETA": ["BI", "BILIRRUBINA NÃO CONJUGADA", "BILIRRUBINA INDIRETA"],
  "ALBUMINA": ["ALB", "ALBUMINA", "ALBUMINA SÉRICA"],
  "PROTEÍNAS TOTAIS": ["PT", "PROTEÍNAS TOTAIS", "PROTEINAS TOTAIS"],
  "AMILASE": ["AMILASE", "AMILASE SÉRICA"],
  "LIPASE": ["LIPASE", "LIPASE SÉRICA"],
  
  // ==================== FUNÇÃO RENAL ====================
  "UREIA": ["URÉIA", "BUN", "UREIA", "UREIA SÉRICA"],
  "CREATININA": ["CR", "CREAT", "CREATININA", "CREATININA SÉRICA"],
  "TFG CKD-EPI": ["RFG", "TFG", "GFR", "CKD-EPI", "RITMO DE FILTRAÇÃO GLOMERULAR", "TFG CKD-EPI"],
  "ÁCIDO ÚRICO": ["AU", "ÁCIDO ÚRICO", "ACIDO URICO", "URATO"],
  
  // ==================== PERFIL LIPÍDICO ====================
  "COLESTEROL TOTAL": ["CT", "COLESTEROL TOTAL", "COLESTEROL"],
  "HDL": ["HDL-C", "HDL COLESTEROL", "HDL", "COLESTEROL HDL"],
  "LDL": ["LDL-C", "LDL COLESTEROL", "LDL", "COLESTEROL LDL"],
  "VLDL": ["VLDL-C", "VLDL COLESTEROL", "VLDL"],
  "TRIGLICÉRIDES": ["TG", "TRIGLICERÍDEOS", "TRIGLICÉRIDES", "TRIGLICERIDES", "TRIGLICERÍDIOS"],
  
  // ==================== GLICEMIA ====================
  "GLICOSE": ["GLICEMIA", "GLICOSE", "GLICOSE JEJUM", "GLICEMIA DE JEJUM"],
  "HEMOGLOBINA GLICADA": ["HBA1C", "A1C", "HEMOGLOBINA GLICADA", "HEMOGLOBINA GLICOSILADA"],
  "INSULINA": ["INSULINA", "INSULINA BASAL", "INSULINA JEJUM"],
  "HOMA-IR": ["HOMA-IR", "HOMA IR", "ÍNDICE HOMA"],
  
  // ==================== ELETRÓLITOS ====================
  "SÓDIO": ["NA", "SÓDIO", "SODIO", "NATREMIA"],
  "POTÁSSIO": ["K", "POTÁSSIO", "POTASSIO", "CALEMIA"],
  "CÁLCIO": ["CA", "CÁLCIO", "CALCIO", "CALCEMIA"],
  "CÁLCIO IONIZADO": ["CAI", "CÁLCIO IONIZADO", "CALCIO IONIZADO", "CÁLCIO IÔNICO"],
  "MAGNÉSIO": ["MG", "MAGNÉSIO", "MAGNESIO"],
  "FÓSFORO": ["P", "FÓSFORO", "FOSFORO", "FOSFATEMIA"],
  "CLORO": ["CL", "CLORO", "CLORETO"],
  
  // ==================== FERRO ====================
  "FERRO": ["FE", "FERRO", "FERRO SÉRICO"],
  "FERRITINA": ["FERRITINA", "FERRITINA SÉRICA"],
  "TRANSFERRINA": ["TRANSFERRINA"],
  "SATURAÇÃO TRANSFERRINA": ["IST", "SATURAÇÃO DE TRANSFERRINA", "SATURAÇÃO TRANSFERRINA", "SAT. TRANSFERRINA"],
  "CAPACIDADE TOTAL LIGAÇÃO FERRO": ["CTLF", "TIBC", "CAPACIDADE TOTAL DE LIGAÇÃO DO FERRO"],
  
  // ==================== VITAMINAS ====================
  "VITAMINA D": ["25-OH VITAMINA D", "VITAMINA D", "25-HIDROXIVITAMINA D", "CALCIDIOL"],
  "VITAMINA B12": ["COBALAMINA", "VITAMINA B12", "B12"],
  "ÁCIDO FÓLICO": ["FOLATO", "ÁCIDO FÓLICO", "ACIDO FOLICO", "VITAMINA B9"],
  
  // ==================== TIREOIDE ====================
  "TSH": ["TSH", "TIREOTROFINA", "HORMÔNIO TIREOESTIMULANTE"],
  "T4 LIVRE": ["T4L", "T4 LIVRE", "TIROXINA LIVRE"],
  "T3 LIVRE": ["T3L", "T3 LIVRE", "TRIIODOTIRONINA LIVRE"],
  "T4 TOTAL": ["T4", "T4 TOTAL", "TIROXINA TOTAL"],
  "ANTI-TPO": ["ANTI-TPO", "ANTICORPO ANTI-PEROXIDASE", "AC ANTI-TPO"],
  "ANTI-TIREOGLOBULINA": ["ANTI-TG", "ANTICORPO ANTI-TIREOGLOBULINA"],
  
  // ==================== HORMÔNIOS ====================
  "PTH": ["PARATORMÔNIO", "PTH", "HORMÔNIO PARATIREOIDIANO"],
  "CORTISOL": ["CORTISOL", "CORTISOL SÉRICO"],
  "TESTOSTERONA": ["TESTOSTERONA", "TESTOSTERONA TOTAL"],
  "ESTRADIOL": ["E2", "ESTRADIOL", "17-BETA-ESTRADIOL"],
  "FSH": ["FSH", "HORMÔNIO FOLÍCULO ESTIMULANTE"],
  "LH": ["LH", "HORMÔNIO LUTEINIZANTE"],
  "PROLACTINA": ["PRL", "PROLACTINA"],
  
  // ==================== COAGULAÇÃO ====================
  "TP": ["TP", "TEMPO DE PROTROMBINA", "TAP"],
  "INR": ["INR", "RNI", "RAZÃO NORMALIZADA INTERNACIONAL"],
  "TTPA": ["TTPA", "TTPa", "TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA", "PTT"],
  "FIBRINOGÊNIO": ["FIBRINOGÊNIO", "FIBRINOGENIO"],
  
  // ==================== MARCADORES TUMORAIS ====================
  "AFP": ["ALFA-FETOPROTEÍNA", "AFP", "ALFAFETOPROTEÍNA"],
  "CEA": ["ANTÍGENO CARCINOEMBRIONÁRIO", "CEA"],
  "CA 19-9": ["CA 19-9", "CA19-9", "ANTÍGENO CA 19-9"],
  "CA 125": ["CA 125", "CA125", "ANTÍGENO CA 125"],
  "PSA": ["PSA", "ANTÍGENO PROSTÁTICO ESPECÍFICO", "PSA TOTAL"],
  
  // ==================== SOROLOGIAS ====================
  "HIV": ["HIV", "HIV 1/2", "ANTI-HIV", "HIV1/HIV2"],
  "ANTI-HCV": ["ANTI-HCV", "HCV", "HEPATITE C"],
  "HBSAG": ["HBSAG", "ANTÍGENO DE SUPERFÍCIE HBV", "ANTÍGENO AUSTRALIA"],
  "ANTI-HBS": ["ANTI-HBS", "ANTICORPO ANTI-HBS"],
  "HBV DNA": ["HBV DNA", "CARGA VIRAL HBV", "DNA DO HBV"],
  "HCV RNA": ["HCV RNA", "CARGA VIRAL HCV", "RNA DO HCV"],
  
  // ==================== IMUNOLOGIA ====================
  "PCR": ["PROTEÍNA C REATIVA", "PCR", "PCR ULTRASSENSÍVEL", "PROTEINA C-REATIVA"],
  "VHS": ["VHS", "VELOCIDADE DE HEMOSSEDIMENTAÇÃO", "VSG"],
  "FAN": ["FAN", "FATOR ANTINUCLEAR", "ANA"],
  "FATOR REUMATÓIDE": ["FR", "FATOR REUMATÓIDE", "FATOR REUMATOIDE"],
  "COMPLEMENTO C3": ["C3", "COMPLEMENTO C3"],
  "COMPLEMENTO C4": ["C4", "COMPLEMENTO C4"],
  "IGG": ["IGG", "IMUNOGLOBULINA G", "IG G"],
  "IGA": ["IGA", "IMUNOGLOBULINA A", "IG A"],
  "IGM": ["IGM", "IMUNOGLOBULINA M", "IG M"],
  "IGE": ["IGE", "IMUNOGLOBULINA E", "IG E"],
  
  // ==================== URINA ====================
  "URINA GLICOSE": ["GLICOSE URINÁRIA", "GLICOSÚRIA", "URINA GLICOSE"],
  "URINA PROTEÍNAS": ["PROTEÍNAS URINÁRIAS", "PROTEINÚRIA", "URINA PROTEÍNAS"],
  "URINA LEUCÓCITOS": ["LEUCOCITÚRIA", "LEUCÓCITOS URINÁRIOS", "URINA LEUCÓCITOS"],
  "URINA ERITRÓCITOS": ["HEMATÚRIA", "ERITRÓCITOS URINÁRIOS", "URINA ERITRÓCITOS"],
};

/**
 * Laboratórios conhecidos com padrões de identificação
 */
export const KNOWN_LABORATORIES: Record<string, {
  fullName: string;
  city?: string;
  state?: string;
  identificationPatterns: string[];
}> = {
  "WEINMANN": {
    fullName: "Weinmann Laboratório",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "weinmann",
      "av farrapos.*2750",
      "katia zanotelli fassina",
    ],
  },
  "MOINHOS_VENTO": {
    fullName: "Hospital Moinhos de Vento",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "moinhos de vento",
      "hospital moinhos",
    ],
  },
  "UNIMED_POA": {
    fullName: "Unimed Porto Alegre",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "unimed porto alegre",
      "unimed poa",
      "rua são luis.*96.*santana",
      "rodrigo dias duarte",
    ],
  },
  "UNIMED_PELOTAS": {
    fullName: "Unimed Pelotas",
    city: "Pelotas",
    state: "RS",
    identificationPatterns: [
      "unimed pelotas",
    ],
  },
  "UNIMED_LITORAL": {
    fullName: "Unimed Litoral",
    city: "Litoral RS",
    state: "RS",
    identificationPatterns: [
      "unimed litoral",
    ],
  },
  "HOSPITAL_CLINICAS": {
    fullName: "Hospital de Clínicas de Porto Alegre",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "hospital de clínicas",
      "hcpa",
    ],
  },
  "SAO_LUCAS": {
    fullName: "Hospital São Lucas da PUCRS",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "são lucas",
      "pucrs",
    ],
  },
  "GALLE": {
    fullName: "Laboratório Galle",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "laboratório galle",
      "galle laboratório",
    ],
  },
  "SERDIL": {
    fullName: "Serdil Medicina Diagnóstica",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "serdil",
    ],
  },
  "DB_DIAGNOSTICOS": {
    fullName: "DB Diagnósticos",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "db diagnósticos",
      "diagnósticos do brasil",
    ],
  },
  "IMAGEM_CONFIANCA": {
    fullName: "Imagem da Confiança",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "imagem da confiança",
    ],
  },
  "ENDOCRIMETA": {
    fullName: "Endocrimeta",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "endocrimeta",
    ],
  },
  "FLEURY": {
    fullName: "Grupo Fleury",
    city: "São Paulo",
    state: "SP",
    identificationPatterns: [
      "fleury",
      "grupo fleury",
    ],
  },
  "HERMES_PARDINI": {
    fullName: "Hermes Pardini",
    city: "Belo Horizonte",
    state: "MG",
    identificationPatterns: [
      "hermes pardini",
      "pardini",
    ],
  },
  "DASA": {
    fullName: "DASA",
    city: "São Paulo",
    state: "SP",
    identificationPatterns: [
      "dasa",
      "diagnósticos da américa",
    ],
  },
};

/**
 * Valores de referência para detecção de alterações
 * Valores padrão para adultos - podem variar por idade/sexo
 */
export const REFERENCE_VALUES: Record<string, {
  min?: number;
  max?: number;
  unit: string;
  gender?: 'M' | 'F' | 'BOTH';
}> = {
  // Hemograma - Homens
  "HEMÁCIAS": { min: 4.32, max: 5.67, unit: "milhões/mm³", gender: 'M' },
  "HEMOGLOBINA": { min: 13.3, max: 16.5, unit: "g/dL", gender: 'M' },
  "HEMATÓCRITO": { min: 39.2, max: 49.0, unit: "%", gender: 'M' },
  "VCM": { min: 81.7, max: 95.3, unit: "fL" },
  "HCM": { min: 27.7, max: 32.7, unit: "pg" },
  "CHCM": { min: 32.4, max: 36.0, unit: "g/dL" },
  "RDW": { min: 11.8, max: 14.1, unit: "%" },
  "LEUCÓCITOS": { min: 3650, max: 8120, unit: "/mm³" },
  "PLAQUETAS": { min: 151000, max: 304000, unit: "/mm³" },
  "VPM": { min: 9.2, max: 12.6, unit: "fL" },
  
  // Leucograma
  "NEUTRÓFILOS": { min: 1590, max: 4770, unit: "/mm³" },
  "LINFÓCITOS": { min: 1120, max: 2950, unit: "/mm³" },
  "MONÓCITOS": { min: 260, max: 730, unit: "/mm³" },
  "EOSINÓFILOS": { min: 34, max: 420, unit: "/mm³" },
  "BASÓFILOS": { min: 10, max: 80, unit: "/mm³" },
  
  // Função Hepática
  "TGO/AST": { max: 40, unit: "U/L" },
  "TGP/ALT": { max: 41, unit: "U/L" },
  "GAMA GT": { min: 12, max: 73, unit: "U/L", gender: 'M' },
  "FOSFATASE ALCALINA": { min: 40, max: 129, unit: "U/L" },
  "BILIRRUBINA TOTAL": { min: 0.20, max: 1.10, unit: "mg/dL" },
  "BILIRRUBINA DIRETA": { max: 0.30, unit: "mg/dL" },
  "BILIRRUBINA INDIRETA": { min: 0.20, max: 0.80, unit: "mg/dL" },
  "ALBUMINA": { min: 3.5, max: 5.0, unit: "g/dL" },
  "AMILASE": { max: 100, unit: "U/L" },
  "LIPASE": { max: 60, unit: "U/L" },
  
  // Função Renal
  "UREIA": { min: 15, max: 45, unit: "mg/dL" },
  "CREATININA": { min: 0.70, max: 1.30, unit: "mg/dL", gender: 'M' },
  "ÁCIDO ÚRICO": { min: 3.5, max: 7.2, unit: "mg/dL", gender: 'M' },
  
  // Perfil Lipídico
  "COLESTEROL TOTAL": { max: 190, unit: "mg/dL" },
  "HDL": { min: 40, unit: "mg/dL" },
  "LDL": { max: 130, unit: "mg/dL" },
  "TRIGLICÉRIDES": { max: 150, unit: "mg/dL" },
  
  // Glicemia
  "GLICOSE": { min: 70, max: 99, unit: "mg/dL" },
  "HEMOGLOBINA GLICADA": { max: 5.7, unit: "%" },
  
  // Eletrólitos
  "SÓDIO": { min: 136, max: 145, unit: "mEq/L" },
  "POTÁSSIO": { min: 3.5, max: 5.1, unit: "mEq/L" },
  "CÁLCIO": { min: 8.5, max: 10.5, unit: "mg/dL" },
  "MAGNÉSIO": { min: 1.6, max: 2.6, unit: "mg/dL" },
  "FÓSFORO": { min: 2.5, max: 4.5, unit: "mg/dL" },
  
  // Ferro
  "FERRO": { min: 65, max: 175, unit: "µg/dL", gender: 'M' },
  "FERRITINA": { min: 26, max: 446, unit: "ng/mL", gender: 'M' },
  "SATURAÇÃO TRANSFERRINA": { min: 20, max: 50, unit: "%" },
  
  // Vitaminas
  "VITAMINA D": { min: 30, max: 100, unit: "ng/mL" },
  "VITAMINA B12": { min: 200, max: 900, unit: "pg/mL" },
  "ÁCIDO FÓLICO": { min: 3.9, unit: "ng/mL" },
  
  // Tireoide
  "TSH": { min: 0.4, max: 4.0, unit: "mUI/L" },
  "T4 LIVRE": { min: 0.8, max: 1.8, unit: "ng/dL" },
  
  // Inflamação
  "PCR": { max: 0.5, unit: "mg/dL" },
  "VHS": { max: 15, unit: "mm/h", gender: 'M' },
  
  // Coagulação
  "INR": { min: 0.8, max: 1.2, unit: "" },
  "TTPA": { min: 25, max: 35, unit: "segundos" },
  
  // Marcadores Tumorais
  "AFP": { max: 10, unit: "ng/mL" },
  "CEA": { max: 5, unit: "ng/mL" },
  "CA 19-9": { max: 37, unit: "U/mL" },
  "PSA": { max: 4, unit: "ng/mL" },
};

/**
 * Padrões de documentos que NÃO são exames
 */
export const NON_EXAM_PATTERNS: RegExp[] = [
  /receitu[aá]rio/i,
  /prescri[çc][aã]o/i,
  /atestado m[ée]dico/i,
  /solicita[çc][aã]o de exame/i,
  /guia sadt/i,
  /extrato de pagamento/i,
  /boleto/i,
  /nota fiscal/i,
  /regulamento/i,
  /termo de consentimento/i,
  /carta m[ée]dica/i,
  /medical letter/i,
  /encaminhamento/i,
];

/**
 * Configuração padrão para extração via ML (Opção 3 - futuro)
 */
export const ML_EXTRACTION_CONFIG = {
  model: 'gpt-4.1-mini' as const,
  temperature: 0.1,
  maxTokens: 4000,
  basePrompt: `Você é um especialista em extração de dados de exames laboratoriais.
Analise o texto do laudo e extraia TODOS os resultados de exames no formato JSON.

Para cada exame, extraia:
- name: nome padronizado do exame
- value: valor numérico ou qualitativo
- unit: unidade de medida
- reference: valor de referência
- isAltered: true se o valor está fora da referência

Retorne um array JSON com todos os exames encontrados.`,
  fewShotExamples: [] as { input: string; output: { name: string; value: string; unit: string; reference: string; isAltered: boolean }[] }[],
};
