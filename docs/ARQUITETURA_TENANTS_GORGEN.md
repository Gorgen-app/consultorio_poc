# GORGEN - Arquitetura de Tenants e Modelo de Dados

> **Documento de Arquitetura** | Versão 1.0 | 19 de Janeiro de 2026  
> **Status**: Aprovado pelo CEO  
> **Autor**: Manus AI

---

## 1. Sumário Executivo

Este documento define a arquitetura de multi-tenancy do GORGEN, estabelecendo como pacientes, médicos e secretárias interagem com a plataforma. O modelo adotado é **centrado no paciente**, onde o prontuário médico é propriedade do paciente e fica sob custódia da plataforma, com acesso concedido explicitamente aos médicos autorizados.

Esta abordagem diferencia o GORGEN de sistemas tradicionais centrados no médico, alinhando-se com a Lei Geral de Proteção de Dados (LGPD) e com as melhores práticas internacionais de saúde digital.

---

## 2. Definições Fundamentais

### 2.1 O que é um Tenant

Um **tenant** no GORGEN representa um espaço isolado de dados associado a um CPF. Cada tenant possui seus próprios dados, configurações e permissões, garantindo isolamento e segurança.

### 2.2 Tipos de Tenant

| Tipo | Criação | Proprietário | Conteúdo Principal |
|------|---------|--------------|-------------------|
| **Tenant Paciente** | Ao cadastrar CPF como paciente | Pessoa física (paciente) | Prontuário médico completo |
| **Tenant Médico** | Ao cadastrar CPF como médico | Pessoa física (médico) | Agenda, faturamento, configurações |

### 2.3 Entidades sem Tenant Próprio

| Entidade | Motivo | Vínculo |
|----------|--------|---------|
| **Secretária** | Trabalha sob supervisão do médico | Vinculada ao tenant do médico |
| **Auditor** | Acesso temporário para auditoria | Permissão específica por tenant |

---

## 3. Arquitetura do Tenant Paciente

### 3.1 Princípio Fundamental

> **"O prontuário médico é propriedade do paciente. A plataforma é custodiante. Os médicos são autorizados."**

Este princípio estabelece que todos os dados clínicos de um paciente residem no tenant do paciente, não no tenant do médico. Os médicos registram informações no tenant do paciente mediante autorização.

### 3.2 Conteúdo do Tenant Paciente

O tenant do paciente contém todos os dados relacionados à sua saúde:

| Categoria | Dados |
|-----------|-------|
| **Identificação** | Nome, CPF, data de nascimento, contatos |
| **Prontuário** | Evoluções médicas, anamneses, exames físicos |
| **Exames** | Resultados laboratoriais, imagens, laudos |
| **Prescrições** | Receitas, medicamentos em uso |
| **Documentos** | Atestados, encaminhamentos, relatórios |
| **Histórico** | Cirurgias, internações, alergias, patologias |
| **Autorizações** | Lista de médicos autorizados e status |

### 3.3 Criação do Tenant Paciente

O tenant do paciente é criado automaticamente quando um CPF é inserido na plataforma pela primeira vez, seja pelo próprio paciente ou por um médico.

| Cenário | Ação | Status do Tenant |
|---------|------|------------------|
| Paciente se cadastra | Tenant criado imediatamente | **Ativo** |
| Médico cadastra CPF do paciente | Tenant criado automaticamente | **Pendente de Consentimento** |

Quando o tenant é criado por um médico, ele permanece em status "Pendente de Consentimento" por **30 dias**. Durante este período, o médico pode registrar informações, mas o paciente deve confirmar o cadastro para que o tenant se torne permanente.

### 3.4 Sistema de Autorizações

O paciente controla quem pode acessar seu prontuário através de um sistema de autorizações explícitas.

| Ação | Quem Executa | Efeito |
|------|--------------|--------|
| **Conceder acesso** | Paciente | Médico ganha acesso total ao prontuário |
| **Revogar acesso** | Paciente | Médico perde acesso ao prontuário |
| **Autorização automática** | Sistema | Médico que cadastrou o paciente recebe autorização inicial |

#### Regras de Revogação

