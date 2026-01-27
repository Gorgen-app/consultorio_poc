# Plano de Implementação - Módulo de Extração de Exames

> **Gorgen - Aplicativo de Gestão em Saúde**  
> Versão 2.0.0 | Janeiro 2026

---

## Resumo Executivo

Este documento detalha o plano de implementação do Módulo de Extração de Exames no sistema Gorgen, seguindo uma abordagem evolutiva em 3 fases:

| Fase | Nome | Complexidade | Prazo | Status |
|------|------|--------------|-------|--------|
| 1 | Feedback Loop Manual | Baixa | Imediato | ✅ Código pronto |
| 2 | Templates Configuráveis | Média | 3-5 dias | 🔄 Preparado |
| 3 | ML Autônomo | Alta | 5-7 dias | 🔄 Preparado |

---

## Fase 1: Feedback Loop Manual

### Objetivo
Implementar sistema de correção manual que permite aos usuários corrigir erros de extração, gerando dados para melhoria contínua.

### Componentes Implementados

#### Backend (✅ Completo)

| Arquivo | Descrição |
|---------|-----------|
| `ExamExtractionService.ts` | Serviço principal de extração |
| `FeedbackLoopService.ts` | Gerenciamento de correções |
| `config.ts` | Laboratórios e sinônimos |
| `types.ts` | Definições TypeScript |
| `exam-extraction-schema.ts` | Schema do banco de dados |

#### Frontend (🔄 Pendente)

| Componente | Descrição | Prioridade |
|------------|-----------|------------|
| `ExamReviewModal` | Modal para revisar exames extraídos | Alta |
| `ExamCorrectionForm` | Formulário de correção | Alta |
| `ExamHistoryChart` | Gráfico de evolução temporal | Média |
| `AccuracyDashboard` | Dashboard de estatísticas | Baixa |

### Fluxo de Uso

```
1. Usuário faz upload de PDF
2. Sistema extrai exames automaticamente
3. Usuário revisa resultados no modal
4. Se houver erro, usuário clica em "Corrigir"
5. Sistema registra correção no banco
6. Correções são analisadas periodicamente
7. Desenvolvedor atualiza algoritmo baseado nas correções
```

### Tarefas de Implementação

#### Sprint 1 (Imediato)

- [x] Criar serviço de extração
- [x] Criar serviço de feedback loop
- [x] Criar schema do banco de dados
- [x] Documentar módulo
- [ ] Executar migrations
- [ ] Criar endpoint de upload de PDF
- [ ] Criar endpoint de extração
- [ ] Criar endpoint de correção

#### Sprint 2 (1-2 dias)

- [ ] Criar componente ExamReviewModal
- [ ] Criar componente ExamCorrectionForm
- [ ] Integrar com prontuário do paciente
- [ ] Adicionar botão de upload no prontuário
- [ ] Testar fluxo completo

---

## Fase 2: Templates Configuráveis

### Objetivo
Permitir que administradores configurem padrões de extração específicos para cada laboratório através de uma interface visual.

### Componentes a Implementar

#### Backend

| Arquivo | Descrição | Esforço |
|---------|-----------|---------|
| `TemplateService.ts` | CRUD de templates | 4h |
| `TemplateValidator.ts` | Validação de regex | 2h |
| `routes/templates.ts` | Endpoints REST | 2h |

#### Frontend

| Componente | Descrição | Esforço |
|------------|-----------|---------|
| `TemplateListPage` | Lista de templates | 4h |
| `TemplateEditorPage` | Editor de template | 8h |
| `RegexTester` | Testador de regex | 4h |
| `FieldMappingEditor` | Editor de mapeamentos | 4h |

### Fluxo de Uso

```
1. Admin acessa "Configurações > Templates de Laboratório"
2. Admin clica em "Novo Template"
3. Admin preenche:
   - Nome do laboratório
   - Padrões de identificação (regex)
   - Mapeamento de campos
4. Admin testa com PDF de exemplo
5. Admin salva template
6. Sistema usa template em extrações futuras
```

### Tarefas de Implementação

#### Sprint 3 (2-3 dias)

- [ ] Criar TemplateService
- [ ] Criar endpoints REST
- [ ] Criar TemplateListPage
- [ ] Criar TemplateEditorPage básico

#### Sprint 4 (2 dias)

