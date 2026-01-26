/**
 * ============================================================================
 * DRY RUN - Simulação de Integração do Módulo exam-extraction
 * ============================================================================
 * 
 * Este script simula a integração do módulo exam-extraction com o sistema
 * principal do Gorgen, identificando incompatibilidades e riscos.
 * 
 * @date 2026-01-25
 */

import { ExameExtraido, DocumentoPDF, ExtratorExames } from './exam-extractor';
import { quickFilter, FilterDecision } from './quick-filter';
import { classifyDocument, DocumentType } from './pdf-classifier';
import { detectLaboratory } from './laboratory-cache';

// ============================================================================
// TIPOS DO SISTEMA PRINCIPAL (simulados)
// ============================================================================

interface InsertResultadoLaboratorial {
  pacienteId: number;
  documentoExternoId: number;
  nomeExameOriginal: string;
  dataColeta: string;
  resultado: string;
  resultadoNumerico: string | null;
  unidade: string | null;
  valorReferenciaTexto: string | null;
  valorReferenciaMin: string | null;
  valorReferenciaMax: string | null;
  laboratorio: string | null;
  extraidoPorIa: boolean;
  foraReferencia?: boolean;
  tipoAlteracao?: 'Normal' | 'Aumentado' | 'Diminuído';
}

// ============================================================================
// FUNÇÕES DE CONVERSÃO (ADAPTER)
// ============================================================================

/**
 * Converte ExameExtraido (módulo) para InsertResultadoLaboratorial (banco)
 * 
 * RISCO IDENTIFICADO: Incompatibilidade de campos
 */
function converterParaBanco(
  exame: ExameExtraido,
  pacienteId: number,
  documentoExternoId: number
): InsertResultadoLaboratorial {
  // Parsear valor de referência
  let valorReferenciaMin: string | null = null;
  let valorReferenciaMax: string | null = null;
  
  const refMatch = exame.valor_referencia.match(/(\d+[.,]?\d*)\s*[-a]\s*(\d+[.,]?\d*)/);
  if (refMatch) {
    valorReferenciaMin = refMatch[1].replace(',', '.');
    valorReferenciaMax = refMatch[2].replace(',', '.');
  } else {
    const menorMatch = exame.valor_referencia.match(/<\s*(\d+[.,]?\d*)/);
    if (menorMatch) {
      valorReferenciaMax = menorMatch[1].replace(',', '.');
    }
    const maiorMatch = exame.valor_referencia.match(/>\s*(\d+[.,]?\d*)/);
    if (maiorMatch) {
      valorReferenciaMin = maiorMatch[1].replace(',', '.');
    }
  }

  // Extrair valor numérico do resultado
  let resultadoNumerico: string | null = null;
  const numMatch = exame.resultado.match(/(\d+[.,]?\d*)/);
  if (numMatch) {
    resultadoNumerico = numMatch[1].replace(',', '.');
  }

  // Converter data de DD/MM/YYYY para YYYY-MM-DD
  let dataColeta = exame.data_coleta;
  const dateMatch = exame.data_coleta.match(/(\d{2})\/(\d{2})\/(\d{2,4})/);
  if (dateMatch) {
    let ano = dateMatch[3];
    if (ano.length === 2) {
      ano = parseInt(ano) > 50 ? '19' + ano : '20' + ano;
    }
    dataColeta = `${ano}-${dateMatch[2]}-${dateMatch[1]}`;
  }

  // Determinar tipo de alteração
  let tipoAlteracao: 'Normal' | 'Aumentado' | 'Diminuído' = 'Normal';
  if (exame.alterado && resultadoNumerico && valorReferenciaMax) {
    if (parseFloat(resultadoNumerico) > parseFloat(valorReferenciaMax)) {
      tipoAlteracao = 'Aumentado';
    } else if (valorReferenciaMin && parseFloat(resultadoNumerico) < parseFloat(valorReferenciaMin)) {
      tipoAlteracao = 'Diminuído';
    }
  }

  return {
    pacienteId,
    documentoExternoId,
    nomeExameOriginal: exame.nome_exame,
    dataColeta,
    resultado: exame.resultado,
    resultadoNumerico,
    unidade: exame.unidade || null,
    valorReferenciaTexto: exame.valor_referencia || null,
    valorReferenciaMin,
    valorReferenciaMax,
    laboratorio: exame.laboratorio || null,
    extraidoPorIa: true,
    foraReferencia: exame.alterado,
    tipoAlteracao,
  };
}