Quando um paciente revoga o acesso de um médico:

1. O médico **perde** acesso ao prontuário completo
2. O médico **mantém** acesso de leitura às evoluções que ele próprio registrou (para fins de defesa legal)
3. O médico **não pode** mais registrar novas informações

---

## 4. Arquitetura do Tenant Médico

### 4.1 Conteúdo do Tenant Médico

O tenant do médico contém dados administrativos e operacionais:

| Categoria | Dados |
|-----------|-------|
| **Identificação** | Nome, CPF, CRM, especialidades |
| **Agenda** | Horários, bloqueios, configurações |
| **Faturamento** | Honorários, guias, contas a receber |
| **Secretárias** | Usuários vinculados (máximo 2) |
| **Configurações** | Preferências, templates, integrações |

### 4.2 O que NÃO fica no Tenant Médico

É importante ressaltar que o tenant do médico **não contém** dados clínicos de pacientes. Todas as evoluções, prescrições e documentos médicos ficam no tenant do respectivo paciente.

### 4.3 Relacionamento com Pacientes

O médico acessa os dados dos pacientes através de autorizações, não através de cópia de dados.

```
┌─────────────────────┐
│   TENANT MÉDICO     │
│   Dr. André Gorgen  │
│                     │
│ • Agenda            │
│ • Faturamento       │
│ • Secretárias       │
└─────────┬───────────┘
          │
          │ AUTORIZAÇÃO
          │ (concedida pelo paciente)
          ▼
┌─────────────────────┐
│  TENANT PACIENTE    │
│  João Silva         │
│                     │
│ • Prontuário ◄──────┼── Médico registra aqui
│ • Exames            │
│ • Prescrições       │
└─────────────────────┘
```

---

## 5. Secretárias

### 5.1 Modelo de Vínculo

As secretárias não possuem tenant próprio. Elas trabalham sob o tenant do médico ao qual estão vinculadas.

| Aspecto | Definição |
|---------|-----------|
| **Tenant próprio** | Não |
| **Limite por médico** | 2 secretárias |
| **Duração do vínculo** | 12 meses (renovação anual) |
| **Renovação** | Notificação ao médico 30 dias antes do vencimento |

### 5.2 Permissões da Secretária

A secretária herda permissões do médico, com algumas restrições:

| Permissão | Secretária |
|-----------|------------|
| Visualizar agenda | ✅ |
| Agendar consultas | ✅ |
| Visualizar lista de pacientes | ✅ |
| Acessar prontuário | ⚠️ Configurável pelo médico |
| Registrar evoluções | ❌ |
| Prescrever medicamentos | ❌ |
| Acessar faturamento | ⚠️ Configurável pelo médico |
| Alterar configurações | ❌ |

### 5.3 Troca de Secretária

Como o limite é de 2 secretárias por médico, a troca requer intervenção administrativa:

1. Médico solicita desvinculação da secretária atual
2. Administrador (ou médico) remove o vínculo
3. Médico pode vincular nova secretária

---

## 6. Fluxo de Dados entre Tenants

### 6.1 Consulta Médica

Quando um médico atende um paciente, o fluxo de dados segue este padrão:

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO DE CONSULTA MÉDICA                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. AGENDAMENTO                                                 │
│     ┌─────────────────┐                                         │
│     │ Tenant Médico   │ ← Consulta registrada na agenda         │
│     └─────────────────┘                                         │
│                                                                  │
│  2. ATENDIMENTO                                                 │
│     ┌─────────────────┐      ┌─────────────────┐               │
│     │ Tenant Médico   │ ───► │ Tenant Paciente │               │
│     │ (lê autorização)│      │ (recebe dados)  │               │
│     └─────────────────┘      └─────────────────┘               │
│                                                                  │
│  3. REGISTRO                                                    │
│     ┌─────────────────┐                                         │
│     │ Tenant Paciente │ ← Evolução salva com assinatura médico │
│     └─────────────────┘                                         │
│                                                                  │
│  4. FATURAMENTO                                                 │
│     ┌─────────────────┐                                         │
│     │ Tenant Médico   │ ← Honorário registrado                  │
│     └─────────────────┘                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 Compartilhamento entre Médicos

