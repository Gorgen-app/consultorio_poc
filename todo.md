# Gorgen - Sistema de Gestão em Saúde
## Lista de Tarefas

> **Última atualização:** 30/01/2026
> **Versão atual:** 3.9.96
> **Repositório:** Gorgen-app/consultorio_poc

---

## ✅ FUNCIONALIDADES IMPLEMENTADAS

### 🏗️ Arquitetura e Infraestrutura
- [x] Arquitetura Multi-tenant completa
- [x] Sistema de autenticação com login/registro
- [x] Autenticação com senha (hash bcrypt)
- [x] Recuperação de senha (forgot/reset password)
- [x] Alteração de senha
- [x] Controle de acesso baseado em roles (admin/user)
- [x] Controle de acesso por funcionalidade (ProtectedRoute)
- [x] Criptografia AES-256-GCM para dados sensíveis (CPF, email, telefone)
- [x] HMAC-SHA256 para busca em campos criptografados
- [x] Soft delete para pacientes e atendimentos
- [x] Sistema de backup completo (manual, automático, incremental)
- [x] Validação de integridade de backup
- [x] Restauração de backup
- [x] Testes de restauração automatizados
- [x] Geração de relatórios de auditoria
- [x] Auto-Healer para diagnóstico e correção automática de problemas

### 🎨 Interface e Design
- [x] Landing Page profissional com branding Gorgen
- [x] Tema médico profissional (cores, tipografia)
- [x] Layout com sidebar de navegação (DashboardLayout)
- [x] Tema claro/escuro
- [x] Design responsivo
- [x] Página "Quem Somos"
- [x] Página "Termos de Uso"
- [x] Página "Política de Privacidade"
- [x] Indicadores de LGPD Compliant e Criptografia AES-256
- [x] Toast notifications para feedback
- [x] Error Boundary para tratamento de erros
- [x] Barra global de minimizados

### 👥 Gestão de Pacientes
- [x] CRUD completo de pacientes
- [x] Formulário completo de cadastro (33+ campos)
- [x] ID automático sequencial (formato: YYYY-NNNNNNN)
- [x] Máscaras automáticas (CPF, telefone, CEP)
- [x] Suporte a 2 convênios por paciente
- [x] Campos de responsável/next of kin
- [x] Status do caso (Ativo/Óbito/Perda)
- [x] Grupo diagnóstico e diagnóstico específico
- [x] Tempo de seguimento em anos
- [x] Busca global (Nome, CPF, ID)
- [x] Filtros avançados:
  - [x] Por nome (busca parcial)
  - [x] Por CPF
  - [x] Por convênio (dropdown)
  - [x] Por diagnóstico
  - [x] Por status (Ativo/Óbito/Perda)
  - [x] Por data de inclusão (período)
  - [x] Por idade
  - [x] Por cidade e UF
- [x] Ordenação por coluna (clique no cabeçalho)
- [x] Paginação (20, 50, 100 por página)
- [x] Contador de resultados
- [x] Botão "Limpar Filtros"
- [x] Edição de pacientes (modal com abas)
- [x] Exclusão lógica (soft delete)
- [x] Restauração de pacientes excluídos
- [x] Merge de pacientes duplicados
- [x] Busca rápida de pacientes
- [x] Registro de últimos acessados (10 mais recentes)
- [x] Inativação de pacientes sem atendimento
- [x] Notificação de pacientes inativos
- [x] Verificação de CPF duplicado
- [x] Relatório de pacientes
- [x] Relatório de duplicados

### 📋 Gestão de Atendimentos
- [x] CRUD completo de atendimentos
- [x] Formulário completo de cadastro (26+ campos)
- [x] ID automático sequencial (formato: YYYYNNNN)
- [x] Vínculo com paciente
- [x] Tipos de atendimento (Consulta, Visita Internado, Cirurgia, etc.)
- [x] Locais de atendimento (HMV, Consultório, etc.)
- [x] Convênio e plano
- [x] Códigos CBHPM
- [x] Campos de faturamento:
  - [x] Pagamento efetivado
  - [x] Pagamento postergado
  - [x] Data de envio ao faturamento
  - [x] Data esperada de pagamento
  - [x] Faturamento previsto
  - [x] Registro manual de valor HM
  - [x] Faturamento previsto final
  - [x] Data de pagamento
  - [x] Nota fiscal correspondente
  - [x] Faturamento Letícia
  - [x] Faturamento AG/LU
