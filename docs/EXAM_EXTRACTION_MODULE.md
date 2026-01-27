# Módulo de Extração de Exames

> **Gorgen - Aplicativo de Gestão em Saúde**  
> Versão 2.0.0 | Janeiro 2026

---

## Índice

1. [Visão Geral](#1-visão-geral)
2. [Arquitetura](#2-arquitetura)
3. [Instalação](#3-instalação)
4. [Uso Básico](#4-uso-básico)
5. [Configuração](#5-configuração)
6. [Feedback Loop (Opção 1)](#6-feedback-loop-opção-1)
7. [Templates Configuráveis (Opção 2)](#7-templates-configuráveis-opção-2)
8. [Extração via ML (Opção 3)](#8-extração-via-ml-opção-3)
9. [Plano de Evolução](#9-plano-de-evolução)
10. [Referência de API](#10-referência-de-api)

---

## 1. Visão Geral

O Módulo de Extração de Exames é responsável por extrair dados estruturados de laudos médicos em PDF e integrá-los ao prontuário eletrônico do paciente.

### Capacidades

| Funcionalidade | Status | Descrição |
|----------------|--------|-----------|
| Extração de texto | ✅ Implementado | Extrai texto de PDFs digitais |
| Identificação de laboratório | ✅ Implementado | 21+ laboratórios suportados |
| Normalização de exames | ✅ Implementado | 100+ sinônimos mapeados |
| Detecção de alterações | ✅ Implementado | Compara com valores de referência |
| Laudo evolutivo | ✅ Implementado | Extrai histórico de datas anteriores |
| Feedback loop | ✅ Implementado | Registra correções para melhoria |
| Templates configuráveis | 🔄 Preparado | Interface de configuração pendente |
| Extração via ML | 🔄 Preparado | Requer ativação e custos |

### Métricas de Performance

Baseado em 16 sessões de treinamento com ~350 PDFs:

- **Performance média:** 60-80 exames/minuto
- **Taxa de acerto:** ~95%
- **Laboratórios suportados:** 21+
- **Tipos de exames:** Laboratoriais, Imagem, Anatomopatológicos, Endoscopia, Cardiologia

---

## 2. Arquitetura

```
server/services/exam-extraction/
├── index.ts                    # Exportações do módulo
├── ExamExtractionService.ts    # Serviço principal de extração
├── FeedbackLoopService.ts      # Gerenciamento de correções (Opção 1)
├── MLExtractionService.ts      # Extração via LLM (Opção 3)
├── config.ts                   # Configurações e constantes
└── types.ts                    # Definições de tipos TypeScript

drizzle/
└── exam-extraction-schema.ts   # Schema do banco de dados
```

### Fluxo de Extração

```
PDF Upload → Classificação → Identificação Lab → Extração → Normalização → Alertas → Prontuário
                  ↓                                              ↓
            (Não é exame)                                   (Feedback Loop)
                  ↓                                              ↓
              Ignorado                                    Correções → Melhorias
```

---

## 3. Instalação

### Pré-requisitos

- Node.js 22+
- MySQL 8.0+
- pdftotext (poppler-utils)

### Passos

1. **Instalar dependências:**
```bash
pnpm install
```

2. **Executar migrations:**
```bash
pnpm drizzle-kit push
```

3. **Verificar instalação:**
```typescript
import { ExamExtractionService } from './server/services/exam-extraction';

const service = ExamExtractionService.getInstance();
console.log(service.getStats());
```

---

## 4. Uso Básico

### Extrair exames de um PDF

```typescript
import { ExamExtractionService } from './server/services/exam-extraction';

// Obter instância do serviço
const extractionService = ExamExtractionService.getInstance();

// Extrair texto do PDF (usando pdftotext ou similar)
const pdfText = await extractTextFromPdf('/path/to/exam.pdf');

// Extrair exames
const result = await extractionService.extractFromPdfText(pdfText, 'exam.pdf');

if (result.success) {
  console.log(`Laboratório: ${result.laboratory?.fullName}`);
  console.log(`Paciente: ${result.patientInfo?.name}`);
  console.log(`Data: ${result.examDate}`);
  console.log(`Exames extraídos: ${result.exams.length}`);
  
  // Listar exames alterados
  const altered = result.exams.filter(e => e.isAltered);
  console.log(`Exames alterados: ${altered.length}`);
  
  for (const exam of altered) {
    console.log(`  - ${exam.name}: ${exam.value} ${exam.unit} (${exam.alertType})`);
  }
} else {
  console.log(`Falha: ${result.message}`);
}
```

### Integração com API

```typescript
// routes/exams.ts
import { Hono } from 'hono';
import { ExamExtractionService } from '../services/exam-extraction';

const app = new Hono();

app.post('/extract', async (c) => {
  const { pdfText, fileName } = await c.req.json();
  
  const service = ExamExtractionService.getInstance();
  const result = await service.extractFromPdfText(pdfText, fileName);
  
  return c.json(result);
});

export default app;
```

---

## 5. Configuração

### Laboratórios Suportados

Edite `config.ts` para adicionar novos laboratórios:

```typescript
export const KNOWN_LABORATORIES = {
  "NOVO_LAB": {
    fullName: "Novo Laboratório",
    city: "Porto Alegre",
    state: "RS",
    identificationPatterns: [
      "novo laboratório",
      "cnpj 12.345.678/0001-90",
    ],
  },
  // ...
};
```

### Sinônimos de Exames

```typescript
export const EXAM_SYNONYMS = {
  "HEMOGLOBINA": ["HB", "HGB", "HEMOGLOBINA"],
  // Adicione novos sinônimos aqui
};
```

### Valores de Referência

```typescript
export const REFERENCE_VALUES = {
  "HEMOGLOBINA": { min: 13.3, max: 16.5, unit: "g/dL", gender: 'M' },
  // Adicione novos valores aqui
};
```

---

## 6. Feedback Loop (Opção 1)

O Feedback Loop permite que usuários corrijam erros de extração, gerando dados para melhoria contínua do algoritmo.

### Registrar Correção

```typescript
import { FeedbackLoopService } from './server/services/exam-extraction';

const feedbackService = FeedbackLoopService.getInstance();

await feedbackService.logCorrection({
  pdfHash: 'abc123...',
  laboratory: 'WEINMANN',
  fieldName: 'HEMOGLOBINA',
  originalValue: '14,8',
  correctedValue: '14.8',
  correctionType: 'VALUE',
  userId: 1,
  tenantId: 1,
});
```

### Gerar Relatório de Acurácia

```typescript
const report = feedbackService.generateAccuracyReport();
console.log(`Taxa de acerto: ${report.accuracyRate}%`);
console.log('Top erros por campo:', report.topErrorFields);
```

### Obter Sugestões de Melhoria

```typescript
const suggestions = feedbackService.suggestImprovements();
for (const suggestion of suggestions) {
  console.log(`[${suggestion.type}] ${suggestion.description}`);
}
```

---

## 7. Templates Configuráveis (Opção 2)

Templates permitem configurar padrões de extração específicos por laboratório sem alterar código.

### Criar Template via API

```typescript
// POST /api/laboratory-templates
{
  "name": "NOVO_LAB",
  "fullName": "Novo Laboratório",
  "city": "Porto Alegre",
  "state": "RS",
  "identificationPatterns": ["novo laboratório", "cnpj 12.345"],
  "fieldMappings": [
    {
      "standardName": "HEMOGLOBINA",
      "patterns": ["Hemoglobina[:\\s]*(\\d+[,.]\\d+)"],
      "expectedUnit": "g/dL"
    }
  ],
  "hasEvolutiveReport": true
}
```

### Interface de Administração

A interface de administração de templates será implementada no frontend, permitindo:

- Criar/editar templates de laboratório
- Testar padrões de regex
- Visualizar estatísticas de uso
- Ativar/desativar templates

---

## 8. Extração via ML (Opção 3)

A extração via ML usa LLMs (GPT-4.1-mini) para processar PDFs complexos ou de laboratórios desconhecidos.

### Habilitar ML

```typescript
import { MLExtractionService } from './server/services/exam-extraction';

const mlService = MLExtractionService.getInstance();

// Verificar se API key está configurada
if (process.env.OPENAI_API_KEY) {
  mlService.enable();
}
```

### Extrair com ML

```typescript
if (mlService.isServiceEnabled()) {
  const exams = await mlService.extractWithML(pdfText);
  console.log(`Extraídos ${exams.length} exames via ML`);
}
```

### Estimar Custos

```typescript
const cost = mlService.estimateCost(pdfText.length);
console.log(`Custo estimado: $${cost.toFixed(4)}`);
```

### Adicionar Exemplos Few-Shot

```typescript
mlService.addFewShotExample({
  input: 'HEMOGRAMA COMPLETO\nHemoglobina: 14.8 g/dL',
  output: [
    { name: 'HEMOGLOBINA', value: '14.8', unit: 'g/dL', reference: '13.3-16.5', isAltered: false }
  ]
});
```

---

## 9. Plano de Evolução

### Fase Atual: Opção 1 (Feedback Loop Manual)

```
[x] Serviço de extração por regex
[x] Identificação de 21+ laboratórios
[x] Normalização de 100+ exames
[x] Detecção de valores alterados
[x] Registro de correções
[x] Relatório de acurácia
[ ] Interface de correção no frontend
[ ] Dashboard de estatísticas
```

### Próxima Fase: Opção 2 (Templates Configuráveis)

**Prazo estimado:** 3-5 dias

```
[ ] Interface de administração de templates
[ ] Editor de regex com preview
[ ] Importação/exportação de templates
[ ] Sincronização entre tenants
```

### Fase Final: Opção 3 (ML Autônomo)

**Prazo estimado:** 5-7 dias (após Opção 2)

```
[ ] Integração com OpenAI API
[ ] Fine-tuning com dados de correções
[ ] Fallback automático para ML
[ ] Monitoramento de custos
[ ] A/B testing regex vs ML
```

### Roadmap Visual

```
Jan 2026          Fev 2026          Mar 2026
    |                 |                 |
    v                 v                 v
[Opção 1]------>[Opção 2]------>[Opção 3]
 Feedback        Templates         ML
  Loop           Configuráveis    Autônomo
    |                 |                 |
    v                 v                 v
 Correções        Interface        Fine-tuning
 manuais          admin            automático
```

---

## 10. Referência de API

### ExamExtractionService

| Método | Descrição |
|--------|-----------|
| `getInstance()` | Retorna instância singleton |
| `extractFromPdfText(text, fileName)` | Extrai exames do texto |
| `getStats()` | Retorna estatísticas de extração |
| `resetStats()` | Reseta estatísticas |

### FeedbackLoopService

| Método | Descrição |
|--------|-----------|
| `getInstance()` | Retorna instância singleton |
| `logCorrection(correction)` | Registra correção |
| `persistCorrections()` | Persiste correções no banco |
| `generateAccuracyReport()` | Gera relatório de acurácia |
| `suggestImprovements()` | Sugere melhorias no algoritmo |
| `exportCorrections()` | Exporta correções em JSON |

### MLExtractionService

| Método | Descrição |
|--------|-----------|
| `getInstance()` | Retorna instância singleton |
| `enable()` | Habilita serviço ML |
| `disable()` | Desabilita serviço ML |
| `isServiceEnabled()` | Verifica se está habilitado |
| `extractWithML(text)` | Extrai exames via LLM |
| `estimateCost(textLength)` | Estima custo em USD |
| `addFewShotExample(example)` | Adiciona exemplo few-shot |
| `getStats()` | Retorna estatísticas de uso |

---

## Suporte

Para dúvidas ou problemas, contate a equipe de desenvolvimento do Gorgen.

**Última atualização:** 27 de Janeiro de 2026
