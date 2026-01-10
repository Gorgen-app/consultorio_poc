# Campos do Formulário de Cadastro de Médicos

Baseado nas imagens de referência fornecidas pelo usuário.

## Estrutura de Abas

1. **PESSOAL** - Dados pessoais básicos
2. **ENDEREÇO** - Endereço residencial
3. **DOCUMENTAÇÃO** - Documentos pessoais e bancários
4. **PROFISSIONAL** - Informações do conselho e formações
5. **PERFIL** - Vínculos e histórico profissional

---

## 1. PESSOAL

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Nome completo | text | Sim |
| Nome social/afetivo | text | Não |
| Sexo | select (Masculino/Feminino) | Sim |
| Data de nascimento | date | Sim |
| Nacionalidade | select | Sim |
| UF de nascimento | select | Sim |
| Cidade de nascimento | text | Sim |
| DDD (celular) | text | Sim |
| Celular | text | Sim |
| DDD (residencial) | text | Não |
| Telefone residencial | text | Não |
| DDD (comercial) | text | Não |
| Telefone comercial | text | Não |
| Nome da mãe | text | Sim |
| Nome do pai | text | Não |
| Estado civil | select | Sim |
| Nome do cônjuge | text | Não |

---

## 2. ENDEREÇO

| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Logradouro | select (Rua/Avenida/etc) | Sim |
| Endereço residencial | text | Sim |
| Número | text | Sim |
| Complemento | text | Não |
| Cidade | text | Sim |
| Bairro | text | Sim |
| UF | select | Sim |
| CEP | text (máscara) | Sim |

---

## 3. DOCUMENTAÇÃO

### Documentos Pessoais
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| RG | text | Sim |
| UF do RG | select | Sim |
| Órgão emissor | select | Sim |
| Data de emissão | date | Sim |
| RG digitalizado | file upload | Sim |
| Nº do PIS | text | Sim |
| Nº do cartão nacional de saúde (CNS) | text | Sim |
| CPF | text (máscara) | Sim |
| CPF digitalizado | file upload | Sim |

### Carteira de Vacinação
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Vacinas | lista dinâmica | Não |

### Informações Bancárias (Pessoa Física)
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Banco | text | Sim |
| Agência | text | Sim |
| Conta corrente | text | Sim |

---

## 4. PROFISSIONAL

### Informações do Conselho
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Conselho | select (CRM, etc) | Sim |
| Nº de registro | text | Sim |
| UF | select | Sim |
| Carteira do conselho digitalizada | file upload | Sim |
| Certidão de regularidade com RQE (digitalizada) | file upload | Sim |
| Código de validação CREMERS | text | Sim |

### Declaração Anual de Conflito de Interesses
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Declaração | file upload / formulário | Sim |

### Formações (lista dinâmica)
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Curso | text | Sim |
| Instituição | text | Sim |
| Conclusão | text (ano) | Sim |
| Certificado | file upload | Não |

### Especializações (lista dinâmica)
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Especialização | text | Sim |
| Instituição | text | Sim |
| Título de especialista | select (Sim/Não) | Sim |
| Registro no conselho | select (Sim/Não) | Sim |
| Certificado | file upload | Não |

---

## 5. PERFIL

### Vínculo com a Instituição (lista dinâmica)
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Tipo de vínculo | text (Autônomo, CLT, etc) | Sim |

### Local de Credenciamento
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Locais | checkbox múltiplo | Sim |

### Carta de Recomendação
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Cartas | file upload (lista) | Não |

### Histórico Profissional (lista dinâmica)
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Histórico | text/formulário | Não |

### Pós-Graduação Stricto Sensu (lista dinâmica)
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| Graduação | text/formulário | Não |

### Currículo Lattes
| Campo | Tipo | Obrigatório |
|-------|------|-------------|
| URL do Lattes | text (URL) | Não |
