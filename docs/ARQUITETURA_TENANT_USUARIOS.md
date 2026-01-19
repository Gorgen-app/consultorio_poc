# GORGEN - Discussão de Arquitetura: Tenants, Médicos e Pacientes

> **Documento de Discussão** | Versão 1.0 | 19 de Janeiro de 2026

---

## 1. Conceito de Tenant no GORGEN

### 1.1 O que é um Tenant?

No contexto do GORGEN, um **tenant** representa uma unidade organizacional isolada dentro do sistema. Cada tenant possui seus próprios dados completamente segregados dos demais, garantindo privacidade e segurança.

### 1.2 Modelos de Tenant Possíveis

| Modelo | Descrição | Vantagens | Desvantagens |
|--------|-----------|-----------|--------------|
| **Tenant = Consultório** | Cada consultório/clínica é um tenant separado | Isolamento total entre clínicas; Ideal para franquias | Pacientes duplicados se atendidos em múltiplos locais |
| **Tenant = Médico** | Cada médico é um tenant independente | Máxima privacidade por profissional; Ideal para médicos autônomos | Secretárias precisam de acesso a múltiplos tenants |
| **Tenant = Grupo Médico** | Grupo de médicos compartilha um tenant | Colaboração facilitada; Visão unificada de pacientes | Requer controle de acesso interno mais granular |

### 1.3 Modelo Atual Implementado

O GORGEN atualmente opera com o modelo **Tenant = Consultório/Clínica**, onde:

- O Dr. André Gorgen é o **Administrador Master** do tenant principal (ID = 1)
- Todos os pacientes e atendimentos pertencem a este tenant
- Usuários (secretárias, médicos colaboradores) são vinculados ao tenant
- Dados são completamente isolados de outros tenants futuros

### 1.4 Recomendação para Evolução

Para suportar múltiplos médicos e a futura expansão comercial, sugiro o modelo híbrido:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PLATAFORMA GORGEN                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │   TENANT A      │  │   TENANT B      │  │   TENANT C      │  │
│  │  (Consultório   │  │  (Dra. Letícia  │  │  (Clínica XYZ)  │  │
│  │   Dr. André)    │  │   Autônoma)     │  │                 │  │
│  │                 │  │                 │  │                 │  │
│  │  - Pacientes    │  │  - Pacientes    │  │  - Pacientes    │  │
│  │  - Atendimentos │  │  - Atendimentos │  │  - Atendimentos │  │
│  │  - Secretárias  │  │  - Secretárias  │  │  - Médicos      │  │
│  │  - Médicos      │  │                 │  │  - Secretárias  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │              CAMADA DE COMPARTILHAMENTO (OPCIONAL)          ││
│  │  - Pacientes podem autorizar acesso entre tenants           ││
│  │  - Médicos podem ser convidados para colaborar              ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Papel dos Médicos na Plataforma

### 2.1 Perfil de Médico - Características

| Aspecto | Descrição |
|---------|-----------|
| **Acesso** | Prontuários de pacientes autorizados |
| **Ações** | Criar/editar atendimentos, evoluções, prescrições |
| **Restrições** | Não pode excluir dados, não pode acessar financeiro (configurável) |
| **Auditoria** | Todas as ações são registradas com timestamp e identificação |

### 2.2 Tipos de Médicos no Sistema

| Tipo | Descrição | Exemplo |
|------|-----------|---------|
| **Médico Titular** | Dono do tenant, administrador | Dr. André Gorgen |
| **Médico Colaborador** | Vinculado ao tenant, acesso limitado | Dra. Letícia Uzeila |
| **Médico Convidado** | Acesso temporário a pacientes específicos | Interconsulta |

### 2.3 Campos do Perfil de Médico

Com base nas diretrizes do projeto, o perfil de médico deve incluir:

- **Dados Básicos**: Nome, CRM, UF do CRM, Email, Telefone
- **Especialidade Principal**: Dropdown com especialidades reconhecidas pelo CFM
- **Especialidade Adicional**: Campo opcional para segunda especialidade
- **Área de Atuação**: Dropdown com áreas reconhecidas (ex: Oncologia Clínica)
- **Assinatura Digital**: Para documentos médicos
- **Foto do Perfil**: Opcional

### 2.4 Fluxo de Acesso do Médico

```
Médico faz login → Sistema verifica tenant → Carrega pacientes autorizados
                                                      │
                                                      ▼
                                          ┌─────────────────────┐
                                          │ Pacientes com       │
                                          │ atendimento prévio  │
                                          │ OU autorização      │
                                          │ explícita           │
                                          └─────────────────────┘
```

---

## 3. Papel dos Pacientes na Plataforma

### 3.1 Modelo Atual (Passivo)

Atualmente, pacientes são **registros no sistema**, sem acesso próprio:

- Cadastrados pela secretária ou médico
- Não possuem login
- Dados gerenciados pelo consultório

### 3.2 Modelo Futuro (Portal do Paciente)

Para a evolução do GORGEN, sugiro implementar acesso para pacientes:

| Funcionalidade | Descrição |
|----------------|-----------|
| **Visualizar Histórico** | Ver atendimentos, exames, prescrições |
| **Atualizar Dados** | Alterar telefone, endereço, convênio |
| **Upload de Exames** | Enviar resultados de exames externos |
| **Agendamento Online** | Marcar consultas (se habilitado pelo médico) |
| **Autorizar Médicos** | Conceder/revogar acesso ao prontuário |
| **Exportar Dados** | Direito LGPD de portabilidade |

### 3.3 Sistema de Autorizações