Quando múltiplos médicos atendem o mesmo paciente, todos acessam o mesmo prontuário:

```
┌─────────────────────────────────────────────────────────────────┐
│              COMPARTILHAMENTO ENTRE MÉDICOS                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────┐                   ┌─────────────────┐      │
│  │ Tenant Médico   │                   │ Tenant Médico   │      │
│  │ Dr. André       │                   │ Dra. Letícia    │      │
│  │ (Cardiologista) │                   │ (Endocrino)     │      │
│  └────────┬────────┘                   └────────┬────────┘      │
│           │                                     │                │
│           │ AUTORIZAÇÃO                AUTORIZAÇÃO               │
│           │                                     │                │
│           ▼                                     ▼                │
│  ┌───────────────────────────────────────────────────────┐      │
│  │                  TENANT PACIENTE                       │      │
│  │                    João Silva                          │      │
│  │                                                        │      │
│  │  PRONTUÁRIO UNIFICADO:                                │      │
│  │  ├── 01/01/2026 - Evolução Dr. André (Cardio)        │      │
│  │  ├── 10/01/2026 - Exame ECG (upload paciente)        │      │
│  │  ├── 15/01/2026 - Evolução Dra. Letícia (Endocrino)  │      │
│  │  └── 18/01/2026 - Prescrição Dr. André               │      │
│  │                                                        │      │
│  │  BENEFÍCIOS:                                          │      │
│  │  • Dra. Letícia vê histórico cardiológico            │      │
│  │  • Dr. André vê resultados endocrinológicos          │      │
│  │  • Evita exames duplicados                           │      │
│  │  • Melhora continuidade do cuidado                   │      │
│  └───────────────────────────────────────────────────────┘      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 7. Modelo de Precificação por Tenant

### 7.1 Pacientes

| Aspecto | Valor |
|---------|-------|
| **Preço mensal** | R$ 9,90 |
| **Preço anual** | R$ 89,90 (24% desconto) |
| **Justificativa** | Preço simbólico ("no-brainer") para maximizar adoção |

O paciente paga para:
- Ter seu prontuário organizado em um só lugar
- Fazer upload de exames
- Acompanhar consultas passadas e futuras
- Autorizar/revogar acesso de médicos

### 7.2 Médicos

| Plano | Mensal | Anual | Desconto |
|-------|--------|-------|----------|
| **Essencial** | R$ 197 | R$ 1.770 | 25% |
| **Profissional** | R$ 347 | R$ 2.997 | 28% |
| **Clínica** | R$ 597 | R$ 4.997 | 30% |

O médico paga para:
- Gerenciar sua agenda
- Acessar prontuários de pacientes autorizados
- Registrar evoluções e prescrições
- Faturar consultas
- Ter até 2 secretárias vinculadas

### 7.3 Secretárias

| Aspecto | Valor |
|---------|-------|
| **Preço** | Gratuito |
| **Limite por médico** | 2 |
| **Renovação** | Anual (12 meses) |

---

## 8. Segurança e Conformidade

### 8.1 Isolamento de Dados

Cada tenant possui isolamento completo:

| Aspecto | Implementação |
|---------|---------------|
| **Banco de dados** | Filtro por `tenant_id` em todas as queries |
| **APIs** | Validação de autorização em cada endpoint |
| **Logs** | Auditoria completa de acessos cross-tenant |

### 8.2 Conformidade LGPD

O modelo centrado no paciente atende aos requisitos da LGPD:

| Requisito LGPD | Implementação GORGEN |
|----------------|---------------------|
| **Consentimento** | Autorização explícita para cada médico |
| **Portabilidade** | Paciente pode exportar todos os dados |
| **Revogação** | Paciente pode revogar acesso a qualquer momento |
| **Transparência** | Log de todos os acessos visível ao paciente |
| **Minimização** | Médico só acessa dados de pacientes autorizados |

### 8.3 Auditoria

Todos os acessos entre tenants são registrados:

| Evento | Dados Registrados |
|--------|-------------------|
| Acesso ao prontuário | Quem, quando, qual paciente, qual ação |
| Registro de evolução | Autor, data/hora, conteúdo (hash) |
| Concessão de autorização | Paciente, médico, data, validade |
| Revogação de autorização | Paciente, médico, data, motivo |

---

## 9. Implementação Técnica

### 9.1 Estrutura de Tabelas

```sql
-- Tabela de Tenants
CREATE TABLE tenants (
  id INT PRIMARY KEY AUTO_INCREMENT,
  cpf VARCHAR(14) UNIQUE NOT NULL,
  tipo ENUM('paciente', 'medico') NOT NULL,
  status ENUM('ativo', 'pendente_consentimento', 'suspenso') DEFAULT 'ativo',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Autorizações
CREATE TABLE autorizacoes_prontuario (
  id INT PRIMARY KEY AUTO_INCREMENT,
  paciente_tenant_id INT NOT NULL,
  medico_tenant_id INT NOT NULL,
  status ENUM('ativo', 'revogado', 'pendente') DEFAULT 'pendente',
  data_concessao TIMESTAMP,
  data_revogacao TIMESTAMP,
  motivo_revogacao TEXT,
  FOREIGN KEY (paciente_tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (medico_tenant_id) REFERENCES tenants(id)
);

-- Tabela de Vínculos Secretária-Médico
CREATE TABLE vinculo_secretaria_medico (
  id INT PRIMARY KEY AUTO_INCREMENT,
  secretaria_user_id INT NOT NULL,
  medico_tenant_id INT NOT NULL,
  data_inicio DATE NOT NULL,
  data_validade DATE NOT NULL,
  status ENUM('ativo', 'pendente_renovacao', 'expirado') DEFAULT 'ativo',
  FOREIGN KEY (medico_tenant_id) REFERENCES tenants(id)
);
```

### 9.2 Validação de Acesso

Toda operação que envolve dados de paciente deve validar:

```typescript
async function validarAcessoProntuario(
  medicoTenantId: number,
  pacienteTenantId: number
): Promise<boolean> {
  const autorizacao = await db.query(`
    SELECT * FROM autorizacoes_prontuario
    WHERE paciente_tenant_id = ?
      AND medico_tenant_id = ?
      AND status = 'ativo'
  `, [pacienteTenantId, medicoTenantId]);
  
  return autorizacao.length > 0;
}
```

---

## 10. Roadmap de Implementação

### Fase 1: MVP (Janeiro 2026)

| Item | Status |
|------|--------|
| Tenant de médico | ✅ Implementado |
| Tenant de paciente (básico) | ⚠️ Parcial |
| Sistema de autorizações | 🔲 Pendente |
| Limite de secretárias | 🔲 Pendente |

### Fase 2: Compartilhamento (Fevereiro 2026)

| Item | Status |
|------|--------|
| Múltiplos médicos por paciente | 🔲 Pendente |
| Visualização cross-tenant | 🔲 Pendente |
| Auditoria de acessos | 🔲 Pendente |

### Fase 3: Portal do Paciente (Março 2026)

| Item | Status |
|------|--------|
| Upload de exames pelo paciente | 🔲 Pendente |
| Gestão de autorizações pelo paciente | 🔲 Pendente |
| Visualização do prontuário pelo paciente | 🔲 Pendente |

---

## 11. Glossário

| Termo | Definição |
|-------|-----------|
| **Tenant** | Espaço isolado de dados associado a um CPF |
| **Autorização** | Permissão concedida pelo paciente ao médico |
| **Prontuário** | Conjunto de dados clínicos do paciente |
| **Custódia** | Responsabilidade de guarda dos dados (plataforma) |
| **Propriedade** | Direito sobre os dados (paciente) |

---

## 12. Aprovações

| Papel | Nome | Data | Status |
|-------|------|------|--------|
| CEO | Dr. André Gorgen | 19/01/2026 | ✅ Aprovado |
| Arquiteto | Manus AI | 19/01/2026 | ✅ Documentado |

---

*Documento preparado por Manus AI em 19 de Janeiro de 2026*  
*Versão 1.0 - Aprovado*
