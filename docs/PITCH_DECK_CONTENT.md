# GORGEN - Pitch Deck para Investidores

## Conteúdo dos Slides

---

### Slide 1: Capa
**Título:** GORGEN
**Subtítulo:** O primeiro aplicativo de gestão em saúde com arquitetura de rede social
**Tagline:** Onde pacientes e médicos se conectam para um cuidado contínuo e integrado
**Visual:** Logo GORGEN centralizado, fundo azul profissional (#0056A4), ícones sutis de saúde
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide1_cover.webp

---

### Slide 2: O Problema - Fragmentação do Cuidado em Saúde
**Insight:** Pacientes perdem histórico médico a cada troca de profissional, gerando exames duplicados e erros evitáveis

**Dados de impacto:**
- 30% dos exames laboratoriais são repetidos desnecessariamente no Brasil
- Paciente médio consulta 4-5 médicos diferentes por ano
- Cada médico usa um sistema diferente, sem comunicação entre eles
- Custo estimado de R$ 15 bilhões/ano em redundâncias no sistema de saúde brasileiro

**Visual:** Diagrama mostrando paciente no centro com setas quebradas para múltiplos médicos isolados
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide2_problem.jpg

---

### Slide 3: A Solução - GORGEN
**Insight:** Um prontuário único, portável, onde o paciente é o dono e médicos são autorizados a contribuir

**Proposta de valor:**
- Paciente tem seu prontuário em um só lugar, acessível em qualquer médico
- Médico vê histórico completo desde a primeira consulta
- Diferentes especialistas compartilham informações do mesmo paciente
- Dados seguem o paciente, não ficam presos em sistemas isolados

**Visual:** Diagrama mostrando paciente no centro conectado harmoniosamente a múltiplos médicos
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide3_solution.jpg

---

### Slide 4: Como Funciona - Arquitetura Inovadora
**Insight:** Combinamos gestão em saúde profissional com a familiaridade de uma rede social

**Modelo de tenants:**
| Entidade | Tenant | Papel |
|----------|--------|-------|
| Paciente | Próprio (CPF) | Dono do prontuário |
| Médico | Próprio (CPF) | Registra evoluções |
| Secretária | Não tem | Trabalha sob médico |

**Fluxo de autorizações:**
1. Paciente cria conta ou é cadastrado pelo médico
2. Paciente autoriza médicos a acessar seu prontuário
3. Médicos registram evoluções no prontuário do paciente
4. Paciente pode revogar acesso a qualquer momento

**Visual:** Fluxograma simples mostrando conexões paciente-médico
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide4_architecture.webp

---

### Slide 5: Diferencial Competitivo - Por que Somos Únicos
**Insight:** Não existe nenhum sistema no mundo que combine prontuário centrado no paciente com gestão médica completa

**Comparativo:**

| Aspecto | Tasy/MV | iClinic | GORGEN |
|---------|---------|---------|--------|
| Prontuário | Hospital é dono | Médico é dono | **Paciente é dono** |
| Portabilidade | Nenhuma | Nenhuma | **Total** |
| Compartilhamento | Não | Não | **Entre médicos** |
| Modelo | B2B apenas | B2C médico | **B2C + B2B** |

**Visual:** Tabela comparativa com destaque verde para GORGEN
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide5_competitive.jpg

---

### Slide 6: Vantagem B2B - Economia de Tenants Existentes
**Insight:** Clientes corporativos pagam apenas por usuários novos, não por quem já está na plataforma

**Exemplo prático:**
Hospital com 200 médicos e 50.000 pacientes, onde 60% já usam GORGEN:

| Métrica | Concorrência | GORGEN | Economia |
|---------|--------------|--------|----------|
| Médicos cobrados | 200 | 80 | 60% |
| Pacientes cobrados | 50.000 | 20.000 | 60% |
| Custo anual | R$ 600.000 | R$ 240.000 | **R$ 360.000** |

**Pitch:** "Quanto mais a plataforma cresce, mais barato fica para novos clientes corporativos"

**Visual:** Gráfico de barras comparando custos
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide6_b2b.jpg

---

### Slide 7: Diferenciais Clínicos - DNA de Quem Atende Pacientes
**Insight:** Funcionalidades desenvolvidas por médico com experiência real, impossíveis de copiar por times de TI

**3 funcionalidades únicas:**

1. **Imutabilidade com histórico comparativo**
   - Dados nunca são sobrescritos, sempre adicionados
   - Gráficos de tendência temporal (peso, PA, exames)
   - Em medicina, a tendência importa mais que o valor absoluto

2. **Período de consentimento pendente (30 dias)**
   - Médico cadastra e atende na hora
   - Paciente confirma depois
   - Fluxo real de consultório, não burocracia

3. **Preservação de evoluções após revogação**
   - Paciente revoga acesso de médico
   - Médico mantém acesso às próprias evoluções
   - Proteção legal para ambos

**Visual:** Ícones representando cada funcionalidade
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide7_clinical.jpg

---

### Slide 8: Modelo de Negócio - Três Camadas de Receita
**Insight:** Receita diversificada entre pacientes, médicos e instituições

**Precificação B2C:**

| Segmento | Mensal | Anual | Margem |
|----------|--------|-------|--------|
| Paciente | R$ 9,90 | R$ 89,90 | Alta |
| Médico Essencial | R$ 197 | R$ 1.770 | Alta |
| Médico Profissional | R$ 347 | R$ 2.997 | Alta |
| Médico Clínica | R$ 597 | R$ 4.997 | Alta |

**Precificação B2B:**
- Setup único + taxa por tenant novo + gestão mensal
- Valores sob consulta (R$ 15k - R$ 300k/ano)

**Visual:** Pirâmide de receita com três camadas
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide8_business.webp

---

### Slide 9: Tração e Status Atual
**Insight:** Produto funcional com base de dados real e cronograma agressivo de lançamento

**Métricas atuais:**
- Versão: 3.9.18 (produção)
- Pacientes cadastrados: 21.644
- Atendimentos registrados: 50.000+
- Testes automatizados: ~700 casos
- Erros TypeScript: 0

**Marcos alcançados:**
- ✅ Sistema de backup automatizado com criptografia
- ✅ Autenticação local e OAuth
- ✅ Multi-tenancy completo
- ✅ Dashboard com métricas em tempo real
- ✅ Conformidade LGPD

**Visual:** Timeline com checkmarks
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide9_traction.png

---

### Slide 10: Roadmap e Metas
**Insight:** Cronograma agressivo com metas claras de usuários e receita

**Metas de curto prazo:**
| Data | Meta |
|------|------|
| 22/01/2026 | Onboarding secretária |
| 26/01/2026 | Beta com pacientes reais |
| 01/02/2026 | Primeira médica externa |
| 28/02/2026 | 3-5 médicos em beta |

**Metas de médio prazo:**
| Data | Usuários | ARR Projetado |
|------|----------|---------------|
| Jul/2026 | 100 | R$ 57k |
| Jan/2027 | 600 | R$ 393k |
| Jan/2028 | 2.000 | R$ 4.3M |

**Visual:** Gráfico de crescimento projetado
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide10_roadmap.jpg

---

### Slide 11: Valuation e Oportunidade
**Insight:** Mercado de saúde digital Brasil estimado em R$ 50+ bilhões, com múltiplos de SaaS saúde entre 10-20x ARR

**Projeção de valuation:**

| Data | ARR | Múltiplo | Valuation |
|------|-----|----------|-----------|
| Jul/2026 | R$ 57k | 10x | R$ 570k |
| Jan/2027 | R$ 393k | 12x | R$ 4.7M |
| Jan/2028 | R$ 4.3M | 15x | R$ 65M |

**Fatores de valorização premium:**
- Inovação única sem concorrentes diretos
- Efeito de rede (valor cresce exponencialmente)
- Dados proprietários de alto valor
- Founder-market fit excepcional

**Visual:** Gráfico de valuation crescente
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide11_valuation.png

---

### Slide 12: Moat - Por que Concorrentes Não Conseguem Copiar
**Insight:** Barreiras estruturais protegem a vantagem competitiva

**5 barreiras de entrada:**

1. **Arquitetura invertida** - Requer reescrever todo o sistema, não é patch
2. **Modelo de negócio** - Quem paga não é dono dos dados (assusta investidores tradicionais)
3. **Conhecimento clínico** - Times de TI não entendem fluxos reais
4. **Base instalada** - Clientes existentes não querem migrar
5. **Efeito de rede** - Quanto mais usuários, mais valor

**Visual:** Diagrama de fosso competitivo
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide12_moat.webp

---

### Slide 13: Time - Founder-Market Fit Excepcional
**Insight:** Combinação rara de experiência clínica com conhecimento técnico

**Dr. André Gorgen - Founder & CEO**
- Médico com milhares de pacientes atendidos
- Conhecimento de lógica, algoritmos e TI
- Vive o problema diariamente
- Desenvolveu o produto para resolver sua própria dor

**Equipe de desenvolvimento:**
- Manus AI como parceiro de desenvolvimento
- Velocidade de execução 24/7
- Documentação e automação completas

**Visual:** Foto do founder com credenciais
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide13_team.jpg

---

### Slide 14: O Pedido - Investimento Seed
**Insight:** Capital para acelerar crescimento e capturar mercado antes de concorrentes reagirem

**Uso dos recursos:**
| Área | % | Objetivo |
|------|---|----------|
| Produto | 40% | Completar prontuário, portal paciente |
| Comercial | 30% | Aquisição de médicos e clínicas |
| Operações | 20% | Suporte, infraestrutura |
| Jurídico | 10% | Patentes, compliance |

**Milestones com o investimento:**
- 6 meses: 100 médicos ativos
- 12 meses: Primeiro cliente B2B
- 18 meses: 500 médicos, 5 clínicas
- 24 meses: Series A ready

**Visual:** Gráfico de pizza com alocação
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide14_ask.webp

---

### Slide 15: Contato e Próximos Passos
**Insight:** Oportunidade de entrar cedo em uma empresa com potencial de transformar a saúde no Brasil

**Informações de contato:**
- Dr. André Gorgen
- [Email confidencial]
- [Telefone confidencial]

**Próximos passos:**
1. Agendar demo do produto
2. Due diligence técnica
3. Negociação de termos
4. Fechamento

**Call to action:** "Junte-se a nós na missão de transformar a saúde no Brasil"

**Visual:** Logo GORGEN, informações de contato, QR code para demo
**Imagem:** /home/ubuntu/consultorio_poc/docs/pitch_images/slide15_contact.jpg

---

## Notas de Design

**Paleta de cores:**
- Azul principal: #0056A4
- Azul secundário: #6B8CBE
- Cinza neutro: #4A5568
- Branco: #FFFFFF
- Verde sucesso: #38A169

**Tipografia:**
- Títulos: Bold, grande
- Corpo: Regular, legível
- Dados: Monospace para números

**Estilo visual:**
- Clean e profissional
- Gráficos e tabelas para dados
- Ícones minimalistas
- Espaço em branco generoso
