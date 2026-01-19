# GORGEN - Planejamento do Prontuário Médico Eletrônico

> **Documento de Planejamento** | Versão 1.0 | 19 de Janeiro de 2026

---

## 1. Estado Atual do Prontuário

### 1.1 Funcionalidades Já Implementadas

| Funcionalidade | Status | Observações |
|----------------|--------|-------------|
| Página de Prontuário (`/prontuario/:id`) | ✅ Implementado | Acesso via lista de pacientes |
| Dados de Identificação | ✅ Implementado | Nome, CPF, data nascimento, convênio |
| Seção de Contato | ✅ Implementado | Email, telefone com link WhatsApp |
| Lista de Atendimentos Anteriores | ✅ Implementado | Timeline cronológica |
| Botão "Novo Atendimento" | ✅ Implementado | Abre modal de agendamento |
| Histórico de Medidas | ✅ Implementado | Peso, altura, IMC com gráficos |
| Problemas Ativos | ✅ Implementado | Lista de problemas com resolução |
| Medicamentos em Uso | ✅ Implementado | Lista de medicações atuais |
| Alergias | ✅ Implementado | Registro de alergias |
| Modal de Edição de Cadastro | ✅ Implementado | Atualização de dados do paciente |

### 1.2 Estrutura Atual do Prontuário

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRONTUÁRIO DO PACIENTE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ IDENTIFICAÇÃO                                               ││
│  │ Nome: Maria Silva | CPF: 123.456.789-00 | DN: 15/03/1980   ││
│  │ Convênio: Unimed | Matrícula: 123456789                     ││
│  │ [Editar Cadastro]                                           ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ CONTATO                                                     ││
│  │ Email: maria@email.com | Tel: (11) 99999-9999 [WhatsApp]   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ATENDIMENTOS ANTERIORES                    [Novo Atendimento]││
│  │ ─────────────────────────────────────────────────────────── ││
│  │ 15/01/2026 - Consulta - Dr. André Gorgen                   ││
│  │ 10/12/2025 - Retorno - Dr. André Gorgen                    ││
│  │ 05/11/2025 - Consulta - Dr. André Gorgen                   ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐ │
│  │ MEDIDAS          │  │ PROBLEMAS ATIVOS │  │ MEDICAMENTOS   │ │
│  │ Peso: 72kg       │  │ • HAS            │  │ • Losartana    │ │
│  │ Altura: 1.68m    │  │ • DM2            │  │ • Metformina   │ │
│  │ IMC: 25.5        │  │                  │  │                │ │
│  │ [📈 Gráfico]     │  │ [+ Adicionar]    │  │ [+ Adicionar]  │ │
│  └──────────────────┘  └──────────────────┘  └────────────────┘ │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ ALERGIAS                                                    ││
│  │ • Dipirona (Reação: Urticária)                             ││
│  │ • Penicilina (Reação: Anafilaxia)                          ││
│  │ [+ Adicionar Alergia]                                       ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Funcionalidades Pendentes de Implementação

### 2.1 Prioridade ALTA (Próximas 2 Semanas)

| # | Funcionalidade | Descrição | Esforço |
|---|----------------|-----------|---------|
| 1 | **Evoluções Médicas** | Registro de evolução clínica por atendimento | 3 dias |
| 2 | **Anamnese Estruturada** | Formulário de anamnese com campos padronizados | 2 dias |
| 3 | **Exame Físico** | Registro de exame físico com campos específicos | 2 dias |
| 4 | **Hipóteses Diagnósticas** | CID-10 com autocomplete | 2 dias |
| 5 | **Conduta/Plano** | Campo de texto para conduta médica | 1 dia |

### 2.2 Prioridade MÉDIA (Próximo Mês)

| # | Funcionalidade | Descrição | Esforço |
|---|----------------|-----------|---------|
| 6 | **Upload de Exames** | Anexar PDFs e imagens de exames | 3 dias |
| 7 | **Visualizador de Exames** | Preview de documentos anexados | 2 dias |
| 8 | **Prescrição Médica** | Geração de receitas com template | 3 dias |
| 9 | **Atestados** | Geração de atestados médicos | 2 dias |
| 10 | **Solicitação de Exames** | Formulário de solicitação | 2 dias |

