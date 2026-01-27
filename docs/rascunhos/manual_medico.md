---
title: "Manual de Utilização – Perfil Médico"
document_type: "Documentação Legal"
system: "Gorgen - Aplicativo de Gestão em Saúde"
version: "2.1"
status: "Aprovado"
last_updated: "27/01/2026"
updated_by: "Dr. André Gorgen"
---

> **Controle de Versão**
> 
> | Campo | Valor |
> |:---|:---|
> | **Versão** | 2.1 |
> | **Status** | Aprovado |
> | **Última Atualização** | 27/01/2026 |
> | **Atualizado por** | Dr. André Gorgen |


# **Manual de Utilização – Perfil Médico | Sistema Gorgen**

---

## **1. Introdução**

Este manual fornece diretrizes técnicas e operacionais para a utilização do Sistema Gorgen sob o perfil "Médico". O documento detalha as funcionalidades, os protocolos de segurança e as responsabilidades inerentes ao uso da plataforma, que foi desenvolvida sobre três pilares fundamentais: **Imutabilidade de Dados, Sigilo Absoluto e Rastreabilidade Completa**.

O correto manuseio do sistema é imperativo para garantir a integridade dos dados clínicos, a conformidade regulatória (LGPD, CFM) e a otimização dos processos assistenciais e administrativos.

## **2. Acesso e Segurança da Conta**

O acesso ao sistema é nominal, individual e intransferível, vinculado ao CPF do usuário e realizado mediante credenciais (usuário/senha) e, compulsoriamente, um segundo fator de autenticação (MFA).

### **2.1. Responsabilidade Legal**
O usuário médico é legalmente responsável por todas as ações executadas com suas credenciais. O compartilhamento de acesso é uma violação grave dos termos de uso e das normas de sigilo profissional, podendo acarretar sanções administrativas (advertência, suspensão, exclusão) e responsabilização ética perante o CRM.

### **2.2. Protocolo de Segurança**
É mandatório o bloqueio da sessão (lock screen) ao se ausentar do terminal de acesso. A política de senhas do sistema exige complexidade e trocas periódicas.

### **2.3. Senha de Acesso**
No ato do cadastramento na plataforma, você receberá uma senha provisória. No primeiro acesso, será necessário trocá-la por uma de sua escolha. A senha de acesso ao sistema é pessoal e intransferível. **Sob nenhuma hipótese será solicitado que você informe sua senha de acesso.** Não passe suas credenciais de acesso para terceiros. Isso é uma violação grave dos termos de uso da plataforma, passível de exclusão.

## **3. Dashboard Analítico: Visão Estratégica**

O painel de controle oferece uma síntese de indicadores de performance clínica e financeira, permitindo uma análise gerencial da sua prática.

| Indicador | Descrição Técnica |
| :--- | :--- |
| **Volume de Atendimentos** | Série histórica do número de consultas, permitindo análise de sazonalidade e tendências. Inclui médias móveis para suavização de dados. |
| **Receita por Período** | Faturamento bruto e líquido, com filtros por convênio e tipo de procedimento. |
| **Taxa de No-Show** | Percentual de ausências não justificadas, correlacionado com o faturamento perdido. |
| **Distribuição Demográfica** | Análise da base de pacientes por idade, gênero e localização geográfica. |

## **4. Gestão de Pacientes**

O módulo de pacientes é o repositório central de dados demográficos e administrativos. A busca é otimizada por múltiplos parâmetros (Nome, CPF, ID) e apresenta um sumário do paciente antes de acessar o prontuário completo.

### **4.1. Cadastro de Novos Pacientes**
O cadastro inicial de pacientes é tipicamente realizado pela equipe administrativa. Contudo, o médico pode complementar ou validar informações diretamente no sistema.

### **4.2. Consentimento do Paciente**
Antes do primeiro registro em prontuário, é mandatório que o paciente tenha assinado o **Termo de Consentimento para Uso da Plataforma**. O sistema sinaliza pacientes sem consentimento registrado.

## **5. Prontuário Médico Eletrônico (PME): O Núcleo do Sistema**

