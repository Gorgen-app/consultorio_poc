# 📊 Plano de Migração - 22k Pacientes para Gorgen

## Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Total de registros** | 21.644 pacientes |
| **IDs únicos** | 21.623 (21 duplicatas) |
| **Taxa média de preenchimento** | ~70% |
| **Convênios identificados** | 34 operadoras |
| **Principal região** | RS (98.8%) |

---

## 1. Análise de Qualidade dos Dados

### ✅ Campos com BOA qualidade (>80% preenchido)

| Campo Origem | Preenchimento | Observação |
|--------------|---------------|------------|
| ID paciente | 100% | 21 duplicatas a tratar |
| Nome | 100% | Todos únicos ✓ |
| Data nascimento | 81.3% | Algumas datas inválidas (1900, 2087) |
| Sexo | 81.3% | F: 11.368 / M: 6.235 |
| E-mail | 81.3% | 1.290 duplicatas |
| CEP | 98.7% | Excelente cobertura |
| Cidade | 81.2% | 324 cidades |
| UF | 81.2% | 21 estados |
| Operadora 1 | 81.9% | 34 convênios |

### ⚠️ Campos com qualidade MÉDIA (20-80%)

| Campo Origem | Preenchimento | Ação Recomendada |
|--------------|---------------|------------------|
| Bairro | 70.7% | Importar como está |
| Endereço | 81.2% | Importar como está |

### ❌ Campos com qualidade BAIXA (<20%)

| Campo Origem | Preenchimento | Ação Recomendada |
|--------------|---------------|------------------|
| CPF | 0.6% (133) | Deixar em branco, coletar depois |
| Telefone | 0.0% (5) | Deixar em branco |
| Nome da mãe | 0.0% (5) | Deixar em branco |
| Matrícula convênio | 0.6% | Deixar em branco |

---

## 2. Mapeamento de Campos

### Planilha → Gorgen

| Campo Planilha | Campo Gorgen | Transformação |
|----------------|--------------|---------------|
| `ID paciente` | `codigoLegado` | Direto (novo campo) |
| `Nome` | `nome` | Direto |
| `Data nascimento` | `dataNascimento` | Converter para timestamp |
| `Sexo` | `sexo` | M→Masculino, F→Feminino |
| `CPF` | `cpf` | Limpar formatação |
| `E-mail` | `email` | Lowercase, trim |
| `Telefone` | `telefone` | Formatar padrão |
| `Endereço` | `endereco` | Direto |
| `Bairro` | `bairro` | Direto |
| `CEP` | `cep` | Remover hífen |
| `Cidade` | `cidade` | Direto |
| `UF` | `estado` | Direto |
| `Pais` | `pais` | Direto (default: Brasil) |
| `Operadora 1` | `convenio` | Mapear para tabela de convênios |
| `Matricula convênio 1` | `numeroCarteirinha` | Direto |
| `Vigente 1` | `convenioAtivo` | Boolean |

### Campos Gorgen sem correspondência (serão vazios)

- `rg`, `orgaoEmissor`
- `estadoCivil`
- `profissao`
- `naturalidade`
- `nomePai`
- `telefone2`, `telefone3`
- `observacoes`
- `alergias`, `medicamentosEmUso`
- `tipoSanguineo`

---

## 3. Problemas Identificados e Soluções

### 🔴 Problema 1: IDs Duplicados (21 casos)

**Causa provável:** Pacientes cadastrados mais de uma vez.

**Solução:**
1. Identificar registros duplicados
2. Mesclar dados (manter o mais completo)
3. Gerar novo ID único no Gorgen

### 🔴 Problema 2: Datas Inválidas

**Exemplos encontrados:**
- Data mínima: 1900-01-02 (improvável)
- Data máxima: 2087-07-13 (erro de digitação)

**Solução:**
1. Validar range: 1900-2025
2. Datas fora do range → deixar em branco
3. Gerar relatório de inconsistências

### 🟡 Problema 3: E-mails Duplicados (1.290 casos)

**Causa provável:** Familiares compartilhando e-mail.

**Solução:**
1. Permitir e-mails duplicados no Gorgen
2. Adicionar flag "email_compartilhado"
3. Não usar e-mail como identificador único

### 🟡 Problema 4: CPF quase vazio (0.6%)

**Solução:**
1. Importar os 133 CPFs existentes
2. Demais pacientes → CPF em branco
3. Coletar CPF gradualmente nos atendimentos

### 🟢 Problema 5: Convênios não padronizados

**Convênios encontrados (34):**
- UNIMED (9.779)
- Particular (2.169)
- IPE (1.687)
- BRADESCO SAÚDE (733)
- CASSI (732)
- ... e mais 29

**Solução:**
1. Criar tabela de convênios no Gorgen
2. Mapear nomes da planilha → IDs do Gorgen
3. Tratar variações (IPE vs IPE-SAUDE)

---

## 4. Plano de Execução

### Fase 1: Preparação (2 dias)

- [ ] Criar campo `codigoLegado` no schema
- [ ] Criar tabela de convênios
- [ ] Desenvolver script de migração
- [ ] Criar ambiente de homologação

### Fase 2: Limpeza de Dados (2 dias)

- [ ] Tratar IDs duplicados
- [ ] Validar e corrigir datas
- [ ] Normalizar e-mails (lowercase)
- [ ] Mapear convênios

### Fase 3: Migração Piloto (1 dia)

- [ ] Importar 1.000 pacientes (amostra)
- [ ] Validar integridade
- [ ] Testar busca e filtros
- [ ] Corrigir problemas encontrados

### Fase 4: Migração Completa (1 dia)

- [ ] Importar todos os 21.644 pacientes
- [ ] Gerar relatório de importação
- [ ] Validar contagens

### Fase 5: Validação (2 dias)

- [ ] Comparar totais origem vs destino
- [ ] Testar busca por nome, e-mail, cidade
- [ ] Validar convênios
- [ ] Homologação com usuário

---

## 5. Cronograma Estimado

| Fase | Duração | Início | Fim |
|------|---------|--------|-----|
| Preparação | 2 dias | D+0 | D+2 |
| Limpeza | 2 dias | D+2 | D+4 |
| Piloto | 1 dia | D+4 | D+5 |
| Migração | 1 dia | D+5 | D+6 |
| Validação | 2 dias | D+6 | D+8 |
| **Total** | **8 dias úteis** | | |

---

## 6. Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Dados corrompidos | Baixa | Alto | Backup antes da migração |
| Performance lenta | Média | Médio | Índices otimizados |
| Duplicatas não detectadas | Média | Baixo | Validação pós-migração |
| Convênios não mapeados | Baixa | Baixo | Categoria "Outros" |

---

## 7. Próximos Passos

1. **Aprovar este plano** com Dr. André
2. **Criar campo codigoLegado** no schema do Gorgen
3. **Desenvolver script de migração** em Python/TypeScript
4. **Executar piloto** com 1.000 pacientes
5. **Validar e ajustar** conforme necessário
6. **Migração completa** após aprovação

---

*Documento gerado em: 11/01/2026*
*Sistema: Gorgen v4.1*
