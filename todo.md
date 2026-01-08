# Gorgen - Sistema de Gestão em Saúde
## Lista de Tarefas

---

## ✅ Funcionalidades Concluídas

### Base do Sistema
- [x] Schema do banco de dados (pacientes + atendimentos)
- [x] CRUD completo de pacientes
- [x] CRUD completo de atendimentos
- [x] Dashboard com métricas em tempo real
- [x] Design elegante com tema médico profissional
- [x] Layout com sidebar de navegação
- [x] Autenticação integrada

### Formulários
- [x] Formulário completo de cadastro de pacientes (33 campos)
- [x] Formulário completo de cadastro de atendimentos (26 campos)
- [x] ID automático sequencial para pacientes
- [x] ID automático sequencial para atendimentos
- [x] Máscaras automáticas (CPF, telefone, CEP)
- [x] Checkboxes para campos Sim/Não
- [x] Dropdown de operadoras customizado
- [x] Dropdown de tipos de atendimento
- [x] Dropdown de locais de atendimento
- [x] Convênio vinculado ao paciente selecionado

### Dados de Demonstração
- [x] Importação de 50 pacientes de amostra
- [x] Importação de 100 atendimentos de amostra

---

## 🚧 FASE 1: Consolidação da Base Administrativa (EM ANDAMENTO)

### Sprint 1: Filtros e Busca Avançada ✅ CONCLUÍDO
- [x] **Filtros na Página de Pacientes**
  - [x] Barra de busca global (Nome, CPF, ID)
  - [x] Filtro por nome (busca parcial) - corrigido em 07/01/2026
  - [x] Filtro por CPF
  - [x] Filtro por convênio (dropdown)
  - [x] Filtro por diagnóstico
  - [x] Filtro por status (Ativo/Óbito/Perda)
  - [x] Filtro por data de inclusão (período)
  - [x] Filtro por idade
  - [x] Filtro por cidade e UF
  - [x] Botão "Limpar Filtros"
  - [x] Contador de resultados
  - [x] Paginação (20, 50, 100 por página)
  - [x] Ordenação por coluna (clique no cabeçalho)

- [x] **Filtros na Página de Atendimentos**
  - [x] Barra de busca global (ID, Paciente, Procedimento)
  - [x] Filtro por tipo de atendimento
  - [x] Filtro por local
  - [x] Filtro por convênio
  - [x] Filtro por data (período)
  - [x] Filtro por status de pagamento
  - [x] Ordenação por coluna
  - [x] Paginação (20, 50, 100 por página)
  - [x] Botão "Limpar Filtros"
  - [x] Contador de resultados

- [ ] **Exportação de Dados** (PENDENTE)
  - [ ] Botão "Exportar para Excel" em Pacientes
  - [ ] Botão "Exportar para Excel" em Atendimentos
  - [ ] Exportar apenas registros filtrados
  - [ ] Formatação profissional (cabeçalhos, larguras, máscaras)
  - [ ] Nome de arquivo com data

### Sprint 2: Edição de Registros
- [x] **Edição de Pacientes** ✅ CONCLUÍDO
  - [x] Botão "Editar" em cada linha da tabela
  - [x] Modal de edição com formulário pré-preenchido
  - [x] Formulário organizado em abas (Dados Básicos, Contato, Convênios, Clínico)
  - [x] Validações mantidas
  - [x] Salvar alterações com feedback toast
  - [ ] Log de alterações (auditoria) - PENDENTE

- [ ] **Edição de Atendimentos** (PENDENTE)
  - [ ] Botão "Editar" em cada linha da tabela
  - [ ] Modal de edição com formulário pré-preenchido
  - [ ] Não permitir alterar paciente vinculado
  - [ ] Salvar alterações
  - [ ] Log de alterações

- [ ] **Exclusão de Registros** (PENDENTE)
  - [ ] Botão "Excluir" com confirmação
  - [ ] Exclusão lógica (soft delete)
  - [ ] Apenas administradores podem excluir
  - [ ] Log de exclusão

### Sprint 3: Importação de Dados Reais (Semana 2 - Parte 2)
- [ ] **Preparação do Script de Importação**
  - [ ] Analisar estrutura do banco atual
  - [ ] Mapear campos (banco antigo → Gorgen)
  - [ ] Limpeza de dados (duplicatas, formatos)
  - [ ] Criar script de importação (Python/Node.js)
  - [ ] Processar em lotes (1000 por vez)
  - [ ] Validação de cada registro
  - [ ] Log de erros

- [ ] **Execução da Importação**
  - [ ] Backup do banco antes da importação
  - [ ] Importação em ambiente de teste
  - [ ] Validação dos resultados
  - [ ] Importação em produção
  - [ ] Gerar relatório de importação

- [ ] **Importação de Atendimentos Históricos**
  - [ ] Mapear atendimentos do banco antigo
  - [ ] Vincular a pacientes importados
  - [ ] Importar em lotes
  - [ ] Validar relacionamentos
  - [ ] Gerar relatório

