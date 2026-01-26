/**
 * ============================================================================
 * GORGEN - INTEGRAÇÃO DO FILTRO RÁPIDO COM ROUTERS.TS
 * ============================================================================
 * 
 * Este arquivo contém o código de integração para ser inserido no routers.ts.
 * 
 * INSTRUÇÕES DE INTEGRAÇÃO:
 * 
 * 1. Adicionar import no topo do routers.ts:
 *    import { preProcessarDocumento } from './filtro-rapido-integrado';
 * 
 * 2. Modificar a função extrairDePdf conforme código abaixo.
 * 
 * @version 1.0.0
 * @date 2026-01-25
 */

// ============================================================================
// CÓDIGO PARA INSERIR NO ROUTERS.TS
// ============================================================================

/**
 * PASSO 1: Adicionar este import no topo do arquivo routers.ts (após linha 7)
 */
const IMPORT_STATEMENT = `
import { preProcessarDocumento } from './filtro-rapido-integrado';
`;

/**
 * PASSO 2: Modificar a função extrairDePdf
 * 
 * A função atual começa na linha 2603.
 * Substituir o bloco de código após a verificação do OCR.
 */
const CODIGO_MODIFICADO = `
    extrairDePdf: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        documentoExternoId: z.number(),
        pdfUrl: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        console.log(\`[LAB-EXTRACT] Iniciando extração de dados laboratoriais para documento \${input.documentoExternoId}\`);
        
        // Buscar o documento para obter o texto OCR já extraído
        const documento = await db.getDocumentoExterno(input.documentoExternoId);
        if (!documento) {
          throw new Error("Documento não encontrado");
        }
        
        // Verificar se tem texto OCR
        const textoOcr = documento.textoOcr;
        if (!textoOcr || textoOcr.includes("[OCR em processamento")||textoOcr.includes("[Erro no OCR")) {
          throw new Error("Texto OCR ainda não foi extraído. Aguarde o processamento ou clique em Reprocessar OCR.");
        }
        
        console.log(\`[LAB-EXTRACT] Usando texto OCR já extraído (\${textoOcr.length} caracteres)\`);
        
        // =====================================================================
        // NOVO: PRÉ-PROCESSAMENTO COM FILTRO RÁPIDO
        // =====================================================================
        const tenantId = ctx.tenant?.tenantId || 1; // Fallback para tenant 1 se não disponível
        const preProcessamento = preProcessarDocumento(textoOcr, tenantId);
        
        console.log(\`[LAB-EXTRACT] Pré-processamento: processar=\${preProcessamento.processar}, motivo=\${preProcessamento.motivo}, tipo=\${preProcessamento.tipo}, lab=\${preProcessamento.laboratorio}, tempo=\${preProcessamento.tempoTotalMs}ms\`);
        
        // Se filtro decidiu não processar, retornar sem chamar LLM
        if (!preProcessamento.processar) {
          console.log(\`[LAB-EXTRACT] Documento ignorado pelo filtro rápido: \${preProcessamento.motivo}\`);
          return {
            sucesso: false,
            motivo: preProcessamento.motivo,
            mensagem: \`Documento identificado como \${preProcessamento.motivo}. Não é um resultado de exame laboratorial.\`,
            examesInseridos: 0,
            economiaLLM: true
          };
        }
        // =====================================================================
        // FIM DO PRÉ-PROCESSAMENTO
        // =====================================================================
        
        // Usar LLM para extrair dados estruturados do texto OCR
        let response;
        try {
          // ... resto do código existente continua igual ...
`;

// ============================================================================
// FUNÇÃO DE INTEGRAÇÃO AUTOMÁTICA
// ============================================================================

/**
 * Gera o código modificado completo para substituição no routers.ts
 */
export function gerarCodigoIntegrado(): string {
  return CODIGO_MODIFICADO;
}

/**
 * Verifica se o routers.ts já tem a integração
 */
export function verificarIntegracao(conteudoRouters: string): boolean {
  return conteudoRouters.includes('preProcessarDocumento');
}

/**
 * Aplica a integração no conteúdo do routers.ts
 */
export function aplicarIntegracao(conteudoRouters: string): string {
  // 1. Verificar se já está integrado
  if (verificarIntegracao(conteudoRouters)) {
    console.log('Integração já aplicada');
    return conteudoRouters;
  }
  
  // 2. Adicionar import
  const importLine = 'import { invokeLLM } from "./_core/llm";';
  const novoImport = `${importLine}\nimport { preProcessarDocumento } from './filtro-rapido-integrado';`;
  let resultado = conteudoRouters.replace(importLine, novoImport);
  
  // 3. Modificar função extrairDePdf
  // Encontrar o início da função
  const inicioFuncao = '.mutation(async ({ input }) => {';
  const novoInicio = '.mutation(async ({ ctx, input }) => {';
  resultado = resultado.replace(
    /extrairDePdf: protectedProcedure[\s\S]*?\.mutation\(async \(\{ input \}\) => \{/,
    `extrairDePdf: protectedProcedure
      .input(z.object({
        pacienteId: z.number(),
        documentoExternoId: z.number(),
        pdfUrl: z.string(),
      }))
      ${novoInicio}`
  );
  
  // 4. Adicionar código do filtro após verificação do OCR
  const marcadorOcr = 'console.log(`[LAB-EXTRACT] Usando texto OCR já extraído (${textoOcr.length} caracteres)`);';
  const codigoFiltro = `${marcadorOcr}
        
        // =====================================================================
        // PRÉ-PROCESSAMENTO COM FILTRO RÁPIDO (Fase 2 - Integração)
        // =====================================================================
        const tenantId = ctx.tenant?.tenantId || 1;
        const preProcessamento = preProcessarDocumento(textoOcr, tenantId);
        
        console.log(\`[LAB-EXTRACT] Pré-processamento: processar=\${preProcessamento.processar}, motivo=\${preProcessamento.motivo}, tipo=\${preProcessamento.tipo}, lab=\${preProcessamento.laboratorio}, tempo=\${preProcessamento.tempoTotalMs}ms\`);
        
        if (!preProcessamento.processar) {
          console.log(\`[LAB-EXTRACT] Documento ignorado pelo filtro rápido: \${preProcessamento.motivo}\`);
          return {
            sucesso: false,
            motivo: preProcessamento.motivo,
            mensagem: \`Documento identificado como \${preProcessamento.motivo}. Não é um resultado de exame laboratorial.\`,
            examesInseridos: 0,
            economiaLLM: true
          };
        }
        // =====================================================================`;
  
  resultado = resultado.replace(marcadorOcr, codigoFiltro);
  
  return resultado;
}

export default {
  gerarCodigoIntegrado,
  verificarIntegracao,
  aplicarIntegracao,
  IMPORT_STATEMENT,
  CODIGO_MODIFICADO
};