- [x] Campos calculados (mês, ano, trimestre)
- [x] Busca global (ID, Paciente, Procedimento)
- [x] Filtros avançados:
  - [x] Por tipo de atendimento
  - [x] Por local
  - [x] Por convênio
  - [x] Por data (período)
  - [x] Por status de pagamento
- [x] Ordenação por coluna
- [x] Paginação (20, 50, 100 por página)
- [x] Contador de resultados
- [x] Botão "Limpar Filtros"
- [x] Edição de atendimentos
- [x] Exclusão lógica (soft delete)
- [x] Restauração de atendimentos excluídos
- [x] Relatórios de atendimentos

### 📊 Dashboard e Métricas
- [x] Dashboard customizável com métricas em tempo real
- [x] Configuração de widgets do dashboard
- [x] **Métricas de Pacientes:**
  - [x] Total de pacientes ativos
  - [x] Novos pacientes por período
  - [x] Distribuição por sexo
  - [x] Faixa etária
  - [x] Distribuição por cidade
  - [x] Distribuição por CEP
  - [x] Mapa de calor por geolocalização
  - [x] Taxa de retenção
  - [x] Tempo médio de acompanhamento
  - [x] Pacientes inativos
  - [x] Óbitos
  - [x] Distribuição por convênio
- [x] **Métricas de Atendimentos:**
  - [x] Total de atendimentos por período
  - [x] Evolução temporal
  - [x] Por tipo de atendimento
  - [x] Por local
  - [x] Por convênio
  - [x] Média diária
  - [x] Distribuição por dia da semana
  - [x] Novos vs Retorno
  - [x] Procedimentos mais realizados
- [x] **Métricas Financeiras:**
  - [x] Faturamento total
  - [x] Evolução do faturamento
  - [x] Faturamento por convênio
  - [x] Ticket médio
  - [x] Taxa de recebimento
  - [x] Glosas
  - [x] Inadimplência
  - [x] Faturamento por tipo
  - [x] Previsão de recebimento
  - [x] Comparativo mensal
- [x] **Métricas de Qualidade:**
  - [x] Diagnósticos mais frequentes
  - [x] Taxa de retorno
- [x] **Diversos:**
  - [x] Próximos atendimentos
  - [x] Aniversariantes
  - [x] Alertas pendentes
- [x] Geocodificação de CEPs
- [x] Job de geocodificação em lote

### 📅 Sistema de Agenda
- [x] Tabela de agendamentos completa
- [x] Página de agenda dedicada
- [x] Tipos de compromisso (Consulta, Cirurgia, Visita internado, Procedimento, Exame, Reunião, Bloqueio)
- [x] Status de agendamento (Agendado, Confirmado, Aguardando, Em atendimento, Realizado, Cancelado, Reagendado, Faltou)
- [x] ID automático (formato: AG-YYYY-NNNNN)
- [x] Vínculo com paciente
- [x] Data/hora início e fim
- [x] Local do atendimento
- [x] Título e descrição
- [x] Reagendamento com preservação do histórico
- [x] Cancelamento com motivo
- [x] Confirmação de agendamento
- [x] Marcação de realizado
- [x] Marcação de falta
- [x] Vínculo com atendimento (quando realizado)
- [x] Histórico de alterações do agendamento
- [x] Criação de paciente durante agendamento
- [x] Vinculação de agendamento a paciente
- [x] Listagem de agendamentos pendentes de vinculação
- [x] Sincronização com Google Calendar (exportação)
- [x] Atualização de UID do Google Calendar
- [x] Listagem de agendamentos não sincronizados

### 📝 Prontuário Médico Eletrônico (PME)
- [x] Página de prontuário dedicada
- [x] Prontuário completo por paciente
- [x] **Resumo Clínico:**
  - [x] História clínica
  - [x] Antecedentes pessoais
  - [x] Antecedentes familiares
  - [x] Hábitos (tabagismo, etilismo, etc.)
  - [x] Informações obstétricas
  - [x] Dados antropométricos atuais