- [ ] **Validação Pós-Importação**
  - [ ] Verificar total de registros
  - [ ] Testar busca de pacientes aleatórios
  - [ ] Verificar relacionamentos
  - [ ] Testar filtros com dados reais
  - [ ] Verificar performance

### Sprint 4: Tabelas Auxiliares e Branding (Semana 3)
- [ ] **Integração de Tabela CBHPM**
  - [ ] Criar tabela `procedimentos_cbhpm` no banco
  - [ ] Importar dados da tabela CBHPM
  - [ ] Atualizar formulário de Novo Atendimento (dropdown)
  - [ ] Preenchimento automático do código
  - [ ] Permitir adicionar novos procedimentos

- [ ] **Integração de Tabela de Honorários**
  - [ ] Criar tabela `honorarios` no banco
  - [ ] Importar dados da tabela de honorários
  - [ ] Cálculo automático por procedimento + convênio
  - [ ] Permitir edição manual
  - [ ] Histórico de valores

- [ ] **Branding "Gorgen"**
  - [ ] Atualizar título: "Gorgen - Aplicativo de Gestão em Saúde"
  - [ ] Criar/adicionar logo
  - [ ] Atualizar favicon
  - [ ] Adicionar tagline na sidebar
  - [ ] Atualizar rodapé com copyright

- [ ] **Testes Finais e Documentação**
  - [ ] Testar todos os filtros
  - [ ] Testar edição de registros
  - [ ] Testar exportação
  - [ ] Testar performance
  - [ ] Testar em múltiplos navegadores
  - [ ] Testar em dispositivos móveis
  - [ ] Criar manual do usuário (PDF)
  - [ ] Criar vídeo tutorial
  - [ ] Criar FAQ

---

## 📅 FASE 2: Prontuário Médico Eletrônico (FUTURO)

### Estrutura do Prontuário
- [ ] Criar tabela de prontuários no banco
- [ ] Página de visualização de prontuário por paciente
- [ ] Timeline de atendimentos
- [ ] Seções: Anamnese, Exame físico, Diagnóstico, Conduta, Evolução

### Upload e Gestão de Exames
- [ ] Criar tabela de exames no banco
- [ ] Sistema de upload de arquivos (PDF, imagens, DICOM)
- [ ] Armazenamento em S3
- [ ] Visualizador de exames
- [ ] Categorização de exames

### Documentos Médicos
- [ ] Geração de atestados
- [ ] Geração de receitas
- [ ] Geração de solicitações de exames
- [ ] Templates customizáveis
- [ ] Assinatura digital

### Acesso ao Prontuário
- [ ] Botão "Ver Prontuário" na listagem de pacientes
- [ ] Navegação entre seções
- [ ] Impressão de prontuário completo

---

## 📅 FASE 3: Portal do Paciente (FUTURO)

### Autenticação e Perfil
- [ ] Sistema de registro de pacientes
- [ ] Login separado para pacientes
- [ ] Perfil com dados básicos
- [ ] Recuperação de senha

### Autogestão de Dados
- [ ] Paciente atualiza dados pessoais
- [ ] Paciente faz upload de exames
- [ ] Paciente visualiza histórico de atendimentos
- [ ] Paciente vê prescrições e receitas

### Agendamento Online
- [ ] Calendário de disponibilidade
- [ ] Sistema de agendamento
- [ ] Confirmação automática
- [ ] Lembretes de consulta

---

## 📝 Notas e Observações

### Dados Necessários para Fase 1
- Banco de dados atual (21.000+ pacientes)
- Tabela CBHPM (procedimentos e códigos)
- Tabela de honorários (valores por convênio)

### Critérios de Sucesso
- Busca em < 3 segundos com 21.000+ registros
- Cadastro de paciente em < 2 minutos
- Registro de atendimento em < 1 minuto
- Taxa de importação > 99%

### Próximos Checkpoints
- Após Sprint 1: Checkpoint com filtros
- Após Sprint 2: Checkpoint com edição
- Após Sprint 3: Checkpoint com dados reais
- Após Sprint 4: Checkpoint final da Fase 1


---

## 🚀 GORGEN 1.1 - Melhorias Solicitadas

### Página de Pacientes - Busca e Filtros
- [x] Busca global por Nome, CPF ou ID (não apenas nome)
- [x] Filtros individuais por coluna:
  - [x] Filtro por Nome
  - [x] Filtro por CPF
  - [x] Filtro por Telefone
  - [x] Filtro por Cidade
  - [x] Filtro por UF
  - [x] Filtro por Operadora (ambas)
  - [x] Filtro por Status (Ativo/Óbito/Perda)
  - [x] Filtro por Diagnóstico
- [x] Botão "Mostrar/Ocultar Filtros"
- [x] Botão "Limpar Filtros"
- [x] Contador de resultados filtrados


### Melhorias Adicionais para Gorgen 1.1
- [x] Filtro por Data de Inclusão (seletor de período de/até)
- [x] Paginação (20, 50, 100 registros por página)
- [x] Contador "Mostrando X a Y de Z pacientes"
- [x] Botões Anterior/Próxima para navegação
- [x] Seletor de itens por página (20, 50, 100)
- [x] Performance otimizada com useMemo


