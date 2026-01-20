_Rascunho Preliminar - Sujeito a Alterações_

# **Manual do Usuário – Sistema Gorgen**

**Versão 1.0 | Janeiro 2026**

---

## **1. Introdução**

Bem-vindo ao **Sistema Gorgen**, uma plataforma integrada de gestão e automação desenvolvida para otimizar os processos operacionais do consultório médico. Este manual fornece um guia completo para a utilização do sistema, abrangendo desde as funcionalidades básicas até as práticas recomendadas de segurança e conformidade.

O Gorgen foi construído sobre pilares fundamentais de **imutabilidade de dados, sigilo absoluto e rastreabilidade completa**. Cada ação realizada no sistema é registrada e preservada, garantindo a integridade do histórico clínico do paciente e a segurança das informações.

## **2. Primeiros Passos**

### **2.1. Acesso ao Sistema**

O acesso ao Sistema Gorgen é realizado através do endereço web fornecido, utilizando as credenciais individuais (usuário e senha) distribuídas pelo administrador. A autenticação pode ser feita via login e senha locais ou através de integração com contas Google/Microsoft (OAuth), conforme configuração.

### **2.2. Gestão de Senhas e Segurança**

A segurança de acesso é uma prioridade. O sistema impõe uma política de senhas fortes e oferece autenticação multifator (MFA) como camada adicional de proteção. É de responsabilidade de cada usuário manter suas credenciais em sigilo.

- **Política de Senhas:** Mínimo de 8 caracteres, incluindo letras maiúsculas, minúsculas, números e símbolos.
- **Recuperação de Senha:** Utilize a opção "Esqueci minha senha" na tela de login para iniciar o processo de recuperação via e-mail.

## **3. Perfis de Usuário e Controle de Acesso**

O acesso às funcionalidades do Gorgen é estritamente controlado por perfis, garantindo que cada usuário visualize e manipule apenas as informações pertinentes à sua função.

| Perfil de Usuário | Descrição das Permissões |
| :--- | :--- |
| **Administrador** | Acesso irrestrito a todas as funcionalidades, incluindo configurações do sistema, gestão de usuários, auditoria completa e relatórios financeiros. É o único perfil com permissão para autorizar exclusões lógicas de dados (retificação). |
| **Secretária/Recepção** | Foco em operações administrativas: cadastro e edição de pacientes, agendamento de atendimentos, gestão da agenda, emissão de guias e documentos não-clínicos. Não possui acesso a prontuários detalhados ou relatórios financeiros. |
| **Assistente Médico** | Acesso para suporte clínico: visualização de prontuários, registro de informações de evolução, upload de exames e auxílio na documentação médica, sempre sob supervisão. Não pode editar dados financeiros. |
| **Financeiro** | Acesso exclusivo à gestão financeira: controle de faturamento, registro de pagamentos, geração de relatórios de inadimplência e performance financeira. Não possui acesso a informações clínicas sensíveis. |

## **4. Módulo de Gestão de Pacientes**

Este módulo centraliza todas as informações cadastrais dos pacientes.

### **4.1. Cadastrar Novo Paciente**

1. No menu lateral, acesse **"Pacientes"** e clique em **"Novo Paciente"**.
2. Preencha os campos obrigatórios, que incluem dados pessoais, de contato e de convênio.
3. O sistema valida automaticamente formatos de CPF, CEP e telefone.
4. Clique em **"Salvar"**. O paciente receberá um ID único e sequencial.

> **Princípio da Imutabilidade:** Uma vez salvo, o registro de um paciente não pode ser excluído. Correções devem ser feitas através da edição do cadastro, e todo o histórico de alterações é mantido.

### **4.2. Buscar e Visualizar Pacientes**

A tela de listagem de pacientes oferece ferramentas de busca e filtro para localizar rapidamente qualquer registro. Utilize a barra de busca para pesquisar por nome ou CPF, ou aplique filtros avançados por cidade, convênio ou idade.

## **5. Módulo de Gestão de Atendimentos**

Este módulo gerencia todo o ciclo de vida dos atendimentos, desde o agendamento até o faturamento.

### **5.1. Agendar e Registrar Atendimentos**

1. Acesse a **"Agenda"** para visualizar os horários disponíveis.
2. Clique no horário desejado e selecione **"Novo Agendamento"**.
3. Vincule o paciente (buscando pelo nome ou ID) e preencha os detalhes do atendimento (tipo, local, convênio).
4. Após o atendimento, o registro pode ser complementado com informações sobre procedimentos e valores.

### **5.2. Gerenciar Status do Atendimento**

O status de cada agendamento (ex: "Confirmado", "Realizado", "Cancelado", "Faltou") deve ser atualizado para garantir a fidedignidade dos relatórios de performance e financeiros.

## **6. Módulo de Prontuário Médico Eletrônico (PME)**

O PME é o coração do sistema, onde todo o histórico de saúde do paciente é registrado de forma segura e perpétua.

### **6.1. Registrar Evolução e Anamnese**

1. Na ficha do paciente, acesse a aba **"Prontuário"**.
2. Clique em **"Novo Registro"** e selecione o tipo (ex: "Evolução", "Anamnese", "Prescrição").
3. Descreva as informações no campo de texto livre. O sistema salva automaticamente a data, hora e o profissional responsável.

> **Rastreabilidade e Sigilo:** Cada entrada no prontuário é assinada digitalmente com o *timestamp* e o hash do conteúdo. A edição de um registro cria uma nova versão retificada, preservando a original. A exclusão é tecnicamente impossível, em conformidade com as normas do CFM e a LGPD.

### **6.2. Anexar Documentos e Exames**

É possível anexar arquivos (PDFs, imagens) diretamente aos registros do prontuário, centralizando todos os documentos do paciente em um único local seguro.

## **7. Dashboard Analítico**

O painel inicial oferece uma visão consolidada dos principais indicadores de desempenho do consultório, incluindo:

- **Total de Pacientes e Atendimentos:** Números absolutos para acompanhamento do volume.
- **Faturamento e Recebimento:** Métricas financeiras que comparam o valor previsto com o efetivamente recebido.
- **Taxa de Ocupação da Agenda:** Percentual de horários preenchidos.
- **Distribuição por Convênio:** Gráfico que ilustra a representatividade de cada operadora.

## **8. Segurança e Conformidade Regulatória**

O uso correto do Sistema Gorgen é fundamental para garantir a conformidade com a **Lei Geral de Proteção de Dados (LGPD)** e as resoluções do **Conselho Federal de Medicina (CFM)**.

### **8.1. Boas Práticas Obrigatórias**

- **Não compartilhe suas credenciais.** O acesso é pessoal e intransferível.
- **Bloqueie sua sessão** sempre que se ausentar do computador.
- **Utilize senhas fortes** e ative a autenticação multifator (MFA).
- **Comunique imediatamente** ao administrador qualquer suspeita de violação de segurança.
- **Acesse dados de pacientes apenas quando necessário** para o cumprimento de suas funções (Princípio da Necessidade).

### **8.2. Conformidade com a LGPD**

O sistema foi projetado para facilitar a conformidade, mas a responsabilidade é compartilhada. O registro do consentimento do paciente para o tratamento de seus dados é uma etapa fundamental, e o sistema oferece ferramentas para gerenciar os direitos dos titulares, como o acesso e a correção de dados.

## **9. Suporte**

Em caso de dúvidas, problemas técnicos ou sugestões, entre em contato com o suporte através do canal designado pelo administrador do sistema.
