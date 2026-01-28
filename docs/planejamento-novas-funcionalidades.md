# Planejamento de Implementação - Novas Funcionalidades Gorgen

**Documento de Análise Técnica e Avaliação de Riscos**

**Versão:** 1.0  
**Data:** 28 de Janeiro de 2026  
**Autor:** Manus AI  
**Projeto:** Gorgen - Sistema de Gestão em Saúde

---

## Sumário Executivo

Este documento apresenta o planejamento detalhado para implementação de três funcionalidades críticas no sistema Gorgen: emissão de documentos médicos, processamento automático de uploads com IA, e auto-save de rascunhos. Para cada funcionalidade, são analisados os requisitos técnicos, riscos de impacto em funcionalidades existentes, estratégias de mitigação e probabilidade de sucesso na primeira tentativa de implementação.

---

## 1. Emissão de Documentos Médicos

### 1.1 Descrição da Funcionalidade

A funcionalidade permitirá que médicos emitam documentos diretamente do modal de evolução, conectando os itens do menu dropdown (Receita, Atestado, Pedido de Exames, etc.) a modais de criação com templates pré-definidos. Cada documento será vinculado à evolução atual e ao paciente, com geração automática de PDF para impressão ou envio digital.

### 1.2 Arquitetura Proposta

| Componente | Descrição | Status Atual |
|------------|-----------|--------------|
| **Schema do Banco** | Tabela `documentos_medicos` com 11 tipos de documentos | ✅ Já existe |
| **Endpoints Backend** | Router `documentos` com CRUD básico | ✅ Já existe (parcial) |
| **Componentes Frontend** | Modais específicos por tipo de documento | ❌ A criar |
| **Geração de PDF** | Biblioteca para renderização de templates | ❌ A implementar |
| **Templates** | Modelos pré-definidos por tipo de documento | ❌ A criar |

### 1.3 Plano de Implementação

**Fase 1: Infraestrutura (2-3 horas)**

O primeiro passo consiste em criar a estrutura base para geração de PDFs. Será utilizada a biblioteca `@react-pdf/renderer` que já está disponível no ecossistema React e permite criar PDFs diretamente no navegador. Alternativamente, pode-se usar `jsPDF` com `html2canvas` para converter HTML em PDF, mantendo a consistência visual com os templates exibidos na tela.

**Fase 2: Templates de Documentos (4-6 horas)**

Serão criados templates para cada tipo de documento, seguindo as normas do CFM e padrões de documentos médicos. Os templates incluirão cabeçalho com dados do médico (nome, CRM, especialidade), dados do paciente (nome, CPF, data de nascimento), corpo do documento específico por tipo, e rodapé com data, local e assinatura digital.

**Fase 3: Modais de Criação (6-8 horas)**

Para cada tipo de documento será criado um modal específico com campos apropriados. A receita simples incluirá lista de medicamentos com nome, dosagem, posologia e quantidade. O atestado de comparecimento terá campos para data/hora do atendimento e finalidade. O pedido de exames permitirá seleção de exames com justificativa clínica.

**Fase 4: Integração com Evolução (2-3 horas)**

Os documentos criados serão automaticamente vinculados à evolução atual através do campo `evolucaoId` já existente no schema. O histórico de documentos emitidos será exibido na timeline da evolução.

### 1.4 Análise de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Conflito com modal de evolução existente | Baixa | Médio | Usar portais React para modais independentes |
| Perda de dados ao fechar modal | Média | Alto | Implementar confirmação antes de fechar |
| Templates não conformes com CFM | Baixa | Alto | Validar com documentação oficial do CFM |
| Performance ao gerar PDF | Baixa | Baixo | Gerar PDF em background com loading |
| Incompatibilidade de impressão | Média | Médio | Testar em múltiplos navegadores |

**Funcionalidades que podem ser afetadas:**

O modal de evolução atual utiliza z-index elevado para sobreposição. A adição de modais aninhados pode causar problemas de empilhamento visual. A mitigação envolve usar React Portals para renderizar modais de documentos fora da hierarquia DOM do modal de evolução.

