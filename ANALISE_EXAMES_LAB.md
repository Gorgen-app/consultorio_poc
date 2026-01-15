# Análise: Estrutura de Exames Laboratoriais

## Observações do PDF Analisado (Weinmann)

### Estrutura do Documento (10 páginas)
- **Páginas 1-8**: Resultados individuais de cada exame
- **Páginas 9-10**: **LAUDO EVOLUTIVO** (Fluxograma) - tabela histórica com múltiplas datas

### Dados Relevantes para o Médico
1. **Nome do exame** (ex: Hemoglobina, Creatinina, Ferritina)
2. **Data da coleta** (ex: 02/10/2025)
3. **Resultado** (ex: 14,2 g/dL)
4. **Valor de referência** (ex: 11,7 a 14,9 g/dL)
5. **Histórico de resultados** (fluxograma)

### Dados NÃO Relevantes (ruído)
- Cabeçalho do laboratório
- Método de análise
- Notas técnicas extensas
- Assinaturas digitais
- Número do pedido
- Responsável técnico

---

## Proposta de Modelagem

### Opção 1: Extração Estruturada com IA

```
Tabela: resultados_laboratoriais
- id
- paciente_id
- documento_id (FK para documento_externo original)
- nome_exame (varchar) - "Hemoglobina"
- codigo_exame (varchar, nullable) - padronização futura
- resultado (varchar) - "14,2" (texto para suportar ">90", "<0,1")
- unidade (varchar) - "g/dL"
- valor_referencia_min (decimal, nullable)
- valor_referencia_max (decimal, nullable)
- valor_referencia_texto (varchar) - "11,7 a 14,9 g/dL"
- data_coleta (date)
- laboratorio (varchar, nullable)
- fora_referencia (boolean) - calculado automaticamente
- created_at
```

### Fluxo Proposto

1. **Upload do PDF** → Salva documento original
2. **OCR + Extração com LLM** → Identifica exames, resultados, datas
3. **Parsing estruturado** → Popula tabela `resultados_laboratoriais`
4. **Visualização** → Fluxograma automático por exame

### Visualização: Fluxograma do Paciente

```
┌─────────────────────────────────────────────────────────────────┐
│ Hemoglobina (g/dL)                           Ref: 11,7 - 14,9   │
├─────────────────────────────────────────────────────────────────┤
│ 19/02/25  │ 20/08/25  │ 22/08/25  │ 25/08/25  │ 02/10/25       │
│   ----    │   4,71    │   4,88    │   13,3    │   14,2         │
│           │   ⚠️      │   ⚠️      │           │                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│ Creatinina (mg/dL)                           Ref: 0,60 - 1,10   │
├─────────────────────────────────────────────────────────────────┤
│ 19/02/25  │ 20/08/25  │ 22/08/25  │ 25/08/25  │ 02/10/25       │
│   0,73    │   0,83    │   0,79    │   0,68    │   0,66         │
└─────────────────────────────────────────────────────────────────┘
```

### Funcionalidades

1. **Gráfico de tendência** - Linha do tempo por exame
2. **Alertas visuais** - Valores fora da referência em vermelho
3. **Agrupamento** - Por categoria (Hemograma, Bioquímica, etc.)
4. **Filtro por período** - Últimos 6 meses, 1 ano, etc.
5. **Comparação** - Selecionar datas específicas

---

## Desafios Técnicos

1. **Variação de formatos** - Cada laboratório tem layout diferente
2. **Nomes de exames** - "TGP" vs "ALT" vs "Transaminase"
3. **Unidades** - "U/L" vs "UI/L"
4. **Valores especiais** - ">90", "<0,1", "Não reagente"

### Soluções

1. **Tabela de sinônimos** - Mapear nomes diferentes para exame padrão
2. **LLM para extração** - Mais flexível que regex
3. **Revisão manual** - Permitir correção pós-extração
4. **Importação do fluxograma** - Priorizar páginas finais do PDF

---

## Próximos Passos Sugeridos

1. [ ] Criar tabela `resultados_laboratoriais` no schema
2. [ ] Criar tabela `exames_padronizados` (catálogo de exames)
3. [ ] Implementar extração estruturada com LLM
4. [ ] Criar visualização de fluxograma no prontuário
5. [ ] Implementar gráficos de tendência
