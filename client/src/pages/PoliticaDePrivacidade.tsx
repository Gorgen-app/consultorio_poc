import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield, Lock, Eye, Database, FileText, Scale } from "lucide-react";

export default function PoliticaDePrivacidade() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation("/")}
              className="text-[#002B49] hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <img 
                src="/assets/logo/gorgen_logo_master_2048_transparent.png" 
                alt="Gorgen Logo" 
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold text-[#002B49]">GORGEN</span>
            </div>
          </div>
          <Button 
            onClick={() => setLocation("/login")}
            className="bg-[#0056A4] hover:bg-[#004080] text-white"
          >
            Entrar
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#0056A4] to-[#002B49] text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Política de Privacidade</h1>
          <p className="text-white/70">Versão 2.1 | Última atualização: 27 de Janeiro de 2026</p>
        </div>
      </section>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            {/* Introdução */}
            <p className="text-gray-600 leading-relaxed mb-8">
              Esta Política de Privacidade ("Política") descreve como o <strong>Sistema Gorgen</strong> ("Sistema"), desenvolvido e mantido pelo consultório do Dr. André Gorgen ("Controlador"), coleta, usa, armazena, compartilha e protege os dados pessoais dos Usuários, em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 – LGPD), o Código de Ética Médica e demais regulamentações aplicáveis.
            </p>

            <div className="bg-blue-50 border-l-4 border-[#0056A4] p-4 mb-8">
              <p className="text-[#002B49] font-medium">
                A utilização do Sistema implica na aceitação integral desta Política. Recomendamos a leitura atenta de todo o documento.
              </p>
            </div>

            {/* Seção 1 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">1</span>
              Dados Coletados
            </h2>
            <p className="text-gray-600 mb-4">
              O Sistema coleta e trata diferentes categorias de dados pessoais, a depender do perfil do Usuário:
            </p>
            <div className="space-y-4 mb-6">
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <h4 className="font-semibold text-[#002B49] mb-2">Dados de Identificação</h4>
                <p className="text-sm text-gray-600">Nome completo, CPF, RG, data de nascimento, gênero, filiação, estado civil, naturalidade, nacionalidade, profissão.</p>
              </div>
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <h4 className="font-semibold text-[#002B49] mb-2">Dados de Contato</h4>
                <p className="text-sm text-gray-600">Endereço residencial, telefone, e-mail, contato de emergência (Next of Kin).</p>
              </div>
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <h4 className="font-semibold text-[#002B49] mb-2">Dados Sensíveis de Saúde</h4>
                <p className="text-sm text-gray-600">Histórico médico, diagnósticos, resultados de exames, prescrições, evoluções clínicas, imagens médicas, laudos e quaisquer outras informações relacionadas à saúde do paciente.</p>
              </div>
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <h4 className="font-semibold text-[#002B49] mb-2">Dados Financeiros</h4>
                <p className="text-sm text-gray-600">Informações de convênio, dados para faturamento, histórico de pagamentos.</p>
              </div>
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <h4 className="font-semibold text-[#002B49] mb-2">Dados de Acesso e Uso</h4>
                <p className="text-sm text-gray-600">Logs de acesso, endereço IP, tipo de dispositivo, navegador, data e hora de acesso, ações realizadas no Sistema.</p>
              </div>
            </div>

            {/* Seção 2 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">2</span>
              Finalidades do Tratamento
            </h2>
            <p className="text-gray-600 mb-4">Os dados pessoais são tratados para as seguintes finalidades:</p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li><strong>Prestação de Serviços de Saúde:</strong> Registro e acompanhamento do histórico clínico do paciente, elaboração de diagnósticos, prescrição de tratamentos e procedimentos médicos.</li>
              <li><strong>Gestão Administrativa:</strong> Agendamento de consultas, comunicação com pacientes, faturamento e cobrança.</li>
              <li><strong>Cumprimento de Obrigações Legais:</strong> Atendimento a requisições de autoridades competentes, guarda de prontuários pelo prazo legal mínimo de 20 anos.</li>
              <li><strong>Segurança e Auditoria:</strong> Garantia da integridade, rastreabilidade e segurança dos dados e do Sistema.</li>
              <li><strong>Melhoria Contínua:</strong> Análise de dados agregados e anonimizados para aprimoramento dos serviços e do Sistema.</li>
            </ul>

            {/* Seção 3 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">3</span>
              Bases Legais para o Tratamento
            </h2>
            <p className="text-gray-600 mb-4">O tratamento de dados pessoais no Sistema Gorgen é fundamentado nas seguintes bases legais da LGPD:</p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li><strong>Tutela da Saúde (Art. 7º, VIII e Art. 11, II, f):</strong> Para o tratamento de dados sensíveis de saúde em procedimentos realizados por profissionais de saúde.</li>
              <li><strong>Cumprimento de Obrigação Legal (Art. 7º, II):</strong> Para atender às exigências do CFM quanto à guarda de prontuários.</li>
              <li><strong>Execução de Contrato (Art. 7º, V):</strong> Para a prestação dos serviços contratados pelo Usuário.</li>
              <li><strong>Legítimo Interesse (Art. 7º, IX):</strong> Para fins de segurança, prevenção à fraude e melhoria dos serviços.</li>
              <li><strong>Consentimento (Art. 7º, I e Art. 11, I):</strong> Quando aplicável, especialmente para comunicações de marketing.</li>
            </ul>

            {/* Seção 4 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">4</span>
              Compartilhamento de Dados
            </h2>
            <p className="text-gray-600 mb-4">Os dados pessoais poderão ser compartilhados com:</p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li><strong>Outros Profissionais de Saúde:</strong> Quando necessário para a continuidade do cuidado, mediante autorização do paciente ou em situações de emergência.</li>
              <li><strong>Operadoras de Planos de Saúde:</strong> Para fins de faturamento e autorização de procedimentos.</li>
              <li><strong>Autoridades Competentes:</strong> Quando exigido por lei ou ordem judicial.</li>
              <li><strong>Prestadores de Serviços:</strong> Empresas contratadas para suporte técnico, hospedagem e backup, sempre mediante contratos que garantam a confidencialidade e segurança dos dados.</li>
            </ul>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8">
              <p className="text-green-800 font-medium">
                O Sistema Gorgen <strong>NÃO</strong> comercializa, vende ou aluga dados pessoais de seus Usuários a terceiros para fins de marketing ou qualquer outra finalidade.
              </p>
            </div>

            {/* Seção 5 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">5</span>
              Segurança dos Dados
            </h2>
            <p className="text-gray-600 mb-4">
              Adotamos medidas técnicas e organizacionais robustas para proteger os dados pessoais contra acessos não autorizados, alterações, divulgação ou destruição indevida:
            </p>
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-start gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                <Lock className="h-5 w-5 text-[#0056A4] mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#002B49]">Criptografia AES-256</h4>
                  <p className="text-sm text-gray-600">Todos os dados sensíveis são criptografados em repouso e em trânsito.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                <Eye className="h-5 w-5 text-[#0056A4] mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#002B49]">Controle de Acesso</h4>
                  <p className="text-sm text-gray-600">Acesso baseado em perfis com privilégios mínimos necessários.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                <Database className="h-5 w-5 text-[#0056A4] mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#002B49]">Backup Automático</h4>
                  <p className="text-sm text-gray-600">Backups diários com redundância geográfica.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-[#F5F7FA] rounded-xl">
                <Shield className="h-5 w-5 text-[#0056A4] mt-0.5" />
                <div>
                  <h4 className="font-semibold text-[#002B49]">Auditoria Completa</h4>
                  <p className="text-sm text-gray-600">Logs detalhados de todas as ações realizadas no Sistema.</p>
                </div>
              </div>
            </div>

            {/* Seção 6 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">6</span>
              Retenção de Dados
            </h2>
            <p className="text-gray-600 mb-4">
              Os dados pessoais serão retidos pelo tempo necessário para cumprir as finalidades para as quais foram coletados, incluindo obrigações legais:
            </p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li><strong>Prontuários Médicos:</strong> Mínimo de 20 anos após o último registro, conforme Resolução CFM nº 1.821/2007.</li>
              <li><strong>Dados Financeiros:</strong> 5 anos para fins fiscais e tributários.</li>
              <li><strong>Logs de Acesso:</strong> 6 meses, conforme Marco Civil da Internet.</li>
            </ul>

            {/* Seção 7 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">7</span>
              Direitos do Titular
            </h2>
            <p className="text-gray-600 mb-4">
              Em conformidade com a LGPD, você possui os seguintes direitos em relação aos seus dados pessoais:
            </p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li><strong>Confirmação e Acesso:</strong> Confirmar a existência de tratamento e acessar seus dados.</li>
              <li><strong>Correção:</strong> Solicitar a correção de dados incompletos, inexatos ou desatualizados.</li>
              <li><strong>Anonimização, Bloqueio ou Eliminação:</strong> Solicitar a anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade.</li>
              <li><strong>Portabilidade:</strong> Solicitar a portabilidade dos dados a outro fornecedor de serviço.</li>
              <li><strong>Revogação do Consentimento:</strong> Revogar o consentimento a qualquer momento, quando aplicável.</li>
              <li><strong>Informação sobre Compartilhamento:</strong> Obter informações sobre entidades com as quais seus dados foram compartilhados.</li>
            </ul>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8">
              <p className="text-amber-800 text-sm">
                <strong>Importante:</strong> Alguns direitos podem ser limitados em razão de obrigações legais, especialmente no que se refere à guarda de prontuários médicos pelo prazo mínimo de 20 anos.
              </p>
            </div>

            {/* Seção 8 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">8</span>
              Tratamento de Dados Após a Morte
            </h2>
            <p className="text-gray-600 mb-4">
              Conforme o Código de Ética Médica e a Recomendação CFM nº 3/2014, o sigilo sobre o prontuário médico permanece após a morte do titular. Os dados serão preservados pelo período legal e poderão ser acessados por:
            </p>
            <ul className="space-y-2 text-gray-600 mb-6">
              <li>Herdeiros legais, mediante comprovação e autorização judicial, quando necessário.</li>
              <li>Autoridades competentes, mediante ordem judicial.</li>
            </ul>

            {/* Seção 9 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">9</span>
              Cookies e Tecnologias Similares
            </h2>
            <p className="text-gray-600 mb-4">
              O Sistema utiliza cookies e tecnologias similares para melhorar a experiência do Usuário, manter a sessão ativa e coletar dados de uso. Você pode gerenciar as preferências de cookies através das configurações do seu navegador.
            </p>

            {/* Seção 10 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">10</span>
              Alterações nesta Política
            </h2>
            <p className="text-gray-600 mb-4">
              Esta Política poderá ser atualizada periodicamente. Alterações significativas serão comunicadas através do Sistema ou por e-mail. Recomendamos a revisão periódica desta página.
            </p>

            {/* Seção 11 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">11</span>
              Contato
            </h2>
            <p className="text-gray-600 mb-4">
              Para exercer seus direitos ou esclarecer dúvidas sobre esta Política, entre em contato com nosso Encarregado de Proteção de Dados (DPO):
            </p>
            <div className="bg-[#F5F7FA] rounded-xl p-6">
              <p className="text-gray-600"><strong>E-mail:</strong> <a href="mailto:privacidade@gorgen.com.br" className="text-[#0056A4] hover:underline">privacidade@gorgen.com.br</a></p>
              <p className="text-gray-600 mt-2"><strong>Endereço:</strong> Rua Exemplo, 123 - Porto Alegre/RS - CEP 90000-000</p>
            </div>
          </div>
        </div>

        {/* Links relacionados */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/termos-de-uso")}
            className="border-[#0056A4] text-[#0056A4]"
          >
            <FileText className="h-4 w-4 mr-2" />
            Termos de Uso
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setLocation("/quem-somos")}
            className="border-[#0056A4] text-[#0056A4]"
          >
            <Scale className="h-4 w-4 mr-2" />
            Quem Somos
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#002B49] text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img 
              src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
              alt="Gorgen Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="font-bold">GORGEN</span>
          </div>
          <p className="text-white/60 text-sm">
            © 2026 Gorgen. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