O paciente deve poder controlar quem acessa seus dados:

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTORIZAÇÕES DO PACIENTE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Paciente: Maria Silva (ID: PAC-2024-0001)                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │ Médico              │ Tipo        │ Desde      │ Ação       ││
│  ├─────────────────────┼─────────────┼────────────┼────────────┤│
│  │ Dr. André Gorgen    │ Automática  │ 15/03/2020 │ [Revogar]  ││
│  │ Dra. Letícia Uzeila │ Convidado   │ 10/01/2026 │ [Revogar]  ││
│  │ Dr. Carlos Mendes   │ Interconsul │ 05/01/2026 │ [Expirado] ││
│  └─────────────────────────────────────────────────────────────┘│
│                                                                  │
│  [+ Autorizar Novo Médico]                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.4 Níveis de Acesso do Paciente

| Nível | Descrição | Dados Visíveis |
|-------|-----------|----------------|
| **Completo** | Acesso total ao prontuário | Tudo |
| **Parcial** | Apenas período específico | Atendimentos do período |
| **Emergência** | Acesso temporário (24h) | Dados essenciais |
| **Revogado** | Sem acesso | Nenhum |

---

## 4. Hierarquia de Usuários Proposta

### 4.1 Estrutura de Perfis

```
┌─────────────────────────────────────────────────────────────────┐
│                    HIERARQUIA DE USUÁRIOS                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  ADMINISTRADOR MASTER                        ││
│  │         (Dr. André Gorgen - Dono do Tenant)                 ││
│  │  • Acesso total e irrestrito                                ││
│  │  • Pode criar/remover qualquer usuário                      ││
│  │  • Único que pode autorizar exclusões físicas               ││
│  └───────────────────────────┬─────────────────────────────────┘│
│                              │                                   │
│         ┌────────────────────┼────────────────────┐             │
│         │                    │                    │             │
│         ▼                    ▼                    ▼             │
│  ┌─────────────┐     ┌─────────────┐     ┌─────────────┐       │
│  │   MÉDICO    │     │ SECRETÁRIA  │     │ FINANCEIRO  │       │
│  │             │     │             │     │             │       │
│  │ • Prontuário│     │ • Agenda    │     │ • Faturas   │       │
│  │ • Evoluções │     │ • Cadastros │     │ • Relatórios│       │
│  │ • Prescrição│     │ • Confirmar │     │ • Pagamentos│       │
│  │ • Atestados │     │ • Telefone  │     │             │       │
│  └─────────────┘     └──────┬──────┘     └─────────────┘       │
│                             │                                   │
│                             │ Vínculo temporal                  │
│                             │ (renovação anual)                 │
│                             ▼                                   │
│                      ┌─────────────┐                            │
│                      │   MÉDICO    │                            │
│                      │ (vinculado) │                            │
│                      └─────────────┘                            │
│                                                                  │
│  ───────────────────────────────────────────────────────────── │
│                                                                  │
│                      ┌─────────────┐                            │
│                      │  PACIENTE   │                            │
│                      │             │                            │
│                      │ • Próprios  │                            │
│                      │   dados     │                            │
│                      │ • Autorizar │                            │
│                      │   médicos   │                            │
│                      └─────────────┘                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Vínculo Secretária-Médico

Conforme diretrizes do projeto, o vínculo secretária-médico deve:

1. Ter **critério temporal** (renovação anual)
2. Após 1 ano, enviar **notificação ao médico** para confirmar continuidade
3. Se não confirmado em 30 dias, **suspender acesso** automaticamente
4. Médico pode **revogar a qualquer momento**

---

## 5. Questões para Decisão do CEO

### 5.1 Sobre Tenants

1. **Dra. Letícia Uzeila deve ter seu próprio tenant ou ser usuária do tenant do Dr. André?**
   - Opção A: Tenant próprio (independência total)
   - Opção B: Usuária do tenant existente (compartilha pacientes)

2. **Pacientes podem ser compartilhados entre tenants?**
   - Se sim, como funciona a autorização?

### 5.2 Sobre Médicos

3. **Médicos colaboradores podem ver todos os pacientes ou apenas os que atenderam?**
   - Opção A: Todos os pacientes do tenant
   - Opção B: Apenas pacientes com atendimento registrado

4. **Médicos podem ter acesso ao módulo financeiro?**
   - Opção A: Sim, visualização completa
   - Opção B: Apenas seus próprios honorários
   - Opção C: Sem acesso

### 5.3 Sobre Pacientes

5. **Implementar Portal do Paciente na Fase 2?**
   - Prioridade alta, média ou baixa?

6. **Pacientes podem revogar acesso do médico titular?**
   - Opção A: Sim, a qualquer momento
   - Opção B: Não, apenas médicos convidados

### 5.4 Sobre Secretárias

7. **Secretária pode atender múltiplos médicos?**
   - Se sim, como gerenciar os vínculos?

8. **Secretária pode ver dados financeiros?**
   - Opção A: Sim, completo
   - Opção B: Apenas agendamentos e confirmações
   - Opção C: Configurável por médico

---

## 6. Próximos Passos Sugeridos

| # | Ação | Dependência |
|---|------|-------------|
| 1 | Definir modelo de tenant para Dra. Letícia | Decisão CEO |
| 2 | Criar usuários iniciais (secretária + Dra. Letícia) | Após definição |
| 3 | Implementar página de login/signup | - |
| 4 | Definir planos de assinatura | Decisão CEO |
| 5 | Implementar Portal do Paciente | Após Fase 2 |

---

**Aguardo seu input para prosseguir com as implementações.**

*Documento preparado por Manus AI em 19 de Janeiro de 2026*
