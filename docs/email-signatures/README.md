# Assinaturas de Email - GORGEN

## Visão Geral

Este diretório contém os templates oficiais de assinatura de email do GORGEN, desenvolvidos em conformidade com o **Manual de Identidade Visual GORGEN v1.0**.

---

## Arquivos Disponíveis

| Arquivo | Descrição |
|---------|-----------|
| `gorgen_email_signature_template.html` | Template base com campos personalizáveis |
| `gorgen_email_signature_dr_andre.html` | Versão preenchida para Dr. André Gorgen |

---

## Versões da Assinatura

### 1. Versão Principal (Completa)
- Logo circular com borda azul
- Nome, título e CRM
- Ícones para email, telefone e website
- Badges de segurança (LGPD, AES-256)
- Disclaimer de confidencialidade

### 2. Versão Compacta
- Ideal para respostas rápidas
- Barra lateral azul
- Informações essenciais em 3 linhas

### 3. Versão com QR Code
- Inclui QR code para acesso rápido ao site
- Layout horizontal com três colunas

---

## Instruções de Instalação

### Gmail

1. Acesse **Configurações** (ícone de engrenagem)
2. Clique em **Ver todas as configurações**
3. Na aba **Geral**, role até **Assinatura**
4. Clique em **Criar nova**
5. No editor, clique no ícone **<>** (Inserir HTML)
6. Cole o código HTML da assinatura
7. Clique em **Salvar alterações**

### Outlook (Desktop)

1. Acesse **Arquivo** > **Opções** > **Email**
2. Clique em **Assinaturas**
3. Clique em **Nova** e dê um nome
4. Cole o código HTML na caixa de edição
5. Clique em **OK**

### Outlook (Web)

1. Clique no ícone de engrenagem (Configurações)
2. Selecione **Exibir todas as configurações do Outlook**
3. Vá em **Email** > **Redigir e responder**
4. Cole o código HTML na seção de assinatura
5. Clique em **Salvar**

### Apple Mail

1. Crie um email em branco
2. Cole o código HTML
3. Selecione todo o conteúdo (Cmd+A)
4. Vá em **Mail** > **Preferências** > **Assinaturas**
5. Arraste o conteúdo selecionado para a área de assinatura

---

## Personalização

### Campos Personalizáveis

Substitua os seguintes campos no template:

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| `{{NOME_COMPLETO}}` | Nome do profissional | Dr. André Gorgen |
| `{{TITULO}}` | Especialidade médica | Cardiologista |
| `{{CRM}}` | Registro profissional | CRM/RS 12345 |
| `{{EMAIL}}` | Email profissional | andre@gorgen.com.br |
| `{{TELEFONE}}` | Telefone formatado | (51) 99999-9999 |
| `{{TELEFONE_LIMPO}}` | Telefone sem formatação | +5551999999999 |
| `{{ENDERECO}}` | Endereço (opcional) | Av. Brasil, 1000 - Porto Alegre/RS |
| `{{LOGO_URL}}` | URL do logo | https://gorgen.com.br/assets/logo/... |
| `{{QR_CODE_URL}}` | URL do QR code | https://gorgen.com.br/assets/qr/... |

### Hospedagem de Imagens

Para que as imagens apareçam corretamente, elas devem estar hospedadas em um servidor público. Opções:

1. **Servidor próprio**: Hospede em `gorgen.com.br/assets/`
2. **CDN**: Use serviços como Cloudinary ou AWS S3
3. **Base64**: Converta imagens para base64 (aumenta o tamanho do email)

---

## Cores Utilizadas

Conforme Manual de Identidade Visual GORGEN v1.0:

| Elemento | Cor | HEX |
|----------|-----|-----|
| Primária | Azul GORGEN | `#6B8CBE` |
| Texto principal | Azul escuro | `#1E2D45` |
| Texto secundário | Azul médio | `#3B5580` |
| Texto terciário | Azul claro | `#5A7DB0` |
| Bordas | Cinza azulado | `#E8EDF5` |
| Sucesso (LGPD) | Verde | `#10B981` |
| Disclaimer | Cinza | `#A8BEDA` |

---

## Especificações Técnicas

- **Largura máxima**: 600px (compatibilidade com clientes de email)
- **Fonte**: Inter (fallback: system fonts)
- **Tamanho do logo**: 70x70px
- **Ícones**: SVG inline (base64)
- **Compatibilidade**: Gmail, Outlook, Apple Mail, Thunderbird

---

## Notas de Conformidade

- ✅ LGPD Compliant
- ✅ Criptografia AES-256
- ✅ Disclaimer de confidencialidade incluído
- ✅ Conforme Manual de Identidade Visual GORGEN v1.0

---

**Versão**: 1.0  
**Data**: 25 de Janeiro de 2026  
**Autor**: GORGEN - Plataforma de Gestão em Saúde