- [x] **Problemas Ativos:**
  - [x] Lista de problemas com CID-10
  - [x] Data de início e resolução
  - [x] Status ativo/inativo
  - [x] CRUD completo
- [x] **Alergias:**
  - [x] Tipo (Medicamento, Alimento, Ambiental, Outro)
  - [x] Substância
  - [x] Reação
  - [x] Gravidade (Leve, Moderada, Grave)
  - [x] Confirmação
  - [x] CRUD completo
- [x] **Medicamentos em Uso:**
  - [x] Medicamento e princípio ativo
  - [x] Dosagem e posologia
  - [x] Via de administração
  - [x] Período de uso
  - [x] Motivo e prescritor
  - [x] Status ativo/inativo
  - [x] CRUD completo
- [x] **Evoluções Clínicas:**
  - [x] Formato SOAP (Subjetivo, Objetivo, Avaliação, Plano)
  - [x] Tipo (Consulta, Retorno, Urgência, Teleconsulta, Parecer)
  - [x] Sinais vitais (PA, FC, Temperatura, Peso, Altura, IMC)
  - [x] Vínculo com atendimento e agendamento
  - [x] Profissional responsável
  - [x] Status de assinatura (rascunho, pendente, assinado)
  - [x] Encerramento de atendimento
  - [x] CRUD completo
  - [x] Evolução do IMC (gráfico histórico)
- [x] **Internações:**
  - [x] Hospital, setor, leito
  - [x] Data de admissão e alta
  - [x] Motivo e diagnóstico de internação
  - [x] Diagnóstico e tipo de alta
  - [x] Resumo e complicações
  - [x] CRUD completo
- [x] **Cirurgias:**
  - [x] Procedimento e códigos CBHPM
  - [x] Hospital e sala operatória
  - [x] Equipe cirúrgica
  - [x] Anestesista e tipo de anestesia
  - [x] Indicação e descrição cirúrgica
  - [x] Achados e complicações
  - [x] Duração e sangramento
  - [x] Status (Agendada, Realizada, Cancelada, Adiada)
  - [x] Vínculo com internação
  - [x] CRUD completo
- [x] **Exames Laboratoriais:**
  - [x] Data de coleta e resultado
  - [x] Laboratório
  - [x] Tipo e nome do exame
  - [x] Resultado, valor de referência, unidade
  - [x] Flag de alterado
  - [x] Arquivo do laudo
  - [x] CRUD completo
- [x] **Exames de Imagem:**
  - [x] Tipos (Raio-X, Tomografia, Ressonância, Ultrassonografia, Mamografia, Densitometria, PET-CT, Cintilografia)
  - [x] Região anatômica
  - [x] Clínica/serviço
  - [x] Médico solicitante e laudador
  - [x] Indicação, laudo, conclusão
  - [x] Arquivos (laudo e imagem)
  - [x] CRUD completo
- [x] **Endoscopias:**
  - [x] Tipos (EDA, Colonoscopia, Retossigmoidoscopia, CPRE, Ecoendoscopia, Enteroscopia)
  - [x] Clínica e médico executor
  - [x] Preparo e sedação
  - [x] Descrição e conclusão
  - [x] Biópsia (local e resultado)
  - [x] Arquivos
  - [x] CRUD completo
- [x] **Cardiologia:**
  - [x] Tipos (ECG, Ecocardiograma, Teste Ergométrico, Holter, MAPA, Cintilografia, Cateterismo, Angiotomografia)
  - [x] Dados específicos do ecocardiograma (FEVE, DDVE, DSVE, AE)
  - [x] Indicação, descrição, conclusão
  - [x] Arquivos
  - [x] CRUD completo
- [x] **Terapias e Infusões:**
  - [x] Tipos (Quimioterapia, Imunoterapia, Terapia Alvo, Imunobiológico, Infusão, Transfusão)
  - [x] Protocolo, ciclo, dia
  - [x] Medicamentos
  - [x] Local
  - [x] Pré-quimio, intercorrências, observações
  - [x] CRUD completo
- [x] **Obstetrícia:**
  - [x] Tipos (Pré-natal, Parto, Puerpério, Aborto)
  - [x] Dados de pré-natal (DUM, DPP, IG)
  - [x] Dados do parto (tipo, data, hospital)
  - [x] Dados do RN (peso, Apgar, sexo)
  - [x] CRUD completo
