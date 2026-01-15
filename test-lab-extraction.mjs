// Script para testar extração de dados laboratoriais
import { invokeLLM } from "./server/_core/llm.js";

const documentoUrl = "https://d2xsxph8kpxj0f.cloudfront.net/310519663277219875/TyeFpW5ykZHTuZXuk6iMG7/documentos/51/exame-laboratorial/1767984363567-6w1nxk.pdf";
const documentoId = 60001;
const pacienteId = 51;

async function testarExtracao() {
  console.log("Iniciando teste de extração de dados laboratoriais...");
  console.log("Documento:", documentoUrl);
  
  try {
    const labResponse = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `Você é um especialista em extração de dados de exames laboratoriais.
Analise o documento e extraia TODOS os resultados de exames laboratoriais.
Para cada exame, extraia:
- nome_exame: nome do exame como aparece no laudo
- resultado: valor do resultado (pode ser texto como ">90" ou "Não reagente")
- resultado_numerico: valor numérico quando aplicável (apenas números)
- unidade: unidade de medida
- valor_referencia_texto: faixa de referência como aparece no laudo
- valor_referencia_min: valor mínimo da referência (apenas números)
- valor_referencia_max: valor máximo da referência (apenas números)
- data_coleta: data da coleta no formato YYYY-MM-DD
- laboratorio: nome do laboratório

PRIORIZE a extração do "LAUDO EVOLUTIVO" ou "FLUXOGRAMA" se existir, pois contém histórico consolidado.

Retorne um JSON válido com a estrutura:
{
  "exames": [
    {
      "nome_exame": "string",
      "resultado": "string",
      "resultado_numerico": number | null,
      "unidade": "string",
      "valor_referencia_texto": "string",
      "valor_referencia_min": number | null,
      "valor_referencia_max": number | null,
      "data_coleta": "YYYY-MM-DD",
      "laboratorio": "string"
    }
  ],
  "laboratorio_principal": "string",
  "data_principal": "YYYY-MM-DD"
}`
        },
        {
          role: "user",
          content: [
            {
              type: "file_url",
              file_url: {
                url: documentoUrl,
                mime_type: "application/pdf"
              }
            },
            {
              type: "text",
              text: "Extraia todos os resultados de exames laboratoriais deste documento. Retorne apenas o JSON, sem texto adicional."
            }
          ]
        }
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "exames_laboratoriais",
          strict: true,
          schema: {
            type: "object",
            properties: {
              exames: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    nome_exame: { type: "string" },
                    resultado: { type: "string" },
                    resultado_numerico: { type: ["number", "null"] },
                    unidade: { type: ["string", "null"] },
                    valor_referencia_texto: { type: ["string", "null"] },
                    valor_referencia_min: { type: ["number", "null"] },
                    valor_referencia_max: { type: ["number", "null"] },
                    data_coleta: { type: "string" },
                    laboratorio: { type: ["string", "null"] }
                  },
                  required: ["nome_exame", "resultado", "data_coleta"],
                  additionalProperties: false
                }
              },
              laboratorio_principal: { type: ["string", "null"] },
              data_principal: { type: ["string", "null"] }
            },
            required: ["exames"],
            additionalProperties: false
          }
        }
      }
    });

    console.log("\n=== RESPOSTA DO LLM ===");
    console.log("Status:", labResponse.choices ? "OK" : "ERRO");
    
    const labContent = labResponse.choices[0]?.message?.content;
    console.log("\nConteúdo bruto:", labContent?.substring(0, 500) + "...");
    
    if (labContent && typeof labContent === "string") {
      const dados = JSON.parse(labContent);
      console.log("\n=== DADOS EXTRAÍDOS ===");
      console.log("Laboratório principal:", dados.laboratorio_principal);
      console.log("Data principal:", dados.data_principal);
      console.log("Total de exames:", dados.exames?.length || 0);
      
      if (dados.exames && dados.exames.length > 0) {
        console.log("\n=== PRIMEIROS 5 EXAMES ===");
        dados.exames.slice(0, 5).forEach((exame, i) => {
          console.log(`\n${i + 1}. ${exame.nome_exame}`);
          console.log(`   Resultado: ${exame.resultado} ${exame.unidade || ""}`);
          console.log(`   Referência: ${exame.valor_referencia_texto || "N/A"}`);
          console.log(`   Data: ${exame.data_coleta}`);
        });
      }
    }
  } catch (error) {
    console.error("\n=== ERRO ===");
    console.error("Mensagem:", error.message);
    console.error("Stack:", error.stack);
  }
}

testarExtracao();
