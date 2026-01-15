# Gorgen - Fase 1: Consolidação da Base Administrativa
## Plano de Execução Detalhado (2-3 semanas)

---

## 🎯 Objetivo da Fase 1

Tornar o **Gorgen** totalmente funcional para gestão diária do consultório, com:
- Filtros avançados para busca rápida
- Edição completa de registros
- Importação do banco de dados real (21.000+ pacientes)
- Integração de tabelas auxiliares (CBHPM, honorários)
- Branding profissional

---

## 📅 Cronograma de Implementação

### **SPRINT 1: Filtros e Busca Avançada** (Semana 1)

#### Dia 1-2: Filtros na Página de Pacientes
**Objetivo**: Permitir busca rápida e eficiente de pacientes

**Implementação**:
- [ ] Adicionar barra de busca global no topo da tabela
- [ ] Filtros individuais por coluna:
  - **Nome**: Busca parcial (ex: "João" encontra "João Silva")
  - **CPF**: Busca exata com máscara
  - **Convênio**: Dropdown com operadoras cadastradas
  - **Diagnóstico**: Busca em grupo e específico
  - **Status**: Dropdown (Ativo, Óbito, Perda de Seguimento)
  - **Data de Inclusão**: Seletor de período (de/até)
- [ ] Botão "Limpar Filtros"
- [ ] Contador de resultados ("Mostrando 15 de 21.543 pacientes")
- [ ] Paginação (20, 50, 100 registros por página)

**Resultado Esperado**: Encontrar qualquer paciente em < 3 segundos

---

#### Dia 3-4: Filtros na Página de Atendimentos
**Objetivo**: Facilitar consulta de atendimentos por múltiplos critérios

**Implementação**:
- [ ] Barra de busca global
- [ ] Filtros individuais:
  - **Paciente**: Autocomplete com nome/ID
  - **Tipo**: Dropdown (Cirurgia, Consulta, Visita, Procedimento, Exame)
  - **Local**: Dropdown (Consultório, Online, HMV, Santa Casa, HMD, HMD CG)
  - **Convênio**: Dropdown com operadoras
  - **Data**: Seletor de período
  - **Status Pagamento**: Checkbox (Pago/Pendente)
- [ ] Filtro rápido: "Últimos 30 dias", "Este mês", "Este ano"
- [ ] Ordenação por coluna (crescente/decrescente)
- [ ] Paginação

**Resultado Esperado**: Consultar atendimentos por qualquer critério em segundos

---

#### Dia 5: Exportação de Dados
**Objetivo**: Permitir análise externa dos dados filtrados

**Implementação**:
- [ ] Botão "Exportar para Excel" nas páginas de Pacientes e Atendimentos
- [ ] Exportar apenas registros filtrados (não todos)
- [ ] Formatação profissional:
  - Cabeçalhos em negrito
  - Colunas com largura ajustada
  - Máscaras de CPF, telefone, valores monetários
  - Filtros do Excel habilitados
- [ ] Nome do arquivo: `Gorgen_Pacientes_2026-01-07.xlsx`
- [ ] Feedback visual: "Exportando... Concluído!"

**Resultado Esperado**: Relatórios prontos para análise em Excel

---

### **SPRINT 2: Edição de Registros** (Semana 2 - Parte 1)

#### Dia 1-2: Edição de Pacientes
**Objetivo**: Permitir correção e atualização de dados cadastrais

**Implementação**:
- [ ] Botão "Editar" em cada linha da tabela de pacientes
- [ ] Página de edição com formulário pré-preenchido
- [ ] Mesmos campos do cadastro (33 campos)
- [ ] Validações mantidas (CPF, email, máscaras)
- [ ] Botão "Salvar Alterações" e "Cancelar"
- [ ] Confirmação: "Dados atualizados com sucesso!"
- [ ] Registro de log: quem editou, quando, o que mudou

**Casos de Uso**:
- Atualizar telefone/email do paciente
- Corrigir erro de digitação no nome
- Adicionar segundo convênio
- Atualizar status (óbito, perda de seguimento)

**Resultado Esperado**: Editar qualquer dado de paciente em < 1 minuto

---

#### Dia 3-4: Edição de Atendimentos
**Objetivo**: Corrigir informações de atendimentos já registrados

**Implementação**:
- [ ] Botão "Editar" em cada linha da tabela de atendimentos
- [ ] Página de edição com formulário pré-preenchido
- [ ] Mesmos campos do cadastro (26 campos)
- [ ] Não permitir alterar paciente vinculado (apenas criar novo)
- [ ] Permitir atualizar valores, datas, status de pagamento
- [ ] Botão "Salvar Alterações" e "Cancelar"
- [ ] Log de alterações

**Casos de Uso**:
- Atualizar data de pagamento
- Corrigir valor de honorário
- Adicionar observações posteriores
- Alterar status de pagamento

**Resultado Esperado**: Corrigir atendimentos rapidamente

