# Planejamento Estratégico - Sistema Gorgen
## Sistema Integrado de Gestão para Consultório Médico

**Versão:** 2.0  
**Data:** 07 de Janeiro de 2026  
**Cliente:** Dr. André Gorgen  
**Autor:** Manus AI

---

## 1. Visão Executiva

O **Sistema Gorgen** é uma plataforma integrada de gestão médica desenvolvida especificamente para otimizar os processos operacionais do consultório do Dr. André Gorgen. O sistema abrange o ciclo completo de atendimento, desde a prospecção de pacientes até o gerenciamento administrativo e financeiro, garantindo eficiência operacional, conformidade regulatória e proteção rigorosa de dados sensíveis.

O projeto está estruturado em fases progressivas que priorizam funcionalidades essenciais antes de avançar para automações e integrações complexas. Esta abordagem garante que o sistema esteja operacional rapidamente, com melhorias contínuas baseadas no uso real.

---

## 2. Status Atual (Versão 1.5)

### 2.1 Funcionalidades Implementadas

O sistema encontra-se na **Fase 1 (Fundação)** com as seguintes funcionalidades operacionais:

#### Gestão de Pacientes
O módulo de pacientes oferece cadastro completo com 33 campos estruturados, incluindo dados pessoais (nome, CPF, data de nascimento, sexo), informações de contato (telefone, email, endereço completo), dados de até dois convênios médicos (operadora, plano, matrícula, vigência), e informações clínicas (diagnóstico, status do caso, tempo de seguimento). O sistema calcula automaticamente a idade do paciente com base na data de nascimento, atualizando-se conforme a data atual. A interface de listagem oferece busca global por nome ou CPF, filtros avançados por cidade, UF, convênio e idade, além de ordenação por qualquer coluna e paginação configurável.

#### Gestão de Atendimentos
O módulo de atendimentos permite registro completo de consultas e procedimentos, vinculando cada atendimento a um paciente cadastrado. Os campos incluem tipo de atendimento (consulta, exame, procedimento em consultório, cirurgia), data, local, convênio utilizado, procedimento realizado, valores (previsto e final), e status de pagamento. A listagem oferece filtros por tipo, local, convênio, status de pagamento, período de datas e idade do paciente, com cálculo automático de faturamento previsto versus recebido.

#### Dashboard Analítico
O painel principal apresenta indicadores-chave de desempenho em tempo real, incluindo total de pacientes (separando ativos e inativos), total de atendimentos registrados, faturamento previsto total, valor efetivamente recebido, taxa de recebimento percentual, e distribuição dos dez principais convênios por número de atendimentos. Os dados são atualizados automaticamente conforme novos registros são inseridos no sistema.

#### Infraestrutura Técnica
A arquitetura do sistema utiliza banco de dados MySQL/TiDB para persistência, backend em Node.js com tRPC para comunicação type-safe entre cliente e servidor, autenticação via Manus OAuth, frontend em React 19 com Tailwind CSS 4 para interface responsiva, e sistema de busca e filtros em tempo real em todas as tabelas.

### 2.2 Métricas de Uso Atual

| Métrica | Valor Atual |
|---------|-------------|
| Total de Pacientes | 52 (51 ativos, 1 teste) |
| Total de Atendimentos | 100 |
| Faturamento Previsto | R$ 147.293,75 |
| Faturamento Recebido | R$ 96.205,42 |
| Taxa de Recebimento | 65,3% |
| Convênios Ativos | 10+ operadoras |

---

## 3. Roadmap de Desenvolvimento

O desenvolvimento do Sistema Gorgen está estruturado em cinco fases principais, cada uma com objetivos claros e entregáveis específicos. A progressão entre fases ocorre somente após validação completa da fase anterior.

### Fase 0: Funcionalidades Essenciais Pendentes
**Prioridade:** CRÍTICA  
**Prazo Estimado:** 2-3 semanas  
**Status:** Próxima fase

Esta fase implementa funcionalidades fundamentais que são pré-requisitos para operação segura e completa do sistema em ambiente de produção.

#### 3.1.1 Sistema de Usuários e Controle de Acesso