O menu dropdown de documentos já existe e funciona corretamente. A conexão com os novos modais requer apenas adicionar handlers `onClick` para cada item, sem modificar a estrutura existente.

### 1.5 Probabilidade de Sucesso

| Aspecto | Avaliação |
|---------|-----------|
| Complexidade técnica | Média |
| Dependências externas | Baixa (bibliotecas estáveis) |
| Código existente reutilizável | Alta (schema e endpoints prontos) |
| **Chance de sucesso na 1ª tentativa** | **75-80%** |

A alta probabilidade de sucesso se deve ao fato de que a maior parte da infraestrutura já existe. O schema do banco já contempla todos os tipos de documentos necessários, e os endpoints básicos de CRUD já estão implementados. O principal trabalho será na criação dos componentes visuais e templates.

---

## 2. Processamento Automático de Uploads com IA

### 2.1 Descrição da Funcionalidade

O sistema utilizará inteligência artificial para identificar automaticamente o tipo de documento médico enviado pelo usuário (exame laboratorial, laudo de imagem, receita externa, atestado, etc.) e classificá-lo na categoria apropriada dentro do Gorgen. Isso elimina a necessidade do usuário selecionar manualmente a categoria do documento.

### 2.2 Arquitetura Proposta

| Componente | Descrição | Status Atual |
|------------|-----------|--------------|
| **Upload de Arquivos** | Componente de upload com drag-and-drop | ✅ Já existe |
| **OCR/Extração de Texto** | Integração com LLM para extração | ✅ Já existe |
| **Classificação por IA** | Novo módulo de classificação | ❌ A implementar |
| **Roteamento Automático** | Lógica para direcionar documento | ❌ A implementar |
| **Tabelas de Destino** | Estruturas para cada tipo de documento | ✅ Já existem |

### 2.3 Plano de Implementação

**Fase 1: Modelo de Classificação (3-4 horas)**

Será criado um prompt especializado para o LLM que analisa o conteúdo do documento e retorna a classificação. O modelo receberá o texto extraído pelo OCR (já implementado) e retornará um JSON estruturado com o tipo identificado, nível de confiança, e campos específicos extraídos.

O prompt de classificação seguirá este formato:

```
Analise o documento médico e classifique-o em uma das categorias:
- Exame Laboratorial (hemograma, bioquímica, hormônios, etc.)
- Exame de Imagem (raio-x, tomografia, ressonância, ultrassom)
- Laudo Anatomopatológico (biópsia, citologia)
- Receita Médica (prescrição de medicamentos)
- Atestado Médico (comparecimento, afastamento)
- Relatório Médico (evolução, alta, encaminhamento)
- Guia de Convênio (SADT, internação)
- Outro (documento não classificável)

Retorne JSON com: tipo, confianca (0-100), justificativa
```

**Fase 2: Lógica de Roteamento (2-3 horas)**

Com base na classificação, o sistema direcionará o documento para a tabela apropriada. Exames laboratoriais irão para `documentosExternos` com categoria "Exame Laboratorial" e dispararão extração automática de resultados. Exames de imagem serão categorizados como "Exame de Imagem". Receitas externas serão armazenadas como referência no prontuário.

**Fase 3: Interface de Confirmação (2-3 horas)**

Antes de finalizar a classificação, o sistema exibirá uma prévia para o usuário confirmar ou corrigir a classificação sugerida pela IA. Isso permite aprendizado contínuo e evita erros de classificação em documentos ambíguos.

**Fase 4: Feedback Loop (1-2 horas)**

Quando o usuário corrigir uma classificação, essa informação será registrada para melhorar futuras classificações. Padrões de erro serão identificados e o prompt será ajustado conforme necessário.

### 2.4 Análise de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Classificação incorreta pela IA | Média | Médio | Tela de confirmação obrigatória |
| Documentos ilegíveis/baixa qualidade | Alta | Médio | Fallback para classificação manual |
| Latência no processamento | Média | Baixo | Processamento em background com status |
| Custo de API do LLM | Baixa | Baixo | Cache de classificações similares |
| Documentos em formatos não suportados | Baixa | Médio | Validação de formato no upload |