---

#### Dia 5: Exclusão de Registros (com Segurança)
**Objetivo**: Permitir exclusão controlada de dados incorretos

**Implementação**:
- [ ] Botão "Excluir" em cada registro
- [ ] Modal de confirmação: "Tem certeza? Esta ação não pode ser desfeita"
- [ ] Exclusão lógica (soft delete): marcar como excluído, não apagar do banco
- [ ] Apenas administradores podem excluir
- [ ] Log de exclusão: quem, quando, motivo
- [ ] Possibilidade de restaurar (futuro)

**Resultado Esperado**: Exclusão segura e rastreável

---

### **SPRINT 3: Importação de Dados Reais** (Semana 2 - Parte 2)

#### Dia 1-2: Preparação do Script de Importação
**Objetivo**: Migrar 21.000+ pacientes reais para o sistema

**Etapas**:
1. **Análise do Banco Atual**
   - [ ] Receber arquivo/acesso ao banco atual
   - [ ] Mapear estrutura de dados (colunas, formatos)
   - [ ] Identificar inconsistências (dados faltantes, duplicados)

2. **Limpeza de Dados**
   - [ ] Remover duplicatas (mesmo CPF)
   - [ ] Padronizar formatos (CPF, telefone, CEP)
   - [ ] Validar campos obrigatórios
   - [ ] Tratar valores nulos

3. **Mapeamento de Campos**
   - [ ] Criar tabela de correspondência:
     ```
     Banco Antigo → Gorgen
     NOME_PACIENTE → nome
     CPF_PACIENTE → cpf
     DATA_NASC → dataNascimento
     ...
     ```

4. **Script de Importação**
   - [ ] Criar script Python/Node.js
   - [ ] Processar em lotes (1000 pacientes por vez)
   - [ ] Gerar IDs automáticos sequenciais
   - [ ] Validar cada registro antes de inserir
   - [ ] Log de erros: registros que falharam

**Resultado Esperado**: Script pronto para executar

---

#### Dia 3: Execução da Importação
**Objetivo**: Importar todos os pacientes reais

**Processo**:
1. **Backup do Banco Atual**
   - [ ] Fazer backup completo antes da importação
   - [ ] Testar restauração do backup

2. **Importação em Ambiente de Teste**
   - [ ] Executar importação em banco de teste
   - [ ] Validar resultados
   - [ ] Verificar integridade dos dados

3. **Importação em Produção**
   - [ ] Executar script de importação
   - [ ] Monitorar progresso (barra de progresso)
   - [ ] Validar total de registros importados
   - [ ] Gerar relatório: sucessos, falhas, avisos

**Resultado Esperado**: 
- 21.000+ pacientes importados com sucesso
- Taxa de sucesso > 99%
- Relatório detalhado de importação

---

#### Dia 4: Importação de Atendimentos Históricos
**Objetivo**: Importar histórico de atendimentos dos pacientes

**Processo**:
- [ ] Mapear atendimentos do banco antigo
- [ ] Vincular atendimentos aos pacientes importados (por CPF/ID)
- [ ] Importar em lotes
- [ ] Validar relacionamentos (paciente existe?)
- [ ] Gerar relatório de importação

**Resultado Esperado**: Histórico completo de atendimentos no sistema

---

#### Dia 5: Validação e Testes Pós-Importação
**Objetivo**: Garantir integridade dos dados importados

**Checklist de Validação**:
- [ ] Total de pacientes no sistema = total esperado
- [ ] Buscar pacientes aleatórios e verificar dados
- [ ] Verificar relacionamento paciente ↔ atendimentos
- [ ] Testar filtros com dados reais
- [ ] Verificar dashboard com dados reais
- [ ] Performance: busca rápida mesmo com 21.000+ registros?

**Resultado Esperado**: Sistema funcionando perfeitamente com dados reais

---

### **SPRINT 4: Tabelas Auxiliares e Branding** (Semana 3)

#### Dia 1-2: Integração de Tabela CBHPM
**Objetivo**: Vincular procedimentos a códigos automaticamente

**Implementação**:
- [ ] Receber tabela CBHPM do usuário
- [ ] Criar tabela `procedimentos_cbhpm` no banco:
  ```sql
  - id
  - codigo_cbhpm (ex: 10101012)
  - descricao (ex: "Consulta médica")
  - categoria (ex: "Consultas")
  - ativo (boolean)
  ```
- [ ] Importar dados da tabela
- [ ] Atualizar formulário de Novo Atendimento:
  - Campo "Procedimento" vira dropdown com busca
  - Ao selecionar, código CBHPM preenche automaticamente
- [ ] Permitir adicionar novos procedimentos pelo sistema

**Resultado Esperado**: Código CBHPM preenchido automaticamente

---

#### Dia 3: Integração de Tabela de Honorários
**Objetivo**: Calcular valores automaticamente por convênio

