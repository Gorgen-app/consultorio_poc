# **Manual de Utilização – Perfil Médico | Sistema Gorgen**

_Versão 1.0 | Documento Técnico | Janeiro 2026_

---

## **1. Introdução**

Este manual fornece diretrizes técnicas e operacionais para a utilização do Sistema Gorgen sob o perfil "Médico". O documento detalha as funcionalidades, os protocolos de segurança e as responsabilidades inerentes ao uso da plataforma, que foi desenvolvida sobre três pilares fundamentais: **Imutabilidade de Dados, Sigilo Absoluto e Rastreabilidade Completa**.

O correto manuseio do sistema é imperativo para garantir a integridade dos dados clínicos, a conformidade regulatória (LGPD, CFM) e a otimização dos processos assistenciais e administrativos.

## **2. Acesso e Segurança da Conta**

O acesso ao sistema é nominal, individual e intransferível, vinculado ao CPF do usuário e realizado mediante credenciais (usuário/senha) e, compulsoriamente, um segundo fator de autenticação (MFA).

-   **Responsabilidade Legal:** O usuário médico é legalmente responsável por todas as ações executadas com suas credenciais. O compartilhamento de acesso é uma violação grave dos termos de uso e das normas de sigilo profissional.
-   **Protocolo de Segurança:** É mandatório o bloqueio da sessão (lock screen) ao se ausentar do terminal de acesso. A política de senhas do sistema exige complexidade e trocas periódicas.
-   **Senha de acesso:** No ato do cadastramento na plataforma, você receberá uma senha provisória. No primeiro acesso, será necessário trocar a senha provisório por uma escolhida por você. A senha de acesso ao sistema é pessoal e intransferível. Sob nenhuma hipotese será solicitado que você informe sua senha de acesso. Não passe suas credenciais de acesso para terceiros. Isso é uma violação grave dos termos de uso da plataforma, passível de exclusão da plataforma.

## **3. Dashboard Analítico: Visão Estratégica**

O painel de controle oferece uma síntese de indicadores de performance clínica e financeira, permitindo uma análise gerencial da sua prática.

| Indicador | Descrição Técnica |
| :--- | :--- |
| **Volume de Atendimentos** | Série histórica do número de consultas, permitindo análise de sazonalidade e tendências. |
| **Receita por Período** | Faturamento bruto e líquido, com filtros por convênio e tipo de procedimento. |
| **Taxa de No-Show** | Percentual de ausências não justificadas, correlacionado com o faturamento perdido. |
| **Distribuição Demográfica** | Análise da base de pacientes por idade, gênero e localização geográfica. |

## **4. Gestão de Pacientes**

O módulo de pacientes é o repositório central de dados demográficos e administrativos. A busca é otimizada por múltiplos parâmetros (Nome, CPF, ID) e apresenta um sumário do paciente antes de acessar o prontuário completo.

## **5. Prontuário Médico Eletrônico (PME): O Núcleo do Sistema**

O PME do Gorgen foi projetado em estrita conformidade com a Resolução CFM nº 1.821/2007, garantindo os requisitos de Nível de Garantia de Segurança 2 (NGS2).

### **5.1. Princípio da Imutabilidade e Retificação**

> **Diretriz Fundamental:** Nenhuma informação registrada no PME pode ser fisicamente excluída. A integridade do histórico do paciente é perpétua.

-   **Registro de Informações:** Cada entrada (anamnese, evolução, prescrição) é salva com um *timestamp* criptográfico, hash do conteúdo e a assinatura digital do usuário logado.
-   **Processo de Retificação:** Caso uma correção seja necessária, o sistema não altera o registro original. Em vez disso, cria-se um novo registro de "retificação", que aponta para o registro anterior e contém a informação corrigida, juntamente com a justificativa da alteração. Ambos os registros (o original e o retificado) permanecem visíveis e auditáveis.

### **5.2. Estrutura do PME**

-   **Anamnese e Evolução:** Campos de texto estruturado para registro do histórico clínico, exame físico e evolução do paciente.
-   **Prescrições:** Módulo com busca de medicamentos e geração de receitas digitais (com opção de assinatura eletrônica padrão ICP-Brasil).
-   **Solicitação de Exames:** Geração de pedidos de exames com integração opcional a laboratórios parceiros.
-   **Anexos:** Upload e armazenamento de documentos externos (PDF, JPG, DICOM) diretamente vinculados à linha do tempo do paciente.

## **6. Integração Financeira**

Cada ato médico registrado no PME que possua um correspondente financeiro (consulta, procedimento) gera automaticamente um lançamento no módulo de faturamento. Esta integração elimina a necessidade de dupla digitação e reduz a probabilidade de erros administrativos.

-   O médico deve apenas confirmar os procedimentos realizados; o sistema se encarrega de associar os códigos e valores correspondentes para a equipe administrativa.

## **7. Conformidade e Auditoria**

O Sistema Gorgen é uma ferramenta para facilitar a conformidade, mas a responsabilidade final recai sobre o usuário.

-   **LGPD (Lei nº 13.709/2018):** O tratamento de dados de saúde é baseado na "tutela da saúde". O acesso a qualquer dado de paciente deve ser justificado pela necessidade do atendimento.
-   **Logs de Auditoria:** Todas as interações com o PME são registradas. É possível auditar quem acessou, visualizou ou tentou alterar qualquer informação, a qualquer momento. Estes logs são armazenados de forma segura e não podem ser modificados.

## **8. Suporte Técnico**

Para questões técnicas, falhas de sistema ou dúvidas operacionais, utilize os canais de suporte designados, informando seu nome de usuário e uma descrição detalhada do problema.

-   **Canal de Suporte:** [Definir canal: e-mail, portal de tickets, etc.]
