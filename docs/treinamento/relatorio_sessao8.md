# Relatório da Sessão 8 - Treinamento de Extração de Exames

**Data:** 26/01/2026
**PDFs Processados:** 127 arquivos
**Exames Extraídos:** 157 (excluindo cabeçalho)
**Pacientes Únicos:** 42
**Exames Alterados:** 38 (24%)

## Resumo Executivo

A Sessão 8 foi a maior sessão de treinamento até o momento, processando 127 PDFs de exames médicos. Foram identificados 14 laboratórios diferentes e extraídos dados de 42 pacientes únicos. A taxa de exames alterados (fora dos valores de referência) foi de 24%.

## Laboratórios Identificados

| Laboratório | Tipo Principal |
|-------------|----------------|
| WEINMANN | Análises clínicas |
| UNIMED POA | Análises clínicas |
| UNIMED PELOTAS | Análises clínicas |
| MOINHOS CRF-RS 8659 | Análises clínicas |
| DIAGNÓSTICOS DO BRASIL | Análises clínicas |
| LAB GALLE | Análises clínicas |
| INSTITUTO DE PATOLOGIA | Anatomopatológico |
| DB DIAGNÓSTICOS | Anatomopatológico |
| SERDIL WEINMANN | Imagem |
| IMAGEM DA CONFIANÇA | Imagem |
| SAÚDE MEDICINA | Imagem |
| TOMOGRAFIA | Imagem |

## Tipos de Exames Processados

### Exames Laboratoriais
- Hemograma completo (eritrócitos, hemoglobina, hematócrito, leucócitos, plaquetas)
- Bioquímica (glicose, creatinina, ureia, ácido úrico, bilirrubinas)
- Perfil lipídico (colesterol total, HDL, triglicerídeos)
- Marcadores (HbA1c, ferritina, ferro, vitamina D, ácido fólico)
- Coagulação (fibrinogênio)
- Cardíacos (troponina T, CK total)
- Tumorais (alfafetoproteína)

### Exames de Imagem
- Ecografia abdominal total
- Ecografia mamária
- Ecodoppler venoso
- Tomografia computadorizada (tórax, abdome)
- Elastografia hepática

### Exames Especiais
- Anatomopatológico (hepatectomia)
- Imuno-histoquímica

## Pacientes com Exames Alterados

| Paciente | Exame | Valor | Referência |
|----------|-------|-------|------------|
| JOSE OSCAR NEDEL | Eritrócitos | 3.45-3.48 | 4.32-5.67 |
| JOSE OSCAR NEDEL | VCM | 108.7-109.2 | 81.7-95.3 |
| GILMAR FERNANDO WEIS | Leucócitos | 2910-3200 | 4000-11000 |
| CRISTIAN REZENDE WINTERSCHEIDT | Glicose | 245 | 70-99 |
| JOAO BATISTA PASETO | Creatinina | 1.45 | 0.3-1.3 |
| MAGDIELE DE AVILA RODRIGUES | Eritrócitos | 3.61-3.69 | 3.88-4.99 |
| DEMETRIO DE FREITAS XAVIER | Colesterol Total | 237 | <190 |
| MURIEL GERUSA MAUS | Colesterol Total | 228 | <190 |

## Documentos Ignorados

Os seguintes tipos de documentos foram identificados como não-exames e ignorados:
- Boletos bancários (330801_1.PDF)
- Documentos de imagem duplicados (TESICAPTURE)
- PDFs duplicados do mesmo exame

## Métricas de Performance

- **Taxa de extração:** ~1.2 exames/PDF
- **Tempo médio por PDF:** ~2 segundos
- **Novos laboratórios identificados:** 2 (LAB GALLE, SAÚDE MEDICINA)

## Próximos Passos

1. Atualizar configuração de extração com novos laboratórios
2. Adicionar templates para LAB GALLE e SAÚDE MEDICINA
3. Melhorar extração de exames de imagem (laudos descritivos)
4. Implementar detecção automática de documentos duplicados
