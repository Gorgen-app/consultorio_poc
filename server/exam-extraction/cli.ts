#!/usr/bin/env npx ts-node
/**
 * ============================================================================
 * GORGEN EXAM EXTRACTOR - CLI (Command Line Interface)
 * ============================================================================
 * 
 * Script executável para extração de exames de PDFs via linha de comando.
 * 
 * USO:
 *   npx ts-node cli.ts <diretório_pdfs> [opções]
 *   npx ts-node cli.ts ./exames --output ./resultados --format csv
 * 
 * OPÇÕES:
 *   --output, -o    Diretório de saída (padrão: ./output)
 *   --format, -f    Formato de saída: csv, json, pivot (padrão: csv)
 *   --patient, -p   Filtrar por nome do paciente
 *   --verbose, -v   Modo verboso
 *   --help, -h      Mostrar ajuda
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExtratorExames, DocumentoPDF, ResultadoProcessamento } from './exam-extractor';
import { 
  lerPDF, 
  lerPDFsDiretorio, 
  exportarCSV, 
  exportarTabelaPivotada, 
  exportarJSON,
  Logger 
} from './utils';

// ============================================================================
// CONFIGURAÇÃO CLI
// ============================================================================

interface OpcoesCliConfig {
  diretorio: string;
  output: string;
  formato: 'csv' | 'json' | 'pivot';
  paciente?: string;
  verbose: boolean;
}

function parseArgs(args: string[]): OpcoesCliConfig {
  const config: OpcoesCliConfig = {
    diretorio: '',
    output: './output',
    formato: 'csv',
    verbose: false
  };

  for (let i = 2; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--help' || arg === '-h') {
      mostrarAjuda();
      process.exit(0);
    }
    
    if (arg === '--verbose' || arg === '-v') {
      config.verbose = true;
      continue;
    }
    
    if (arg === '--output' || arg === '-o') {
      config.output = args[++i] || './output';
      continue;
    }
    
    if (arg === '--format' || arg === '-f') {
      const formato = args[++i];
      if (['csv', 'json', 'pivot'].includes(formato)) {
        config.formato = formato as 'csv' | 'json' | 'pivot';
      }
      continue;
    }
    
    if (arg === '--patient' || arg === '-p') {
      config.paciente = args[++i];
      continue;
    }
    
    // Argumento posicional (diretório)
    if (!arg.startsWith('-')) {
      config.diretorio = arg;
    }
  }

  return config;
}

function mostrarAjuda(): void {
  console.log(`
================================================================================
GORGEN EXAM EXTRACTOR - Extração de Exames de PDFs
================================================================================

USO:
  npx ts-node cli.ts <diretório_pdfs> [opções]

EXEMPLOS:
  npx ts-node cli.ts ./exames
  npx ts-node cli.ts ./exames --output ./resultados --format pivot
  npx ts-node cli.ts ./exames -o ./resultados -f csv -v
  npx ts-node cli.ts ./exames --patient "JOÃO SILVA"

OPÇÕES:
  --output, -o <dir>     Diretório de saída (padrão: ./output)
  --format, -f <fmt>     Formato de saída: csv, json, pivot (padrão: csv)
  --patient, -p <nome>   Filtrar por nome do paciente
  --verbose, -v          Modo verboso com logs detalhados
  --help, -h             Mostrar esta ajuda

FORMATOS DE SAÍDA:
  csv     Tabela CSV com todos os exames (1 exame por linha)
  json    Arquivo JSON estruturado
  pivot   Tabela pivotada (exames nas linhas, datas nas colunas)

ARQUIVOS GERADOS:
  exames_extraidos.csv       Todos os exames extraídos
  exames_pivot.csv           Tabela pivotada por paciente
  relatorio_processamento.txt  Relatório detalhado
  indice_pacientes.json      Índice de pacientes processados

================================================================================
`);
}

// ============================================================================
// FUNÇÃO PRINCIPAL
// ============================================================================

async function main(): Promise<void> {
  const config = parseArgs(process.argv);
  const logger = new Logger('CLI', config.verbose ? 'debug' : 'info');

  // Validar diretório
  if (!config.diretorio) {
    console.error('Erro: Diretório de PDFs não especificado.');
    console.error('Use --help para ver as opções disponíveis.');
    process.exit(1);
  }

  if (!fs.existsSync(config.diretorio)) {
    console.error(`Erro: Diretório não encontrado: ${config.diretorio}`);
    process.exit(1);
  }

  // Criar diretório de saída
  if (!fs.existsSync(config.output)) {
    fs.mkdirSync(config.output, { recursive: true });
  }

  console.log(`
================================================================================
GORGEN EXAM EXTRACTOR - Iniciando processamento
================================================================================
Diretório de entrada: ${config.diretorio}
Diretório de saída: ${config.output}
Formato: ${config.formato}
${config.paciente ? `Filtro de paciente: ${config.paciente}` : ''}
================================================================================
`);

  try {
    // FASE 1: Carregar PDFs
    logger.info('Carregando PDFs...');
    const documentos = await lerPDFsDiretorio(config.diretorio);
    logger.info(`${documentos.length} PDFs carregados`);

    if (documentos.length === 0) {
      console.warn('Nenhum PDF encontrado no diretório especificado.');
      process.exit(0);
    }

    // FASE 2: Processar
    logger.info('Iniciando extração...');
    const extrator = new ExtratorExames();
    const resultado = await extrator.processarLote(documentos);

    // FASE 3: Filtrar por paciente se especificado
    let examesFiltrados = resultado.exames;
    if (config.paciente) {
      const pacienteUpper = config.paciente.toUpperCase();
      examesFiltrados = resultado.exames.filter(e => 
        e.paciente.toUpperCase().includes(pacienteUpper)
      );
      logger.info(`${examesFiltrados.length} exames filtrados para paciente: ${config.paciente}`);
    }

    // FASE 4: Exportar resultados
    logger.info('Exportando resultados...');

    // Sempre exportar CSV completo
    const caminhoCSV = path.join(config.output, 'exames_extraidos.csv');
    exportarCSV(examesFiltrados, caminhoCSV);
    logger.info(`CSV exportado: ${caminhoCSV}`);

    // Exportar formato específico
    switch (config.formato) {
      case 'json':
        const caminhoJSON = path.join(config.output, 'exames_extraidos.json');
        exportarJSON(examesFiltrados, caminhoJSON);
        logger.info(`JSON exportado: ${caminhoJSON}`);
        break;
        
      case 'pivot':
        const caminhoPivot = path.join(config.output, 'exames_pivot.csv');
        exportarTabelaPivotada(examesFiltrados, caminhoPivot);
        logger.info(`Tabela pivotada exportada: ${caminhoPivot}`);
        break;
    }

    // Sempre exportar tabela pivotada também
    if (config.formato !== 'pivot') {
      const caminhoPivot = path.join(config.output, 'exames_pivot.csv');
      exportarTabelaPivotada(examesFiltrados, caminhoPivot);
    }

    // Exportar relatório
    const caminhoRelatorio = path.join(config.output, 'relatorio_processamento.txt');
    const relatorio = extrator.gerarRelatorio(resultado);
    fs.writeFileSync(caminhoRelatorio, relatorio);
    logger.info(`Relatório exportado: ${caminhoRelatorio}`);

    // Exportar índice de pacientes
    const caminhoIndice = path.join(config.output, 'indice_pacientes.json');
    const indice: Record<string, any> = {};
    for (const [nome, info] of extrator.getIndicePacientes()) {
      indice[nome] = {
        ...info,
        ultima_atualizacao: info.ultima_atualizacao.toISOString()
      };
    }
    fs.writeFileSync(caminhoIndice, JSON.stringify(indice, null, 2));
    logger.info(`Índice de pacientes exportado: ${caminhoIndice}`);

    // FASE 5: Resumo final
    console.log(`
================================================================================
PROCESSAMENTO CONCLUÍDO
================================================================================
Arquivos processados: ${resultado.estatisticas.arquivos_processados}
Arquivos ignorados: ${resultado.estatisticas.arquivos_ignorados}
Total de exames: ${resultado.estatisticas.total_exames}
Tempo total: ${(resultado.estatisticas.tempo_total_ms / 1000).toFixed(2)}s
Velocidade: ${resultado.estatisticas.exames_por_minuto.toFixed(1)} exames/min

Arquivos gerados em: ${config.output}
- exames_extraidos.csv
- exames_pivot.csv
- relatorio_processamento.txt
- indice_pacientes.json
================================================================================
`);

    // Mostrar erros se houver
    if (resultado.erros.length > 0) {
      console.log('\nERROS:');
      for (const erro of resultado.erros) {
        console.log(`  - ${erro.arquivo}: ${erro.erro}`);
      }
    }

    // Mostrar ignorados se houver
    if (resultado.ignorados.length > 0) {
      console.log('\nARQUIVOS IGNORADOS:');
      for (const item of resultado.ignorados) {
        console.log(`  - ${item.arquivo}: ${item.motivo}`);
      }
    }

  } catch (error) {
    console.error(`\nErro durante processamento: ${error}`);
    process.exit(1);
  }
}

// ============================================================================
// EXECUÇÃO
// ============================================================================

main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
