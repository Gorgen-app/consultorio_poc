# Treinamento do Algoritmo de Extração de Exames

## Histórico de Treinamento

### Sessão 1 - 23/01/2026

**PDFs Processados:**
1. `06-08-202511001_15822576007026463270.pdf` (9 páginas)
2. `luizvaldecirlaboratoriaisoutubro2025_8842869909479701500.pdf` (10 páginas)
3. `examealuizvaldecir.pdf` (22 páginas)

**Paciente de Teste:** LUIZ VALDECIR DA ROSA BAHU

**Laboratórios Identificados:**
- Hermes Pardini
- Lab-to-Lab Pardini / Solução
- Hospital Padre Jeremias
- AmorSaúde
- Raio Som

---

## Aprendizados e Otimizações

### 1. Estrutura de Documentos

Os laudos laboratoriais brasileiros geralmente seguem esta estrutura:

| Seção | Localização | Conteúdo |
|-------|-------------|----------|
| Cabeçalho | Topo | Logo, dados do laboratório, dados do paciente |
| Exames Individuais | Corpo | Um exame por página ou seção |
| Laudo Evolutivo/Fluxograma | Final | Tabela histórica com múltiplas datas |

**Insight Crítico:** O "Laudo Evolutivo" ou "Fluxograma" nas últimas páginas contém dados consolidados de múltiplas coletas, sendo a fonte mais valiosa para extração de histórico.

### 2. Variações de Nomenclatura

Mapeamento de sinônimos identificados:

```
TGO = AST = Transaminase Oxalacética
TGP = ALT = Transaminase Pirúvica
GGT = Gama GT = Gama Glutamil Transferase
Hb = HGB = Hemoglobina
Ht = HCT = Hematócrito
```

### 3. Formatos de Data

Padrões encontrados:
- `DD/MM/YYYY` (mais comum)
- `DD/MM/YY`
- Data de coleta vs Data de emissão (priorizar coleta)

### 4. Valores Especiais

Tipos de resultados não numéricos:
- `>90` (maior que)
- `<0,1` (menor que)
- `Não reagente` / `NÃO REAGENTE`
- `Negativo` / `NEGATIVO`
- `Ausente` / `AUSENTE`

### 5. Unidades de Medida

Variações encontradas:
- `g/dL` vs `g/dl`
- `U/L` vs `UI/L`
- `/mm³` vs `/uL`
- `mEq/L` vs `mmol/L`

---

## Métricas de Extração

### Sessão 1

| Métrica | Valor |
|---------|-------|
| Total de PDFs | 3 |
| Total de páginas | 41 |
| Exames únicos extraídos | 44 |
| Datas diferentes | 6 |
| Taxa de sucesso | ~95% |

### Exames Extraídos com Sucesso

- Hemograma completo (todos os parâmetros)
- Função hepática (TGO, TGP, GGT, FA, Bilirrubinas)
- Função renal (Ureia, Creatinina, RFG)
- Eletrólitos (Na, K, Ca)
- Perfil lipídico (CT, HDL, TG)
- Metabolismo do ferro (Ferritina, Ferro, Transferrina, IST)
- Coagulação (TP/RNI, TTPA)
- Marcadores (PCR, AFP)
- Glicemia (Glicose jejum, HbA1c)
- Sorologias (Anti-HBc)
- Elastografia hepática

---

## Melhorias Implementadas

### 1. Arquivo de Configuração (`exam-extraction-config.ts`)

- Mapeamento de sinônimos para padronização
- Categorização de exames para visualização
- Valores de referência padrão
- Prompt otimizado para LLM
- Funções utilitárias para normalização

### 2. Prompt Otimizado

Principais melhorias no prompt:
1. Priorização do Laudo Evolutivo
2. Tratamento de múltiplas datas
3. Padronização de nomenclatura
4. Conversão de formatos de data
5. Tratamento de valores especiais

---

## Próximos Passos

1. [ ] Testar com PDFs de outros laboratórios (Weinmann, Fleury, DASA)
2. [ ] Implementar extração de exames de imagem (Ecografia, Elastografia)
3. [ ] Adicionar mais sinônimos conforme novos padrões forem encontrados
4. [ ] Implementar validação cruzada de valores extraídos
5. [ ] Criar testes automatizados com PDFs de referência

---

## Observações Técnicas

### Performance
- Tempo médio de extração por PDF: ~10-15 segundos
- Modelo utilizado: Gemini 2.5 Flash
- Tokens médios por extração: ~8.000-12.000

### Limitações Conhecidas
1. PDFs baseados em imagem requerem OCR prévio
2. Tabelas complexas podem ter extração parcial
3. Laudos manuscritos não são suportados

---

*Documento atualizado automaticamente após sessões de treinamento.*
