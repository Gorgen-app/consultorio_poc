# Relatório de Erros TypeScript - GORGEN v3.9.13

**Data:** 19/01/2026  
**Total de Erros:** 79

---

## Resumo por Tipo de Erro

| Código | Descrição | Quantidade |
|--------|-----------|------------|
| TS2322 | Type 'X' is not assignable to type 'Y' | 39 |
| TS2769 | No overload matches this call | 29 |
| TS2345 | Argument of type 'X' is not assignable to parameter of type 'Y' | 5 |
| TS2365 | Operator cannot be applied to types | 2 |
| TS2741 | Property is missing in type | 1 |
| TS2367 | Comparison appears to be unintentional | 1 |
| TS2358 | The left-hand side of an 'instanceof' expression must be of type 'any' | 1 |
| TS2339 | Property does not exist on type | 1 |

---

## Resumo por Arquivo

| Arquivo | Erros |
|---------|-------|
| server/db.ts | 42 |
| server/backup.ts | 22 |
| server/routers.ts | 3 |
| client/src/pages/BackupSettings.tsx | 3 |
| server/_core/sdk.ts | 2 |
| server/_core/oauth.ts | 1 |
| server/_core/tenantContext.ts | 1 |
| server/backup-scheduler.ts | 1 |
| client/src/pages/Prontuario.tsx | 1 |

---

## Grupo 1: boolean vs number (13 erros)

**Causa:** O banco de dados MySQL armazena booleanos como TINYINT (0/1), mas o código TypeScript espera boolean.

### Arquivos Afetados:

**server/db.ts:**
- Linha 3167: `Type 'number | false' is not assignable to type 'boolean'`
- Linha 3452: `Type 'number | false' is not assignable to type 'boolean'`
- Linha 3475: `Type 'boolean' is not assignable to type 'number'`
- Linha 3478: `Type 'boolean' is not assignable to type 'number'`
- Linha 3481: `Type 'boolean' is not assignable to type 'number'`
- Linha 3744: `Type 'number' is not assignable to type 'boolean | null'`
- Linha 5114: `Type 'number' is not assignable to type 'boolean | SQL<unknown> | null | undefined'`

**server/backup.ts:**
- Linha 301: `Type 'true' is not assignable to type 'number | SQL<unknown> | null | undefined'`
- Linha 1418: `Type 'false' is not assignable to type 'number | SQL<unknown> | null | undefined'`
- Linha 1478: `Type 'true' is not assignable to type 'number | SQL<unknown> | null | undefined'`

**server/routers.ts:**
- Linha 2229: `isAdminMaster: boolean vs number`
- Linha 2232: `isAdminMaster: boolean vs number`
- Linha 3646: `backupEnabled: boolean vs number`

**client/src/pages/BackupSettings.tsx:**
- Linha 540: `Type 'number | true' is not assignable to type 'boolean | undefined'`
- Linha 657: `Type 'number | false' is not assignable to type 'boolean | undefined'`
- Linha 669: `Type 'number | true' is not assignable to type 'boolean | undefined'`

**server/backup-scheduler.ts:**
- Linha 121: `Comparison between 'number | null' and 'boolean'`

### Solução:
Converter valores ao ler/escrever no banco:
- Leitura: `Boolean(value)` ou `value === 1`
- Escrita: `value ? 1 : 0`

---

## Grupo 2: Date vs string (18 erros)

**Causa:** O Drizzle ORM retorna timestamps como strings, mas o código espera objetos Date.

### Arquivos Afetados:

**server/db.ts:**
- Linha 4030: `Type 'Date' is not assignable to type 'string | SQL<unknown> | null | undefined'`
- Linha 4675: `Type 'Date' is not assignable to type 'string | SQL<unknown> | null | undefined'`
- Linha 5081: `Type 'Date | null' is not assignable to type 'string | null | undefined'`
- Linha 3744 (2x): `Type 'string | null' is not assignable to type 'Date | null'`
- Linha 5158: `dataInicio: string vs Date`, `dataFim: string vs Date`

**server/backup.ts:**
- Linha 295: `Type 'Date' is not assignable to type 'string'`
- Linha 347: `Type 'Date' is not assignable to type 'string'`
- Linha 572: `Type 'Date' is not assignable to type 'string'`
- Linha 595: `Type 'Date' is not assignable to type 'string'`
- Linha 1263: `Type 'string' is not assignable to type 'Date'`
- Linha 1413: `Type 'Date' is not assignable to type 'string'`
- Linha 1472: `Type 'Date' is not assignable to type 'string'`
- Linha 1523: `Type 'Date' is not assignable to type 'string'`
- Linha 1809 (2x): `Operator '<=' cannot be applied to types 'string' and 'Date'`
- Linha 1848: `date: string vs Date`
- Linha 2153: `Type 'Date' is not assignable to type 'string'`
- Linha 2313: `backupDate: string vs Date`, `lastTestedAt: string vs Date`

