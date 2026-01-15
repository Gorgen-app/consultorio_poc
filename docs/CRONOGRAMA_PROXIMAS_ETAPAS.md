# Cronograma de Desenvolvimento - Gorgen
## Próximas Etapas até Lançamento Público

**Versão:** 1.0  
**Data:** 12 de Janeiro de 2026  
**Autor:** Manus AI

---

## Visão Geral do Cronograma

```
Janeiro 2026    Fevereiro 2026    Março 2026       Abril 2026
|---------------|-----------------|----------------|----------|
  Prontuário      Agenda           Faturamento      LANÇAMENTO
  Avançado        Completa         TISS             PÚBLICO
                                   + Testes
```

---

## Fase 1: Prontuário Eletrônico Avançado
**Período:** 13/01/2026 - 31/01/2026 (3 semanas)

### Semana 1 (13-19/01)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Criar schema de prontuário no banco | Dev | [ ] |
| Implementar editor de texto rico (TipTap) | Dev | [ ] |
| Criar componente de timeline de atendimentos | Dev | [ ] |
| Adicionar seções: Anamnese, Exame Físico | Dev | [ ] |

### Semana 2 (20-26/01)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Adicionar seções: Diagnóstico, Conduta, Evolução | Dev | [ ] |
| Implementar upload de arquivos (PDF, imagens) | Dev | [ ] |
| Integrar armazenamento S3 para anexos | Dev | [ ] |
| Criar visualizador de exames | Dev | [ ] |

### Semana 3 (27-31/01)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Implementar templates de documentos | Dev | [ ] |
| Criar gerador de atestados | Dev | [ ] |
| Criar gerador de receitas | Dev | [ ] |
| Testes e ajustes | Dev | [ ] |

**Entregável:** Prontuário eletrônico completo com editor rico e anexos

---

## Fase 2: Agenda Completa
**Período:** 01/02/2026 - 14/02/2026 (2 semanas)

### Semana 4 (01-07/02)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Criar schema de agendamentos | Dev | [ ] |
| Implementar calendário visual (FullCalendar) | Dev | [ ] |
| Criar visualizações: dia, semana, mês | Dev | [ ] |
| Adicionar configuração de horários de trabalho | Dev | [ ] |

### Semana 5 (08-14/02)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Implementar marcação de consultas | Dev | [ ] |
| Criar gestão de conflitos de horários | Dev | [ ] |
| Adicionar status de agendamento | Dev | [ ] |
| Implementar lista de espera | Dev | [ ] |
| Integrar confirmações por WhatsApp (básico) | Dev | [ ] |

**Entregável:** Sistema de agenda completo com calendário visual

---

## Fase 3: Faturamento TISS e Conformidade
**Período:** 15/02/2026 - 15/03/2026 (4 semanas)

### Semana 6 (15-21/02)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Estudar especificação TISS/ANS | Dev | [ ] |
| Criar schema de guias TISS | Dev | [ ] |
| Implementar geração de XML TISS | Dev | [ ] |
| Criar templates de guias por convênio | Dev | [ ] |

### Semana 7 (22-28/02)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Implementar validação de guias | Dev | [ ] |
| Criar numeração sequencial de guias | Dev | [ ] |
| Integrar assinatura digital ICP-Brasil | Dev | [ ] |
| Implementar envio de lotes | Dev | [ ] |

**MARCO: Beta Fechado Disponível (28/02/2026)**

### Semana 8 (01-07/03)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Implementar gestão de glosas | Dev | [ ] |
| Criar relatórios de faturamento | Dev | [ ] |
| Adicionar conciliação de pagamentos | Dev | [ ] |
| Testes com convênios reais | QA | [ ] |

### Semana 9 (08-15/03)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Correções de bugs do beta | Dev | [ ] |
| Ajustes de UX baseados em feedback | Dev | [ ] |
| Documentação de usuário | Doc | [ ] |
| Preparar materiais de treinamento | Doc | [ ] |

**Entregável:** Faturamento TISS completo com assinatura digital

---

## Fase 4: Preparação para Lançamento
**Período:** 16/03/2026 - 31/03/2026 (2 semanas)

### Semana 10 (16-22/03)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Testes de carga e stress | QA | [ ] |
| Testes de segurança (pentest básico) | QA | [ ] |
| Otimização de performance final | Dev | [ ] |
| Backup e disaster recovery | Ops | [ ] |

### Semana 11 (23-31/03)
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Finalizar documentação | Doc | [ ] |
| Criar FAQ e base de conhecimento | Doc | [ ] |
| Configurar suporte ao cliente | Ops | [ ] |
| Preparar landing page comercial | Marketing | [ ] |
| Definir preços e planos | Business | [ ] |

**Entregável:** Sistema pronto para lançamento público

---

## Fase 5: Lançamento Público
**Data:** 01/04/2026

### Atividades de Lançamento
| Tarefa | Responsável | Status |
|--------|-------------|--------|
| Deploy em produção | Ops | [ ] |
| Monitoramento intensivo (24h) | Ops | [ ] |
| Suporte prioritário | Suporte | [ ] |
| Comunicação de lançamento | Marketing | [ ] |
| Coleta de feedback inicial | Produto | [ ] |

---

## Marcos Importantes

| Data | Marco | Descrição |
|------|-------|-----------|
| 31/01/2026 | Prontuário Completo | Prontuário eletrônico avançado funcional |
| 14/02/2026 | Agenda Completa | Sistema de agendamento funcional |
| 28/02/2026 | Beta Fechado | Sistema disponível para usuários selecionados |
| 15/03/2026 | Feature Freeze | Congelamento de novas funcionalidades |
| 31/03/2026 | Release Candidate | Versão candidata a lançamento |
| 01/04/2026 | **LANÇAMENTO PÚBLICO** | Sistema disponível comercialmente |

---

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Atraso no TISS | Média | Alto | Contratar especialista TISS |
| Bugs em produção | Média | Alto | Testes extensivos + rollback |
| Baixa adoção | Média | Médio | Marketing + preço competitivo |
| Problemas de performance | Baixa | Alto | Já otimizado (93-98% melhoria) |

---

## Recursos Necessários

### Equipe
- 1 Desenvolvedor Full-Stack (dedicado)
- 1 QA/Tester (parcial)
- 1 Documentador (parcial)
- 1 Suporte (a partir do beta)

### Infraestrutura
- Servidor de produção (já disponível via Manus)
- Certificado digital ICP-Brasil
- Conta em gateway de pagamento

### Orçamento Estimado
| Item | Custo Mensal |
|------|--------------|
| Infraestrutura | R$ 0 (Manus) |
| Certificado Digital | R$ 150/ano |
| Gateway de Pagamento | 2-3% por transação |
| Marketing Inicial | R$ 2.000-5.000 |

---

## Próximos Passos Imediatos

1. [ ] Aprovar cronograma com Dr. André Gorgen
2. [ ] Iniciar desenvolvimento do Prontuário Avançado
3. [ ] Definir usuários para Beta Fechado
4. [ ] Contratar/designar recursos necessários
5. [ ] Configurar ambiente de produção separado

---

*Documento gerado automaticamente pelo sistema Gorgen em 12/01/2026*