### 2.3 Prioridade BAIXA (Próximos 3 Meses)

| # | Funcionalidade | Descrição | Esforço |
|---|----------------|-----------|---------|
| 11 | **Assinatura Digital** | Assinatura em documentos | 5 dias |
| 12 | **Impressão de Prontuário** | Exportar prontuário completo em PDF | 3 dias |
| 13 | **Resumo Clínico** | Geração automática de resumo | 3 dias |
| 14 | **Integração com Labs** | Importação automática de resultados | 10 dias |
| 15 | **Telemedicina** | Integração com videochamada | 10 dias |

---

## 3. Detalhamento das Funcionalidades Prioritárias

### 3.1 Evoluções Médicas

**Objetivo**: Registrar a evolução clínica do paciente a cada atendimento, mantendo histórico completo e imutável.

**Estrutura de Dados**:
```typescript
interface Evolucao {
  id: number;
  atendimentoId: number;
  pacienteId: number;
  medicoId: number;
  dataHora: Date;
  
  // Conteúdo da evolução
  subjetivo: string;      // Queixa do paciente (S do SOAP)
  objetivo: string;       // Exame físico (O do SOAP)
  avaliacao: string;      // Hipóteses diagnósticas (A do SOAP)
  plano: string;          // Conduta (P do SOAP)
  
  // Metadados
  criadoPor: string;
  criadoEm: Date;
  assinadoDigitalmente: boolean;
  assinaturaHash?: string;
}
```

**Interface Proposta**:
```
┌─────────────────────────────────────────────────────────────────┐
│                    NOVA EVOLUÇÃO                                 │
├─────────────────────────────────────────────────────────────────┤
│  Atendimento: Consulta - 19/01/2026 14:30                       │
│  Médico: Dr. André Gorgen (CRM 12345/RS)                        │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ SUBJETIVO (Queixa Principal)                                ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ Paciente refere dor torácica há 2 dias, tipo aperto,   │ ││
│  │ │ que piora aos esforços e melhora com repouso...        │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ OBJETIVO (Exame Físico)                                     ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ PA: 140x90 mmHg | FC: 88 bpm | FR: 18 irpm | T: 36.5°C │ ││
│  │ │ ACV: RCR 2T BNF sem sopros                              │ ││
│  │ │ AR: MV+ bilateral sem RA                                │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ AVALIAÇÃO (Hipóteses Diagnósticas)                          ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ [🔍 Buscar CID-10]                                      │ ││
│  │ │ • I20.0 - Angina instável                               │ ││
│  │ │ • I10 - Hipertensão essencial                           │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ PLANO (Conduta)                                             ││
│  │ ┌─────────────────────────────────────────────────────────┐ ││
│  │ │ 1. Solicitar ECG + enzimas cardíacas                    │ ││
│  │ │ 2. Iniciar AAS 100mg/dia                                │ ││
│  │ │ 3. Retorno em 7 dias com exames                         │ ││
│  │ └─────────────────────────────────────────────────────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [Salvar Rascunho]  [Assinar e Finalizar]                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Princípios de Imutabilidade

Conforme os pilares fundamentais do GORGEN:

1. **Nunca sobrescrever**: Cada evolução é um novo registro
2. **Botão discreto**: Ícone de lápis para "inserir nova evolução"
3. **Histórico acessível**: Botão de gráfico para ver evolução temporal
4. **Auditoria automática**: Data, hora e usuário registrados automaticamente
5. **Sem exclusão**: Apenas soft delete com autorização do Admin Master

### 3.3 Upload de Exames

**Tipos de Arquivos Suportados**:
- PDF (laudos, relatórios)
- Imagens (JPEG, PNG, TIFF)
- DICOM (imagens médicas)

**Estrutura de Dados**:
```typescript
interface ExameAnexo {
  id: number;
  pacienteId: number;
  atendimentoId?: number;
  
