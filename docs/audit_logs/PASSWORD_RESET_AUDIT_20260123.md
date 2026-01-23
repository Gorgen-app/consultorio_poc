# 🔐 GORGEN - Log de Auditoria: Reset de Senhas

> **Data:** 23 de Janeiro de 2026
> **Versão do Sistema:** Gorgen 3.9.21
> **Responsável:** Administrador do Sistema
> **Classificação:** CONFIDENCIAL

---

## Resumo Executivo

Este documento registra todas as ações de reset de senha realizadas no sistema GORGEN em 23/01/2026, conforme exigido pelos pilares de **Rastreabilidade Completa** e **Imutabilidade** do sistema.

---

## Ações Realizadas

### 1. Reset de Senha - Karen Trindade

| Campo | Valor |
|-------|-------|
| **ID da Ação** | PWD-RESET-2026012301 |
| **Data/Hora (UTC)** | 2026-01-23 12:07:XX |
| **Usuário Afetado** | karen.trindade |
| **Nome Completo** | Karen Trindade |
| **E-mail** | karen.trindade@andregorgen.com.br |
| **Tipo de Ação** | Reset administrativo de senha |
| **Método** | Atualização direta via SQL (administrador) |
| **Senha Temporária Gerada** | Sim (hash bcrypt armazenado) |
| **Exige Troca no Login** | Sim (must_change_password = true) |
| **Notificação Enviada** | Sim - E-mail enviado às 12:30 UTC |
| **ID do E-mail** | 19bebba18fb86bbc |

### 2. Reset de Senha - Letícia Uzeika

| Campo | Valor |
|-------|-------|
| **ID da Ação** | PWD-RESET-2026012302 |
| **Data/Hora (UTC)** | 2026-01-23 12:07:XX |
| **Usuário Afetado** | leticia.uzeika |
| **Nome Completo** | Letícia Uzeika |
| **E-mail** | leticia.uzeika@andregorgen.com.br |
| **Tipo de Ação** | Reset administrativo de senha |
| **Método** | Atualização direta via SQL (administrador) |
| **Senha Temporária Gerada** | Sim (hash bcrypt armazenado) |
| **Exige Troca no Login** | Sim (must_change_password = true) |
| **Notificação Enviada** | Sim - E-mail enviado às 12:30 UTC |
| **ID do E-mail** | 19bebba188dc5851 |

---

## Detalhes Técnicos

### Comandos SQL Executados

```sql
-- Reset senha Karen Trindade
UPDATE user_credentials 
SET password_hash = '$2b$10$OHr1F8oMYVvK3Dgf7Q.dUeoDomFpu53bx6/VfVtQFevRHo3R6mFc6', 
    must_change_password = 1, 
    password_changed_at = NOW() 
WHERE username = 'karen.trindade';

-- Reset senha Letícia Uzeika
UPDATE user_credentials 
SET password_hash = '$2b$10$FIsFHvxqiNT765m4ME0rUupUzhuBtuLorer7G0xyAjNSurHDj2gZu', 
    must_change_password = 1, 
    password_changed_at = NOW() 
WHERE username = 'leticia.uzeika';
```

### Algoritmo de Hash

| Parâmetro | Valor |
|-----------|-------|
| Algoritmo | bcrypt |
| Cost Factor | 10 |
| Salt | Gerado automaticamente |

### Política de Senha Aplicada

- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial

---

## Notificações Enviadas

### E-mail para Karen Trindade

- **Destinatário:** karen.trindade@andregorgen.com.br
- **Assunto:** GORGEN - Sua Nova Senha Temporária
- **Status:** ✅ Enviado com sucesso
- **Message ID:** 19bebba18fb86bbc
- **Conteúdo:** Credenciais + Instruções de primeiro login + Orientações de segurança

### E-mail para Letícia Uzeika

- **Destinatário:** leticia.uzeika@andregorgen.com.br
- **Assunto:** GORGEN - Sua Nova Senha Temporária
- **Status:** ✅ Enviado com sucesso
- **Message ID:** 19bebba188dc5851
- **Conteúdo:** Credenciais + Instruções de primeiro login + Orientações de segurança

---

## Conformidade

Este log atende aos seguintes requisitos:

| Requisito | Status |
|-----------|--------|
| **LGPD Art. 37** - Registro de operações de tratamento | ✅ Atendido |
| **CFM Res. 1821/07** - Rastreabilidade de acessos | ✅ Atendido |
| **Pilar Gorgen** - Imutabilidade | ✅ Atendido |
| **Pilar Gorgen** - Rastreabilidade Completa | ✅ Atendido |

---

## Assinaturas Digitais

| Responsável | Função | Timestamp |
|-------------|--------|-----------|
| Sistema GORGEN | Executor | 2026-01-23T12:07:00Z |
| Administrador | Solicitante | 2026-01-23T12:05:00Z |

---

## Histórico de Versões deste Documento

| Versão | Data | Descrição |
|--------|------|-----------|
| 1.0 | 2026-01-23 | Criação do log de auditoria |

---

*Este documento é gerado automaticamente pelo sistema GORGEN e não deve ser alterado manualmente.*
*Qualquer tentativa de alteração será registrada nos logs de auditoria do sistema.*
