# Análise Detalhada de Vulnerabilidades - Sistema GORGEN

**Data:** 28 de Janeiro de 2026 | **Security Scorecard:** 7.85/10 | **Documento Interno**

---

## 1. Resumo do Security Scorecard

O Security Scorecard de **7.85/10** foi calculado com base em 11 categorias de segurança, ponderadas por impacto e criticidade. A nota está **0.15 pontos abaixo do mínimo recomendado de 8.0/10** para lançamento público, mas é aceitável para um beta restrito.

| Categoria | Nota | Peso | Contribuição | Gap |
|-----------|------|------|--------------|-----|
| SQL Injection | 9/10 | 10% | 0.90 | -0.10 |
| Validação de Entrada | 9/10 | 10% | 0.90 | -0.10 |
| CSRF | 6/10 | 5% | 0.30 | **-0.20** |
| Cookies | 8/10 | 5% | 0.40 | -0.10 |
| Criptografia PII | 7/10 | 15% | 1.05 | **-0.45** |
| Rate Limiting | 9/10 | 10% | 0.90 | -0.10 |
| Security Headers | 9/10 | 10% | 0.90 | -0.10 |
| Auditoria | 9/10 | 10% | 0.90 | -0.10 |
| Backup | 8/10 | 10% | 0.80 | -0.20 |
| MFA/2FA | 8/10 | 10% | 0.80 | -0.20 |
| Pentest | 0/10 | 5% | 0.00 | **-0.50** |
| **TOTAL** | | 100% | **7.85** | **-2.15** |

---

## 2. Vulnerabilidades Detalhadas

### 2.1 VULNERABILIDADE CRÍTICA: Ausência de Pentest Profissional

**Nota:** 0/10 | **Peso:** 5% | **Impacto no Score:** -0.50

**Descrição:**
O sistema nunca passou por um teste de penetração (pentest) profissional. Isso significa que vulnerabilidades desconhecidas podem existir e não foram identificadas por especialistas externos.

**Riscos:**
- Vulnerabilidades zero-day não detectadas
- Falhas de configuração em produção
- Vetores de ataque não considerados durante o desenvolvimento
- Exposição a ataques sofisticados

**Solução Proposta:**

| Ação | Prazo | Responsável | Custo Estimado |
|------|-------|-------------|----------------|
| Contratar empresa de pentest certificada (ex: Tempest, Cipher, Redbelt) | Até 14/02/2026 | Dr. André | R$ 15.000 - R$ 40.000 |
| Realizar pentest de caixa cinza (gray box) | 1-2 semanas | Empresa contratada | Incluso |
| Receber relatório de vulnerabilidades | Até 28/02/2026 | Empresa contratada | Incluso |
| Corrigir vulnerabilidades críticas e altas | Até 14/03/2026 | Desenvolvimento | Interno |
| Realizar re-teste para validar correções | Até 21/03/2026 | Empresa contratada | R$ 5.000 - R$ 10.000 |

**Código de Implementação:** N/A (serviço externo)

---

### 2.2 VULNERABILIDADE ALTA: Criptografia PII Dependente de Configuração

**Nota:** 7/10 | **Peso:** 15% | **Impacto no Score:** -0.45

**Descrição:**
A criptografia de dados PII (CPF, email, telefone) está implementada, mas depende da configuração correta das variáveis de ambiente `ENCRYPTION_KEY` e `HMAC_SECRET_KEY`. Se estas não estiverem configuradas, os dados são salvos em texto plano com apenas um warning no console.

**Riscos:**
- Dados PII expostos se as variáveis não estiverem configuradas
- Falha silenciosa (apenas warning, não erro)
- Possível inconsistência entre ambientes (dev vs prod)

**Solução Proposta:**

| Ação | Prazo | Responsável |
|------|-------|-------------|
| Verificar configuração em produção | Imediato | Dr. André |
| Implementar validação obrigatória na inicialização | 29/01/2026 | Desenvolvimento |
| Adicionar health check para criptografia | 30/01/2026 | Desenvolvimento |
| Documentar processo de rotação de chaves | 31/01/2026 | Desenvolvimento |

