# 🏛️ PILARES FUNDAMENTAIS DO GORGEN

> **Documento de Referência** | Versão 1.0 | Atualizado em 08/01/2026

Este documento define os princípios invioláveis que guiam o desenvolvimento e operação do sistema Gorgen. Cada funcionalidade, decisão de design e implementação técnica deve estar alinhada com estes pilares.

---

## Índice

1. [Imutabilidade e Preservação Histórica](#1-imutabilidade-e-preservação-histórica)
2. [Sigilo e Confidencialidade Absoluta](#2-sigilo-e-confidencialidade-absoluta)
3. [Rastreabilidade Completa](#3-rastreabilidade-completa)
4. [Simplicidade com Profundidade sob Demanda](#4-simplicidade-com-profundidade-sob-demanda)
5. [Controle de Acesso Baseado em Perfis](#5-controle-de-acesso-baseado-em-perfis)
6. [Automação e Eliminação de Duplo Trabalho](#6-automação-e-eliminação-de-duplo-trabalho)

---

## 1. IMUTABILIDADE E PRESERVAÇÃO HISTÓRICA

### Mandamento
> **"Em saúde, a informação é o retrato do momento do paciente. Todo dado inserido é perpétuo."**

### Princípio
- Todo dado inserido no Gorgen é **perpétuo**
- **Não se apaga** informação
- **Não se descarta** dados
- Apenas o **Dr. André Gorgen** (Administrador Master) pode autorizar exclusões físicas

### Justificativa
- A capacidade de analisar dados ao longo do tempo é a informação realmente útil na prática clínica
- Cada registro representa o estado do paciente naquele momento específico
- Comparar parâmetros passados com atuais permite avaliar eficácia de tratamentos
- Registro completo e inalterado para fins legais e de auditoria

### Exemplo Prático
Se um paciente tinha **IMC 35 kg/m²** em 01/01/2025 e hoje apresenta **IMC 29 kg/m²**:
- ✅ O valor anterior é preservado no histórico
- ✅ Ambos os valores são acessíveis para comparação
- ✅ A evolução pode ser visualizada em gráfico temporal
- ✅ O médico pode avaliar a eficácia da intervenção

### Implementação Técnica
| Mecanismo | Descrição |
|-----------|-----------|
| Soft Delete | Registros nunca são removidos fisicamente, apenas marcados como inativos |
| Histórico de Alterações | Toda modificação cria um novo registro preservando o anterior |
| Tabelas de Histórico | Dados que mudam ao longo do tempo são armazenados em séries temporais |
| Audit Log | Todas as ações são registradas com usuário, data/hora e valores |
| Permissão de Exclusão | Apenas o Administrador Master pode executar exclusões físicas |

### Dados com Histórico Obrigatório
- Peso e Altura (IMC calculado)
- Pressão Arterial
- Glicemia
- Medicamentos em Uso
- Diagnósticos/Problemas Ativos
- Alergias
- Resultados de Exames

---

## 2. SIGILO E CONFIDENCIALIDADE ABSOLUTA

### Mandamento
> **"Dados de saúde são informações sensíveis protegidas por lei. Sigilo absoluto, sem exceções."**

### Princípio
- Todos os dados inseridos no sistema são tratados como **informações confidenciais e sensíveis**
- Proteção máxima contra divulgação não autorizada
- Apenas pessoal expressamente autorizado pelo Dr. André Gorgen terá acesso

### Conformidade Legal
| Regulamentação | Descrição |
|----------------|-----------|
| LGPD | Lei Geral de Proteção de Dados |
| CFM | Conselho Federal de Medicina |
| CREMESP | Conselho Regional de Medicina de São Paulo |
| Código de Ética Médica | Sigilo profissional |

### Implementação Técnica
- Controle de acesso por perfil (Admin, Médico, Paciente, Secretária, Auditor)
- Autorização explícita para acesso a prontuários
- Criptografia de dados em repouso e em trânsito
- Log de auditoria de todos os acessos
- Termos de confidencialidade para todos os usuários

---

## 3. RASTREABILIDADE COMPLETA

### Mandamento
> **"Toda ação no sistema deve ser auditável. Quem, quando, o quê, valores antes e depois."**

### Princípio
Cada operação realizada no Gorgen é registrada com:
- **Quem** executou (usuário)
- **Quando** executou (timestamp)
- **O que** foi feito (ação)
- **Valores** anteriores e novos (diff)

### Finalidade
| Objetivo | Descrição |
|----------|-----------|
| Conformidade Regulatória | Atender exigências legais de auditoria |
| Investigação de Incidentes | Rastrear origem de problemas |
| Responsabilização | Identificar responsáveis por ações |
| Melhoria Contínua | Analisar padrões de uso |

### Implementação Técnica
- Tabela `audit_log` com registro de todas as operações
- Campos: `usuario_id`, `acao`, `tabela`, `registro_id`, `valores_anteriores`, `valores_novos`, `timestamp`, `ip`
- Logs imutáveis (não podem ser editados ou excluídos)
- Retenção mínima de 20 anos (conforme CFM)

---

## 4. SIMPLICIDADE COM PROFUNDIDADE SOB DEMANDA

### Mandamento
> **"O sistema deve ser simples de pronto, mas capaz de responder imediatamente a quem exige detalhes."**

### Princípio
- A interface do Gorgen é **simples por padrão**, exibindo apenas as informações essenciais
- Todos os dados detalhados estão **prontos no background** para acesso imediato
- Acesso com **um único clique**

### Regra de Ouro
> **Máximo de 2 cliques** para acessar qualquer informação detalhada a partir da tela principal.

### Exemplo Prático: Peso e Altura
| Visão | O que mostra |
|-------|--------------|
| **Simples** | No cabeçalho do prontuário: peso atual, altura e IMC |
| **Detalhada** | Com um clique: histórico completo com gráficos de evolução |
| **Background** | Dados históricos já carregados, sem espera adicional |

### Padrões de Interface
1. **Resumo → Detalhe**: Toda seção mostra resumo primeiro, detalhe sob demanda
2. **Expansão In-Place**: Detalhes expandem na mesma tela quando possível
3. **Tooltips Informativos**: Informações complementares aparecem ao passar o mouse
4. **Modais para Ações**: Formulários complexos em modais, não em novas páginas
5. **Navegação Lateral**: Menu sempre visível para acesso rápido a qualquer seção

### Implementação Técnica
- **Pré-carregamento**: Dados frequentemente acessados são carregados em background
- **Cache Inteligente**: Consultas recentes ficam em cache para acesso instantâneo
- **Lazy Loading**: Dados pesados (imagens, PDFs) carregam apenas quando solicitados
- **Skeleton Loading**: Feedback visual imediato enquanto dados carregam

---

## 5. CONTROLE DE ACESSO BASEADO EM PERFIS

### Mandamento
> **"Cada usuário acessa apenas o que lhe é permitido, com base em seu perfil e autorizações explícitas."**

### Princípio
- O acesso ao Gorgen é controlado por **perfis de usuário**
- Um mesmo CPF pode ter **múltiplos perfis** simultâneos
- Exemplo: médico que também é paciente de outro médico no sistema

### Os 5 Perfis do Gorgen

#### 🔑 ADMINISTRADOR
| Aspecto | Descrição |
|---------|-----------|
| **Acesso** | Total e irrestrito a todo o sistema |
| **Permissões** | Pode modificar qualquer coisa, incluir/excluir usuários, configurar sistema |
| **Quem** | Dr. André Gorgen e equipe técnica autorizada |
| **Responsabilidade** | Único perfil que pode executar exclusões físicas de dados |

#### 🩺 MÉDICO
| Aspecto | Descrição |
|---------|-----------|
| **Acesso** | Prontuários de pacientes que lhe conferiram autorização expressa OU que o médico já atendeu |
| **Restrições** | Não acessa perfis de outros médicos; não modifica funções do sistema |
| **Papel** | Consumidor do sistema, atua apenas sobre dados dos seus pacientes |
| **Regra** | Sem atendimento ou autorização = sem acesso |

#### 👤 PACIENTE
| Aspecto | Descrição |
|---------|-----------|
| **Acesso** | Apenas aos próprios dados |
| **Permissões** | Incluir informações pessoais; fazer upload de documentos; conceder/revogar acesso a médicos; apagar seu perfil (LGPD) |
| **Restrições** | Não pode deletar informações clínicas (imutabilidade) |

#### 📝 SECRETÁRIA
| Aspecto | Descrição |
|---------|-----------|
| **Acesso** | Vinculado a um ou mais médicos específicos |
| **Permissões** | Manejar agenda; acessar dados cadastrais básicos; acessar dados de faturamento e agendamento |
| **Restrições** | **Não pode consultar prontuários médicos**; atua como preposto do médico |

#### 🔍 AUDITOR
| Aspecto | Descrição |
|---------|-----------|
| **Acesso** | Similar ao médico, porém autorização concedida pelo Administrador (não pelo paciente) |
| **Restrições** | **Não pode editar absolutamente nenhuma informação**; acesso somente leitura |
| **Observação** | Todas as consultas são registradas em log |

### Matriz de Permissões

| Ação | Admin | Médico | Paciente | Secretária | Auditor |
|------|:-----:|:------:|:--------:|:----------:|:-------:|
| Ver prontuário | ✅ | ✅* | Próprio | ❌ | ✅** |
| Editar prontuário | ✅ | ✅* | ❌ | ❌ | ❌ |
| Criar evolução | ✅ | ✅* | ❌ | ❌ | ❌ |
| Upload documentos | ✅ | ✅* | ✅ | ❌ | ❌ |
| Gerenciar agenda | ✅ | ✅ | ❌ | ✅*** | ❌ |
| Ver faturamento | ✅ | ✅ | Próprio | ✅*** | ✅** |
| Configurar sistema | ✅ | ❌ | ❌ | ❌ | ❌ |
| Excluir dados | ✅ | ❌ | ❌ | ❌ | ❌ |
| Conceder acesso | ✅ | ❌ | ✅**** | ❌ | ❌ |
| Ver logs auditoria | ✅ | ❌ | ❌ | ❌ | ✅ |

**Legenda:**
- \* Com autorização do paciente ou atendimento prévio
- \*\* Com autorização do administrador
- \*\*\* Apenas dos médicos vinculados
- \*\*\*\* Concede/revoga acesso de médicos ao próprio prontuário

---

## 6. AUTOMAÇÃO E ELIMINAÇÃO DE DUPLO TRABALHO

### Mandamento
> **"O que puder ser automatizado, será. Não existe duplo trabalho no Gorgen."**

### Princípio
- Todo dado inserido uma vez no Gorgen é **propagado automaticamente** para todos os contextos onde for necessário
- Este pilar promove a **conciliação entre medicina e administração**
- Elimina a distância entre profissionais da área médica e administrativa

### Regra de Ouro
> **Nenhum dado deve ser digitado mais de uma vez.** Se o sistema já conhece a informação, ela deve ser preenchida automaticamente.

### Justificativa
| Problema | Solução Gorgen |
|----------|----------------|
| Distância histórica entre medicina e administração | Dashboard unificado médico-administrativo |
| Dupla digitação em múltiplos sistemas | Propagação automática de dados |
| Erros de transcrição | Dado único, referenciado em todos os contextos |
| Tempo perdido em burocracia | Automação de documentos e guias |

### Exemplo Prático: CPF do Paciente
CPF inserido **uma única vez** no cadastro do paciente aparece automaticamente em:
- ✅ Guias de autorização
- ✅ Receitas e atestados
- ✅ Notas fiscais
- ✅ Relatórios de faturamento
- ✅ Documentos para convênios
- ✅ Qualquer campo que exija CPF

### Áreas de Automação

#### Documentos Médicos
- Receitas pré-preenchidas com dados do paciente e médico
- Atestados com CID vinculado ao atendimento
- Solicitações de exames com histórico clínico relevante
- Laudos com dados antropométricos atuais

#### Faturamento e Guias
- Guias TISS geradas automaticamente após atendimento
- Dados do convênio puxados do cadastro do paciente
- Códigos de procedimento vinculados ao tipo de atendimento
- Honorários calculados conforme tabela configurada

#### Administração
- Relatórios financeiros consolidados automaticamente
- Conciliação de pagamentos com atendimentos
- Alertas de glosas e pendências
- Dashboard unificado médico-administrativo

### Dashboard Unificado (Visão)

#### Métricas Financeiras (✅ Implementado)
- Faturamento previsto
- Taxa de recebimento
- Distribuição por convênio

#### Métricas Médicas (📅 Futuro)
- Número de atendimentos ao longo do tempo
- Médias móveis de 28 dias para atendimentos
- Análise por tipo de atendimento (consulta, retorno, procedimento)
- Distribuição por diagnóstico
- Taxa de retorno de pacientes
- Tempo médio entre consultas

---

## 📋 Checklist de Conformidade

Antes de implementar qualquer funcionalidade, verifique:

- [ ] **Pilar 1**: Os dados são preservados historicamente? Há soft delete?
- [ ] **Pilar 2**: O acesso é restrito conforme perfil? Há criptografia?
- [ ] **Pilar 3**: A ação é registrada no audit log?
- [ ] **Pilar 4**: A interface é simples? Detalhes estão a 1-2 cliques?
- [ ] **Pilar 5**: As permissões estão corretas para cada perfil?
- [ ] **Pilar 6**: Há algum dado sendo digitado mais de uma vez?

---

## 📝 Histórico de Alterações

| Data | Versão | Alteração | Autor |
|------|--------|-----------|-------|
| 08/01/2026 | 1.0 | Criação do documento com os 6 pilares | Dr. André Gorgen / Manus |

---

## 🔗 Referências

- [todo.md](/home/ubuntu/consultorio_poc/todo.md) - Lista de tarefas e implementações
- [ROADMAP.md](/home/ubuntu/consultorio_poc/ROADMAP.md) - Planejamento de longo prazo
- [drizzle/schema.ts](/home/ubuntu/consultorio_poc/drizzle/schema.ts) - Schema do banco de dados

---

> **"O Gorgen não é apenas um sistema de gestão. É uma filosofia de cuidado com a informação médica."**
