# Template para Importação de Atendimentos Históricos

## Formato da Planilha

A planilha deve ser um arquivo **Excel (.xlsx)** ou **CSV** com as seguintes colunas:

### Colunas Obrigatórias

| Coluna | Descrição | Formato | Exemplo |
|--------|-----------|---------|---------|
| `codigo_paciente` | Código do paciente (ID legado) | Texto | `2025-0000001` |
| `data_atendimento` | Data do atendimento | DD/MM/AAAA | `15/03/2025` |
| `tipo_atendimento` | Tipo do atendimento | Texto | `Consulta`, `Cirurgia`, `Procedimento em consultório`, `Visita hospitalar` |
| `convenio` | Convênio utilizado | Texto | `UNIMED`, `PARTICULAR`, `BRADESCO SAÚDE` |

### Colunas Opcionais

| Coluna | Descrição | Formato | Exemplo |
|--------|-----------|---------|---------|
| `procedimento` | Descrição do procedimento | Texto | `Consulta de rotina` |
| `codigos_cbhpm` | Códigos CBHPM separados por vírgula | Texto | `10101012, 10101020` |
| `local` | Local do atendimento | Texto | `Consultório`, `HMV`, `Hospital Mãe de Deus` |
| `plano_convenio` | Plano/Modalidade do convênio | Texto | `Executivo`, `Básico` |
| `faturamento_previsto` | Valor previsto em R$ | Número | `350,00` |
| `data_envio_faturamento` | Data de envio ao convênio | DD/MM/AAAA | `20/03/2025` |
| `data_esperada_pagamento` | Data esperada do pagamento | DD/MM/AAAA | `20/04/2025` |
| `pagamento_efetivado` | Se já foi pago | Sim/Não | `Sim` ou `Não` |
| `data_pagamento` | Data do pagamento efetivo | DD/MM/AAAA | `18/04/2025` |
| `valor_recebido` | Valor efetivamente recebido | Número | `315,00` |
| `nota_fiscal` | Número da nota fiscal | Texto | `NF-2025-001234` |
| `observacoes` | Observações gerais | Texto | `Paciente com acompanhante` |

### Tipos de Atendimento Válidos

Conforme Glossário Gorgen v3.0:

1. **Consulta** - Consulta médica com horário pré-determinado, realizada em consultório
2. **Cirurgia** - Procedimentos invasivos, anestesias, parto, realizados em ambiente hospitalar
3. **Procedimento em consultório** - Procedimentos de pequeno porte, sem anestesia geral
4. **Visita hospitalar** - Visita realizada em paciente internado em hospital

### Convênios Válidos

Lista completa de convênios reconhecidos:

```
AFRAFEP, AMIL, ASSEFAZ, BRADESCO SAÚDE, CABERGS, CAMED, CASSI, CCG, 
CORTESIA, DOCTORCLIN, EMBRATEL, FAPES, FUNDAFFEMG, GEAP, GKN, HAPVIDA, 
IPE SAÚDE, MEDISERVICE, NOTRE DAME, PARTICULAR, PARTICULAR COM 25% DESCONTO, 
PETROBRAS, POSTAL SAUDE, RETORNO DE PARTICULAR, SAUDE BNDES, SAÚDE CAIXA, 
SAÚDE PAS, SULAMÉRICA, SULMED, SUS, TELOS, UNAFISCO, UNIMED
```

### Formatação de Valores Monetários

- Use **vírgula** como separador decimal: `350,00`
- Use **ponto** como separador de milhares (opcional): `1.350,00`
- Não inclua o símbolo R$

### Exemplo de Planilha

| codigo_paciente | data_atendimento | tipo_atendimento | convenio | procedimento | local | faturamento_previsto |
|-----------------|------------------|------------------|----------|--------------|-------|---------------------|
| 2025-0000001 | 15/03/2025 | Consulta | UNIMED | Consulta de rotina | Consultório | 350,00 |
| 2025-0000002 | 16/03/2025 | Cirurgia | BRADESCO SAÚDE | Colecistectomia | HMV | 2.500,00 |
| 2025-0000001 | 20/03/2025 | Visita hospitalar | UNIMED | Acompanhamento pós-op | HMV | 180,00 |

### Observações Importantes

1. **Código do paciente**: Use o código legado original (ex: `2025-0000001`). O sistema irá vincular automaticamente ao paciente correto usando o campo `codigo_legado`.

2. **Datas**: Use sempre o formato brasileiro DD/MM/AAAA.

3. **Valores**: Use o padrão brasileiro com vírgula decimal.

4. **Convênios**: Use exatamente os nomes da lista acima para garantir consistência.

5. **Primeira linha**: A primeira linha deve conter os nomes das colunas (cabeçalho).

6. **Codificação**: Salve o arquivo em UTF-8 para preservar acentos.

---

*Documento gerado em 11/01/2026 - Gorgen v3.0*
