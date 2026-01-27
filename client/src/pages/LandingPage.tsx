import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { 
  Shield, 
  Users, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Lock,
  ArrowRight,
  Phone,
  Mail,
  MessageCircle,
  X
} from "lucide-react";
import MobileLandingMosaic from "@/components/MobileLandingMosaic";

// Ícones de redes sociais
const InstagramIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const XIcon = () => (
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Componente de aviso de cookies
function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const cookieConsent = localStorage.getItem("gorgen_cookie_consent");
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem("gorgen_cookie_consent", "accepted");
    setShowBanner(false);
  };

  const rejectCookies = () => {
    localStorage.setItem("gorgen_cookie_consent", "rejected");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#002B49] text-white p-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm">
            Utilizamos cookies para melhorar sua experiência em nosso site. Ao continuar navegando, você concorda com nossa{" "}
            <a href="#" className="underline hover:text-[#6B8CBE]">Política de Privacidade</a> e{" "}
            <a href="#" className="underline hover:text-[#6B8CBE]">Política de Cookies</a>.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={rejectCookies}
            className="border-white text-white hover:bg-white hover:text-[#002B49]"
          >
            Rejeitar
          </Button>
          <Button 
            size="sm" 
            onClick={acceptCookies}
            className="bg-white text-[#002B49] hover:bg-gray-100"
          >
            Aceitar Cookies
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Mobile: Mosaico estilo Itaú */}
      <div className="lg:hidden">
        <MobileLandingMosaic />
      </div>

      {/* Desktop: Landing page tradicional */}
      <div className="hidden lg:block min-h-screen bg-white">
        {/* Header/Navigation */}
        <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-2">
                <img 
                  src="/assets/logo/gorgen_logo_master_2048_transparent.png" 
                  alt="Gorgen Logo" 
                  className="h-10 w-10 object-contain"
                />
                <span className="text-2xl font-bold text-[#002B49] tracking-wide">GORGEN</span>
                <span className="ml-2 text-sm text-gray-500 hidden sm:block">Gestão em Saúde</span>
              </div>
              
              {/* Navigation Links + Auth Buttons */}
              <div className="hidden md:flex items-center gap-8">
                <nav className="flex items-center gap-8">
                  <a href="#funcionalidades" className="text-gray-600 hover:text-[#002B49] transition-colors font-medium">Funcionalidades</a>
                  <a href="#sobre" className="text-gray-600 hover:text-[#002B49] transition-colors font-medium">Sobre</a>
                  <a href="#quem-somos" className="text-gray-600 hover:text-[#002B49] transition-colors font-medium">Quem Somos</a>
                </nav>
                <div className="flex items-center gap-3">
                  <Link href="/register">
                    <Button 
                      variant="outline" 
                      className="border-[#002B49] text-[#002B49] bg-white hover:bg-[#002B49] hover:text-white px-6"
                    >
                      Crie sua conta
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="bg-[#002B49] hover:bg-[#001A2E] text-white px-6">
                      Entrar
                    </Button>
                  </Link>
                </div>
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
                  <a href="#funcionalidades">
                    <Button size="lg" className="bg-[#0056A4] hover:bg-[#004080] text-white px-8">
                      Saiba Mais
                      <ArrowRight className="ml-2 h-5 w-5" />
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
                    <div className="w-64 h-64 mx-auto mb-6 bg-[#002B49] rounded-full flex items-center justify-center shadow-xl">
                      <img 
                        src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
                        alt="Gorgen Logo" 
                        className="w-48 h-48 object-contain"
                      />
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
              <Card className="border-gray-100 hover:border-[#6B8CBE] transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#6B8CBE]/10 rounded-lg flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-[#6B8CBE]" />
                  </div>
                  <CardTitle className="text-[#002B49]">Prontuário Eletrônico</CardTitle>
                  <CardDescription>
                    Registro completo do seu histórico de saúde, acessível de qualquer lugar, a qualquer momento.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-gray-100 hover:border-[#BE6B7D] transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#BE6B7D]/10 rounded-lg flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-[#BE6B7D]" />
                  </div>
                  <CardTitle className="text-[#002B49]">Agendamento Inteligente</CardTitle>
                  <CardDescription>
                    Marque consultas, receba lembretes e gerencie sua agenda de saúde com facilidade.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-gray-100 hover:border-[#8E7DBE] transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#8E7DBE]/10 rounded-lg flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-[#8E7DBE]" />
                  </div>
                  <CardTitle className="text-[#002B49]">Rede de Médicos</CardTitle>
                  <CardDescription>
                    Conecte-se com seus médicos e compartilhe informações de forma segura e controlada.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-gray-100 hover:border-[#BEA06B] transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#BEA06B]/10 rounded-lg flex items-center justify-center mb-4">
                    <TrendingUp className="h-6 w-6 text-[#BEA06B]" />
                  </div>
                  <CardTitle className="text-[#002B49]">Acompanhamento de Saúde</CardTitle>
                  <CardDescription>
                    Visualize tendências, monitore indicadores e tome decisões informadas sobre sua saúde.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-gray-100 hover:border-[#6BB0BE] transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#6BB0BE]/10 rounded-lg flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-[#6BB0BE]" />
                  </div>
                  <CardTitle className="text-[#002B49]">Segurança Total</CardTitle>
                  <CardDescription>
                    Criptografia de ponta a ponta, conformidade LGPD e backups automáticos.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-gray-100 hover:border-[#0056A4] transition-colors">
                <CardHeader>
                  <div className="w-12 h-12 bg-[#0056A4]/10 rounded-lg flex items-center justify-center mb-4">
                    <Lock className="h-6 w-6 text-[#0056A4]" />
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

        {/* About Section */}
        <section id="sobre" className="py-20 px-4 sm:px-6 lg:px-8 bg-[#F5F7FA]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-[#002B49] mb-6">Sobre o GORGEN</h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Somos uma plataforma de gestão em saúde com foco no paciente, no qual médicos são parte do ecossistema que desenvolve toda a jornada assistencial — da consulta ao faturamento, do intra- ao extra-hospitalar.
            </p>
            <p className="text-lg text-gray-500 mb-8">
              Ouvimos as dores de pacientes e de médicos diante de um sistema de saúde burocrático, fragmentado e distorcido e desenhamos uma solução inteligente que simplifica a gestão e devolve tempo e energia dos médicos para o que realmente importa: o cuidado às pessoas.
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

        {/* Footer Completo */}
        <footer className="py-16 px-4 sm:px-6 lg:px-8 bg-[#001A2E]">
          <div className="max-w-7xl mx-auto">
            {/* Grid de 5 colunas */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 mb-12">
              {/* Logo e descrição */}
              <div className="col-span-2 md:col-span-3 lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <img 
                    src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
                    alt="Gorgen Logo" 
                    className="h-10 w-10 object-contain"
                  />
                  <span className="text-xl font-bold text-white tracking-wide">GORGEN</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Gestão em Saúde com Arquitetura de Rede Social. Seu prontuário, sua propriedade.
                </p>
              </div>

              {/* Nossos Produtos */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Nossos Produtos</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Para Pacientes</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Para Médicos</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Para Empresas</a></li>
                </ul>
              </div>

              {/* A Empresa */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">A Empresa</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li><a href="#quem-somos" className="hover:text-white transition-colors">Quem Somos</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Carreiras</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Imprensa</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Relação com Investidores</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacidade</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Segurança de Dados</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Sustentabilidade</a></li>
                </ul>
              </div>

              {/* Ajuda */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Ajuda</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li><a href="#" className="hover:text-white transition-colors">Central de Ajuda</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">SAC 0800 123 4567</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Denúncia</a></li>
                </ul>
              </div>

              {/* Fale Conosco */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Fale Conosco</h4>
                <ul className="space-y-3 text-gray-400 text-sm">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <a href="tel:+5511999999999" className="hover:text-white transition-colors">(11) 99999-9999</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <a href="mailto:contato@gorgen.com.br" className="hover:text-white transition-colors">contato@gorgen.com.br</a>
                  </li>
                  <li className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4" />
                    <a href="https://wa.me/5511999999999" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp</a>
                  </li>
                </ul>
              </div>

              {/* Acompanhe */}
              <div>
                <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Acompanhe</h4>
                <div className="flex flex-wrap gap-3">
                  <a 
                    href="https://instagram.com/gorgen" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-700 hover:bg-[#E4405F] rounded-full flex items-center justify-center text-white transition-colors"
                    title="Instagram"
                  >
                    <InstagramIcon />
                  </a>
                  <a 
                    href="https://youtube.com/gorgen" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-700 hover:bg-[#FF0000] rounded-full flex items-center justify-center text-white transition-colors"
                    title="YouTube"
                  >
                    <YouTubeIcon />
                  </a>
                  <a 
                    href="https://facebook.com/gorgen" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-700 hover:bg-[#1877F2] rounded-full flex items-center justify-center text-white transition-colors"
                    title="Facebook"
                  >
                    <FacebookIcon />
                  </a>
                  <a 
                    href="https://x.com/gorgen" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-10 h-10 bg-gray-700 hover:bg-black rounded-full flex items-center justify-center text-white transition-colors"
                    title="X (Twitter)"
                  >
                    <XIcon />
                  </a>
                </div>
              </div>
            </div>

            {/* Linha divisória e copyright */}
            <div className="border-t border-gray-700 pt-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-gray-400 text-sm">
                  © 2026 GORGEN. Todos os direitos reservados. CNPJ: 00.000.000/0001-00
                </p>
                <div className="flex items-center gap-4 text-gray-400 text-sm">
                  <a href="#" className="hover:text-white transition-colors">Termos de Uso</a>
                  <span>|</span>
                  <a href="#" className="hover:text-white transition-colors">Política de Privacidade</a>
                  <span>|</span>
                  <a href="#" className="hover:text-white transition-colors">Cookies</a>
                </div>
              </div>
            </div>
          </div>
        </footer>

        {/* Banner de Cookies */}
        <CookieBanner />
      </div>
    </>
  );
}