// ============================================================================
// SIMULAÇÃO DE INTEGRAÇÃO
// ============================================================================

interface ResultadoDryRun {
  sucesso: boolean;
  etapas: {
    nome: string;
    status: 'OK' | 'AVISO' | 'ERRO';
    mensagem: string;
    risco?: string;
  }[];
  riscos: {
    categoria: string;
    descricao: string;
    impacto: 'BAIXO' | 'MÉDIO' | 'ALTO' | 'CRÍTICO';
    probabilidade: number; // 0-100
    mitigacao: string;
  }[];
  compatibilidade: {
    tipos: number;
    funcoes: number;
    dependencias: number;
    total: number;
  };
  chanceSuccesso: number;
}

export async function executarDryRun(): Promise<ResultadoDryRun> {
  const resultado: ResultadoDryRun = {
    sucesso: true,
    etapas: [],
    riscos: [],
    compatibilidade: {
      tipos: 0,
      funcoes: 0,
      dependencias: 0,
      total: 0,
    },
    chanceSuccesso: 0,
  };

  // ============================================================================
  // ETAPA 1: Verificar compatibilidade de tipos
  // ============================================================================
  
  // Simular ExameExtraido
  const exameSimulado: ExameExtraido = {
    paciente: 'TESTE PACIENTE',
    nome_exame: 'HEMOGLOBINA',
    resultado: '14.5',
    unidade: 'g/dL',
    valor_referencia: '13.3 - 16.5',
    data_coleta: '15/01/2026',
    laboratorio: 'Weinmann',
    alterado: false,
    arquivo_origem: 'teste.pdf',
  };

  try {
    const convertido = converterParaBanco(exameSimulado, 1, 1);
    
    // Verificar campos obrigatórios
    const camposObrigatorios = ['pacienteId', 'documentoExternoId', 'nomeExameOriginal', 'dataColeta', 'resultado'];
    const camposFaltando = camposObrigatorios.filter(c => !(c in convertido) || convertido[c as keyof typeof convertido] === undefined);
    
    if (camposFaltando.length === 0) {
      resultado.etapas.push({
        nome: 'Compatibilidade de Tipos',
        status: 'OK',
        mensagem: 'Todos os campos obrigatórios mapeados corretamente',
      });
      resultado.compatibilidade.tipos = 95;
    } else {
      resultado.etapas.push({
        nome: 'Compatibilidade de Tipos',
        status: 'ERRO',
        mensagem: `Campos faltando: ${camposFaltando.join(', ')}`,
        risco: 'Inserção no banco falhará',
      });
      resultado.compatibilidade.tipos = 50;
      resultado.sucesso = false;
    }
  } catch (error) {
    resultado.etapas.push({
      nome: 'Compatibilidade de Tipos',
      status: 'ERRO',
      mensagem: `Erro na conversão: ${error}`,
    });
    resultado.compatibilidade.tipos = 0;
    resultado.sucesso = false;
  }

  // ============================================================================
  // ETAPA 2: Verificar filtro rápido
  // ============================================================================
  
  const docTeste: DocumentoPDF = {
    nome_arquivo: 'teste.pdf',
    caminho: '/teste/teste.pdf',
    conteudo_texto: 'WEINMANN LABORATÓRIO\nHEMOGRAMA COMPLETO\nHEMOGLOBINA: 14.5 g/dL',
    numero_paginas: 1,
    tamanho_bytes: 1000,
  };

  try {
    const filtroResult = quickFilter(docTeste.conteudo_texto, docTeste.caminho);
    if (filtroResult.decision === FilterDecision.PROCESS) {
      resultado.etapas.push({
        nome: 'Filtro Rápido',
        status: 'OK',
        mensagem: 'Filtro funcionando corretamente',
      });
      resultado.compatibilidade.funcoes += 25;
    } else {
      resultado.etapas.push({
        nome: 'Filtro Rápido',
        status: 'AVISO',
        mensagem: `Documento de teste foi ${filtroResult.decision}`,
      });
      resultado.compatibilidade.funcoes += 15;
    }
  } catch (error) {
    resultado.etapas.push({
      nome: 'Filtro Rápido',
      status: 'ERRO',
      mensagem: `Erro no filtro: ${error}`,
    });
  }

  // ============================================================================
  // ETAPA 3: Verificar classificação de documentos
  // ============================================================================
  
  try {
    const classResult = classifyDocument(docTeste.conteudo_texto, 'test.pdf');
    if (classResult.type === DocumentType.LABORATORIAL) {
      resultado.etapas.push({
        nome: 'Classificação de Documentos',
        status: 'OK',
        mensagem: `Documento classificado como ${classResult.type}`,
      });
      resultado.compatibilidade.funcoes += 25;
    } else {
      resultado.etapas.push({
        nome: 'Classificação de Documentos',
        status: 'AVISO',
        mensagem: `Classificação inesperada: ${classResult.type}`,
      });
      resultado.compatibilidade.funcoes += 15;
    }
  } catch (error) {
    resultado.etapas.push({
      nome: 'Classificação de Documentos',
      status: 'ERRO',
      mensagem: `Erro na classificação: ${error}`,
    });
  }

  // ============================================================================
  // ETAPA 4: Verificar detecção de laboratório
  // ============================================================================
  
  try {
    const lab = detectLaboratory(docTeste.conteudo_texto);
    if (lab) {
      resultado.etapas.push({
        nome: 'Detecção de Laboratório',
        status: 'OK',
        mensagem: `Laboratório detectado: ${lab.name}`,
      });
      resultado.compatibilidade.funcoes += 25;
    } else {
      resultado.etapas.push({
        nome: 'Detecção de Laboratório',
        status: 'AVISO',
        mensagem: 'Laboratório não reconhecido (usará padrão)',
      });
      resultado.compatibilidade.funcoes += 20;
    }
  } catch (error) {
    resultado.etapas.push({
      nome: 'Detecção de Laboratório',
      status: 'ERRO',
      mensagem: `Erro na detecção: ${error}`,
    });
  }

  // ============================================================================
  // ETAPA 5: Verificar dependências de Node.js
  // ============================================================================
  
  const dependenciasNode = ['fs', 'path'];
  let depOk = 0;
  
  for (const dep of dependenciasNode) {
    try {
      require(dep);
      depOk++;
    } catch (error) {
      resultado.etapas.push({
        nome: `Dependência: ${dep}`,
        status: 'ERRO',
        mensagem: `Módulo ${dep} não disponível`,
      });
    }
  }
  
  if (depOk === dependenciasNode.length) {
    resultado.etapas.push({
      nome: 'Dependências Node.js',
      status: 'OK',
      mensagem: 'Todas as dependências disponíveis',
    });
    resultado.compatibilidade.dependencias = 100;
  } else {
    resultado.compatibilidade.dependencias = (depOk / dependenciasNode.length) * 100;
  }

  // ============================================================================
  // IDENTIFICAÇÃO DE RISCOS
  // ============================================================================

  resultado.riscos = [
    {
      categoria: 'INCOMPATIBILIDADE DE TIPOS',
      descricao: 'Campo "paciente" do módulo não existe no banco (usa pacienteId)',
      impacto: 'BAIXO',
      probabilidade: 100,
      mitigacao: 'Adapter já implementado na função converterParaBanco()',
    },
    {
      categoria: 'FORMATO DE DATA',
      descricao: 'Módulo usa DD/MM/YYYY, banco usa YYYY-MM-DD',
      impacto: 'MÉDIO',
      probabilidade: 100,
      mitigacao: 'Conversão implementada no adapter',
    },
    {
      categoria: 'CAMPO FALTANTE',
      descricao: 'Módulo não extrai examePadronizadoId (normalização)',
      impacto: 'BAIXO',
      probabilidade: 100,
      mitigacao: 'Campo é opcional no banco, normalização pode ser feita depois',
    },
    {
      categoria: 'CONFLITO DE FUNÇÃO',
      descricao: 'Duas funções de extração: extrairDePdf (atual) e processarLote (novo)',
      impacto: 'MÉDIO',
      probabilidade: 80,
      mitigacao: 'Usar novo módulo como pré-processador, manter LLM para extração final',
    },
    {
      categoria: 'PERFORMANCE',
      descricao: 'Módulo usa fs/path síncronos que podem bloquear event loop',
      impacto: 'MÉDIO',
      probabilidade: 60,
      mitigacao: 'Converter para versões async (fs.promises)',
    },
    {
      categoria: 'DEPENDÊNCIA EXTERNA',
      descricao: 'Módulo depende de pdftotext (poppler-utils) não garantido em produção',
      impacto: 'ALTO',
      probabilidade: 40,
      mitigacao: 'Usar texto OCR já extraído pelo sistema (documento.textoOcr)',
    },
    {
      categoria: 'MULTI-TENANT',
      descricao: 'Módulo não considera tenantId na extração',
      impacto: 'CRÍTICO',
      probabilidade: 100,
      mitigacao: 'Adicionar tenantId como parâmetro obrigatório',
    },
    {
      categoria: 'DUPLICAÇÃO DE DADOS',
      descricao: 'Módulo pode inserir exames duplicados se processado múltiplas vezes',
      impacto: 'ALTO',
      probabilidade: 70,
      mitigacao: 'Implementar verificação de duplicidade antes de inserir',
    },
    {
      categoria: 'ROLLBACK',
      descricao: 'Não há transação para rollback em caso de erro parcial',
      impacto: 'MÉDIO',
      probabilidade: 50,
      mitigacao: 'Usar transação do Drizzle para inserção em lote',
    },
    {
      categoria: 'TESTES',
      descricao: 'Testes do módulo usam vitest, projeto usa outro framework',
      impacto: 'BAIXO',
      probabilidade: 30,
      mitigacao: 'Adaptar testes ou executar separadamente',
    },
  ];

  // ============================================================================
  // CÁLCULO DE COMPATIBILIDADE E CHANCE DE SUCESSO
  // ============================================================================

  resultado.compatibilidade.total = Math.round(
    (resultado.compatibilidade.tipos * 0.4) +
    (resultado.compatibilidade.funcoes * 0.4) +
    (resultado.compatibilidade.dependencias * 0.2)
  );

  // Calcular chance de sucesso baseado nos riscos
  let penalidade = 0;
  for (const risco of resultado.riscos) {
    const pesoImpacto = {
      'BAIXO': 2,
      'MÉDIO': 5,
      'ALTO': 10,
      'CRÍTICO': 20,
    };
    penalidade += (pesoImpacto[risco.impacto] * risco.probabilidade) / 100;
  }

  resultado.chanceSuccesso = Math.max(0, Math.min(100, 
    resultado.compatibilidade.total - penalidade
  ));

  return resultado;
}

