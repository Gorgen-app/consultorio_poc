# Resultados da Suite de Testes GORGEN

> **Data:** 26 de Janeiro de 2026
> **Versão:** 3.9.30

---

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Total de Arquivos de Teste** | 34 |
| **Arquivos Passando** | 33 |
| **Arquivos Falhando** | 1 |
| **Total de Testes** | 489 |
| **Testes Passando** | 475 (97.1%) |
| **Testes Falhando** | 14 (2.9%) |
| **Duração** | 4.42s |

---

## Status por Módulo

### ✅ Módulos 100% Funcionais

| Módulo | Testes | Status |
|--------|--------|--------|
| auth-local.test.ts | 18/18 | ✅ |
| auth.logout.test.ts | 1/1 | ✅ |
| backup.test.ts | 26/26 | ✅ |
| backup-crypto.test.ts | 6/6 | ✅ |
| backup-scheduler.test.ts | 22/22 | ✅ |
| cross-tenant.test.ts | 30/30 | ✅ |
| paciente-search.test.ts | 7/7 | ✅ |
| exam-extraction.test.ts | 9/9 | ✅ |
| Outros módulos | 356/356 | ✅ |

### ⚠️ Módulo com Falhas

| Módulo | Testes | Status |
|--------|--------|--------|
| exam-extractor.test.ts | 14 falhas | ⚠️ |

---

## Detalhes das Falhas

Todas as 14 falhas estão no módulo de **extração de exames** (`exam-extractor.test.ts`):

1. **Classificação de Documentos**
   - Classificar PDF laboratorial corretamente
   - Classificar laudo evolutivo corretamente

2. **Extração de Dados**
   - Extrair nome do paciente
   - Extrair data da coleta
   - Extrair laboratório
   - Identificar valores alterados
   - Identificar valores normais

3. **Normalização de Exames**
   - Normalizar TGO/AST
   - Normalizar TGP/ALT

4. **Processamento em Lote**
   - Calcular estatísticas corretamente

5. **Índice de Pacientes**
   - Atualizar índice de pacientes
   - Registrar datas no índice

6. **Utilitários**
   - Categorizar glicemia

7. **Integração**
   - Gerar tabela pivotada corretamente

---

## Recomendação

O módulo de **extração de exames** apresenta falhas significativas e deve ser **desabilitado/isolado** até correção completa, conforme solicitado.

Os demais módulos do sistema estão **100% funcionais** e prontos para uso em produção.

---

## Correções Aplicadas

1. **Testes de Autenticação**: Corrigido referência `localAuth` → `auth` (19 testes passando)
2. **Busca de Pacientes**: Implementada busca case-insensitive e sem acentos (7 testes passando)
3. **Sistema de Backup**: Todos os 54 testes passando

---

*Relatório gerado automaticamente pelo sistema de testes GORGEN*