**Implementação**:
- [ ] Receber tabela de honorários do usuário
- [ ] Criar tabela `honorarios` no banco:
  ```sql
  - id
  - procedimento_id (FK para procedimentos_cbhpm)
  - convenio (ex: "UNIMED")
  - valor (decimal)
  - vigencia_inicio (date)
  - vigencia_fim (date, nullable)
  ```
- [ ] Importar dados da tabela
- [ ] Atualizar formulário de Novo Atendimento:
  - Ao selecionar procedimento + convênio → valor preenche automaticamente
  - Permitir editar valor manualmente (casos especiais)
- [ ] Histórico de valores (para análise futura)

**Resultado Esperado**: Valores preenchidos automaticamente

---

#### Dia 4: Branding "Gorgen"
**Objetivo**: Identidade visual profissional

**Implementação**:
- [ ] Atualizar título do sistema: "Gorgen - Aplicativo de Gestão em Saúde"
- [ ] Criar logo profissional (ou usar iniciais "G" estilizado)
- [ ] Atualizar favicon
- [ ] Adicionar tagline na sidebar: "Gestão em Saúde"
- [ ] Atualizar cores do tema (manter azul médico elegante)
- [ ] Adicionar rodapé: "© 2026 Gorgen - Dr. André Gorgen"

**Resultado Esperado**: Sistema com identidade visual profissional

---

#### Dia 5: Testes Finais e Documentação
**Objetivo**: Garantir qualidade e documentar o sistema

**Testes**:
- [ ] Testar todos os filtros com dados reais
- [ ] Testar edição de pacientes e atendimentos
- [ ] Testar exportação para Excel
- [ ] Testar performance com 21.000+ pacientes
- [ ] Testar em diferentes navegadores (Chrome, Firefox, Safari)
- [ ] Testar em dispositivos móveis

**Documentação**:
- [ ] Manual do usuário (PDF):
  - Como cadastrar pacientes
  - Como registrar atendimentos
  - Como buscar e filtrar
  - Como editar registros
  - Como exportar dados
- [ ] Vídeo tutorial (5-10 minutos)
- [ ] FAQ (perguntas frequentes)

**Resultado Esperado**: Sistema testado e documentado

---

## 📊 Critérios de Sucesso da Fase 1

### Funcionalidades
- ✅ Filtros funcionando em todas as colunas
- ✅ Busca retorna resultados em < 3 segundos
- ✅ Edição de registros funcional
- ✅ Exportação para Excel formatada
- ✅ 21.000+ pacientes importados com sucesso
- ✅ Tabelas CBHPM e honorários integradas
- ✅ Branding "Gorgen" aplicado

### Performance
- ✅ Páginas carregam em < 2 segundos
- ✅ Busca com 21.000+ registros em < 3 segundos
- ✅ Exportação de 1.000 registros em < 10 segundos

### Usabilidade
- ✅ Usuário consegue cadastrar paciente em < 2 minutos
- ✅ Usuário consegue registrar atendimento em < 1 minuto
- ✅ Usuário consegue encontrar paciente em < 30 segundos
- ✅ Usuário consegue editar dados em < 1 minuto

---

## 🚀 Entregáveis da Fase 1

1. **Sistema Funcional**
   - Filtros avançados implementados
   - Edição de registros funcionando
   - Dados reais importados

2. **Documentação**
   - Manual do usuário
   - Vídeo tutorial
   - FAQ

3. **Relatório de Importação**
   - Total de registros importados
   - Taxa de sucesso
   - Problemas identificados e resolvidos

4. **Checkpoint de Produção**
   - Sistema pronto para uso diário
   - Backup completo
   - Plano de suporte

---

## 📋 Próximos Passos Após Fase 1

Após concluir a Fase 1, teremos:
- ✅ Base administrativa sólida e funcional
- ✅ Dados reais no sistema
- ✅ Usuário operando o sistema diariamente

**Então partimos para Fase 2: Prontuário Médico Eletrônico**
- Upload de exames
- Histórico clínico estruturado
- Documentos médicos

---

## 🤝 Apoio Necessário do Usuário

Para executar a Fase 1 com sucesso, precisarei:

1. **Banco de Dados Atual**
   - Arquivo Excel/CSV com pacientes
   - Arquivo Excel/CSV com atendimentos
   - Ou acesso ao banco de dados atual

2. **Tabela CBHPM**
   - Lista de procedimentos com códigos
   - Formato: Excel ou CSV

3. **Tabela de Honorários**
   - Valores por procedimento e convênio
   - Formato: Excel ou CSV

4. **Feedback Contínuo**
   - Testar funcionalidades conforme implementadas
   - Reportar bugs ou sugestões
   - Validar se atende necessidades reais

---

**Pronto para começar a Fase 1! Quando você puder fornecer o banco de dados atual, iniciamos a importação. Enquanto isso, posso começar pelos filtros e edição de registros. O que acha? 🚀**
