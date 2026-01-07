# Sistema de Gestão - Prova de Conceito

## Funcionalidades Implementadas

- [x] Banco de dados completo (33 campos pacientes + 26 campos atendimentos)
- [x] Schema com relacionamento via ID
- [x] APIs tRPC para CRUD de pacientes
- [x] APIs tRPC para CRUD de atendimentos
- [x] APIs tRPC para dashboard com métricas
- [x] Design system elegante com tema médico profissional
- [x] Layout com sidebar de navegação
- [x] Autenticação integrada
- [x] Dashboard com métricas principais
- [x] Distribuição por convênio
- [x] Importação de dados de amostra (50 pacientes + 100 atendimentos)
- [x] Página de listagem de pacientes
- [x] Página de listagem de atendimentos
- [x] Busca de pacientes por nome

## Funcionalidades Pendentes

- [x] **[PRIORIDADE]** Formulário completo de cadastro de pacientes (33 campos)
- [x] **[PRIORIDADE]** Formulário completo de cadastro de atendimentos (26 campos)
- [ ] Validações e máscaras nos formulários (CPF, telefone, CEP)
- [ ] Edição de pacientes
- [ ] Edição de atendimentos
- [ ] Filtros avançados (CPF, convênio, diagnóstico, status)
- [ ] Visualização detalhada de paciente individual
- [ ] Histórico de atendimentos por paciente
- [ ] Exportação de relatórios
- [ ] Gráficos adicionais no dashboard
- [ ] Paginação nas listagens
- [ ] Validações de formulário
- [ ] Testes unitários

## Notas Técnicas

- Banco: MySQL com Drizzle ORM
- Frontend: React 19 + Tailwind 4
- Backend: tRPC + Express
- Autenticação: Manus OAuth
- Design: Tema médico profissional com azul elegante
- Fonte: Inter (Google Fonts)


## Melhorias de Usabilidade Solicitadas

- [x] ID automático sequencial para novos pacientes
- [x] Mudar "Pasta do Paciente" para "Pasta de Documentos" com link automático
- [x] Máscaras automáticas para CPF (999.999.999-99)
- [x] Máscaras automáticas para telefone ((51) 99999-9999)
- [x] Máscaras automáticas para CEP (99999-999)
- [x] Converter campos "Vigente" e "Privativo" para checkboxes
- [x] Converter "Óbito/Perda" para checkbox Sim/Não
- [x] Mensagens de erro detalhadas nos formulários


## Correções Urgentes

- [x] Adicionar dropdown de operadoras com lista da tabela original
- [x] Corrigir erro de inserção no banco de dados (campos obrigatórios)


## Melhorias no Formulário de Atendimentos

- [x] Dropdown de tipos de atendimento (cirurgia, consulta, visita internado, procedimento em consultório, exame)
- [x] Dropdown de locais (Consultorio, On-line, HMV, Santa Casa, HMD, HMD CG)
- [x] Vincular procedimento ao código CBHPM (estrutura para tabela futura)
- [x] Convênio vinculado ao paciente selecionado + Particular + Cortesia
- [x] Honorários vinculados a tabela (estrutura para implementação futura)
- [x] Simplificar campos adicionais para apenas "Observações"