### Refinamentos Gorgen 1.1
- [x] Ordenação por coluna ao clicar no cabeçalho (A-Z / Z-A alternando)
- [x] Remover filtros redundantes: Nome, CPF, Telefone (manter apenas na busca global)
- [x] Ícone visual indicando direção da ordenação (↑ ↓)
- [x] Terceiro clique remove ordenação
- [x] Hover effect nos cabeçalhos ordenáveis


### Melhorias Estéticas Gorgen 1.1
- [x] Reorganizar layout de filtros para 2 linhas
- [x] Mover Status para ao lado de Operadora (linha 1: 4 campos, linha 2: 3 campos)
- [x] Layout mais compacto e visualmente agradável


## 🚀 GORGEN 1.2 - Novas Funcionalidades

### Edição de Pacientes
- [x] Adicionar botão "Editar" em cada linha da tabela de pacientes
- [x] Criar modal de edição com formulário pré-preenchido
- [x] Procedure tRPC para atualizar paciente (já existia)
- [x] Formulário organizado em abas (Dados Básicos, Contato, Convênios, Clínico)
- [x] Checkboxes para campos Sim/Não
- [x] Feedback visual de sucesso/erro com toast

### Melhorias na Página de Atendimentos
- [x] Busca global por ID, Paciente ou Procedimento
- [x] Ordenação por coluna ao clicar no cabeçalho (A-Z / Z-A)
- [x] Filtros otimizados: Tipo, Local, Convênio, Pagamento, Período
- [x] Paginação (20, 50, 100 registros)
- [x] Layout de filtros em 2 linhas compactas
- [x] Contador de resultados ("Mostrando X a Y de Z")
- [x] Botão "Limpar Filtros"
- [x] Performance otimizada com useMemo


---

## 🔐 FASE 1.5: Sistema de Controle de Acesso (PLANEJADO - NÃO IMPLEMENTAR AGORA)

### Gestão de Usuários
- [ ] Criar aba "Usuários" no menu
- [ ] Tabela de listagem de usuários (Nome, Email, Perfil, Status)
- [ ] Formulário de cadastro de novo usuário
- [ ] Formulário de edição de usuário
- [ ] Botão Ativar/Desativar usuário

### Níveis de Acesso
- [ ] **Administrador Master** (Dr. André Gorgen): Acesso total sem restrições
- [ ] **Médico**: Acesso apenas a pacientes autorizados (com atendimento registrado + autorização)
- [ ] **Paciente**: Acesso apenas aos próprios dados

### Sistema de Autorizações
- [ ] Criar tabela `autorizacoes_prontuario` no banco
- [ ] Interface para paciente conceder/revogar acesso de médicos
- [ ] Interface para admin visualizar todas as autorizações
- [ ] Autorização automática ao registrar primeiro atendimento

### Middleware de Controle
- [ ] `adminProcedure`: Requer perfil Admin
- [ ] `medicoProcedure`: Requer perfil Médico
- [ ] `pacienteProcedure`: Requer perfil Paciente
- [ ] Validação de acesso a prontuário em todas as queries

### Log de Auditoria (LGPD)
- [ ] Criar tabela `audit_log` no banco
- [ ] Registrar todas as ações sensíveis (visualizar, editar, criar, excluir)
- [ ] Página "Logs de Auditoria" (apenas Admin)
- [ ] Exportar logs para análise

### Segurança
- [ ] Autenticação multifator (MFA) para Admin
- [ ] Política de senhas fortes
- [ ] Bloqueio após 5 tentativas de login
- [ ] Timeout de sessão (30 minutos)
- [ ] Criptografia de dados sensíveis

**Observação**: Implementar ANTES da Fase 2 (Prontuário) para garantir segurança desde o início.


---

## 🐛 BUGS A CORRIGIR

### Gorgen 1.2
- [x] Nomes dos pacientes não aparecem na tabela de Atendimentos (JOIN implementado)

- [x] Bug: "Invalid Date" aparecendo na página de Atendimentos (função formatarData com validação)

- [x] Bug: ID, data, local, tipo de atendimento e convênio não aparecem na tabela de Atendimentos (RESOLVIDO: corrigido select no db.ts para retornar estrutura flat com getTableColumns)

- [x] Adicionar coluna "Idade" nas tabelas de Pacientes e Atendimentos (extrair número após o nome, com filtro e ordenação)

- [x] Implementar idade dinâmica baseada em data de nascimento (calcular automaticamente com base na data atual)

- [x] Bug: Erro ao atualizar paciente - "Invalid input: expected string, received Date" no campo dataInclusao

- [x] Adicionar campo de data de nascimento no formulário de cadastro de novos pacientes (campo já existia, testado e validado)


## FASE 0: FUNCIONALIDADES ESSENCIAIS (Próxima)