- [x] **Documentos Médicos:**
  - [x] Tipos (Receita, Receita Especial, Solicitação de Exames, Atestados, Laudos, Relatórios, Protocolos, Guias)
  - [x] Conteúdo do documento
  - [x] Campos específicos por tipo
  - [x] Profissional e CRM
  - [x] Assinatura digital (status, data, assinante)
  - [x] Arquivo gerado
  - [x] CRUD completo
- [x] **Histórico de Medidas Antropométricas:**
  - [x] Peso, altura, IMC
  - [x] Pressão arterial (sistólica/diastólica)
  - [x] Frequência cardíaca
  - [x] Temperatura
  - [x] Saturação (SpO2)
  - [x] Observações
  - [x] Registro de quem inseriu
- [x] Contagem de documentos pendentes de assinatura
- [x] Listagem de documentos pendentes de assinatura

### 📄 Documentos Externos e OCR
- [x] Upload de documentos externos
- [x] Extração de texto via OCR (LLM)
- [x] Vínculo com evolução, internação ou cirurgia
- [x] Listagem de documentos externos
- [x] Atualização de OCR

### 🔬 Patologia
- [x] CRUD completo de laudos de patologia
- [x] Listagem e visualização

### 🧪 Resultados Laboratoriais
- [x] Listagem de resultados
- [x] Listagem por exame
- [x] Fluxograma de resultados
- [x] Extração de resultados de PDF
- [x] Exclusão por documento
- [x] Geração de relatório PDF de exames

### ⭐ Exames Favoritos
- [x] Página dedicada de exames favoritos
- [x] Adicionar/remover favoritos
- [x] Ordenação de favoritos
- [x] Extração de exame do documento

### 🔬 Exames Padronizados
- [x] Listagem de exames padronizados
- [x] Criação de novos exames padronizados

### 📤 Extração de Exames (IA)
- [x] Página dedicada de extração de exames
- [x] Processamento de PDFs com IA
- [x] Salvamento de dados extraídos no banco
- [x] Listagem de exames extraídos
- [x] Pré-processamento de documentos

### 🔔 Notificações
- [x] Página de notificações
- [x] Listagem de notificações
- [x] Listagem de pacientes aguardando

### 📊 Auditoria e Rastreabilidade
- [x] Tabela de log de auditoria completa
- [x] Registro de ações (CREATE, UPDATE, DELETE, RESTORE, VIEW, EXPORT, LOGIN, LOGOUT, AUTHORIZE, REVOKE)
- [x] Tipos de entidade (paciente, atendimento, user, prontuario, documento, autorizacao, tenant, session)
- [x] Valores antigos e novos
- [x] Campos alterados
- [x] IP e User Agent
- [x] Listagem de logs de auditoria

### 🏢 Multi-Tenant e Administração
- [x] Tabela de tenants completa
- [x] Planos (free, basic, professional, enterprise)
- [x] Status (ativo, inativo, suspenso)
- [x] Limites (max usuários, max pacientes)
- [x] CRUD de tenants
- [x] Página de administração de tenants
- [x] Estatísticas por tenant
- [x] Listagem de usuários por tenant
- [x] Ativação/desativação de tenant
- [x] Seleção de tenant ativo
- [x] Listagem de tenants do usuário

### 🔗 Compartilhamento Cross-Tenant (LGPD)
- [x] Página dedicada de autorizações cross-tenant
- [x] Tabela de autorizações de pacientes
- [x] Tipos de autorização (leitura, escrita, completo)
- [x] Escopo de autorização (prontuario, atendimentos, exames, documentos, completo)
- [x] Período de validade
- [x] Consentimento LGPD
- [x] Status (pendente, ativa, revogada, expirada, rejeitada)
- [x] Solicitação de autorização
- [x] Aprovação/rejeição de autorização
- [x] Revogação de autorização
- [x] Listagem de autorizações concedidas e recebidas
- [x] Acesso ao prontuário cross-tenant
- [x] Acesso aos atendimentos cross-tenant
- [x] Logs de acesso cross-tenant
- [x] Estatísticas de compartilhamento
- [x] Alertas de autorizações expirando
- [x] Atualização de autorizações expiradas

