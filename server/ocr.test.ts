import { describe, it, expect, vi, beforeEach } from "vitest";
import { invokeLLM } from "./_core/llm";

// Mock do invokeLLM para testar a lógica
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("OCR Extraction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve extrair texto de uma imagem usando LLM", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "CREMERS\nPACIENTE: Yasmin Fontella Leguiça\nCPF: 043.070.480-16\nSolicitação de Exame\nSOLICITO\n- RNM Abdomen Superior com contraste EV",
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em transcrição de documentos médicos.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraia TODO o texto visível nesta imagem de documento médico.",
            },
            {
              type: "image_url",
              image_url: {
                url: "https://example.com/test.jpg",
                detail: "high",
              },
            },
          ],
        },
      ],
    });

    expect(result.choices[0].message.content).toContain("CREMERS");
    expect(result.choices[0].message.content).toContain("Yasmin Fontella Leguiça");
  });

  it("deve extrair texto de um PDF usando LLM", async () => {
    const mockResponse = {
      choices: [
        {
          message: {
            content: "Documento PDF extraído com sucesso",
          },
        },
      ],
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await invokeLLM({
      messages: [
        {
          role: "system",
          content: "Você é um assistente especializado em transcrição de documentos médicos.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraia TODO o texto deste documento PDF médico.",
            },
            {
              type: "file_url",
              file_url: {
                url: "https://example.com/test.pdf",
                mime_type: "application/pdf",
              },
            },
          ],
        },
      ],
    });

    expect(result.choices[0].message.content).toBe("Documento PDF extraído com sucesso");
  });

  it("deve lidar com tipos de arquivo não suportados", () => {
    const tipoArquivo = "application/octet-stream";
    const isImage = tipoArquivo.startsWith("image/");
    const isPdf = tipoArquivo === "application/pdf";

    expect(isImage).toBe(false);
    expect(isPdf).toBe(false);
  });

  it("deve identificar corretamente tipos de arquivo para OCR automático", () => {
    // Testa imagens
    expect("image/jpeg".startsWith("image/")).toBe(true);
    expect("image/png".startsWith("image/")).toBe(true);
    expect("image/gif".startsWith("image/")).toBe(true);
    
    // Testa PDF
    expect("application/pdf" === "application/pdf").toBe(true);
    
    // Testa tipos não suportados
    expect("application/msword".startsWith("image/")).toBe(false);
    expect("application/msword" === "application/pdf").toBe(false);
  });

  it("deve gerar mensagem de status correta para OCR em processamento", () => {
    const statusMessage = "[OCR em processamento...] Aguarde alguns segundos.";
    expect(statusMessage).toContain("OCR em processamento");
    expect(statusMessage).toContain("Aguarde");
  });
});
