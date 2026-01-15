# 🏥 GORGEN - Diagrama EPC (Event-driven Process Chain)

## Visão Geral

Este documento descreve os principais processos do sistema Gorgen utilizando a notação **EPC (Event-driven Process Chain)**, uma metodologia de modelagem de processos de negócio amplamente utilizada em sistemas de gestão empresarial.

---

## Elementos da Notação EPC

| Elemento | Símbolo | Descrição |
|----------|---------|-----------|
| **Evento** | Hexágono/Oval | Representa um estado ou condição que dispara ou resulta de uma função |
| **Função** | Retângulo arredondado | Representa uma atividade ou tarefa executada |
| **Gateway/Decisão** | Losango | Representa um ponto de decisão no fluxo |
| **Conector** | Seta | Indica a sequência do fluxo |

### Cores dos Eventos

- 🔵 **Azul**: Evento inicial (dispara o processo)
- 🟢 **Verde**: Evento final (conclusão bem-sucedida)
- 🟡 **Amarelo**: Evento intermediário (aguardando ação)
- 🔴 **Vermelho**: Evento de erro ou negação

---

## Processos Mapeados

### 1️⃣ Gestão de Pacientes

**Objetivo**: Gerenciar o ciclo de vida dos dados cadastrais dos pacientes.

| Evento Inicial | Função | Evento Final |
|----------------|--------|--------------|
| Novo paciente chega | Cadastrar Paciente | Paciente cadastrado |
| Dados precisam atualização | Editar Paciente | Dados atualizados |
| Busca necessária | Buscar/Filtrar Pacientes | Paciente localizado |

**Campos gerenciados**: 33 campos incluindo dados pessoais, contato, convênios e informações clínicas.

---

### 2️⃣ Agendamento

**Objetivo**: Gerenciar a agenda de consultas e procedimentos.

```
Solicitação de consulta → Verificar Disponibilidade → [Disponível?]
    ↓ Sim                                              ↓ Não
Agendar Consulta → Consulta agendada → Enviar Confirmação → Paciente notificado
```

**Fluxos alternativos**:
- Cancelamento de agendamento
- Reagendamento
- Lista de espera (quando não há horário disponível)

---

### 3️⃣ Atendimento Médico

**Objetivo**: Registrar o atendimento clínico completo seguindo metodologia SOAP.

```
Paciente chega → Registrar Atendimento → Atendimento iniciado
                                              ↓
                                    Preencher Evolução SOAP
                                              ↓
                                    [Exames necessários?]
                                    ↓ Sim           ↓ Não
                              Solicitar Exames      ↓
                                    ↓               ↓
                                    [Prescrição necessária?]
                                    ↓ Sim           ↓ Não
                              Emitir Receita        ↓
                                    ↓               ↓
                              Finalizar Atendimento
                                    ↓
                              Atendimento concluído
```

**Componentes do SOAP**:
- **S**ubjetivo: Queixa principal, história da doença atual
- **O**bjetivo: Exame físico, sinais vitais
- **A**valiação: Impressão diagnóstica, CID-10
- **P**lano: Conduta, prescrições, solicitações

---

### 4️⃣ Prontuário Eletrônico

**Objetivo**: Manter registro completo e organizado do histórico clínico do paciente.

| Processo | Descrição |
|----------|-----------|
| Acesso ao prontuário | Verificação de permissão antes de exibir dados |
| Upload de documentos | Inclusão de exames externos, laudos, imagens |
| Extração OCR/IA | Processamento automático de documentos digitalizados |
| Histórico de medidas | Registro de peso, altura, IMC, pressão arterial |

**Seções do Prontuário**:
- Resumo clínico
- Problemas ativos (CID-10)
- Alergias
- Medicamentos em uso
- Evoluções clínicas
- Exames e documentos

---

### 5️⃣ Faturamento

**Objetivo**: Gerenciar o ciclo financeiro dos atendimentos.