O sistema atualmente utiliza autenticação OAuth básica, mas precisa evoluir para um modelo robusto de controle de acesso baseado em perfis. A implementação incluirá os seguintes perfis de usuário:

**Perfil Administrador (Dr. André Gorgen):** Acesso completo a todas as funcionalidades do sistema, incluindo cadastro e gerenciamento de usuários, visualização e edição de todos os dados de pacientes e atendimentos, acesso a relatórios financeiros e gerenciais, configuração de parâmetros do sistema, e auditoria de ações de usuários.

**Perfil Secretária/Recepção:** Acesso limitado focado em operações do dia a dia, incluindo cadastro e edição de pacientes, agendamento e registro de atendimentos, emissão de guias e documentos, consulta de informações de convênios, mas sem acesso a relatórios financeiros detalhados ou configurações do sistema.

**Perfil Assistente Médico:** Acesso intermediário com foco em suporte clínico, incluindo visualização de prontuários, registro de informações clínicas, acesso a histórico de atendimentos, mas sem permissão para editar dados financeiros ou cadastrais.

**Perfil Financeiro:** Acesso focado em gestão financeira, incluindo visualização e edição de valores de atendimentos, controle de pagamentos, geração de relatórios financeiros, mas sem acesso a prontuários médicos ou informações clínicas sensíveis.

A implementação técnica incluirá tabela de usuários com campos de perfil, senha criptografada (bcrypt), status ativo/inativo, e data de último acesso. O middleware de autorização verificará permissões em cada endpoint do backend, com logs de auditoria registrando todas as ações sensíveis (criação, edição, exclusão de registros).

#### 3.1.2 Sistema de Senhas e Autenticação Local

Além da autenticação OAuth, o sistema implementará autenticação local com senha para usuários internos. As senhas serão armazenadas utilizando hash bcrypt com salt, garantindo segurança mesmo em caso de vazamento do banco de dados. O sistema implementará política de senhas fortes (mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais), funcionalidade de recuperação de senha via email, bloqueio temporário após múltiplas tentativas falhas (proteção contra força bruta), e expiração de senha configurável (opcional, para ambientes de alta segurança).

#### 3.1.3 Prontuário Médico Eletrônico (PME)

O Prontuário Médico Eletrônico será implementado como módulo central do sistema, vinculado diretamente a cada paciente. Cada entrada de prontuário conterá data e hora do registro, tipo de entrada (anamnese, evolução, prescrição, exame, procedimento), texto livre para descrição detalhada, campos estruturados específicos por tipo (sinais vitais, medicamentos prescritos, resultados de exames), anexos de documentos (PDFs, imagens de exames), e identificação do profissional que registrou a informação.

O sistema garantirá rastreabilidade completa com histórico de edições (quem editou, quando, o que foi alterado), impossibilidade de exclusão de registros (apenas marcação como "retificado"), e assinatura digital das entradas (timestamp + hash do conteúdo). A interface permitirá visualização cronológica do histórico completo do paciente, busca por palavras-chave dentro dos prontuários, e impressão de relatórios de evolução para compartilhamento com outros profissionais.

#### 3.1.4 Sistema de Agenda

O módulo de agenda implementará gestão completa de horários de atendimento, com calendário visual mensal, semanal e diário, configuração de horários de trabalho e intervalos, bloqueio de horários para eventos especiais ou ausências, e integração com cadastro de pacientes e atendimentos.

As funcionalidades de agendamento incluirão marcação de consultas com seleção de paciente, tipo de atendimento e duração, visualização de disponibilidade em tempo real, confirmação de presença (status: agendado, confirmado, realizado, faltou, cancelado), notificações automáticas de lembretes (via email ou SMS, se integrado), e lista de espera para horários cancelados.

O sistema gerenciará conflitos de horários automaticamente, impedindo dupla marcação no mesmo horário, e oferecerá relatórios de taxa de comparecimento, horários mais procurados, e tempo médio de atendimento por tipo.

#### 3.1.5 Produção Automatizada de Guias

