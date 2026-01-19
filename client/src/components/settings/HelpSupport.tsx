import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  FileText,
  ExternalLink,
  Send,
  Loader2,
  CheckCircle2,
  BookOpen,
  Video,
  Shield,
  Users,
  Calendar,
  ClipboardList,
  Stethoscope,
  AlertCircle,
} from "lucide-react";

export function HelpSupport() {
  return (
    <div className="space-y-6">
      <ContactSupportSection />
      <Separator />
      <FAQSection />
      <Separator />
      <ResourcesSection />
    </div>
  );
}

// ==================== SEÇÃO DE CONTATO COM SUPORTE ====================
function ContactSupportSection() {
  const [formData, setFormData] = useState({
    subject: "",
    category: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.subject.trim()) {
      toast.error("Informe o assunto da mensagem");
      return;
    }
    if (!formData.category) {
      toast.error("Selecione uma categoria");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Escreva sua mensagem");
      return;
    }

    setIsSubmitting(true);

    // Simular envio (em produção, isso seria uma chamada à API)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setSubmitted(true);
    toast.success("Mensagem enviada com sucesso!");
  };

  if (submitted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Mensagem Enviada!
          </CardTitle>
          <CardDescription>
            Recebemos sua mensagem e responderemos em breve.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              Você receberá uma resposta no e-mail cadastrado em sua conta em até 24 horas úteis.
            </AlertDescription>
          </Alert>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(false);
              setFormData({ subject: "", category: "", message: "" });
            }}
          >
            Enviar Nova Mensagem
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Fale com o Suporte
        </CardTitle>
        <CardDescription>
          Envie sua dúvida ou problema e nossa equipe responderá em breve
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="subject">Assunto</Label>
              <Input
                id="subject"
                name="subject"
                placeholder="Resumo do seu problema ou dúvida"
                value={formData.subject}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="duvida">Dúvida sobre funcionalidade</SelectItem>
                  <SelectItem value="problema">Problema técnico</SelectItem>
                  <SelectItem value="sugestao">Sugestão de melhoria</SelectItem>
                  <SelectItem value="conta">Problema com minha conta</SelectItem>
                  <SelectItem value="pagamento">Dúvida sobre pagamento</SelectItem>
                  <SelectItem value="outro">Outro assunto</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem</Label>
            <Textarea
              id="message"
              name="message"
              placeholder="Descreva detalhadamente sua dúvida ou problema..."
              rows={5}
              value={formData.message}
              onChange={handleChange}
            />
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Enviar Mensagem
              </>
            )}
          </Button>
        </form>

        <Separator className="my-6" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-full">
              <Mail className="h-5 w-5 text-[#0056A4] dark:text-blue-400" />
            </div>
            <div>
              <p className="font-medium">E-mail</p>
              <a
                href="mailto:suporte@gorgen.com.br"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                suporte@gorgen.com.br
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 border rounded-lg">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-full">
              <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="font-medium">WhatsApp</p>
              <a
                href="https://wa.me/5551999999999"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground hover:text-primary"
              >
                (51) 99999-9999
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== SEÇÃO DE PERGUNTAS FREQUENTES ====================
function FAQSection() {
  const faqs = [
    {
      category: "Conta e Acesso",
      icon: <Shield className="h-4 w-4" />,
      questions: [
        {
          question: "Como faço para alterar minha senha?",
          answer:
            "Acesse Configurações > Segurança e clique em 'Alterar Senha'. Você precisará informar sua senha atual e a nova senha desejada. A nova senha deve ter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.",
        },
        {
          question: "Esqueci minha senha. Como recupero o acesso?",
          answer:
            "Na tela de login, clique em 'Esqueci minha senha'. Digite o e-mail cadastrado e você receberá um link para criar uma nova senha. O link expira em 1 hora por segurança.",
        },
        {
          question: "O que é autenticação em duas etapas (2FA)?",
          answer:
            "A autenticação em duas etapas adiciona uma camada extra de segurança à sua conta. Além da senha, você precisará informar um código gerado por um aplicativo autenticador (como Google Authenticator) para fazer login.",
        },
      ],
    },
    {
      category: "Pacientes",
      icon: <Users className="h-4 w-4" />,
      questions: [
        {
          question: "Como cadastro um novo paciente?",
          answer:
            "Acesse o menu Pacientes e clique em 'Novo Paciente'. Preencha os dados obrigatórios (nome, data de nascimento) e os dados opcionais conforme necessário. O sistema gerará automaticamente um código de identificação único.",
        },
        {
          question: "Posso importar pacientes de outro sistema?",
          answer:
            "Sim! O Gorgen suporta importação de pacientes via arquivo CSV. Acesse Pacientes > Importar e siga as instruções para mapear os campos do seu arquivo com os campos do sistema.",
        },
        {
          question: "Como funciona a mesclagem de pacientes duplicados?",
          answer:
            "Se você identificar pacientes duplicados, acesse Pacientes > Duplicados. O sistema mostrará possíveis duplicatas baseado em nome e CPF. Você pode mesclar os registros, mantendo o histórico de ambos.",
        },
      ],
    },
    {
      category: "Agenda",
      icon: <Calendar className="h-4 w-4" />,
      questions: [
        {
          question: "Como configuro meus horários de atendimento?",
          answer:
            "Acesse Configurações > Profissional > Horários de Atendimento. Defina os dias da semana, horários de início e fim, e duração padrão das consultas. Você também pode configurar intervalos para almoço.",
        },
        {
          question: "Os pacientes recebem lembretes de consulta?",
          answer:
            "Sim! O sistema envia automaticamente lembretes por e-mail e/ou WhatsApp (conforme configurado) 24 horas antes da consulta. Você pode personalizar as mensagens em Configurações > Mensagens.",
        },
      ],
    },
    {
      category: "Prontuário",
      icon: <ClipboardList className="h-4 w-4" />,
      questions: [
        {
          question: "O prontuário é seguro e sigiloso?",
          answer:
            "Absolutamente! O Gorgen foi desenvolvido seguindo as diretrizes do CFM e LGPD. Todos os dados são criptografados, o acesso é controlado por perfis de usuário, e todas as ações são registradas em log de auditoria.",
        },
        {
          question: "Posso anexar exames e documentos ao prontuário?",
          answer:
            "Sim! Você pode anexar arquivos PDF, imagens e outros documentos diretamente no prontuário do paciente. Os arquivos são armazenados de forma segura e vinculados ao histórico do paciente.",
        },
        {
          question: "Como funciona o compartilhamento de prontuário entre médicos?",
          answer:
            "O paciente pode autorizar o compartilhamento de seu prontuário com outros profissionais. Acesse o prontuário do paciente > Autorizações para gerenciar os acessos. Todo acesso é registrado em log.",
        },
      ],
    },
    {
      category: "Faturamento",
      icon: <Stethoscope className="h-4 w-4" />,
      questions: [
        {
          question: "Como registro um atendimento para faturamento?",
          answer:
            "Após realizar o atendimento, acesse Atendimentos > Novo Atendimento. Selecione o paciente, tipo de atendimento, procedimentos realizados e convênio. O sistema calculará automaticamente os valores com base na tabela CBHPM.",
        },
        {
          question: "Posso gerar relatórios de faturamento?",
          answer:
            "Sim! Acesse Atendimentos > Relatórios para gerar relatórios por período, convênio, tipo de procedimento e outros filtros. Os relatórios podem ser exportados em PDF ou Excel.",
        },
      ],
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5" />
          Perguntas Frequentes
        </CardTitle>
        <CardDescription>
          Encontre respostas rápidas para as dúvidas mais comuns
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="flex items-center gap-1">
                  {category.icon}
                  {category.category}
                </Badge>
              </div>
              <Accordion type="single" collapsible className="w-full">
                {category.questions.map((faq, faqIndex) => (
                  <AccordionItem
                    key={faqIndex}
                    value={`${categoryIndex}-${faqIndex}`}
                  >
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ==================== SEÇÃO DE RECURSOS ====================
function ResourcesSection() {
  const resources = [
    {
      icon: <BookOpen className="h-5 w-5" />,
      title: "Documentação",
      description: "Guia completo de uso do sistema",
      href: "#",
      badge: "PDF",
    },
    {
      icon: <Video className="h-5 w-5" />,
      title: "Vídeos Tutoriais",
      description: "Aprenda com vídeos passo a passo",
      href: "#",
      badge: "YouTube",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Termos de Uso",
      description: "Leia nossos termos e condições",
      href: "#",
      badge: null,
    },
    {
      icon: <Shield className="h-5 w-5" />,
      title: "Política de Privacidade",
      description: "Como protegemos seus dados",
      href: "#",
      badge: "LGPD",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Recursos e Documentação
        </CardTitle>
        <CardDescription>
          Materiais de apoio para aproveitar ao máximo o Gorgen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {resources.map((resource, index) => (
            <a
              key={index}
              href={resource.href}
              className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent transition-colors group"
            >
              <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary/20 transition-colors">
                {resource.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{resource.title}</p>
                  {resource.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {resource.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {resource.description}
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </a>
          ))}
        </div>

        <Separator className="my-6" />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Horário de Atendimento do Suporte:</strong> Segunda a Sexta, das 8h às 18h (horário de Brasília).
            Mensagens enviadas fora deste horário serão respondidas no próximo dia útil.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}

export default HelpSupport;