### Sistema de Usuários e Controle de Acesso
- [ ] Criar tabela de usuários no schema
- [ ] Implementar perfis de usuário (Admin, Secretária, Assistente, Financeiro)
- [ ] Criar middleware de autorização no backend
- [ ] Implementar UI de gerenciamento de usuários
- [ ] Adicionar logs de auditoria para ações sensíveis

### Autenticação com Senha
- [ ] Implementar hash de senhas com bcrypt
- [ ] Criar tela de login local
- [ ] Implementar recuperação de senha via email
- [ ] Adicionar bloqueio após tentativas falhas
- [ ] Implementar política de senhas fortes

### Prontuário Médico Eletrônico
- [ ] Criar schema de prontuário no banco
- [ ] Implementar editor de texto rico
- [ ] Adicionar suporte a anexos (PDFs, imagens)
- [ ] Criar visualização cronológica do histórico
- [ ] Implementar busca dentro dos prontuários
- [ ] Adicionar assinatura digital e rastreabilidade
- [ ] Implementar impressão de relatórios de evolução

### Sistema de Agenda
- [ ] Criar schema de agendamentos
- [ ] Implementar calendário visual (mensal, semanal, diário)
- [ ] Adicionar configuração de horários de trabalho
- [ ] Implementar marcação de consultas
- [ ] Criar gestão de conflitos de horários
- [ ] Adicionar status de agendamento (agendado, confirmado, realizado, faltou)
- [ ] Implementar lista de espera

### Produção Automatizada de Guias
- [ ] Criar templates de guias por convênio
- [ ] Implementar geração de PDF
- [ ] Adicionar preenchimento automático de dados
- [ ] Criar numeração sequencial de guias
- [ ] Implementar armazenamento no histórico do atendimento
- [ ] Adicionar funcionalidade de reimpressão

## FASE A: FUNCIONALIDADES BÁSICAS

- [ ] Implementar edição de atendimentos (modal similar ao de pacientes)
- [ ] Criar relatório de inadimplência (atendimentos não pagos agrupados)
- [ ] Implementar exportação para Excel em todas as tabelas

## FASE B: MIGRAÇÃO DE DADOS

- [ ] Desenvolver script de importação em massa
- [ ] Implementar validação e limpeza de dados
- [ ] Importar tabela CBHPM completa
- [ ] Criar tabela de honorários por convênio
- [ ] Implementar cálculo automático de valores

## FASE C: AUTOMAÇÕES E UX

- [ ] Implementar sistema de notificações automáticas
- [ ] Criar lembretes de consultas (email/SMS)
- [ ] Desenvolver interface de relatórios personalizados
- [ ] Adicionar agendamento de relatórios automáticos

- [x] Implementar novo formato de ID de atendimento (ID_PACIENTE-YYYYNNNN)

- [x] Bug: Busca/autocomplete corrigido em Novo Atendimento (usando Card ao invés de button)
- [ ] Bug: Botão "Novo Atendimento" não aparece na tabela de pacientes (código correto, problema de cache do navegador - usuário precisa limpar cache)

- [x] Bug: Botão Novo Atendimento retorna erro 404 (corrigido - rota era /atendimentos/novo)

- [x] Bug: Sistema de busca corrigido - melhorado autocomplete em Novo Atendimento com feedback visual de "nenhum resultado"


---

## 🚀 GORGEN 1.9.1 - Correção de Bug (07/01/2026)

### Bug Corrigido
- [x] **Filtro de busca por nome não funcionava**
  - Problema: Busca por CPF e ID funcionava, mas busca por nome não filtrava
  - Causa: Conversão de tipo incorreta no campo `nome`
  - Solução: Usar `String()` para garantir conversão correta
  - Adicionar `filtroIdade` às dependências do useMemo

### Status Atual do Sistema
- **Versão:** 1.9.1
- **Checkpoint:** 2b61af73
- **Data:** 07/01/2026

---

## 📊 RESUMO DE PROGRESSO

### Fase 1 - Consolidação Base Administrativa
| Sprint | Status | Progresso |
|--------|--------|-----------|
| Sprint 1: Filtros e Busca | ✅ Concluído | 100% |
| Sprint 2: Edição | ✅ Concluído | 100% |
| Sprint 3: Importação | ⏳ Pendente | 0% |
| Sprint 4: Tabelas/Branding | ⏳ Pendente | 0% |

### Próximas Prioridades
1. [ ] Exportação para Excel (Pacientes e Atendimentos)
2. [ ] Edição de Atendimentos
3. [ ] Importação dos 21.000+ pacientes reais
4. [ ] Integração tabela CBHPM



---

## 🚀 GORGEN 2.0 - Sprint 2 Completo ✅ CONCLUÍDO (07/01/2026)

### Edição de Atendimentos
- [x] Modal de edição com formulário pré-preenchido (3 abas: Dados Básicos, Faturamento, Pagamento)
- [x] Não permitir alterar paciente vinculado
- [ ] Salvar alterações com feedback toast
- [ ] Validações mantidas