### 👤 Perfis de Usuário
- [x] Perfil do usuário logado
- [x] Listagem de perfis disponíveis
- [x] Seleção de perfil ativo
- [x] Atualização de perfil
- [x] Listagem de perfis
- [x] Upsert de perfil
- [x] Vínculos entre usuários
- [x] Especialidades médicas
- [x] Listagem de médicos disponíveis

### ⚙️ Configurações
- [x] Página de configurações
- [x] Get/Set/Delete de configurações
- [x] Configurações de backup

### 📈 Performance e Monitoramento
- [x] Página de performance (admin)
- [x] Visão geral de métricas
- [x] Métricas por endpoint
- [x] Histórico de tempo de resposta
- [x] Sistema de alertas
- [x] Configuração de alertas
- [x] Acknowledge de alertas
- [x] Exportação CSV de métricas
- [x] Histórico de memória
- [x] Diagnóstico de problemas
- [x] Investigação e correção automática
- [x] Execução de ações corretivas
- [x] Histórico de auto-healing
- [x] Estatísticas de auto-healing
- [x] Configuração de auto-healing

---

## 🚧 FUNCIONALIDADES PENDENTES

### Exportação de Dados
- [ ] Botão "Exportar para Excel" em Pacientes
- [ ] Botão "Exportar para Excel" em Atendimentos
- [ ] Exportar apenas registros filtrados
- [ ] Formatação profissional (cabeçalhos, larguras, máscaras)
- [ ] Nome de arquivo com data

### Integração de Tabelas Auxiliares
- [ ] Tabela CBHPM completa com dropdown no formulário
- [ ] Tabela de honorários por convênio
- [ ] Cálculo automático de valores por procedimento + convênio

### Importação de Dados Reais ✅ CONCLUÍDO
- [x] Script de importação em massa
- [x] Mapeamento de campos (banco antigo → Gorgen)
- [x] Validação e limpeza de dados
- [x] Importação dos 21.000+ pacientes reais
- [x] Importação de atendimentos históricos
- [x] Relatório de importação

### Produção Automatizada de Guias
- [ ] Templates de guias por convênio
- [ ] Geração automática de PDF
- [ ] Preenchimento automático de dados
- [ ] Numeração sequencial de guias
- [ ] Armazenamento no histórico do atendimento

### Portal do Paciente
- [ ] Sistema de registro de pacientes
- [ ] Login separado para pacientes
- [ ] Perfil com dados básicos
- [ ] Autogestão de dados pessoais
- [ ] Upload de exames pelo paciente
- [ ] Visualização de histórico de atendimentos
- [ ] Agendamento online

### Marketing Médico
- [ ] Análise de dados demográficos
- [ ] Segmentação de público
- [ ] Campanhas personalizadas

### Sincronização Bidirecional Google Calendar
- [ ] Importação de eventos do Google Calendar
- [ ] Sincronização contínua bidirecional

---

## 📝 Notas Técnicas

### Stack Tecnológico
- **Frontend:** React 19 + TypeScript + Tailwind CSS 4 + shadcn/ui
- **Backend:** Express 4 + tRPC 11 + Drizzle ORM
- **Banco de Dados:** MySQL/TiDB
- **Autenticação:** Manus OAuth + Login local com bcrypt
- **Storage:** S3 para arquivos
- **IA:** LLM para OCR e extração de dados

### Pilares Fundamentais
1. **Imutabilidade e Preservação Histórica** - Dados são perpétuos, soft delete
2. **Sigilo e Confidencialidade Absoluta** - Criptografia AES-256, LGPD
3. **Rastreabilidade Completa** - Logs de auditoria para todas as ações
4. **Simplicidade com Profundidade sob Demanda** - Interface limpa, detalhes acessíveis
5. **Controle de Acesso Baseado em Perfis** - Roles e permissões
6. **Automação e Eliminação de Duplo Trabalho** - Preenchimento automático

### Critérios de Performance
- Busca em < 3 segundos com 21.000+ registros
- Cadastro de paciente em < 2 minutos
- Registro de atendimento em < 1 minuto

---

*Documento gerado automaticamente em 30/01/2026*