O sistema automatizará a geração de guias médicas para convênios, reduzindo trabalho manual e erros. As funcionalidades incluirão templates personalizáveis por operadora (cada convênio tem formato específico), preenchimento automático de dados do paciente, médico e procedimento, numeração sequencial de guias com controle de série, geração em PDF pronto para impressão ou envio digital, e armazenamento automático no histórico do atendimento.

Os tipos de guias suportados incluirão guia de consulta (TISS), guia de solicitação de exames (SADT), guia de internação, e guia de procedimentos ambulatoriais. O sistema manterá registro de todas as guias emitidas, permitindo reimpressão e auditoria posterior.

### Tabela de Entregáveis - Fase 0

| Funcionalidade | Complexidade | Prazo Estimado | Dependências |
|----------------|--------------|----------------|--------------|
| Sistema de Usuários | Média | 3 dias | Schema de banco, UI de gerenciamento |
| Controle de Acesso | Média | 2 dias | Sistema de usuários |
| Autenticação com Senha | Baixa | 2 dias | Sistema de usuários |
| Prontuário Médico | Alta | 5 dias | Editor de texto rico, anexos |
| Agenda | Média | 4 dias | Calendário, integração com atendimentos |
| Guias Automatizadas | Alta | 4 dias | Templates PDF, dados de convênios |

---

### Fase A: Completar Funcionalidades Básicas
**Prioridade:** ALTA  
**Prazo Estimado:** 1-2 semanas  
**Status:** Após Fase 0

Esta fase complementa as funcionalidades operacionais básicas, melhorando a experiência do usuário e adicionando recursos essenciais para gestão diária.

#### 3.2.1 Edição de Atendimentos

Atualmente o sistema permite apenas criação de atendimentos. A funcionalidade de edição permitirá correção de dados, atualização de valores, alteração de status de pagamento, e modificação de procedimentos realizados. O modal de edição seguirá o mesmo padrão do modal de edição de pacientes, com validação de campos e histórico de alterações.

#### 3.2.2 Relatório de Inadimplência

Página dedicada à gestão financeira, apresentando lista de atendimentos não pagos agrupados por paciente e convênio, com totalizadores por operadora, filtros por período (últimos 30, 60, 90 dias ou customizado), ordenação por valor ou data, e exportação para análise externa. O relatório incluirá gráficos de evolução da inadimplência ao longo do tempo e comparação entre convênios.

#### 3.2.3 Exportação para Excel

Implementação de botões de exportação em todas as tabelas principais (Pacientes, Atendimentos, Relatórios), gerando planilhas XLSX com dados filtrados conforme visualização atual, incluindo colunas calculadas (idade, valores totais), formatação profissional (cabeçalhos, cores, bordas), e nome de arquivo automático com data e tipo de relatório.

### Tabela de Entregáveis - Fase A

| Funcionalidade | Complexidade | Prazo Estimado | Impacto |
|----------------|--------------|----------------|---------|
| Edição de Atendimentos | Baixa | 2 dias | Correção de erros operacionais |
| Relatório de Inadimplência | Média | 3 dias | Gestão financeira proativa |
| Exportação para Excel | Baixa | 2 dias | Análises externas e backups |

---

### Fase B: Preparar para Migração de Dados
**Prioridade:** ALTA  
**Prazo Estimado:** 2-3 semanas  
**Status:** Após Fase A

Esta fase prepara o sistema para receber os dados históricos do sistema anterior, incluindo mais de 21.000 pacientes e seus respectivos atendimentos.

#### 3.3.1 Script de Importação em Massa

Desenvolvimento de ferramenta robusta para importação de grandes volumes de dados, com suporte a múltiplos formatos (CSV, Excel, SQL dump), mapeamento flexível de colunas (sistema antigo → Gorgen), validação de dados antes da importação (CPF, datas, valores), e relatório detalhado de erros e avisos.

O processo de importação será executado em lotes (batch processing) para evitar sobrecarga do banco de dados, com possibilidade de pausar e retomar, rollback em caso de erro crítico, e preview dos dados antes da importação definitiva.

#### 3.3.2 Validação e Limpeza de Dados

