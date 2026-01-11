# 📦 Guia de Migração de Pacientes - Gorgen

## Visão Geral

Este guia descreve como executar a migração dos 21.644 pacientes da planilha Excel para o banco de dados do Gorgen.

---

## Pré-requisitos

1. **Arquivo de entrada**: `/home/ubuntu/consultorio_poc/data/22kpacientes.xlsx`
2. **Variáveis de ambiente** configuradas (conexão com banco)
3. **Python 3.11+** com dependências instaladas

---

## Scripts Disponíveis

### Script Python (Recomendado)

```bash
# Localização
scripts/migrate_patients.py

# Dependências
pip3 install pandas mysql-connector-python openpyxl
```

### Script Node.js (Alternativo)

```bash
# Localização
scripts/migrate-patients.mjs

# Dependências
pnpm add xlsx mysql2
```

---

## Como Executar

### 1. Teste de Simulação (Dry-Run)

Sempre execute primeiro em modo simulação para validar os dados:

```bash
# Testar com 1000 registros
python3 scripts/migrate_patients.py --dry-run --limit=1000

# Testar todos os registros
python3 scripts/migrate_patients.py --dry-run
```

**Saída esperada:**
```
📊 RESUMO DA MIGRAÇÃO
   Total de registros: 21,644
   Processados: 21,644
   Inseridos: 21,644
   Ignorados: 0
   Warnings: 3
```

### 2. Migração Piloto (1000 pacientes)

Após validar o dry-run, execute uma migração piloto:

```bash
python3 scripts/migrate_patients.py --limit=1000
```

Verifique no sistema:
- Acesse a página de Pacientes
- Confirme que os dados aparecem corretamente
- Teste a busca e filtros

### 3. Migração Completa

Se o piloto foi bem-sucedido:

```bash
python3 scripts/migrate_patients.py
```

**Tempo estimado:** ~2-3 minutos para 21.644 registros

---

## Opções do Script

| Opção | Descrição | Exemplo |
|-------|-----------|---------|
| `--dry-run` | Simula sem inserir dados | `--dry-run` |
| `--limit=N` | Limita a N registros | `--limit=1000` |
| `--batch=N` | Tamanho do lote (default: 500) | `--batch=1000` |

---

## Validações Realizadas

O script executa as seguintes validações automaticamente:

### Datas de Nascimento
- Range válido: 1900-2025
- Datas fora do range são ignoradas (campo fica vazio)

### CPF
- Valida 11 dígitos
- Remove formatação
- Rejeita CPFs com todos dígitos iguais
- Formata como XXX.XXX.XXX-XX

### Email
- Converte para lowercase
- Remove espaços
- Valida formato básico (regex)

### IDs Duplicados
- Detecta IDs repetidos na planilha
- Adiciona sufixo `-DUP-N` para evitar conflitos

### Convênios
- Mapeia nomes para padrão do Gorgen
- Normaliza variações (ex: IPE-SAUDE → IPE)

---

## Relatório de Migração

Após a execução, um relatório JSON é gerado:

```
/home/ubuntu/consultorio_poc/data/migration_report.json
```

Conteúdo:
```json
{
  "total": 21644,
  "processed": 21644,
  "inserted": 21644,
  "skipped": 0,
  "warnings": [
    "Datas de nascimento inválidas: 1",
    "CPFs inválidos: 8",
    "IDs duplicados tratados: 21"
  ],
  "start_time": "2026-01-11T00:00:00",
  "end_time": "2026-01-11T00:02:00"
}
```

---

## Mapeamento de Campos

| Campo Planilha | Campo Gorgen | Transformação |
|----------------|--------------|---------------|
| ID paciente | id_paciente | Direto |
| ID paciente | codigo_legado | Cópia (referência) |
| Nome | nome | Trim |
| Data nascimento | data_nascimento | Validação + formato |
| Sexo | sexo | M/F/Outro |
| CPF | cpf | Validação + formato |
| E-mail | email | Lowercase + validação |
| Telefone | telefone | Trim |
| Endereço | endereco | Trim |
| Bairro | bairro | Trim |
| CEP | cep | Formato XXXXX-XXX |
| Cidade | cidade | Trim |
| UF | uf | Uppercase |
| Pais | pais | Default: Brasil |
| Operadora 1 | operadora_1 | Mapeamento |
| Vigente 1 | vigente_1 | Sim/Não |
| Obito / Perda | obito_perda | Sim/Não |
| Status do caso | status_caso | Default: Ativo |

---

## Troubleshooting

### Erro: "No module named 'mysql'"
```bash
sudo pip3 install mysql-connector-python
```

### Erro: "Access denied for user"
Verifique as variáveis de ambiente:
```bash
export DB_HOST=...
export DB_USER=...
export DB_PASSWORD=...
export DB_NAME=...
```

### Erro: "Duplicate entry"
O script já trata duplicatas automaticamente. Se persistir:
1. Verifique se já existe migração anterior
2. Limpe a tabela ou use `--skip=N`

### Performance lenta
Aumente o batch size:
```bash
python3 scripts/migrate_patients.py --batch=1000
```

---

## Pós-Migração

### Verificações Recomendadas

1. **Contagem total**
   ```sql
   SELECT COUNT(*) FROM pacientes WHERE tenant_id = 1;
   -- Esperado: 21.644
   ```

2. **Verificar convênios**
   ```sql
   SELECT operadora_1, COUNT(*) 
   FROM pacientes 
   GROUP BY operadora_1 
   ORDER BY COUNT(*) DESC;
   ```

3. **Verificar cidades**
   ```sql
   SELECT cidade, COUNT(*) 
   FROM pacientes 
   GROUP BY cidade 
   ORDER BY COUNT(*) DESC 
   LIMIT 10;
   ```

### Backup

Antes de executar a migração em produção, faça backup:
```sql
CREATE TABLE pacientes_backup AS SELECT * FROM pacientes;
```

---

## Suporte

Em caso de problemas, consulte:
- Relatório de migração: `data/migration_report.json`
- Logs do script no terminal
- Documentação do sistema: `docs/`

---

*Documento gerado em: 11/01/2026*
*Sistema: Gorgen v4.1*