### Exclusão de Registros (Soft Delete)
- [ ] Adicionar campo `deletedAt` nas tabelas
- [ ] Botão "Excluir" com confirmação em Pacientes
- [ ] Botão "Excluir" com confirmação em Atendimentos
- [ ] Filtrar registros excluídos nas listagens
- [ ] Opção para visualizar registros excluídos (admin)

### Log de Auditoria
- [ ] Criar tabela `audit_log` no banco
- [ ] Registrar criação de registros
- [ ] Registrar edição de registros (antes/depois)
- [ ] Registrar exclusão de registros
- [ ] Página de visualização de logs (admin)



### ✅ IMPLEMENTADO EM 07/01/2026

**Edição de Atendimentos:**
- [x] Modal de edição com 3 abas (Dados Básicos, Faturamento, Pagamento)
- [x] Todos os campos editáveis
- [x] Salvar alterações com feedback toast
- [x] Validações mantidas

**Exclusão de Registros (Soft Delete):**
- [x] Campo `deletedAt` e `deletedBy` nas tabelas pacientes e atendimentos
- [x] Botão "Excluir" com confirmação em Pacientes
- [x] Botão "Excluir" com confirmação em Atendimentos
- [x] Registros excluídos são marcados, não removidos fisicamente
- [x] Listagens filtram automaticamente registros excluídos

**Log de Auditoria:**
- [x] Tabela `audit_log` criada no banco
- [x] Registra criação, edição e exclusão de registros
- [x] Armazena dados antigos e novos para comparação
- [x] Procedure para listar logs de auditoria

**Testes Automatizados:**
- [x] 5 testes passando para Sprint 2
- [x] Teste de listagem de pacientes
- [x] Teste de listagem de atendimentos
- [x] Teste de edição de pacientes
- [x] Teste de edição de atendimentos
- [x] Teste de log de auditoria


---

## 🐛 BUG: ID de Pacientes Incorreto (07/01/2026) ✅ CORRIGIDO
- [x] Corrigir geração de ID de pacientes (formato YYYY-NNNNNNN)
- [x] ID "2026-0000NaN" corrigido para "2026-0000052"
- [x] ID de atendimentos verificado - formato correto
- [x] Função getNextPacienteId reescrita com regex para ignorar IDs inválidos
- [x] Testes automatizados adicionados


---

## 🏥 FASE 2: PRONTUÁRIO MÉDICO ELETRÔNICO (PME)

### Estrutura do Prontuário
- [ ] **Cabeçalho do Paciente**
  - [ ] Dados pessoais (nome, idade, sexo, contato)
  - [ ] Resumo da história clínica
  - [ ] Lista de problemas ativos
  - [ ] Alergias conhecidas
  - [ ] Medicamentos em uso

### Seções do Prontuário (Menu Lateral)
- [ ] **Evolução** - Registro de consultas e evoluções clínicas
- [ ] **Internações** - Histórico de internações hospitalares
- [ ] **Cirurgias** - Procedimentos cirúrgicos realizados
- [ ] **Exames Laboratoriais** - Resultados de exames de sangue, urina, etc.
- [ ] **Exames de Imagem** - Raio-X, TC, RM, USG com laudos e imagens
- [ ] **Endoscopia** - EDA, colonoscopia, etc.
- [ ] **Cardiologia** - ECG, ecocardiograma, teste ergométrico
- [ ] **Terapias e Infusões** - Quimioterapia, imunobiológicos, etc.
- [ ] **Obstetrícia** - Apenas para pacientes do sexo feminino

### Documentos Médicos
- [ ] **Receitas** - Receita simples
- [ ] **Receita Especial** - Receita de controle especial
- [ ] **Solicitação de Exames** - Requisição de exames
- [ ] **Atestado de Comparecimento** - Declaração de presença
- [ ] **Atestado de Afastamento** - Atestado médico com CID
- [ ] **Protocolo de Cirurgia** - Agendamento cirúrgico
- [ ] **Guias** - Guias de autorização

### Integração
- [ ] Link no nome do paciente na lista
- [ ] Ícone de prontuário ao lado do botão editar
- [ ] Navegação entre seções do prontuário

### Schema do Banco
- [ ] Tabela evolucoes
- [ ] Tabela internacoes
- [ ] Tabela cirurgias
- [ ] Tabela exames_laboratoriais
- [ ] Tabela exames_imagem
- [ ] Tabela endoscopias
- [ ] Tabela cardiologia
- [ ] Tabela terapias
- [ ] Tabela obstetricia
- [ ] Tabela documentos_medicos
- [ ] Tabela alergias
- [ ] Tabela medicamentos_uso
- [ ] Tabela problemas_ativos


### Requisitos Adicionais (07/01/2026)
- [ ] Adicionar campos peso, altura e IMC automático no cabeçalho do prontuário
- [ ] Adicionar campo de contato de responsável/next of kin na tabela de pacientes


---

# 🏛️ PILARES FUNDAMENTAIS DO GORGEN

