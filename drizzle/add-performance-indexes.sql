-- =====================================================
-- ÍNDICES DE PERFORMANCE - GORGEN 3.9.35
-- =====================================================
-- Este script adiciona índices para otimizar as queries mais frequentes
-- Executar via: pnpm db:push ou manualmente no banco

-- =====================================================
-- TABELA: evolucoes
-- Queries frequentes: listEvolucoes (por pacienteId, ordenado por data)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_evolucoes_paciente_data 
ON evolucoes (paciente_id, data_evolucao DESC);

CREATE INDEX IF NOT EXISTS idx_evolucoes_tenant_paciente 
ON evolucoes (tenant_id, paciente_id);

-- =====================================================
-- TABELA: agendamentos
-- Queries frequentes: getAgendamentos (por data, status, paciente)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_status 
ON agendamentos (data_hora_inicio, status);

CREATE INDEX IF NOT EXISTS idx_agendamentos_tenant_data 
ON agendamentos (tenant_id, data_hora_inicio);

CREATE INDEX IF NOT EXISTS idx_agendamentos_paciente 
ON agendamentos (paciente_id);

CREATE INDEX IF NOT EXISTS idx_agendamentos_google_uid 
ON agendamentos (google_uid);

-- =====================================================
-- TABELA: resultados_laboratoriais
-- Queries frequentes: getFluxogramaLaboratorial (por paciente, ordenado por data)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_resultados_lab_paciente_data 
ON resultados_laboratoriais (paciente_id, data_coleta DESC);

CREATE INDEX IF NOT EXISTS idx_resultados_lab_paciente_exame 
ON resultados_laboratoriais (paciente_id, nome_exame_original);

-- =====================================================
-- TABELA: documentos_medicos
-- Queries frequentes: listDocumentosMedicos (por paciente, tipo)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_docs_medicos_paciente_tipo 
ON documentos_medicos (paciente_id, tipo);

CREATE INDEX IF NOT EXISTS idx_docs_medicos_paciente_data 
ON documentos_medicos (paciente_id, data_emissao DESC);

-- =====================================================
-- TABELA: user_profiles
-- Queries frequentes: getUserProfile (por userId)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id 
ON user_profiles (user_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant 
ON user_profiles (tenant_id);

-- =====================================================
-- TABELA: user_settings
-- Queries frequentes: getUserSettings (por userProfileId, categoria)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_settings_profile_cat 
ON user_settings (user_profile_id, categoria);

-- =====================================================
-- TABELA: vinculo_secretaria_medico
-- Queries frequentes: getMedicosVinculados, getSecretariasVinculadas
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_vinculo_secretaria 
ON vinculo_secretaria_medico (secretaria_user_id, status);

CREATE INDEX IF NOT EXISTS idx_vinculo_medico 
ON vinculo_secretaria_medico (medico_user_id, status);

-- =====================================================
-- TABELA: historico_medidas
-- Queries frequentes: getHistoricoMedidas (por paciente, ordenado por data)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_historico_medidas_paciente_data 
ON historico_medidas (paciente_id, data_medicao DESC);

-- =====================================================
-- TABELA: audit_log
-- Queries frequentes: listAuditLog (por entityType, userId)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_audit_log_entity 
ON audit_log (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_audit_log_user 
ON audit_log (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_date 
ON audit_log (tenant_id, created_at DESC);