**Código de Implementação:**

```typescript
// server/index.ts - Adicionar na inicialização do servidor

function validateEncryptionConfig(): void {
  const encryptionKey = process.env.ENCRYPTION_KEY;
  const hmacKey = process.env.HMAC_SECRET_KEY;
  
  if (!encryptionKey || encryptionKey.length < 64) {
    console.error("❌ ERRO CRÍTICO: ENCRYPTION_KEY não configurada ou inválida");
    console.error("   A chave deve ter pelo menos 64 caracteres hexadecimais");
    process.exit(1);
  }
  
  if (!hmacKey || hmacKey.length < 32) {
    console.error("❌ ERRO CRÍTICO: HMAC_SECRET_KEY não configurada ou inválida");
    console.error("   A chave deve ter pelo menos 32 caracteres");
    process.exit(1);
  }
  
  console.log("✅ Configuração de criptografia validada");
}

// Chamar antes de iniciar o servidor
validateEncryptionConfig();
```

---

### 2.3 VULNERABILIDADE MÉDIA: Proteção CSRF Implícita

**Nota:** 6/10 | **Peso:** 5% | **Impacto no Score:** -0.20

**Descrição:**
O sistema não implementa tokens CSRF explícitos. A proteção atual é implícita, baseada em:
- Cookies com `sameSite: "none"` (necessário para OAuth)
- Autenticação via JWT/sessão
- tRPC que usa POST para mutations

**Riscos:**
- Ataques CSRF em navegadores antigos que não suportam SameSite
- Possível bypass em cenários específicos de OAuth
- Não conformidade com melhores práticas OWASP

**Solução Proposta:**

| Ação | Prazo | Responsável |
|------|-------|-------------|
| Implementar token CSRF para formulários críticos | 05/02/2026 | Desenvolvimento |
| Adicionar header X-CSRF-Token nas requisições | 05/02/2026 | Desenvolvimento |
| Validar token no middleware de autenticação | 05/02/2026 | Desenvolvimento |

**Código de Implementação:**

```typescript
// server/_core/csrf.ts - Novo arquivo

import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';

const CSRF_TOKEN_LENGTH = 32;
const CSRF_COOKIE_NAME = 'gorgen_csrf';
const CSRF_HEADER_NAME = 'x-csrf-token';

export function generateCsrfToken(): string {
  return crypto.randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
}

export function csrfMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Ignorar para métodos seguros (GET, HEAD, OPTIONS)
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }
  
  // Ignorar para rotas de autenticação OAuth (callback)
  if (req.path.includes('/auth/callback')) {
    return next();
  }
  
  const cookieToken = req.cookies[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];
  
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    res.status(403).json({ error: 'CSRF token inválido ou ausente' });
    return;
  }
  
  next();
}

export function setCsrfCookie(req: Request, res: Response): string {
  const token = generateCsrfToken();
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Precisa ser acessível pelo JavaScript
    secure: req.protocol === 'https',
    sameSite: 'strict',
    path: '/',
  });
  return token;
}
```

```typescript
// client/src/lib/api.ts - Adicionar ao cliente

// Obter token CSRF do cookie
function getCsrfToken(): string | null {
  const match = document.cookie.match(/gorgen_csrf=([^;]+)/);
  return match ? match[1] : null;
}

// Adicionar header em todas as requisições
const originalFetch = window.fetch;
window.fetch = function(input, init) {
  const csrfToken = getCsrfToken();
  if (csrfToken && init?.method && !['GET', 'HEAD', 'OPTIONS'].includes(init.method)) {
    init.headers = {
      ...init.headers,
      'x-csrf-token': csrfToken,
    };
  }
  return originalFetch(input, init);
};
```

---

### 2.4 VULNERABILIDADE MÉDIA: Backup sem Verificação de Integridade

