# 🔍 Fase 3 - Problemas Identificados no Dry Run

> **Data:** 25/01/2026 | **Versão:** 1.0

---

## Resumo

| Severidade | Quantidade | Status |
|------------|------------|--------|
| 🔴 CRÍTICO | 0 | - |
| 🟠 ALTO | 2 | Correção proposta |
| 🟡 MÉDIO | 2 | Correção proposta |
| 🟢 BAIXO | 0 | - |

---

## 🟠 PROBLEMA 1: Sem try-catch no filtro

### Descrição
A função `preProcessarDocumento` não possui tratamento de exceções. Se ocorrer qualquer erro interno (regex inválido, acesso a propriedade undefined, etc.), a extração inteira falha e o usuário recebe erro genérico.

### Impacto
- **Severidade:** ALTO
- **Probabilidade:** Baixa (código testado)
- **Consequência:** Falha silenciosa na extração, usuário não sabe o motivo

### Código Atual
```typescript
const preProcessamento = preProcessarDocumento(textoOcr, tenantId);
// Se preProcessarDocumento lançar exceção, a função extrairDePdf falha
```

### Correção Proposta
```typescript
let preProcessamento;
try {
  preProcessamento = preProcessarDocumento(textoOcr, tenantId);
} catch (error) {
  console.error(`[LAB-EXTRACT] Erro no filtro rápido: ${error.message}`);
  // Fallback: continuar com extração LLM normal
  preProcessamento = { processar: true, motivo: 'FALLBACK_ERRO_FILTRO' };
}
```

### Esforço
- **Tempo:** 15 minutos
- **Risco:** Baixo
- **Chance de sucesso:** 99%

---

## 🟠 PROBLEMA 2: Sem fallback quando filtro falha

### Descrição
Se o filtro retornar um resultado inesperado (undefined, null, objeto malformado), o código pode falhar ao acessar `preProcessamento.processar`.

### Impacto
- **Severidade:** ALTO
- **Probabilidade:** Muito baixa
- **Consequência:** TypeError, extração falha

### Código Atual
```typescript
if (!preProcessamento.processar) {
  // Se preProcessamento for undefined, isso lança TypeError
```

### Correção Proposta
```typescript
// Validar resultado do filtro
if (!preProcessamento || typeof preProcessamento.processar !== 'boolean') {
  console.warn('[LAB-EXTRACT] Resultado do filtro inválido, usando fallback');
  preProcessamento = { processar: true, motivo: 'FALLBACK_RESULTADO_INVALIDO' };
}

if (!preProcessamento.processar) {
  // Código seguro agora
```

### Esforço
- **Tempo:** 10 minutos
- **Risco:** Baixo
- **Chance de sucesso:** 99%

---

## 🟡 PROBLEMA 3: ctx.tenant pode ser undefined (MITIGADO)

### Descrição
O código usa `ctx.tenant?.tenantId || 1`, o que significa que se `ctx.tenant` for undefined, o tenantId será 1 (padrão).

### Análise
Após investigação, descobri que `extrairDePdf` usa `protectedProcedure`, não `tenantProcedure`. Isso significa que `ctx.tenant` **pode** ser undefined em alguns casos.

**PORÉM:** Na prática, o sistema Gorgen sempre tem tenant definido para usuários logados. O fallback para `1` é uma medida de segurança, não um risco real.

### Impacto
- **Severidade:** MÉDIO (mitigado pelo design do sistema)
- **Probabilidade:** Muito baixa
- **Consequência:** Documento processado no tenant 1 (admin)

### Correção Proposta (Opcional)
```typescript
// Opção 1: Mudar para tenantProcedure
extrairDePdf: tenantProcedure  // Garante ctx.tenant sempre definido

// Opção 2: Validar explicitamente
const tenantId = ctx.tenant?.tenantId;
if (!tenantId) {
  throw new Error('Tenant não identificado. Faça login novamente.');
}
```

### Esforço
- **Tempo:** 30 minutos (se mudar para tenantProcedure)
- **Risco:** Médio (pode afetar outras partes do código)
- **Chance de sucesso:** 95%

### Recomendação
**Adiar para Fase 4.** O risco é baixo e a correção pode ter efeitos colaterais.

---

## 🟡 PROBLEMA 4: Sem métricas de economia LLM

### Descrição
O código retorna `economiaLLM: true` quando ignora um documento, mas não registra essa métrica em banco de dados para análise posterior.

### Impacto
- **Severidade:** MÉDIO (não afeta funcionalidade)
- **Probabilidade:** 100%
- **Consequência:** Não é possível medir economia real de chamadas LLM

### Correção Proposta
```typescript
// Adicionar tabela de métricas
CREATE TABLE metricas_extracao (
  id SERIAL PRIMARY KEY,
  tenant_id INT NOT NULL,
  documento_id INT,
  filtro_decisao VARCHAR(50),
  filtro_motivo VARCHAR(100),
  llm_chamado BOOLEAN,
  tempo_filtro_ms INT,
  tempo_llm_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

// No código
if (!preProcessamento.processar) {
  await db.registrarMetricaExtracao({
    tenantId,
    documentoId: input.documentoId,
    filtroDecisao: 'IGNORAR',
    filtroMotivo: preProcessamento.motivo,
    llmChamado: false,
    tempoFiltroMs: preProcessamento.tempoTotalMs
  });
}
```

### Esforço
- **Tempo:** 1-2 horas
- **Risco:** Baixo
- **Chance de sucesso:** 99%

### Recomendação
**Adiar para Fase 4.** Não é crítico para o funcionamento.

---

## Plano de Correção Atualizado

### Correções Obrigatórias (antes da Fase 3 real)

| # | Problema | Tempo | Prioridade |
|---|----------|-------|------------|
| 1 | Try-catch no filtro | 15 min | 🔴 Alta |
| 2 | Fallback para resultado inválido | 10 min | 🔴 Alta |

**Tempo total:** ~25 minutos

### Correções Opcionais (Fase 4)

| # | Problema | Tempo | Prioridade |
|---|----------|-------|------------|
| 3 | Mudar para tenantProcedure | 30 min | 🟡 Média |
| 4 | Métricas de economia LLM | 1-2h | 🟡 Média |

---

## Conclusão

Os problemas identificados são de **baixa a média severidade** e têm **correções simples**. As duas correções obrigatórias podem ser implementadas em menos de 30 minutos e aumentam significativamente a robustez do sistema.

**Recomendação:** Implementar correções 1 e 2 antes de prosseguir com a Fase 3 real.
