import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Shield, AlertTriangle, Scale } from "lucide-react";

export default function TermosDeUso() {
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
            <FileText className="h-10 w-10" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Termos e Condições de Uso</h1>
          <p className="text-white/70">Versão 2.1 | Última atualização: 27 de Janeiro de 2026</p>
        </div>
      </section>

      {/* Conteúdo */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
          {/* Introdução */}
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 leading-relaxed mb-8">
              Bem-vindo ao <strong>Sistema Gorgen</strong>. Estes Termos e Condições de Uso ("Termos") regem o acesso e a utilização do software de gestão médica Gorgen ("Sistema"), disponibilizado e mantido pelo consultório do Dr. André Gorgen ("Prestador").
            </p>

            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-8">
              <p className="text-amber-800 font-medium">
                AO ACESSAR E UTILIZAR O SISTEMA, VOCÊ ("USUÁRIO") RECONHECE QUE LEU, COMPREENDEU E CONCORDA EM FICAR VINCULADO A ESTES TERMOS, À NOSSA POLÍTICA DE PRIVACIDADE E A TODOS OS DEMAIS DOCUMENTOS LEGAIS AQUI REFERENCIADOS.
              </p>
            </div>

            {/* Seção 1 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">1</span>
              Definições
            </h2>
            <ul className="space-y-3 text-gray-600">
              <li><strong>Sistema:</strong> Refere-se à plataforma de software Gorgen, incluindo todos os seus módulos, funcionalidades, interfaces e documentação associada.</li>
              <li><strong>Usuário:</strong> Refere-se a qualquer indivíduo (paciente, médico, secretária, assistente, administrador financeiro) autorizado a acessar e utilizar o Sistema, cada um com seu perfil específico.</li>
              <li><strong>Dados do Paciente:</strong> Inclui todos os dados pessoais e dados pessoais sensíveis (informações de saúde) dos pacientes inseridos no Sistema.</li>
            </ul>

            {/* Seção 2 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">2</span>
              Perfis de Usuário, Privilégios e Responsabilidades
            </h2>
            <p className="text-gray-600 mb-4">
              O acesso ao Sistema é estritamente segmentado por perfis, cada um com diferentes níveis de privilégios, atribuições e responsabilidades. Ao aceitar estes Termos, você reconhece e concorda com as limitações e deveres do seu perfil específico.
            </p>

            <div className="overflow-x-auto mb-6">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#002B49] text-white">
                    <th className="p-3 text-left">Perfil</th>
                    <th className="p-3 text-left">Privilégios e Atribuições</th>
                    <th className="p-3 text-left">Responsabilidades</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  <tr className="border-b">
                    <td className="p-3 font-medium">Paciente</td>
                    <td className="p-3 text-gray-600">Acesso ao seu próprio portal para visualizar agendamentos, documentos, e dados de saúde de forma simplificada. Pode designar um "Responsável" (Next of Kin).</td>
                    <td className="p-3 text-gray-600">Manter seus dados de acesso em sigilo. Comunicar ao consultório qualquer inconsistência em seus dados.</td>
                  </tr>
                  <tr className="border-b bg-gray-50">
                    <td className="p-3 font-medium">Médico</td>
                    <td className="p-3 text-gray-600">Acesso completo aos prontuários dos pacientes sob seus cuidados, registro de evolução, prescrição, solicitação de exames e análise de dados clínicos.</td>
                    <td className="p-3 text-gray-600">Responsabilidade legal e ética sobre todos os registros. Sigilo profissional absoluto. Uso das credenciais é pessoal e intransferível.</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3 font-medium">Secretária</td>
                    <td className="p-3 text-gray-600">Gestão de agendamentos, cadastro e atualização de dados demográficos de pacientes, faturamento e comunicação administrativa. <strong>Não possui acesso a dados clínicos sensíveis.</strong></td>
                    <td className="p-3 text-gray-600">Confidencialidade dos dados administrativos. Renovação periódica da autorização de acesso junto ao médico responsável.</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="p-3 font-medium">Administrador</td>
                    <td className="p-3 text-gray-600">Acesso irrestrito a todas as funcionalidades, incluindo configurações do sistema, gestão de usuários e auditoria completa. <strong>Único perfil com poder para autorizar exclusões lógicas de dados.</strong></td>
                    <td className="p-3 text-gray-600">Supervisão geral da plataforma, garantia da conformidade e gestão dos perfis de acesso.</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Seção 3 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">3</span>
              Violações e Sanções Administrativas
            </h2>
            <p className="text-gray-600 mb-4">
              O cumprimento destes Termos é mandatório. A violação de qualquer cláusula, especialmente as relativas à segurança e confidencialidade, sujeitará o Usuário a um processo administrativo interno, que pode resultar em uma hierarquia de sanções, aplicadas a critério exclusivo do Prestador.
            </p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 mb-4">
              <li><strong>Advertência:</strong> Notificação formal por escrito sobre a infração cometida.</li>
              <li><strong>Restrição de Uso:</strong> Limitação temporária do acesso a determinadas funcionalidades do Sistema.</li>
              <li><strong>Suspensão de Uso:</strong> Bloqueio temporário e completo da conta do Usuário.</li>
              <li><strong>Exclusão da Conta:</strong> Encerramento definitivo do acesso do Usuário à plataforma, sem prejuízo das medidas legais cabíveis.</li>
            </ol>

            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                <p className="text-red-800 text-sm">
                  O Usuário declara-se ciente de que o Prestador se reserva o direito de aplicar qualquer uma das sanções acima, ou mesmo excluir sumariamente um Usuário da plataforma, a qualquer tempo e sem necessidade de justificativa prévia, caso sua conduta seja considerada um risco à segurança, integridade ou reputação do Sistema, dos dados ou de seus pacientes.
                </p>
              </div>
            </div>

            {/* Seção 4 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">4</span>
              Regras de Utilização e Princípios Fundamentais
            </h2>
            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center mb-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-[#002B49] mb-2">Imutabilidade</h4>
                <p className="text-sm text-gray-600">Todo dado clínico inserido no Sistema é perpétuo. <strong>Não se apaga informação.</strong> Correções são feitas via "retificação", preservando o registro original.</p>
              </div>
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center mb-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-[#002B49] mb-2">Sigilo Absoluto</h4>
                <p className="text-sm text-gray-600">A divulgação indevida de informações constitui uma violação grave destes Termos.</p>
              </div>
              <div className="bg-[#F5F7FA] rounded-xl p-4">
                <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center mb-3">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <h4 className="font-semibold text-[#002B49] mb-2">Rastreabilidade</h4>
                <p className="text-sm text-gray-600">Todas as ações são registradas em logs de auditoria detalhados.</p>
              </div>
            </div>

            {/* Seção 5 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">5</span>
              Propriedade Intelectual
            </h2>
            <p className="text-gray-600 mb-4">
              Todo o conteúdo, software, design, logotipos, fluxos de trabalho, lógicas de programação, scripts e demais elementos que compõem o Sistema Gorgen são de propriedade intelectual exclusiva do Dr. André Gorgen. A utilização indevida, cópia, engenharia reversa ou qualquer forma de apropriação de qualquer parte do Sistema constitui violação das leis de propriedade intelectual e será tratada com o máximo rigor.
            </p>

            {/* Seção 6 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">6</span>
              Privacidade e Proteção de Dados
            </h2>
            <p className="text-gray-600 mb-4">
              A nossa <a href="/politica-de-privacidade" className="text-[#0056A4] hover:underline font-medium">Política de Privacidade</a> detalha como tratamos os dados pessoais e está incorporada a estes Termos. É seu dever ler, compreender e concordar com ela.
            </p>
            <p className="text-gray-600 mb-4">A Política de Privacidade aborda temas essenciais como:</p>
            <ul className="space-y-2 text-gray-600 mb-4">
              <li><strong>Tratamento de Dados Após a Morte:</strong> Conforme o Código de Ética Médica e a Recomendação CFM nº 3/2014, o sigilo sobre o prontuário permanece após a morte do titular. Os dados serão preservados por um período mínimo de 20 anos.</li>
              <li><strong>Responsável (Next of Kin):</strong> Pacientes podem designar um responsável legal para operar sua conta em seu melhor interesse em caso de incapacidade ou menoridade.</li>
            </ul>

            {/* Seção 7 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">7</span>
              Contratos de Uso Específicos
            </h2>
            <p className="text-gray-600 mb-4">
              Além destes Termos gerais, o uso do Sistema está condicionado à aceitação de um <strong>Contrato de Uso</strong> específico para o seu perfil (Paciente, Médico ou Secretária), que detalhará outras obrigações e condições. A aceitação destes contratos é obrigatória para a liberação do acesso.
            </p>

            {/* Seção 8 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">8</span>
              Limitação de Responsabilidade
            </h2>
            <p className="text-gray-600 mb-4">
              O Prestador não se responsabiliza por danos indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo perda de lucros, dados, uso, boa vontade ou outras perdas intangíveis, resultantes do uso ou incapacidade de usar o Sistema.
            </p>

            {/* Seção 9 */}
            <h2 className="text-2xl font-bold text-[#002B49] mt-10 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#0056A4] text-white rounded-full flex items-center justify-center text-sm">9</span>
              Contato
            </h2>
            <p className="text-gray-600">
              Em caso de dúvidas sobre estes Termos de Uso, entre em contato com o administrador do sistema através do e-mail: <a href="mailto:contato@gorgen.com.br" className="text-[#0056A4] hover:underline">contato@gorgen.com.br</a>
            </p>
          </div>
        </div>

        {/* Links relacionados */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button 
            variant="outline" 
            onClick={() => setLocation("/politica-de-privacidade")}
            className="border-[#0056A4] text-[#0056A4]"
          >
            <Shield className="h-4 w-4 mr-2" />
            Política de Privacidade
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