O PME do Gorgen foi projetado em estrita conformidade com a Resolução CFM nº 1.821/2007, garantindo os requisitos de Nível de Garantia de Segurança 2 (NGS2).

### **5.1. Princípio da Imutabilidade e Retificação**

> **Diretriz Fundamental:** Nenhuma informação registrada no PME pode ser fisicamente excluída. A integridade do histórico do paciente é perpétua.

O processo de retificação funciona da seguinte forma:
1.  O médico identifica a informação a ser corrigida.
2.  Ao clicar em "Retificar", o sistema abre um novo registro.
3.  O médico insere a informação corrigida e a **justificativa obrigatória** para a retificação.
4.  O registro original permanece visível, marcado como "Retificado", com um link para o novo registro.
5.  Ambos os registros (o original e o retificado) permanecem visíveis e auditáveis.

### **5.2. Estrutura do PME**

| Módulo | Funcionalidade |
| :--- | :--- |
| **Anamnese** | Registro estruturado da história da doença atual (HDA), antecedentes pessoais e familiares. |
| **Exame Físico** | Campos para registro de sinais vitais, inspeção, palpação, ausculta e percussão. |
| **Evolução** | Registro de cada atendimento, com campo para hipótese diagnóstica e conduta. |
| **Prescrições** | Módulo com busca de medicamentos e geração de receitas digitais (com opção de assinatura eletrônica padrão ICP-Brasil). |
| **Solicitação de Exames** | Geração de pedidos de exames com integração opcional a laboratórios parceiros. |
| **Anexos** | Upload e armazenamento de documentos externos (PDF, JPG, DICOM) diretamente vinculados à linha do tempo do paciente. |

### **5.3. Assinatura Digital**
O sistema suporta assinatura digital no padrão ICP-Brasil para documentos que exijam validade jurídica plena, como atestados e laudos.

## **6. Integração Financeira**

Cada ato médico registrado no PME que possua um correspondente financeiro (consulta, procedimento) gera automaticamente um lançamento no módulo de faturamento. Esta integração elimina a necessidade de dupla digitação e reduz a probabilidade de erros administrativos.

O médico deve apenas confirmar os procedimentos realizados; o sistema se encarrega de associar os códigos e valores correspondentes para a equipe administrativa.

## **7. Conformidade, Auditoria e Sanções**

O Sistema Gorgen é uma ferramenta para facilitar a conformidade, mas a responsabilidade final recai sobre o usuário.

### **7.1. LGPD (Lei nº 13.709/2018)**
O tratamento de dados de saúde é baseado na "tutela da saúde". O acesso a qualquer dado de paciente deve ser justificado pela necessidade do atendimento.

### **7.2. Logs de Auditoria**
Todas as interações com o PME são registradas. É possível auditar quem acessou, visualizou ou tentou alterar qualquer informação, a qualquer momento. Estes logs são armazenados de forma segura e não podem ser modificados.

### **7.3. Hierarquia de Sanções**
O descumprimento dos Termos de Uso ou das normas de segurança sujeita o usuário a um processo administrativo interno, com a seguinte hierarquia de sanções:

1.  **Advertência:** Notificação formal por escrito.
2.  **Restrição de Uso:** Limitação temporária do acesso a funcionalidades.
3.  **Suspensão de Uso:** Bloqueio temporário e completo da conta.
4.  **Exclusão da Conta:** Encerramento definitivo do acesso, sem prejuízo de medidas legais.

## **8. Tratamento de Dados Pós-Morte do Paciente**

Conforme o Código de Ética Médica (Art. 73, parágrafo único), o sigilo profissional permanece mesmo após o falecimento do paciente.

O acesso ao prontuário por familiares ou pelo inventariante só será concedido mediante **autorização judicial**, respeitando a ordem de vocação hereditária (cônjuge, descendentes, ascendentes, colaterais até 4º grau), conforme a Recomendação CFM nº 3/2014.

## **9. Suporte Técnico**

Para questões técnicas, falhas de sistema ou dúvidas operacionais, utilize os canais de suporte designados, informando seu nome de usuário e uma descrição detalhada do problema.

-   **Canal de Suporte:** [Definir canal: e-mail, portal de tickets, etc.]