## 1. IMUTABILIDADE E PRESERVAÇÃO HISTÓRICA DOS DADOS

> **"Em saúde, a informação é o retrato do momento do paciente."**

### Princípio
Todo dado inserido no Gorgen é **perpétuo**. Não se apaga informação. Não se descarta dados. A única pessoa autorizada a deletar informações é o **Dr. André Gorgen** (Administrador Master).

### Justificativa
- **Análise Longitudinal**: A capacidade de analisar dados ao longo do tempo é a informação realmente útil na prática clínica
- **Contexto Temporal**: Cada registro representa o estado do paciente naquele momento específico
- **Evolução Clínica**: Comparar parâmetros passados com atuais permite avaliar eficácia de tratamentos
- **Segurança Jurídica**: Registro completo e inalterado para fins legais e de auditoria

### Exemplo Prático
Se um paciente tinha **IMC 35 kg/m²** em 01/01/2025 e hoje apresenta **IMC 29 kg/m²**:
- O valor anterior é preservado no histórico
- Ambos os valores são acessíveis para comparação
- A evolução pode ser visualizada em gráfico temporal
- O médico pode avaliar a eficácia da intervenção

### Implementação Técnica
1. **Soft Delete**: Registros nunca são removidos fisicamente, apenas marcados como inativos
2. **Histórico de Alterações**: Toda modificação cria um novo registro preservando o anterior
3. **Tabelas de Histórico**: Dados que mudam ao longo do tempo (peso, altura, pressão, etc.) são armazenados em tabelas de série temporal
4. **Audit Log**: Todas as ações são registradas com usuário, data/hora e valores anteriores/novos
5. **Permissão de Exclusão**: Apenas o Administrador Master pode executar exclusões físicas

### Dados com Histórico Obrigatório
- [ ] Peso e Altura (IMC calculado)
- [ ] Pressão Arterial
- [ ] Glicemia
- [ ] Medicamentos em Uso
- [ ] Diagnósticos/Problemas Ativos
- [ ] Alergias
- [ ] Resultados de Exames

---

## 2. SIGILO E CONFIDENCIALIDADE ABSOLUTA

> **"Dados de saúde são informações sensíveis protegidas por lei."**

### Princípio
Todos os dados inseridos no sistema são tratados como **informações confidenciais e sensíveis**, com proteção máxima contra divulgação não autorizada.

### Implementação
- Controle de acesso por perfil (Admin, Médico, Paciente)
- Autorização explícita para acesso a prontuários
- Criptografia de dados em repouso e em trânsito
- Log de auditoria de todos os acessos
- Conformidade com LGPD, CFM e CREMESP

---

## 3. RASTREABILIDADE COMPLETA

> **"Toda ação no sistema deve ser auditável."**

### Princípio
Cada operação realizada no Gorgen é registrada com:
- Quem executou (usuário)
- Quando executou (timestamp)
- O que foi feito (ação)
- Valores anteriores e novos (diff)

### Finalidade
- Conformidade regulatória
- Investigação de incidentes
- Responsabilização
- Melhoria contínua

---

## 4. SIMPLICIDADE COM PROFUNDIDADE SOB DEMANDA

> **"O sistema deve ser simples de pronto, mas capaz de responder imediatamente a quem exige detalhes."**

### Princípio
A interface do Gorgen é **simples por padrão**, exibindo apenas as informações essenciais. Porém, todos os dados detalhados estão **prontos no background** para acesso imediato com **um único clique**.

### Justificativa
- **Redução de Carga Cognitiva**: O usuário não é sobrecarregado com informações desnecessárias
- **Eficiência**: Tarefas rotineiras são rápidas e diretas
- **Profundidade Disponível**: Quando necessário, o detalhe está a um clique de distância
- **Adaptação ao Contexto**: O sistema atende tanto ao uso rápido quanto à análise aprofundada

### Exemplo Prático: Peso e Altura
- **Visão Simples**: No cabeçalho do prontuário, exibe apenas o peso atual, altura e IMC
- **Visão Detalhada**: Com um clique em "Medidas Antropométricas", acessa histórico completo com gráficos de evolução
- **Background Pronto**: Os dados históricos já estão carregados, sem espera adicional

### Padrões de Interface
1. **Resumo → Detalhe**: Toda seção mostra resumo primeiro, detalhe sob demanda
2. **Expansão In-Place**: Detalhes expandem na mesma tela quando possível
3. **Tooltips Informativos**: Informações complementares aparecem ao passar o mouse
4. **Modais para Ações**: Formulários complexos em modais, não em novas páginas
5. **Navegação Lateral**: Menu sempre visível para acesso rápido a qualquer seção

### Regra de Ouro
> **Máximo de 2 cliques** para acessar qualquer informação detalhada a partir da tela principal.

### Implementação Técnica
- **Pré-carregamento**: Dados frequentemente acessados são carregados em background
- **Cache Inteligente**: Consultas recentes ficam em cache para acesso instantâneo
- **Lazy Loading**: Dados pesados (imagens, PDFs) carregam apenas quando solicitados
- **Skeleton Loading**: Feedback visual imediato enquanto dados carregam