Implementação de rotinas de validação que identificarão dados duplicados (pacientes com mesmo CPF ou nome muito similar), inconsistências (datas futuras, valores negativos), campos obrigatórios vazios, e formatos incorretos (telefone, CEP, CPF).

O sistema oferecerá ferramentas de limpeza automática para padronização de nomes (capitalização correta), formatação de CPF, telefone e CEP, remoção de espaços extras e caracteres especiais, e correção de UFs e cidades baseada em CEP.

#### 3.3.3 Integração com Tabelas CBHPM e Honorários

Implementação de tabelas de referência da CBHPM (Classificação Brasileira Hierarquizada de Procedimentos Médicos) para cálculo automático de valores. O sistema incluirá importação da tabela CBHPM completa com códigos e descrições, tabela de honorários por convênio (cada operadora tem valores específicos), cálculo automático de valor previsto ao selecionar procedimento e convênio, e histórico de alterações de valores (para auditoria).

A interface permitirá busca de procedimentos por código ou descrição, cadastro de procedimentos customizados não presentes na CBHPM, e configuração de percentuais de desconto ou acréscimo por convênio.

### Tabela de Entregáveis - Fase B

| Funcionalidade | Complexidade | Prazo Estimado | Impacto |
|----------------|--------------|----------------|---------|
| Script de Importação | Alta | 5 dias | Migração de 21.000+ pacientes |
| Validação de Dados | Média | 3 dias | Qualidade dos dados importados |
| Integração CBHPM | Alta | 6 dias | Automação de precificação |

---

### Fase C: Melhorias de UX e Automação
**Prioridade:** MÉDIA  
**Prazo Estimado:** 2-3 semanas  
**Status:** Após Fase B

Esta fase adiciona automações e melhorias de experiência que aumentam a eficiência operacional e reduzem trabalho manual.

#### 3.4.1 Sistema de Notificações Automáticas

Implementação de motor de notificações que enviará alertas automáticos para eventos importantes, incluindo lembretes de consultas agendadas (24h antes, via email/SMS), avisos de aniversário de pacientes, alertas de inadimplência (pagamentos atrasados há mais de 30 dias), e notificações de ações do sistema (novo usuário criado, alteração de senha).

O sistema permitirá configuração individual de preferências de notificação por usuário, templates personalizáveis de mensagens, e histórico de notificações enviadas.

#### 3.4.2 Lembretes de Consultas

Funcionalidade específica para redução de faltas, com envio automático de lembretes por email 24h antes da consulta, SMS (se integrado com gateway), e notificação push (se app mobile for desenvolvido). Os lembretes incluirão confirmação de presença com link de resposta, opção de cancelamento ou reagendamento, e atualização automática do status na agenda.

O sistema gerará relatórios de efetividade dos lembretes, comparando taxa de comparecimento antes e depois da implementação.

#### 3.4.3 Relatórios Personalizados

Interface para criação de relatórios customizados sem necessidade de programação, com seleção de campos a incluir (drag-and-drop), filtros dinâmicos por qualquer campo, agrupamentos e totalizadores, e visualizações em gráficos (barras, linhas, pizza).

Os relatórios poderão ser salvos como templates reutilizáveis, agendados para geração automática (diária, semanal, mensal), e exportados em múltiplos formatos (PDF, Excel, CSV).

### Tabela de Entregáveis - Fase C

| Funcionalidade | Complexidade | Prazo Estimado | Impacto |
|----------------|--------------|----------------|---------|
| Notificações Automáticas | Média | 4 dias | Redução de trabalho manual |
| Lembretes de Consultas | Baixa | 2 dias | Redução de faltas |
| Relatórios Personalizados | Alta | 6 dias | Análises sob demanda |

---

## 4. Requisitos Técnicos e Conformidade

### 4.1 Segurança e Privacidade

O sistema implementa múltiplas camadas de segurança para proteção de dados sensíveis, em conformidade com a Lei Geral de Proteção de Dados (LGPD) e regulamentações do Conselho Federal de Medicina (CFM).

