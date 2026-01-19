import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { 
  Shield, 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Lock,
  CheckCircle,
  ArrowRight,
  Stethoscope,
  Heart,
  Building2
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header/Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl font-bold text-[#002B49] tracking-wide">GORGEN</span>
              <span className="ml-2 text-sm text-gray-500 hidden sm:block">Gestão em Saúde</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#funcionalidades" className="text-gray-600 hover:text-[#0056A4] transition-colors">Funcionalidades</a>
              <a href="#planos" className="text-gray-600 hover:text-[#0056A4] transition-colors">Planos</a>
              <a href="#sobre" className="text-gray-600 hover:text-[#0056A4] transition-colors">Sobre</a>
            </nav>
            
            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost" className="text-[#002B49] hover:text-[#0056A4]">
                  Entrar
                </Button>
              </Link>
              <Link href="/register">
                <Button className="bg-[#0056A4] hover:bg-[#004080] text-white">
                  Criar Conta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F5F7FA] to-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold text-[#002B49] leading-tight mb-6">
                Gestão em Saúde com{" "}
                <span className="text-[#0056A4]">Arquitetura de Rede Social</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                O prontuário eletrônico centrado no paciente. Você é dono dos seus dados de saúde e decide quem pode acessá-los.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button size="lg" className="bg-[#0056A4] hover:bg-[#004080] text-white px-8">
                    Começar Agora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <a href="#funcionalidades">
                  <Button size="lg" variant="outline" className="border-[#0056A4] text-[#0056A4] hover:bg-[#0056A4] hover:text-white px-8">
                    Saiba Mais
                  </Button>
                </a>
              </div>
              
              {/* Trust Badges */}
              <div className="mt-10 flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-[#0056A4]" />
                  <span>LGPD Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-[#0056A4]" />
                  <span>Criptografia AES-256</span>
                </div>
              </div>
            </div>
            
            {/* Hero Image/Illustration */}
            <div className="relative">
              <div className="bg-gradient-to-br from-[#6B8CBE]/20 to-[#0056A4]/10 rounded-2xl p-8 aspect-square flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 bg-[#0056A4] rounded-full flex items-center justify-center">
                    <Stethoscope className="h-16 w-16 text-white" />
                  </div>
                  <p className="text-lg font-medium text-[#002B49]">Seu prontuário, sua propriedade</p>
                  <p className="text-gray-500 mt-2">Compartilhe com quem você confia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="funcionalidades" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#002B49] mb-4">Funcionalidades</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar sua saúde ou seu consultório em um só lugar.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature Cards */}
            <Card className="border-gray-100 hover:border-[#6B8CBE] transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-[#6B8CBE]/10 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6 text-[#6B8CBE]" />
                </div>
                <CardTitle className="text-[#002B49]">Prontuário Eletrônico</CardTitle>
                <CardDescription>
                  Histórico médico completo e organizado. Evoluções, exames, prescrições em um só lugar.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-gray-100 hover:border-[#6B8CBE] transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-[#6B8CBE]/10 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="h-6 w-6 text-[#6B8CBE]" />
                </div>
                <CardTitle className="text-[#002B49]">Agenda Inteligente</CardTitle>
                <CardDescription>
                  Gerencie consultas, confirmações automáticas e lembretes para pacientes.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-gray-100 hover:border-[#6B8CBE] transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-[#6B8CBE]/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-[#6B8CBE]" />
                </div>
                <CardTitle className="text-[#002B49]">Compartilhamento Seguro</CardTitle>
                <CardDescription>
                  Autorize médicos a acessar seu prontuário. Revogue acesso a qualquer momento.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-gray-100 hover:border-[#6B8CBE] transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-[#6B8CBE]/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-[#6B8CBE]" />
                </div>
                <CardTitle className="text-[#002B49]">Faturamento</CardTitle>
                <CardDescription>
                  Controle financeiro completo. Recibos, faturas e relatórios de faturamento.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-gray-100 hover:border-[#6B8CBE] transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-[#6B8CBE]/10 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-[#6B8CBE]" />
                </div>
                <CardTitle className="text-[#002B49]">Segurança Total</CardTitle>
                <CardDescription>
                  Criptografia de ponta, backup automático e conformidade com LGPD.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="border-gray-100 hover:border-[#6B8CBE] transition-colors">
              <CardHeader>
                <div className="w-12 h-12 bg-[#6B8CBE]/10 rounded-lg flex items-center justify-center mb-4">
                  <Lock className="h-6 w-6 text-[#6B8CBE]" />
                </div>
                <CardTitle className="text-[#002B49]">Você no Controle</CardTitle>
                <CardDescription>
                  Seus dados são seus. Decida quem vê, por quanto tempo e revogue quando quiser.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F7FA]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-[#002B49] mb-4">Planos e Preços</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Escolha o plano ideal para você. Pacientes, médicos ou clínicas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Paciente Plan */}
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#6B8CBE]/10 rounded-full flex items-center justify-center">
                  <Heart className="h-8 w-8 text-[#6B8CBE]" />
                </div>
                <CardTitle className="text-xl text-[#002B49]">Paciente</CardTitle>
                <CardDescription>Para quem quer organizar sua saúde</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#002B49]">R$ 9,90</span>
                  <span className="text-gray-500">/mês</span>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Prontuário pessoal unificado</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Upload de exames</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Histórico de consultas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Gestão de autorizações</span>
                  </li>
                </ul>
                <Link href="/register?plan=paciente">
                  <Button className="w-full bg-[#6B8CBE] hover:bg-[#5A7DB0] text-white">
                    Começar
                  </Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Médico Plan */}
            <Card className="border-2 border-[#0056A4] bg-white relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-[#0056A4] text-white text-sm font-medium px-4 py-1 rounded-full">
                  Mais Popular
                </span>
              </div>
              <CardHeader className="text-center pb-2 pt-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#0056A4]/10 rounded-full flex items-center justify-center">
                  <Stethoscope className="h-8 w-8 text-[#0056A4]" />
                </div>
                <CardTitle className="text-xl text-[#002B49]">Médico</CardTitle>
                <CardDescription>Para profissionais de saúde</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#002B49]">R$ 197</span>
                  <span className="text-gray-500">/mês</span>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Prontuário eletrônico completo</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Agenda e faturamento</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Até 2 secretárias inclusas</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Suporte prioritário</span>
                  </li>
                </ul>
                <Link href="/register?plan=medico">
                  <Button className="w-full bg-[#0056A4] hover:bg-[#004080] text-white">
                    Começar
                  </Button>
                </Link>
                <p className="text-sm text-gray-500 mt-3">25% de desconto no plano anual</p>
              </CardContent>
            </Card>
            
            {/* Clínica Plan */}
            <Card className="border-2 border-gray-200 bg-white">
              <CardHeader className="text-center pb-2">
                <div className="w-16 h-16 mx-auto mb-4 bg-[#002B49]/10 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-[#002B49]" />
                </div>
                <CardTitle className="text-xl text-[#002B49]">Clínica</CardTitle>
                <CardDescription>Para clínicas e hospitais</CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-[#002B49]">Sob Consulta</span>
                </div>
                <ul className="space-y-3 text-left mb-8">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Economia de tenants existentes</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Dashboard gerencial</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">API de integração</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span className="text-gray-600">Onboarding dedicado</span>
                  </li>
                </ul>
                <a href="mailto:contato@gorgen.com.br?subject=Interesse no Plano Clínica">
                  <Button variant="outline" className="w-full border-[#002B49] text-[#002B49] hover:bg-[#002B49] hover:text-white">
                    Fale Conosco
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#002B49] mb-6">Sobre o GORGEN</h2>
          <p className="text-xl text-gray-600 mb-8 leading-relaxed">
            O GORGEN nasceu da experiência real de um médico que atendeu milhares de pacientes e entendeu que o prontuário deveria pertencer ao paciente, não ao consultório.
          </p>
          <p className="text-lg text-gray-500 mb-8">
            Combinamos gestão em saúde com arquitetura de rede social: você conecta com seus médicos, compartilha seus dados de forma segura e mantém o controle total sobre quem pode acessar suas informações.
          </p>
          <div className="flex justify-center gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-[#0056A4]">100%</div>
              <div className="text-gray-500">LGPD Compliant</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0056A4]">AES-256</div>
              <div className="text-gray-500">Criptografia</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-[#0056A4]">24/7</div>
              <div className="text-gray-500">Backup Automático</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-[#002B49]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Pronto para transformar sua gestão de saúde?
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Junte-se a milhares de pacientes e médicos que já confiam no GORGEN.
          </p>
          <Link href="/register">
            <Button size="lg" className="bg-[#0056A4] hover:bg-[#004080] text-white px-12">
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 bg-[#001A2E]">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-xl font-bold text-white tracking-wide">GORGEN</span>
              <p className="text-gray-400 mt-2 text-sm">
                Gestão em Saúde com Arquitetura de Rede Social
              </p>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Produto</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#funcionalidades" className="hover:text-white transition-colors">Funcionalidades</a></li>
                <li><a href="#planos" className="hover:text-white transition-colors">Planos</a></li>
                <li><a href="#sobre" className="hover:text-white transition-colors">Sobre</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LGPD</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-4">Contato</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li>contato@gorgen.com.br</li>
                <li>www.gorgen.com.br</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400 text-sm">
            © 2026 GORGEN. Todos os direitos reservados.
          </div>
        </div>
      </footer>
    </div>
  );
}