**Funcionalidades que podem ser afetadas:**

O sistema de OCR existente já funciona bem para extração de texto. A adição da classificação automática é uma camada adicional que não modifica o fluxo existente, apenas o estende. O risco de impacto é baixo porque a classificação ocorre após a extração de texto, não durante.

O upload de documentos no modal de evolução já está implementado. A classificação automática será adicionada como um passo intermediário entre o upload e o salvamento, sem alterar a interface existente.

### 2.5 Probabilidade de Sucesso

| Aspecto | Avaliação |
|---------|-----------|
| Complexidade técnica | Média-Alta |
| Dependências externas | Média (LLM pode ter variações) |
| Código existente reutilizável | Alta (OCR e upload prontos) |
| **Chance de sucesso na 1ª tentativa** | **65-70%** |

A probabilidade é ligeiramente menor devido à natureza imprevisível da classificação por IA. Documentos médicos podem ter formatos muito variados, e a precisão da classificação depende da qualidade do OCR e da clareza do documento. A tela de confirmação mitiga esse risco, mas pode haver necessidade de ajustes no prompt após testes com documentos reais.

---

## 3. Auto-Save de Rascunhos

### 3.1 Descrição da Funcionalidade

O sistema salvará automaticamente a evolução a cada 30 segundos enquanto o médico digita, evitando perda de dados em caso de queda de conexão, fechamento acidental do navegador, ou qualquer outro problema. O rascunho será recuperado automaticamente ao reabrir o modal de evolução.

### 3.2 Arquitetura Proposta

| Componente | Descrição | Status Atual |
|------------|-----------|--------------|
| **Estado Local** | Gerenciamento de estado do formulário | ✅ Já existe |
| **Debounce/Throttle** | Controle de frequência de salvamento | ❌ A implementar |
| **Endpoint de Rascunho** | API para salvar/recuperar rascunhos | ❌ A implementar |
| **Armazenamento** | Local (localStorage) + Servidor | ❌ A implementar |
| **Indicador Visual** | Feedback de salvamento automático | ❌ A implementar |

### 3.3 Plano de Implementação

**Fase 1: Armazenamento Local (1-2 horas)**

O primeiro nível de proteção será o localStorage do navegador. A cada alteração no formulário (com debounce de 5 segundos), o estado completo será serializado e salvo localmente. Isso protege contra fechamento acidental do navegador e funciona mesmo offline.

A chave do localStorage seguirá o padrão: `gorgen_rascunho_evolucao_{pacienteId}_{agendamentoId}` para permitir múltiplos rascunhos simultâneos.

**Fase 2: Sincronização com Servidor (2-3 horas)**

A cada 30 segundos (ou quando houver alterações significativas), o rascunho será enviado ao servidor. Será criado um novo endpoint `evolucoes.salvarRascunho` que armazena o conteúdo em uma tabela dedicada ou utiliza o campo `status: 'rascunho'` já existente na tabela de evoluções.

A sincronização seguirá esta lógica: primeiro salva localmente (instantâneo), depois tenta sincronizar com servidor (background). Se a sincronização falhar, o rascunho local permanece válido e será sincronizado na próxima oportunidade.

**Fase 3: Recuperação Automática (2-3 horas)**

Ao abrir o modal de evolução, o sistema verificará se existe rascunho salvo (local ou servidor) para o paciente/agendamento atual. Se existir, exibirá um diálogo perguntando se o usuário deseja recuperar o rascunho ou iniciar uma nova evolução.

A lógica de recuperação priorizará o rascunho mais recente entre local e servidor, comparando timestamps.

**Fase 4: Indicadores Visuais (1-2 horas)**

O modal exibirá indicadores discretos do status de salvamento: "Salvando..." durante a sincronização, "Salvo às HH:MM" após sucesso, e "Offline - salvo localmente" quando sem conexão. Esses indicadores seguirão o padrão visual discreto já estabelecido no protótipo aprovado.