**Criptografia:** Todas as comunicações entre cliente e servidor utilizam HTTPS com certificado SSL/TLS. Senhas são armazenadas com hash bcrypt (custo 12). Dados sensíveis em repouso podem ser criptografados com AES-256 (opcional, para ambientes de alta segurança).

**Controle de Acesso:** Sistema de autenticação robusto com OAuth 2.0 e autenticação local. Autorização baseada em perfis (RBAC - Role-Based Access Control). Sessões com timeout configurável. Logs de auditoria para todas as operações sensíveis.

**Backup e Recuperação:** Backups automáticos diários do banco de dados. Retenção de backups por 90 dias. Testes periódicos de restauração. Plano de recuperação de desastres documentado.

**Conformidade LGPD:** Registro de consentimento de pacientes para tratamento de dados. Funcionalidade de exportação de dados pessoais (direito de portabilidade). Possibilidade de anonimização de dados para pesquisa. Política de privacidade e termos de uso integrados ao sistema.

### 4.2 Infraestrutura e Performance

**Banco de Dados:** MySQL 8.0+ ou TiDB (compatível com MySQL). Índices otimizados para consultas frequentes. Particionamento de tabelas para grandes volumes (opcional). Replicação para alta disponibilidade (produção).

**Backend:** Node.js 22+ com TypeScript. Framework tRPC para comunicação type-safe. Express para servidor HTTP. Drizzle ORM para acesso ao banco.

**Frontend:** React 19 com hooks e context API. Tailwind CSS 4 para estilização. Wouter para roteamento. TanStack Query (via tRPC) para cache e sincronização.

**Hospedagem:** Manus Cloud (atual) com domínio customizável. Alternativa: VPS dedicado (Hetzner, DigitalOcean) para maior controle. CDN para assets estáticos (opcional, para performance).

### 4.3 Escalabilidade

O sistema está preparado para crescimento gradual, com arquitetura que suporta:

- **Até 50.000 pacientes** sem necessidade de otimizações adicionais
- **Até 500.000 atendimentos** com índices adequados
- **Até 20 usuários simultâneos** com infraestrutura atual
- **Expansão horizontal** (múltiplos servidores) se necessário no futuro

---

## 5. Cronograma Consolidado

### Visão Geral por Fase

| Fase | Descrição | Prazo Estimado | Início Previsto |
|------|-----------|----------------|-----------------|
| **Fase 0** | Funcionalidades Essenciais | 2-3 semanas | Imediato |
| **Fase A** | Funcionalidades Básicas | 1-2 semanas | Após Fase 0 |
| **Fase B** | Migração de Dados | 2-3 semanas | Após Fase A |
| **Fase C** | Automações e UX | 2-3 semanas | Após Fase B |
| **Total** | Projeto Completo | **8-11 semanas** | - |

### Cronograma Detalhado - Fase 0 (Próxima)

| Semana | Atividades | Entregáveis |
|--------|-----------|-------------|
| **Semana 1** | Sistema de usuários e controle de acesso | Tabela de usuários, perfis, middleware de autorização |
| **Semana 1-2** | Autenticação com senha e recuperação | Login local, hash de senhas, recuperação via email |
| **Semana 2** | Prontuário médico - estrutura básica | Schema de prontuário, interface de visualização |
| **Semana 2-3** | Prontuário médico - funcionalidades avançadas | Editor de texto rico, anexos, histórico |
| **Semana 3** | Sistema de agenda | Calendário, marcação de horários, conflitos |
| **Semana 3** | Produção de guias | Templates, geração de PDF, armazenamento |

---

## 6. Riscos e Mitigações

### 6.1 Riscos Técnicos

**Risco:** Perda de dados durante migração em massa (Fase B)  
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:** Backup completo antes da importação. Importação em ambiente de teste primeiro. Validação extensiva antes de commit final. Possibilidade de rollback completo.

**Risco:** Performance degradada com grande volume de dados  
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Mitigação:** Índices otimizados no banco de dados. Paginação em todas as listagens. Cache de consultas frequentes. Monitoramento de performance.