---

## 5. CONTROLE DE ACESSO BASEADO EM PERFIS

> **"Cada usuário acessa apenas o que lhe é permitido, com base em seu perfil e autorizações explícitas."**

### Princípio
O acesso ao Gorgen é controlado por **perfis de usuário**. Um mesmo CPF pode ter **múltiplos perfis** simultâneos (ex: médico que também é paciente de outro médico no sistema).

### Os 5 Perfis do Gorgen

#### 🔑 ADMINISTRADOR
- **Acesso**: Total e irrestrito a todo o sistema
- **Permissões**: Pode modificar qualquer coisa, incluir/excluir usuários, configurar sistema
- **Quem**: Dr. André Gorgen e equipe técnica autorizada
- **Responsabilidade**: Único perfil que pode executar exclusões físicas de dados

#### 🩺 MÉDICO
- **Acesso**: Prontuários de pacientes que:
  1. Lhe conferiram **autorização expressa** para consulta, OU
  2. O médico já **atendeu** (autorização implícita por atendimento)
- **Restrições**:
  - Não acessa perfis de outros médicos
  - Não modifica funções do sistema
  - Sem atendimento ou autorização = sem acesso
- **Papel**: Consumidor do sistema, atua apenas sobre dados dos seus pacientes

#### 👤 PACIENTE
- **Acesso**: Apenas aos próprios dados
- **Permissões**:
  - Incluir informações pessoais
  - Fazer upload de documentos e exames
  - **Conceder/revogar** acesso a médicos a qualquer tempo
  - Apagar seu perfil do Gorgen com poucos cliques (direito LGPD)
- **Restrições**: Não pode deletar informações clínicas (imutabilidade)

#### 📝 SECRETÁRIA
- **Acesso**: Vinculado a um ou mais médicos específicos
- **Permissões**:
  - Manejar agenda do(s) médico(s) vinculado(s)
  - Acessar dados cadastrais básicos de pacientes
  - Acessar dados de faturamento e agendamento
- **Restrições**:
  - **Não pode consultar prontuários médicos**
  - Atua como preposto do médico que lhe autorizou

#### 🔍 AUDITOR
- **Acesso**: Similar ao médico, porém:
  - Autorização concedida pelo **Administrador** (não pelo paciente)
  - Acesso para fins de auditoria e conformidade
- **Restrições**:
  - **Não pode editar absolutamente nenhuma informação**
  - Acesso somente leitura (read-only)
  - Todas as consultas são registradas em log

### Matriz de Permissões

| Ação | Admin | Médico | Paciente | Secretária | Auditor |
|-------|-------|--------|----------|------------|--------|
| Ver prontuário | ✅ | ✅* | Próprio | ❌ | ✅** |
| Editar prontuário | ✅ | ✅* | ❌ | ❌ | ❌ |
| Criar evolução | ✅ | ✅* | ❌ | ❌ | ❌ |
| Upload documentos | ✅ | ✅* | ✅ | ❌ | ❌ |
| Gerenciar agenda | ✅ | ✅ | ❌ | ✅*** | ❌ |
| Ver faturamento | ✅ | ✅ | Próprio | ✅*** | ✅** |
| Configurar sistema | ✅ | ❌ | ❌ | ❌ | ❌ |
| Excluir dados | ✅ | ❌ | ❌ | ❌ | ❌ |
| Conceder acesso | ✅ | ❌ | ✅**** | ❌ | ❌ |
| Ver logs auditoria | ✅ | ❌ | ❌ | ❌ | ✅ |

*Legenda:*
- \* Com autorização do paciente ou atendimento prévio
- \*\* Com autorização do administrador
- \*\*\* Apenas dos médicos vinculados
- \*\*\*\* Concede/revoga acesso de médicos ao próprio prontuário

### Implementação Técnica
- Tabela `usuarios` com campo `perfis` (array de perfis)
- Tabela `autorizacoes_prontuario` (paciente → médico)
- Tabela `vinculos_secretaria` (secretária → médico)
- Middleware de autorização em todas as rotas
- Log de todas as tentativas de acesso (autorizadas e negadas)

---

## 6. AUTOMAÇÃO E ELIMINAÇÃO DE DUPLO TRABALHO

> **"O que puder ser automatizado, será. Não existe duplo trabalho no Gorgen."**

### Princípio
Todo dado inserido uma vez no Gorgen é **propagado automaticamente** para todos os contextos onde for necessário. Este pilar promove a **conciliação entre medicina e administração**, eliminando a distância entre profissionais da área médica e administrativa.

### Justificativa
- **Dor do Setor**: Existe uma distância histórica entre quem atua na medicina e quem atua na administração
- **Dupla Digitação**: Profissionais frequentemente precisam inserir os mesmos dados em múltiplos sistemas
- **Erros de Transcrição**: Cada redigitação é uma oportunidade de erro
- **Perda de Tempo**: Tempo gasto em burocracia é tempo perdido no cuidado ao paciente