### 3.4 Análise de Riscos

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Conflito entre rascunho local e servidor | Média | Médio | Usar timestamp para resolver conflitos |
| localStorage cheio | Baixa | Baixo | Limpar rascunhos antigos (>7 dias) |
| Rascunho sobrescrevendo evolução final | Baixa | Alto | Verificar status antes de recuperar |
| Performance com salvamentos frequentes | Baixa | Baixo | Debounce adequado (30s) |
| Dados sensíveis no localStorage | Média | Médio | Criptografar dados locais |

**Funcionalidades que podem ser afetadas:**

O fluxo atual de criação de evolução não será alterado. O auto-save é uma camada adicional que opera em paralelo, sem modificar os botões "Salvar" e "Assinar" existentes. O único ponto de atenção é garantir que ao salvar/assinar manualmente, o rascunho seja limpo para evitar recuperação indevida.

O timer de consulta já implementado no modal pode ser usado como referência para o intervalo de auto-save, mantendo consistência no código.

### 3.5 Probabilidade de Sucesso

| Aspecto | Avaliação |
|---------|-----------|
| Complexidade técnica | Baixa-Média |
| Dependências externas | Nenhuma |
| Código existente reutilizável | Média |
| **Chance de sucesso na 1ª tentativa** | **85-90%** |

Esta é a funcionalidade com maior probabilidade de sucesso na primeira tentativa. O conceito é bem estabelecido (auto-save existe em praticamente todos os editores modernos), não há dependências externas, e a implementação é relativamente direta. O principal cuidado é com a lógica de resolução de conflitos entre rascunhos locais e do servidor.

---

## Resumo Comparativo

| Funcionalidade | Complexidade | Risco de Impacto | Chance de Sucesso |
|----------------|--------------|------------------|-------------------|
| Emissão de Documentos | Média | Baixo | 75-80% |
| Processamento IA de Uploads | Média-Alta | Baixo | 65-70% |
| Auto-Save de Rascunhos | Baixa-Média | Muito Baixo | 85-90% |

---

## Recomendação de Ordem de Implementação

Com base na análise de riscos e probabilidade de sucesso, a ordem recomendada de implementação é:

**1º - Auto-Save de Rascunhos**

Maior probabilidade de sucesso, menor risco de impacto, e benefício imediato para o usuário. Implementar primeiro permite validar o fluxo de trabalho e ganhar confiança antes das funcionalidades mais complexas.

**2º - Emissão de Documentos**

Funcionalidade essencial para o fluxo de trabalho médico, com infraestrutura já parcialmente existente. O risco é controlável e a maior parte do trabalho é criação de componentes visuais.

**3º - Processamento IA de Uploads**

Funcionalidade mais complexa e com maior incerteza devido à natureza da classificação por IA. Implementar por último permite focar em ajustes finos após as outras funcionalidades estarem estáveis.

---

## Estimativa de Tempo Total

| Funcionalidade | Tempo Estimado |
|----------------|----------------|
| Auto-Save de Rascunhos | 6-10 horas |
| Emissão de Documentos | 14-20 horas |
| Processamento IA de Uploads | 8-12 horas |
| **Total** | **28-42 horas** |

---

## Considerações Finais

Todas as três funcionalidades são viáveis de implementar com a arquitetura atual do Gorgen. O sistema já possui a maior parte da infraestrutura necessária, especialmente para emissão de documentos (schema completo) e processamento de uploads (OCR já funcional).

O principal fator de risco é a integração com o modal de evolução recém-redesenhado. Recomenda-se implementar cada funcionalidade em branch separado, com testes extensivos antes de merge para a branch principal, seguindo o workflow de deployment preferido do projeto.

A abordagem incremental permite validar cada funcionalidade isoladamente e reverter rapidamente caso algum problema seja identificado, minimizando o risco de impacto nas funcionalidades existentes que já funcionam bem.