```
Atendimento realizado → Calcular Honorários → Valor calculado
                                                    ↓
                                          Enviar para Faturamento
                                                    ↓
                                              Fatura enviada
                                                    ↓
                                          [Pagamento recebido?]
                                          ↓ Sim           ↓ Não
                                    Registrar Pagamento   Aguardar
                                          ↓
                                    Atualizar Dashboard
                                          ↓
                                    Métricas atualizadas
```

**Métricas rastreadas**:
- Faturamento previsto vs. realizado
- Taxa de recebimento
- Distribuição por convênio
- Inadimplência

---

### 6️⃣ Compartilhamento Cross-Tenant

**Objetivo**: Permitir compartilhamento seguro de dados entre clínicas parceiras em conformidade com a LGPD.

```
Clínica externa solicita acesso → Criar Solicitação → Solicitação pendente
                                                            ↓
                                                  Notificar Clínica Origem
                                                            ↓
                                                  [Paciente autoriza?]
                                                  ↓ Sim           ↓ Não
                                          Aprovar + LGPD    Rejeitar
                                                  ↓               ↓
                                          Acesso autorizado  Acesso negado
                                                  ↓
                                          Registrar Log Auditoria
```

**Tipos de autorização**:
- **Leitura**: Apenas visualização
- **Escrita**: Pode adicionar registros
- **Completo**: Acesso total

**Escopos disponíveis**:
- Prontuário
- Atendimentos
- Exames
- Documentos
- Completo (todos os dados)

---

### 7️⃣ Auditoria e Conformidade

**Objetivo**: Garantir rastreabilidade completa e conformidade com regulamentações.

| Ação | Log Registrado |
|------|----------------|
| CREATE | Criação de novo registro |
| UPDATE | Alteração de registro existente |
| DELETE | Exclusão (soft delete) |
| VIEW | Visualização de dados sensíveis |
| EXPORT | Exportação de dados |
| AUTHORIZE | Concessão de autorização |
| REVOKE | Revogação de autorização |

**Dados capturados**:
- Usuário responsável
- Data/hora (timestamp UTC)
- Endereço IP
- User-Agent do navegador
- Valores antes e depois da alteração
- Campos modificados

---

## Integrações Entre Processos

O diagrama EPC demonstra como os processos se conectam:

```
CADASTRO ──────────────────────────────────────────────────────────┐
    │                                                               │
    ↓                                                               │
AGENDAMENTO ─────────────────────────────────────────────────────┐ │
    │                                                             │ │
    ↓                                                             │ │
ATENDIMENTO ──┬──────────────────────────────────────────────────┤ │
              │                                                   │ │
              ├──→ PRONTUÁRIO ──→ CROSS-TENANT ──→ AUDITORIA ←───┘ │
              │                                                     │
              └──→ FATURAMENTO ─────────────────────────────────────┘
```

---

## Conformidade Regulatória

O sistema Gorgen foi projetado para atender:

| Regulamentação | Implementação |
|----------------|---------------|
| **LGPD** | Consentimento explícito, logs de acesso, direito ao esquecimento |
| **CFM** | Prontuário eletrônico conforme resoluções do Conselho Federal de Medicina |
| **CREMESP** | Sigilo médico e confidencialidade |
| **HIPAA** | Padrões de segurança para dados de saúde (referência internacional) |

---

## Arquivos do Diagrama

| Arquivo | Descrição |
|---------|-----------|
| `diagrama_epc_gorgen.mmd` | Diagrama completo em formato Mermaid |
| `diagrama_epc_gorgen.png` | Imagem PNG do diagrama completo |
| `diagrama_epc_gorgen_v2.mmd` | Versão simplificada em formato Mermaid |
| `diagrama_epc_gorgen_v2.png` | Imagem PNG da versão simplificada |

---

## Versão

- **Versão**: 1.0
- **Data**: 10/01/2026
- **Sistema**: Gorgen v4.1
- **Autor**: Equipe de Desenvolvimento Gorgen

---

*Este documento faz parte da documentação técnica do sistema Gorgen - Sistema de Gestão em Saúde.*
