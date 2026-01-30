# 🔒 Auditoria de Segurança - GORGEN
**Data:** 30/01/2026  
**Total de Vulnerabilidades:** 30 (12 Alta, 16 Moderada, 2 Baixa)

---

## 🚨 Vulnerabilidades de Alta Severidade (12)

### 1. pnpm - Command Injection (3 vulnerabilidades)
| Campo | Valor |
|-------|-------|
| **Pacote** | pnpm |
| **Versão Vulnerável** | 10.18.0 |
| **Versão Corrigida** | ≥10.27.0 |
| **CVEs** | GHSA-2phv-j68v-wwqx, GHSA-379q-355j-w6rj, GHSA-7vhp-vf5g-r2fw |
| **Impacto** | Command Injection via environment variable, Bypass de lifecycle scripts, Lockfile Integrity Bypass |

**Mitigação Imediata:**
```bash
pnpm self-update
# ou
npm install -g pnpm@latest
```

---

### 2. node-tar - Path Traversal (4 vulnerabilidades)
| Campo | Valor |
|-------|-------|
| **Pacote** | tar |
| **Versão Vulnerável** | 7.5.1 |
| **Versão Corrigida** | ≥7.5.7 |
| **Via** | @tailwindcss/vite → @tailwindcss/oxide → tar |
| **CVEs** | GHSA-8qq5-rm4j-mr97, GHSA-r6q2-hw4h-h46w, GHSA-xxxx |
| **Impacto** | Arbitrary File Overwrite, Symlink Poisoning, Hardlink Path Traversal |

**Mitigação Imediata:**
```bash
pnpm update @tailwindcss/vite @tailwindcss/oxide
```

---

### 3. qs - DoS via Memory Exhaustion
| Campo | Valor |
|-------|-------|
| **Pacote** | qs |
| **Versão Vulnerável** | 6.13.0 |
| **Versão Corrigida** | ≥6.14.1 |
| **Via** | express → body-parser → qs |
| **CVE** | GHSA-6rw7-vpxm-498p |
| **Impacto** | Denial of Service via arrayLimit bypass |

**Mitigação Imediata:**
```bash
pnpm update express
```

---

### 4. @trpc/server - Vulnerabilidade de Segurança
| Campo | Valor |
|-------|-------|
| **Pacote** | @trpc/server |
| **Versão Vulnerável** | 11.6.0 |
| **CVE** | GHSA-43p4-m455-4f4j |
| **Impacto** | Verificar advisory para detalhes |

**Mitigação Imediata:**
```bash
pnpm update @trpc/server @trpc/client @trpc/react-query
```

---

### 5. xlsx - Vulnerabilidades de Parsing (2 vulnerabilidades)
| Campo | Valor |
|-------|-------|
| **Pacote** | xlsx |
| **CVEs** | GHSA-xxxx (verificar) |
| **Impacto** | Parsing vulnerabilities em arquivos Excel |

**Mitigação Imediata:**
```bash
pnpm update xlsx
# ou considerar alternativa: exceljs
```

---

### 6. vite - Server-Side Request Forgery
| Campo | Valor |
|-------|-------|
| **Pacote** | vite |
| **Via** | vitest → vite |
| **CVEs** | GHSA-xxxx |
| **Impacto** | SSRF em ambiente de desenvolvimento |

**Mitigação Imediata:**
```bash
pnpm update vite vitest
```

---

### 7. esbuild - Vulnerabilidade
| Campo | Valor |
|-------|-------|
| **Pacote** | esbuild |
| **Via** | drizzle-kit → @esbuild-kit → esbuild |
| **CVE** | GHSA-xxxx |

**Mitigação Imediata:**
```bash
pnpm update drizzle-kit
```

---

## 📋 Plano de Mitigação Imediata

### Passo 1: Atualizar pnpm globalmente
```bash
npm install -g pnpm@latest
```

### Passo 2: Atualizar dependências críticas
```bash
cd /home/ubuntu/consultorio_poc
pnpm update @tailwindcss/vite @tailwindcss/oxide
pnpm update express
pnpm update @trpc/server @trpc/client @trpc/react-query
pnpm update vite vitest
pnpm update xlsx
pnpm update drizzle-kit
```

### Passo 3: Verificar se resolveu
```bash
pnpm audit
```

### Passo 4: Se necessário, forçar resoluções
Adicionar ao `package.json`:
```json
"pnpm": {
  "overrides": {
    "tar": ">=7.5.7",
    "qs": ">=6.14.1"
  }
}
```

---

## ⚠️ Notas Importantes

1. **pnpm** é uma dependência de desenvolvimento - o risco em produção é menor
2. **tar** é transitiva via Tailwind - atualizar Tailwind deve resolver
3. **qs** é transitiva via Express - atualizar Express deve resolver
4. **xlsx** pode requerer migração para alternativa mais segura (exceljs)

---

## 🔄 Próxima Auditoria
Agendar para: **06/02/2026**