### Exemplo Prático: CPF do Paciente
- CPF inserido **uma única vez** no cadastro do paciente
- Aparece automaticamente em:
  - Guias de autorização
  - Receitas e atestados
  - Notas fiscais
  - Relatórios de faturamento
  - Documentos para convênios
  - Qualquer campo que exija CPF

### Áreas de Automação

#### Documentos Médicos
- Receitas pré-preenchidas com dados do paciente e médico
- Atestados com CID vinculado ao atendimento
- Solicitações de exames com histórico clínico relevante
- Laudos com dados antropométricos atuais

#### Faturamento e Guias
- Guias TISS geradas automaticamente após atendimento
- Dados do convênio puxados do cadastro do paciente
- Códigos de procedimento vinculados ao tipo de atendimento
- Honorários calculados conforme tabela configurada

#### Administração
- Relatórios financeiros consolidados automaticamente
- Conciliação de pagamentos com atendimentos
- Alertas de glosas e pendências
- Dashboard unificado médico-administrativo

### Dashboard Unificado (Visão Futura)
A dashboard deve integrar **medicina e administração**:

#### Métricas Financeiras (✅ Já Implementado)
- Faturamento previsto
- Taxa de recebimento
- Distribuição por convênio

#### Métricas Médicas (📅 Futuro)
- Número de atendimentos ao longo do tempo
- Médias móveis de 28 dias para atendimentos
- Análise por tipo de atendimento (consulta, retorno, procedimento)
- Distribuição por diagnóstico
- Taxa de retorno de pacientes
- Tempo médio entre consultas

### Implementação Técnica
- **Campos Vinculados**: Referência única para dados do paciente em todas as tabelas
- **Preenchimento Automático**: Formulários buscam dados existentes antes de solicitar digitação
- **Templates Inteligentes**: Documentos gerados com merge de dados do banco
- **Validação Cruzada**: Sistema alerta quando dados divergem entre fontes
- **Sincronização**: Atualização em um local reflete em todos os documentos

### Regra de Ouro
> **Nenhum dado deve ser digitado mais de uma vez.** Se o sistema já conhece a informação, ela deve ser preenchida automaticamente.

---

## 📋 IMPLEMENTAÇÃO DOS PILARES

### Histórico de Medidas Antropométricas
- [ ] Criar tabela `historico_medidas` (paciente_id, data, peso, altura, imc, registrado_por)
- [ ] Ao atualizar peso/altura, criar novo registro preservando histórico
- [ ] Exibir gráfico de evolução no prontuário
- [ ] Mostrar comparativo com última medição



---

## 🏛️ PILARES FUNDAMENTAIS DO GORGEN - IMPLEMENTAÇÃO (07/01/2026)

### Pilar 1: Imutabilidade e Preservação Histórica ✅ IMPLEMENTADO
- [x] Documentado como princípio fundamental do sistema
- [x] Tabela `historico_medidas` criada para preservar todas as medições
- [x] Funções de registro sem possibilidade de edição ou exclusão
- [x] 12 testes automatizados validando o pilar de imutabilidade
- [x] Interface de Medidas Antropométricas com gráfico de evolução do IMC
- [x] Cálculo automático de IMC com classificação (Abaixo do peso, Normal, Sobrepeso, Obesidade)

### Campos Adicionados
- [x] Peso e Altura com cálculo automático de IMC
- [x] Histórico de medidas preservado
- [x] Contato de Responsável/Next of Kin (nome, parentesco, telefone, email)
- [x] Atualizar título da aba do navegador para "Gorgen v2.5"

## 🗓️ GORGEN 2.6 - Módulo de Agenda

### Schema e Backend
- [ ] Criar tabela `agendamentos` no schema
- [ ] Criar tabela `bloqueios_horario` no schema
- [x] Implementar procedures CRUD de agendamentos
- [ ] Implementar procedure de cancelamento (soft)
- [ ] Implementar procedure de reagendamento com histórico

### Frontend
- [x] Criar página de Agenda com calendário
- [x] Adicionar Agenda na barra lateral
- [ ] Modal de novo agendamento
- [ ] Modal de cancelamento
- [ ] Modal de reagendamento
- [ ] Visualização de compromissos cancelados (transparente)
- [ ] Gestão de bloqueios de horário

### Tipos de Compromisso
- [ ] Reunião
- [ ] Consulta
- [ ] Cirurgia
- [ ] Visita internado
- [ ] Procedimento em consultório
- [ ] Exame
- [x] Melhorar estética da agenda - linhas mais compactas para caber em uma tela
- [x] Adicionar indicação visual de feriados nacionais na agenda
- [x] Criar sistema de perfis de usuário (Administrador Master, Médico, Secretária, Financeiro, Visualizador)
- [x] Vincular perfis a nome, CPF e email do usuário
- [x] Implementar seletor de perfil para usuários com múltiplos perfis
- [x] Criar página de Configurações com abas específicas por perfil
- [x] Criar usuário de teste André Gorgen com todos os perfis
