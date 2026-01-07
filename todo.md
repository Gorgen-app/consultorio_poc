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

### Sprint 1: Filtros e Busca Avançada (Semana 1)
- [ ] **Filtros na Página de Pacientes**
  - [ ] Barra de busca global
  - [ ] Filtro por nome (busca parcial)
  - [ ] Filtro por CPF
  - [ ] Filtro por convênio (dropdown)
  - [ ] Filtro por diagnóstico
  - [ ] Filtro por status (Ativo/Óbito/Perda)
  - [ ] Filtro por data de inclusão (período)
  - [ ] Botão "Limpar Filtros"
  - [ ] Contador de resultados
  - [ ] Paginação (20, 50, 100 por página)

- [ ] **Filtros na Página de Atendimentos**
  - [ ] Barra de busca global
  - [ ] Filtro por paciente (autocomplete)
  - [ ] Filtro por tipo de atendimento
  - [ ] Filtro por local
  - [ ] Filtro por convênio
  - [ ] Filtro por data (período)
  - [ ] Filtro por status de pagamento
  - [ ] Filtros rápidos (Últimos 30 dias, Este mês, Este ano)
  - [ ] Ordenação por coluna
  - [ ] Paginação

- [ ] **Exportação de Dados**
  - [ ] Botão "Exportar para Excel" em Pacientes
  - [ ] Botão "Exportar para Excel" em Atendimentos
  - [ ] Exportar apenas registros filtrados
  - [ ] Formatação profissional (cabeçalhos, larguras, máscaras)
  - [ ] Nome de arquivo com data

### Sprint 2: Edição de Registros (Semana 2 - Parte 1)
- [ ] **Edição de Pacientes**
  - [ ] Botão "Editar" em cada linha da tabela
  - [ ] Página de edição com formulário pré-preenchido
  - [ ] Validações mantidas
  - [ ] Salvar alterações
  - [ ] Log de alterações (auditoria)

- [ ] **Edição de Atendimentos**
  - [ ] Botão "Editar" em cada linha da tabela
  - [ ] Página de edição com formulário pré-preenchido
  - [ ] Não permitir alterar paciente vinculado
  - [ ] Salvar alterações
  - [ ] Log de alterações

- [ ] **Exclusão de Registros**
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