  // Metadados do arquivo
  nomeOriginal: string;
  tipoMime: string;
  tamanhoBytes: number;
  s3Key: string;
  s3Url: string;
  
  // Classificação
  categoria: 'laboratorial' | 'imagem' | 'laudo' | 'outro';
  descricao: string;
  dataExame: Date;
  
  // Auditoria
  uploadPor: string;
  uploadEm: Date;
}
```

---

## 4. Fluxo de Trabalho Proposto

### 4.1 Fluxo de Consulta Completa

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Paciente   │────▶│  Agenda     │────▶│  Check-in   │
│  Chega      │     │  Confirma   │     │  Secretária │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Finalizar  │◀────│  Evolução   │◀────│  Atendimento│
│  Consulta   │     │  SOAP       │     │  Médico     │
└──────┬──────┘     └─────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Documentos │────▶│  Faturamento│────▶│  Próximo    │
│  (Receita,  │     │  Guia TISS  │     │  Retorno    │
│  Atestado)  │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
```

### 4.2 Integração com Atendimento

Cada atendimento deve ter:
- Link para evolução associada
- Documentos gerados (receitas, atestados)
- Exames solicitados
- Exames anexados

---

## 5. Cronograma Sugerido

### Fase 1: Evoluções (Semana 1-2)

| Dia | Tarefa |
|-----|--------|
| 1-2 | Criar schema de evoluções no banco |
| 3-4 | Implementar API tRPC para CRUD de evoluções |
| 5-6 | Criar interface de nova evolução (SOAP) |
| 7-8 | Integrar com página de prontuário |
| 9-10 | Testes e ajustes |

### Fase 2: Documentos (Semana 3-4)

| Dia | Tarefa |
|-----|--------|
| 11-12 | Criar templates de receita |
| 13-14 | Implementar geração de PDF |
| 15-16 | Criar templates de atestado |
| 17-18 | Criar solicitação de exames |
| 19-20 | Testes e ajustes |

### Fase 3: Anexos (Semana 5-6)

| Dia | Tarefa |
|-----|--------|
| 21-22 | Implementar upload para S3 |
| 23-24 | Criar visualizador de documentos |
| 25-26 | Categorização de exames |
| 27-28 | Integração com prontuário |
| 29-30 | Testes finais |

---

## 6. Questões para Decisão do CEO

### 6.1 Sobre Evoluções

1. **Usar formato SOAP ou formato livre?**
   - Opção A: SOAP estruturado (Subjetivo, Objetivo, Avaliação, Plano)
   - Opção B: Texto livre com campos opcionais
   - Opção C: Híbrido (campos estruturados + texto livre)

2. **Evoluções devem ser assinadas digitalmente?**
   - Se sim, implementar agora ou na Fase 2?

### 6.2 Sobre Documentos

3. **Quais templates são prioritários?**
   - Receita simples
   - Receita controlada (azul/amarela)
   - Atestado médico
   - Solicitação de exames
   - Encaminhamento
   - Relatório médico

4. **Documentos devem ter numeração sequencial?**

### 6.3 Sobre Exames

5. **Limite de tamanho para upload de arquivos?**
   - Sugestão: 50MB por arquivo

6. **Categorias de exames necessárias?**
   - Laboratorial, Imagem, Laudo, Outro
   - Ou categorias mais específicas?

---

## 7. Próximos Passos Imediatos

| # | Ação | Responsável | Prazo |
|---|------|-------------|-------|
| 1 | Aprovar estrutura de evoluções | CEO | Imediato |
| 2 | Definir templates prioritários | CEO | Imediato |
| 3 | Criar schema de evoluções | Manus AI | Após aprovação |
| 4 | Implementar interface SOAP | Manus AI | 1 semana |
| 5 | Testar com dados reais | CEO | Após implementação |

---

**Aguardo sua aprovação e direcionamento para iniciar as implementações.**

*Documento preparado por Manus AI em 19 de Janeiro de 2026*