**Nota:** 8/10 | **Peso:** 10% | **Impacto no Score:** -0.20

**Descrição:**
O sistema de backup está implementado e funcional, mas não possui verificação automática de integridade dos backups gerados. Também não há teste automatizado de restauração.

**Riscos:**
- Backups corrompidos não detectados
- Falha na restauração em caso de desastre
- Tempo de recuperação (RTO) desconhecido

**Solução Proposta:**

| Ação | Prazo | Responsável |
|------|-------|-------------|
| Implementar checksum SHA-256 nos backups | 03/02/2026 | Desenvolvimento |
| Criar job de verificação semanal de integridade | 05/02/2026 | Desenvolvimento |
| Documentar e testar procedimento de restauração | 07/02/2026 | Dr. André + Dev |
| Criar alerta se verificação falhar | 05/02/2026 | Desenvolvimento |

**Código de Implementação:**

```typescript
// server/backup.ts - Adicionar funções de verificação

import crypto from 'crypto';
import fs from 'fs';

export function calculateBackupChecksum(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    
    stream.on('data', (data) => hash.update(data));
    stream.on('end', () => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

export async function verifyBackupIntegrity(
  filePath: string, 
  expectedChecksum: string
): Promise<boolean> {
  const actualChecksum = await calculateBackupChecksum(filePath);
  return actualChecksum === expectedChecksum;
}

export async function testBackupRestoration(backupId: number): Promise<{
  success: boolean;
  duration: number;
  error?: string;
}> {
  const startTime = Date.now();
  
  try {
    // 1. Criar banco de dados temporário para teste
    const testDbName = `gorgen_restore_test_${Date.now()}`;
    
    // 2. Restaurar backup no banco temporário
    // ... (implementar lógica de restauração)
    
    // 3. Verificar integridade dos dados restaurados
    // ... (verificar contagem de registros, checksums, etc.)
    
    // 4. Limpar banco temporário
    // ... (DROP DATABASE)
    
    return {
      success: true,
      duration: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}
```

---

### 2.5 VULNERABILIDADE MÉDIA: MFA/2FA Não Obrigatório

**Nota:** 8/10 | **Peso:** 10% | **Impacto no Score:** -0.20

**Descrição:**
O MFA/2FA está implementado, mas não é obrigatório para nenhum perfil de usuário. Isso significa que contas de administradores e médicos podem operar sem a camada adicional de segurança.

**Riscos:**
- Contas privilegiadas vulneráveis a phishing
- Comprometimento de credenciais sem segunda barreira
- Não conformidade com melhores práticas para dados de saúde

**Solução Proposta:**

| Ação | Prazo | Responsável |
|------|-------|-------------|
| Tornar MFA obrigatório para admin_master | 03/02/2026 | Desenvolvimento |
| Tornar MFA obrigatório para médicos | 10/02/2026 | Desenvolvimento |
| Criar fluxo de configuração de MFA no primeiro login | 05/02/2026 | Desenvolvimento |
| Implementar backup codes para recuperação | 07/02/2026 | Desenvolvimento |

**Código de Implementação:**

```typescript
// server/auth-router.ts - Adicionar verificação de MFA obrigatório

const ROLES_REQUIRING_MFA = ['admin_master', 'admin', 'medico'];

export async function checkMfaRequirement(userId: number, role: string): Promise<{
  required: boolean;
  configured: boolean;
  enforced: boolean;
}> {
  const required = ROLES_REQUIRING_MFA.includes(role);
  
  if (!required) {
    return { required: false, configured: false, enforced: false };
  }
  
  const mfaConfig = await getTwoFactorConfig(userId);
  const configured = mfaConfig?.enabled ?? false;
  
  return {
    required: true,
    configured,
    enforced: required && !configured, // Força configuração se necessário
  };
}

// Middleware para forçar configuração de MFA
export function enforceMfaMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = req.user;
  
  if (!user) {
    return next();
  }
  
  // Permitir acesso às rotas de configuração de MFA
  if (req.path.includes('/auth/2fa/setup') || req.path.includes('/auth/2fa/verify')) {
    return next();
  }
  
  const mfaStatus = await checkMfaRequirement(user.id, user.role);
  
  if (mfaStatus.enforced) {
    res.status(403).json({
      error: 'MFA_REQUIRED',
      message: 'Você precisa configurar a autenticação de dois fatores para continuar',
      redirectTo: '/configuracoes/seguranca/2fa',
    });
    return;
  }
  
  next();
}
```