**Risco:** Incompatibilidade de dados do sistema antigo  
**Probabilidade:** Alta  
**Impacto:** Médio  
**Mitigação:** Análise prévia da estrutura de dados antiga. Mapeamento flexível de campos. Rotinas de limpeza e normalização. Importação incremental com validação.

### 6.2 Riscos Operacionais

**Risco:** Resistência à mudança por parte da equipe  
**Probabilidade:** Média  
**Impacto:** Médio  
**Mitigação:** Treinamento adequado antes do go-live. Documentação clara e acessível. Suporte dedicado nas primeiras semanas. Interface intuitiva e familiar.

**Risco:** Indisponibilidade do sistema em horário de atendimento  
**Probabilidade:** Baixa  
**Impacto:** Alto  
**Mitigação:** Manutenções programadas fora do horário comercial. Monitoramento 24/7. Plano de contingência com backup manual. SLA de disponibilidade 99,5%.

---

## 7. Critérios de Sucesso

O projeto será considerado bem-sucedido quando atender aos seguintes critérios mensuráveis:

### 7.1 Critérios Funcionais

- **Cadastro completo** de todos os pacientes ativos (21.000+) migrados com sucesso
- **Zero perda de dados** durante a migração
- **Todos os módulos** (Pacientes, Atendimentos, Prontuário, Agenda, Guias) operacionais
- **Tempo de resposta** inferior a 2 segundos para 95% das operações
- **Taxa de disponibilidade** superior a 99,5% (menos de 4h de downtime por mês)

### 7.2 Critérios de Adoção

- **100% da equipe** treinada e utilizando o sistema
- **Redução de 50%** no tempo de cadastro de pacientes (vs. sistema anterior)
- **Redução de 30%** no tempo de emissão de guias
- **Aumento de 20%** na taxa de comparecimento (via lembretes automáticos)
- **Satisfação da equipe** superior a 8/10 em pesquisa pós-implementação

### 7.3 Critérios Financeiros

- **Visibilidade completa** do faturamento previsto vs. recebido
- **Redução de 40%** no tempo de geração de relatórios financeiros
- **Identificação proativa** de inadimplência (relatório semanal automatizado)
- **ROI positivo** em 6 meses (economia de tempo vs. custo de desenvolvimento)

---

## 8. Próximos Passos Imediatos

### 8.1 Ações para Iniciar Fase 0

1. **Definir perfis de usuário detalhados:** Reunião com Dr. André para mapear exatamente quais permissões cada tipo de usuário deve ter
2. **Levantar templates de guias:** Coletar modelos de guias de cada convênio para implementação correta
3. **Definir estrutura do prontuário:** Decidir quais campos estruturados são necessários além de texto livre
4. **Configurar horários de agenda:** Definir horários de trabalho, duração padrão de consultas, intervalos

### 8.2 Informações Necessárias

Para dar continuidade ao desenvolvimento, são necessárias as seguintes informações:

- **Lista de usuários:** Nomes, emails e perfis de cada pessoa que terá acesso ao sistema
- **Modelos de guias:** PDFs ou documentos Word com templates de guias de cada convênio
- **Horários de atendimento:** Dias da semana, horários de início/fim, intervalos
- **Estrutura do prontuário:** Campos específicos que devem ser capturados além de texto livre
- **Dados do sistema antigo:** Formato dos dados a serem migrados (CSV, Excel, SQL dump)

---

## 9. Conclusão

O Sistema Gorgen está em estágio avançado de desenvolvimento, com fundação sólida já implementada (Fase 1 completa). As próximas fases estão claramente definidas e priorizadas conforme necessidades operacionais do consultório.

A abordagem incremental garante que cada fase agregue valor imediato, permitindo uso produtivo do sistema mesmo antes da conclusão completa do projeto. A estimativa total de 8-11 semanas para conclusão de todas as fases é realista e considera complexidades técnicas e necessidades de validação.

O compromisso com segurança, conformidade regulatória e qualidade de dados garante que o sistema não apenas atenda às necessidades operacionais, mas também esteja em conformidade com todas as exigências legais e éticas da prática médica.

---

**Documento preparado por:** Manus AI  
**Última atualização:** 07 de Janeiro de 2026  
**Versão:** 2.0