**server/_core/sdk.ts:**
- Linha 282: `Type 'Date' is not assignable to type 'string'`
- Linha 297: `Type 'Date' is not assignable to type 'string'`

**server/_core/oauth.ts:**
- Linha 36: `Type 'Date' is not assignable to type 'string'`

### Solução:
- Leitura: `new Date(value)` para converter string em Date
- Escrita: `value.toISOString()` para converter Date em string
- Comparações: Converter ambos para o mesmo tipo antes de comparar

---

## Grupo 3: string | null vs string | undefined (8 erros)

**Causa:** Incompatibilidade entre campos nullable do banco (null) e parâmetros opcionais do TypeScript (undefined).

### Arquivos Afetados:

**server/db.ts:**
- Linha 232: `Type 'string | null' is not assignable to type 'string | undefined'`
- Linha 2099: `Type 'string | null' is not assignable to type 'string | SQL<unknown> | undefined'`
- Linha 4774: `Type 'string | null' is not assignable to type 'string | SQL<unknown> | undefined'`
- Linha 4841: `Type 'string | null' is not assignable to type 'string | SQL<unknown> | undefined'`

### Solução:
Usar operador nullish coalescing: `value ?? undefined`

---

## Grupo 4: No overload matches this call (29 erros)

**Causa:** Parâmetros passados para funções do Drizzle ORM não correspondem às assinaturas esperadas.

### Arquivos Afetados:

**server/db.ts:** Linhas 2071, 2156, 2248, 2249, 2276, 2277, 2356, 2359, 3892, 4133, 4309, 4487, 4655, 4656, 4680, 4799, 4802, 4976, 5003, 5027, 5150, 5153, 5219

**server/backup.ts:** Linhas 230, 502, 1367

**server/_core/tenantContext.ts:** Linha 176

### Solução:
Verificar cada chamada individualmente e ajustar os tipos dos parâmetros.

---

## Grupo 5: Argument type mismatch (5 erros)

**Causa:** Argumentos passados para funções não correspondem aos tipos esperados.

### Arquivos Afetados:

**server/db.ts:**
- Linha 4134: `Argument of type 'number | null' is not assignable to parameter of type 'number'`
- Linha 4216: `Argument of type 'number | null' is not assignable to parameter of type 'number'`

**server/routers.ts:**
- Linhas 2229, 2232, 3646: Tipos de propriedades incompatíveis

### Solução:
Adicionar verificações de null antes de passar argumentos ou usar valores padrão.

---

## Grupo 6: Outros Erros (3 erros)

**client/src/pages/Prontuario.tsx:**
- Linha 1438: `Property 'dataObitoLastFU' is missing in type`
  - **Solução:** Adicionar a propriedade ao tipo ou torná-la opcional

**server/db.ts:**
- Linha 5158: `permissao: string | null vs "visualizar" | "editar"`
  - **Solução:** Fazer cast ou validar o valor antes de retornar

---

## Plano de Correção Recomendado

### Dia 1: Erros boolean vs number (13 erros)
1. Criar funções helper para conversão boolean/number
2. Aplicar em server/db.ts, server/backup.ts, server/routers.ts
3. Corrigir BackupSettings.tsx e backup-scheduler.ts

### Dia 2: Erros Date vs string (18 erros)
1. Criar funções helper para conversão Date/string
2. Aplicar em server/backup.ts (maior concentração)
3. Corrigir server/_core/sdk.ts e oauth.ts

### Dia 3: Erros string | null vs undefined (8 erros)
1. Aplicar operador nullish coalescing
2. Corrigir em server/db.ts

### Dia 4: Erros "No overload matches" (29 erros)
1. Analisar cada chamada individualmente
2. Ajustar tipos dos parâmetros
3. Foco em server/db.ts (maior concentração)

### Dia 5: Erros restantes e validação
1. Corrigir erros de propriedade faltante
2. Corrigir erros de tipo de argumento
3. Executar tsc --noEmit para validar
4. Executar testes unitários

---

## Comandos Úteis

```bash
# Verificar erros TypeScript
npx tsc --noEmit

# Contar erros
npx tsc --noEmit 2>&1 | grep "error TS" | wc -l

# Listar erros por arquivo
npx tsc --noEmit 2>&1 | grep "error TS" | cut -d':' -f1 | sort | uniq -c | sort -rn

# Executar testes
pnpm test
```