- [ ] Criar RegexTester com preview
- [ ] Criar FieldMappingEditor
- [ ] Adicionar validação de templates
- [ ] Testar com laboratórios reais

---

## Fase 3: ML Autônomo

### Objetivo
Implementar extração inteligente usando LLMs para processar PDFs complexos ou de laboratórios desconhecidos, com aprendizado contínuo.

### Componentes a Implementar

#### Backend

| Arquivo | Descrição | Esforço |
|---------|-----------|---------|
| `MLExtractionService.ts` | Serviço ML (✅ preparado) | 2h ajustes |
| `TrainingService.ts` | Fine-tuning automático | 8h |
| `CostMonitorService.ts` | Monitoramento de custos | 4h |
| `ABTestService.ts` | A/B testing regex vs ML | 4h |

#### Frontend

| Componente | Descrição | Esforço |
|------------|-----------|---------|
| `MLConfigPage` | Configuração do ML | 4h |
| `CostDashboard` | Dashboard de custos | 4h |
| `TrainingStatusPage` | Status de treinamento | 4h |

### Fluxo de Uso

```
1. PDF é recebido para extração
2. Sistema tenta extração por regex
3. Se confiança < 80%, usa ML como fallback
4. Resultado ML é validado pelo usuário
5. Validações alimentam fine-tuning
6. Modelo é retreinado periodicamente
7. Custos são monitorados e alertados
```

### Estratégia de Custos

| Cenário | Custo Estimado/PDF | Ação |
|---------|-------------------|------|
| Regex bem-sucedido | $0.00 | Usar regex |
| ML fallback | ~$0.002 | Usar ML |
| Fine-tuning mensal | ~$5-10 | Batch training |

### Tarefas de Implementação

#### Sprint 5 (3 dias)

- [ ] Ativar MLExtractionService
- [ ] Implementar fallback automático
- [ ] Criar CostMonitorService
- [ ] Criar MLConfigPage

#### Sprint 6 (2-3 dias)

- [ ] Implementar TrainingService
- [ ] Criar pipeline de fine-tuning
- [ ] Implementar A/B testing
- [ ] Criar dashboards de monitoramento

---

## Cronograma Consolidado

```
Semana 1 (Jan 27 - Jan 31)
├── [x] Código backend Fase 1
├── [ ] Migrations e endpoints
└── [ ] Frontend básico

Semana 2 (Fev 3 - Fev 7)
├── [ ] Completar Fase 1
├── [ ] Iniciar Fase 2
└── [ ] Templates backend

Semana 3 (Fev 10 - Fev 14)
├── [ ] Completar Fase 2
├── [ ] Interface de templates
└── [ ] Testes integrados

Semana 4 (Fev 17 - Fev 21)
├── [ ] Iniciar Fase 3
├── [ ] Ativar ML
└── [ ] Monitoramento de custos

Semana 5 (Fev 24 - Fev 28)
├── [ ] Fine-tuning
├── [ ] A/B testing
└── [ ] Go-live completo
```

---

## Métricas de Sucesso

### Fase 1
- [ ] 100% dos PDFs processados sem erro
- [ ] Taxa de correção < 10%
- [ ] Tempo de extração < 5 segundos

### Fase 2
- [ ] 5+ templates configurados
- [ ] 0 alterações de código para novos labs
- [ ] Interface intuitiva (NPS > 8)

### Fase 3
- [ ] Taxa de acerto ML > 95%
- [ ] Custo mensal < $50
- [ ] Tempo de retreinamento < 1 hora

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| PDF escaneado (imagem) | Alta | Médio | OCR como feature futura |
| Laboratório desconhecido | Média | Baixo | Fallback para ML |
| Custo ML elevado | Baixa | Médio | Limites e alertas |
| Erro de regex | Média | Baixo | Feedback loop |

---

## Próximos Passos Imediatos

1. **Executar migrations** para criar tabelas no banco
2. **Criar endpoint de upload** de PDF
3. **Criar endpoint de extração** que usa ExamExtractionService
4. **Criar modal de revisão** no frontend
5. **Testar fluxo completo** com PDFs reais

---

## Contato

Para dúvidas sobre este plano, contate a equipe de desenvolvimento do Gorgen.

**Última atualização:** 27 de Janeiro de 2026