// ============================================================================
// EXECUÇÃO DO DRY RUN
// ============================================================================

if (require.main === module) {
  executarDryRun().then(resultado => {
    console.log('\n' + '='.repeat(80));
    console.log('DRY RUN - INTEGRAÇÃO DO MÓDULO EXAM-EXTRACTION');
    console.log('='.repeat(80) + '\n');

    console.log('ETAPAS DE VERIFICAÇÃO:');
    console.log('-'.repeat(40));
    for (const etapa of resultado.etapas) {
      const icon = etapa.status === 'OK' ? '✅' : etapa.status === 'AVISO' ? '⚠️' : '❌';
      console.log(`${icon} ${etapa.nome}: ${etapa.mensagem}`);
      if (etapa.risco) {
        console.log(`   ⚠️ Risco: ${etapa.risco}`);
      }
    }

    console.log('\n' + 'RISCOS IDENTIFICADOS:');
    console.log('-'.repeat(40));
    for (const risco of resultado.riscos) {
      const icon = risco.impacto === 'CRÍTICO' ? '🔴' : 
                   risco.impacto === 'ALTO' ? '🟠' :
                   risco.impacto === 'MÉDIO' ? '🟡' : '🟢';
      console.log(`${icon} [${risco.impacto}] ${risco.categoria}`);
      console.log(`   ${risco.descricao}`);
      console.log(`   Probabilidade: ${risco.probabilidade}%`);
      console.log(`   Mitigação: ${risco.mitigacao}`);
      console.log('');
    }

    console.log('COMPATIBILIDADE:');
    console.log('-'.repeat(40));
    console.log(`Tipos: ${resultado.compatibilidade.tipos}%`);
    console.log(`Funções: ${resultado.compatibilidade.funcoes}%`);
    console.log(`Dependências: ${resultado.compatibilidade.dependencias}%`);
    console.log(`TOTAL: ${resultado.compatibilidade.total}%`);

    console.log('\n' + '='.repeat(80));
    console.log(`CHANCE DE SUCESSO DA INTEGRAÇÃO: ${resultado.chanceSuccesso.toFixed(1)}%`);
    console.log('='.repeat(80) + '\n');
  });
}
