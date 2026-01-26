import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Target, 
  Heart, 
  Lightbulb,
  Award,
  Clock,
  Lock
} from "lucide-react";

export default function QuemSomos() {
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

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-[#0056A4] to-[#002B49] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-8 backdrop-blur-sm">
            <img 
              src="/assets/logo/gorgen_logo_master_2048_transparent_white.png" 
              alt="Gorgen Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Quem Somos</h1>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Transformando a gestão em saúde com tecnologia, segurança e foco no paciente.
          </p>
        </div>
      </section>

      {/* Nossa História */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-[#0056A4]/10 rounded-full flex items-center justify-center">
                <Clock className="h-6 w-6 text-[#0056A4]" />
              </div>
              <h2 className="text-3xl font-bold text-[#002B49]">Nossa História</h2>
            </div>
            <div className="prose prose-lg max-w-none text-gray-600">
              <p>
                O Gorgen nasceu da visão do <strong>Dr. André Gorgen</strong>, médico com mais de 
                duas décadas de experiência clínica, que identificou uma lacuna crítica no mercado: 
                a falta de sistemas de gestão médica que realmente colocassem o paciente no centro 
                do cuidado.
              </p>
              <p>
                Em 2025, após anos de frustração com sistemas fragmentados e pouco intuitivos, 
                iniciamos o desenvolvimento de uma plataforma que unisse o melhor da tecnologia 
                moderna com as necessidades reais de médicos e pacientes.
              </p>
              <p>
                Hoje, o Gorgen representa uma nova era na gestão em saúde: um sistema que não 
                apenas organiza informações, mas que cria conexões significativas entre todos os 
                participantes do ecossistema de saúde.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Missão, Visão e Valores */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Missão */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-[#0056A4] rounded-xl flex items-center justify-center mb-6">
                <Target className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#002B49] mb-4">Missão</h3>
              <p className="text-gray-600">
                Democratizar o acesso a uma gestão de saúde de excelência, capacitando 
                médicos e pacientes com ferramentas intuitivas e seguras.
              </p>
            </div>

            {/* Visão */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-[#6BB0BE] rounded-xl flex items-center justify-center mb-6">
                <Lightbulb className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#002B49] mb-4">Visão</h3>
              <p className="text-gray-600">
                Ser a plataforma de referência em gestão de saúde no Brasil, reconhecida 
                pela inovação, segurança e compromisso com o bem-estar do paciente.
              </p>
            </div>

            {/* Valores */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-14 h-14 bg-[#BE6B7D] rounded-xl flex items-center justify-center mb-6">
                <Heart className="h-7 w-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-[#002B49] mb-4">Valores</h3>
              <p className="text-gray-600">
                Ética, transparência, inovação responsável, respeito à privacidade e 
                compromisso inabalável com a qualidade do cuidado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pilares */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#002B49] text-center mb-12">
            Nossos Pilares Fundamentais
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="flex items-start gap-4 p-6 bg-[#F5F7FA] rounded-xl">
              <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center flex-shrink-0">
                <Lock className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#002B49] mb-2">Imutabilidade</h4>
                <p className="text-sm text-gray-600">
                  Todo dado inserido é perpétuo. Não se apaga informação em saúde.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-[#F5F7FA] rounded-xl">
              <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#002B49] mb-2">Sigilo Absoluto</h4>
                <p className="text-sm text-gray-600">
                  Criptografia AES-256 e conformidade total com LGPD.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-[#F5F7FA] rounded-xl">
              <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center flex-shrink-0">
                <Award className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#002B49] mb-2">Rastreabilidade</h4>
                <p className="text-sm text-gray-600">
                  Cada ação é registrada com timestamp e identificação do autor.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-[#F5F7FA] rounded-xl">
              <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#002B49] mb-2">Controle de Acesso</h4>
                <p className="text-sm text-gray-600">
                  Perfis granulares garantem que cada usuário veja apenas o necessário.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-[#F5F7FA] rounded-xl">
              <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#002B49] mb-2">Simplicidade</h4>
                <p className="text-sm text-gray-600">
                  Interface intuitiva com profundidade sob demanda.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-6 bg-[#F5F7FA] rounded-xl">
              <div className="w-10 h-10 bg-[#0056A4] rounded-lg flex items-center justify-center flex-shrink-0">
                <Target className="h-5 w-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-[#002B49] mb-2">Automação</h4>
                <p className="text-sm text-gray-600">
                  Eliminação de duplo trabalho através de integrações inteligentes.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Equipe */}
      <section className="py-16 bg-[#F5F7FA]">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-[#002B49] text-center mb-12">
            Nossa Equipe
          </h2>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-2xl p-8 shadow-sm text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-[#0056A4] to-[#002B49] rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl font-bold text-white">AG</span>
              </div>
              <h3 className="text-xl font-bold text-[#002B49] mb-2">Dr. André Gorgen</h3>
              <p className="text-[#0056A4] font-medium mb-4">Fundador & Diretor Médico</p>
              <p className="text-gray-600 text-sm">
                Médico com mais de 20 anos de experiência clínica, especialista em 
                gestão de saúde e tecnologia aplicada à medicina. Idealizador do 
                conceito de prontuário eletrônico centrado no paciente.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-[#0056A4] to-[#002B49] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Faça Parte Desta Transformação</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Junte-se a milhares de profissionais e pacientes que já descobriram 
            uma nova forma de cuidar da saúde.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => setLocation("/register")}
              className="bg-white text-[#0056A4] hover:bg-gray-100 font-semibold"
            >
              Criar Conta Gratuita
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => setLocation("/login")}
              className="border-white text-white hover:bg-white/10"
            >
              Já Tenho Conta
            </Button>
          </div>
        </div>
      </section>

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
          <p className="text-white/40 text-xs mt-2">
            Paciente no centro do cuidado.
          </p>
        </div>
      </footer>
    </div>
  );
}
