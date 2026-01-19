# Configuração do Domínio gorgen.com.br

> **Guia de Configuração** | 19 de Janeiro de 2026

---

## 1. Visão Geral

O GORGEN está hospedado na infraestrutura do Manus, que oferece hospedagem integrada com suporte a domínios customizados e SSL automático.

---

## 2. Pré-requisitos

- ✅ Domínio **gorgen.com.br** registrado (confirmado pelo CEO)
- ✅ Acesso ao painel de DNS do registrador do domínio
- ✅ Projeto GORGEN publicado no Manus

---

## 3. Passo a Passo

### 3.1 No Painel do Manus

1. Acesse o projeto GORGEN no Manus
2. Clique no ícone de **Settings** (engrenagem) no painel direito
3. Navegue até **Domains** no menu lateral
4. Clique em **Add Custom Domain**
5. Digite: `gorgen.com.br`
6. Clique em **Add**
7. O sistema mostrará os registros DNS necessários

### 3.2 Registros DNS Necessários

Configure os seguintes registros no painel do seu registrador de domínio:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| **CNAME** | `www` | `cname.manus.space` | 3600 |
| **A** | `@` | (IP fornecido pelo Manus) | 3600 |

**Ou, se preferir usar apenas CNAME:**

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| **CNAME** | `www` | `cname.manus.space` | 3600 |
| **CNAME** | `@` | `cname.manus.space` | 3600 |

> **Nota**: Alguns registradores não permitem CNAME no apex (@). Nesse caso, use o registro A.

### 3.3 Verificação

1. Após configurar os registros DNS, volte ao painel do Manus
2. Clique em **Verify** ao lado do domínio
3. Aguarde a propagação DNS (pode levar até 48 horas, geralmente 15-30 minutos)
4. O status mudará para **Verified** ✅

### 3.4 SSL/HTTPS

- O certificado SSL é **gerado automaticamente** pelo Manus
- Após a verificação do domínio, o HTTPS estará disponível em minutos
- Não é necessária nenhuma configuração adicional

---

## 4. Redirecionamentos Recomendados

Configure os seguintes redirecionamentos para melhor SEO:

| De | Para | Tipo |
|----|------|------|
| `http://gorgen.com.br` | `https://www.gorgen.com.br` | 301 |
| `http://www.gorgen.com.br` | `https://www.gorgen.com.br` | 301 |
| `https://gorgen.com.br` | `https://www.gorgen.com.br` | 301 |

> **Nota**: O Manus gerencia esses redirecionamentos automaticamente.

---

## 5. Registradores Populares - Guias Específicos

### Registro.br

1. Acesse https://registro.br
2. Faça login na sua conta
3. Clique no domínio `gorgen.com.br`
4. Vá em **DNS** → **Editar zona**
5. Adicione os registros conforme tabela acima
6. Salve as alterações

### GoDaddy

1. Acesse https://godaddy.com
2. Vá em **My Products** → **Domains**
3. Clique em **DNS** ao lado do domínio
4. Adicione os registros
5. Salve

### Cloudflare

1. Acesse https://cloudflare.com
2. Selecione o domínio
3. Vá em **DNS** → **Records**
4. Adicione os registros
5. **Importante**: Desative o proxy (nuvem laranja) para o CNAME

---

## 6. Troubleshooting

### Domínio não verifica

- Aguarde até 48 horas para propagação DNS
- Verifique se os registros estão corretos com: `dig gorgen.com.br`
- Confirme que não há conflitos com outros registros

### SSL não funciona

- Aguarde alguns minutos após a verificação do domínio
- Limpe o cache do navegador
- Tente em uma janela anônima

### Erro de redirecionamento

- Verifique se não há redirecionamentos conflitantes no registrador
- Desative qualquer proxy/CDN temporariamente para testar

---

## 7. Checklist Final

- [ ] Domínio adicionado no painel Manus
- [ ] Registros DNS configurados no registrador
- [ ] Domínio verificado no Manus
- [ ] HTTPS funcionando
- [ ] Redirecionamentos testados
- [ ] Site acessível via https://www.gorgen.com.br

---

## 8. Suporte

Em caso de problemas:
1. Verifique a documentação do Manus
2. Consulte o suporte do registrador de domínio
3. Entre em contato com o suporte Manus

---

*Documento preparado por Manus AI em 19 de Janeiro de 2026*