---

### 2.6 VULNERABILIDADE BAIXA: Cookies com SameSite=None

**Nota:** 8/10 | **Peso:** 5% | **Impacto no Score:** -0.10

**Descrição:**
Os cookies de sessão estão configurados com `sameSite: "none"`, o que é necessário para o fluxo de OAuth funcionar corretamente. No entanto, isso reduz a proteção contra CSRF em comparação com `sameSite: "strict"`.

**Riscos:**
- Menor proteção contra CSRF
- Cookies enviados em requisições cross-site

**Solução Proposta:**

| Ação | Prazo | Responsável |
|------|-------|-------------|
| Usar SameSite=Lax para sessão principal | 10/02/2026 | Desenvolvimento |
| Criar cookie separado para OAuth com SameSite=None | 10/02/2026 | Desenvolvimento |
| Implementar proteção CSRF explícita (ver 2.3) | 05/02/2026 | Desenvolvimento |

---

## 3. Matriz de Priorização

| Vulnerabilidade | Severidade | Esforço | Prioridade | Prazo |
|-----------------|------------|---------|------------|-------|
| Pentest Profissional | Crítica | Alto (externo) | 1 | 14/02/2026 |
| Validação de Criptografia | Alta | Baixo | 2 | 29/01/2026 |
| Proteção CSRF | Média | Médio | 3 | 05/02/2026 |
| Verificação de Backup | Média | Médio | 4 | 07/02/2026 |
| MFA Obrigatório | Média | Médio | 5 | 10/02/2026 |
| Cookies SameSite | Baixa | Baixo | 6 | 10/02/2026 |

---

## 4. Impacto Esperado no Security Scorecard

Após implementação de todas as soluções propostas:

| Categoria | Nota Atual | Nota Esperada | Melhoria |
|-----------|------------|---------------|----------|
| CSRF | 6/10 | 9/10 | +0.15 |
| Criptografia PII | 7/10 | 9/10 | +0.30 |
| Backup | 8/10 | 9/10 | +0.10 |
| MFA/2FA | 8/10 | 9/10 | +0.10 |
| Pentest | 0/10 | 8/10 | +0.40 |
| **TOTAL** | **7.85/10** | **8.90/10** | **+1.05** |

---

## 5. Cronograma de Implementação

```
Semana 1 (28/01 - 31/01):
├── 29/01: Validação de criptografia obrigatória
├── 30/01: Health check para criptografia
└── 31/01: Documentação de rotação de chaves

Semana 2 (03/02 - 07/02):
├── 03/02: Checksum de backups + MFA obrigatório admin
├── 05/02: Proteção CSRF + Job de verificação de backup
└── 07/02: Teste de restauração + Backup codes MFA

Semana 3 (10/02 - 14/02):
├── 10/02: MFA obrigatório médicos + Cookies SameSite
└── 14/02: Início do pentest profissional

Semana 4 (17/02 - 21/02):
└── Pentest em andamento

Semana 5 (24/02 - 28/02):
├── 24/02: Recebimento do relatório de pentest
└── 28/02: Correção de vulnerabilidades críticas

Semana 6 (03/03 - 07/03):
└── Re-teste de pentest
```

---

## 6. Referências

- OWASP Top 10 2021: https://owasp.org/Top10/
- OWASP CSRF Prevention Cheat Sheet: https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html
- NIST Cryptographic Standards: https://csrc.nist.gov/publications/detail/sp/800-175b/rev-1/final
- LGPD - Lei Geral de Proteção de Dados: http://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm
