import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Save, Plus, Trash2, FileText, Upload, GraduationCap, Briefcase, Link as LinkIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Lista de estados brasileiros
const ESTADOS_BR = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
];

// Órgãos emissores de RG
const ORGAOS_EMISSORES = [
  "SSP - Secretaria de Segurança Pública",
  "SJS - Secretaria da Justiça e Segurança",
  "PM - Polícia Militar",
  "PC - Polícia Civil",
  "CNT - Carteira Nacional de Trânsito",
  "DIC - Diretoria de Identificação Civil",
  "CTPS - Carteira de Trabalho e Previdência Social",
  "FGTS - Fundo de Garantia do Tempo de Serviço",
  "IFP - Instituto Félix Pacheco",
  "IPF - Instituto Pereira Faustino",
  "MTE - Ministério do Trabalho e Emprego",
  "Outro"
];

// Tipos de logradouro
const TIPOS_LOGRADOURO = ["Rua", "Avenida", "Alameda", "Travessa", "Praça", "Estrada", "Rodovia", "Outro"];

// Estados civis
const ESTADOS_CIVIS = ["Solteiro(a)", "Casado(a)", "Divorciado(a)", "Viúvo(a)", "União Estável", "Separado(a)"];

interface CadastroMedicoFormProps {
  userProfileId: number;
}

export default function CadastroMedicoForm({ userProfileId }: CadastroMedicoFormProps) {
  const [activeSection, setActiveSection] = useState<"pessoal" | "endereco" | "documentacao" | "profissional" | "perfil">("pessoal");
  
  // Queries
  const { data: cadastroCompleto, refetch } = trpc.medicoCadastro.getCompleto.useQuery({ userProfileId });
  
  // Mutations
  const savePessoal = trpc.medicoCadastro.savePessoal.useMutation({
    onSuccess: () => {
      toast.success("Dados pessoais salvos com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
  });
  
  const saveEndereco = trpc.medicoCadastro.saveEndereco.useMutation({
    onSuccess: () => {
      toast.success("Endereço salvo com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
  });
  
  const saveDocumentacao = trpc.medicoCadastro.saveDocumentacao.useMutation({
    onSuccess: () => {
      toast.success("Documentação salva com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
  });
  
  const saveConselho = trpc.medicoCadastro.saveConselho.useMutation({
    onSuccess: () => {
      toast.success("Dados do conselho salvos com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
  });
  
  const addFormacao = trpc.medicoCadastro.addFormacao.useMutation({
    onSuccess: () => {
      toast.success("Formação adicionada!");
      refetch();
      setNovaFormacao({ curso: "", instituicao: "", anoConclusao: "" });
    },
    onError: (error) => toast.error(`Erro ao adicionar: ${error.message}`),
  });
  
  const removeFormacao = trpc.medicoCadastro.removeFormacao.useMutation({
    onSuccess: () => {
      toast.success("Formação removida!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao remover: ${error.message}`),
  });
  
  const addEspecializacao = trpc.medicoCadastro.addEspecializacao.useMutation({
    onSuccess: () => {
      toast.success("Especialização adicionada!");
      refetch();
      setNovaEspecializacao({ especializacao: "", instituicao: "", tituloEspecialista: false, registroConselho: false, rqe: "" });
    },
    onError: (error) => toast.error(`Erro ao adicionar: ${error.message}`),
  });
  
  const removeEspecializacao = trpc.medicoCadastro.removeEspecializacao.useMutation({
    onSuccess: () => {
      toast.success("Especialização removida!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao remover: ${error.message}`),
  });
  
  const saveLinks = trpc.medicoCadastro.saveLinks.useMutation({
    onSuccess: () => {
      toast.success("Links salvos com sucesso!");
      refetch();
    },
    onError: (error) => toast.error(`Erro ao salvar: ${error.message}`),
  });

  // Form states
  const [pessoalForm, setPessoalForm] = useState({
    nomeCompleto: "",
    nomeSocial: "",
    sexo: "",
    dataNascimento: "",
    nacionalidade: "Brasileira",
    ufNascimento: "",
    cidadeNascimento: "",
    dddCelular: "",
    celular: "",
    dddResidencial: "",
    telefoneResidencial: "",
    dddComercial: "",
    telefoneComercial: "",
    nomeMae: "",
    nomePai: "",
    estadoCivil: "",
    nomeConjuge: "",
  });

  const [enderecoForm, setEnderecoForm] = useState({
    logradouro: "",
    enderecoResidencial: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
  });

  const [documentacaoForm, setDocumentacaoForm] = useState({
    rg: "",
    rgUf: "",
    rgOrgaoEmissor: "",
    rgDataEmissao: "",
    numeroPis: "",
    numeroCns: "",
    cpf: "",
  });

  const [conselhoForm, setConselhoForm] = useState({
    conselho: "CRM",
    numeroRegistro: "",
    uf: "",
    codigoValidacao: "",
  });

  const [linksForm, setLinksForm] = useState({
    curriculoLattes: "",
    linkedin: "",
    orcid: "",
    researchGate: "",
  });

  const [novaFormacao, setNovaFormacao] = useState({
    curso: "",
    instituicao: "",
    anoConclusao: "",
  });

  const [novaEspecializacao, setNovaEspecializacao] = useState({
    especializacao: "",
    instituicao: "",
    tituloEspecialista: false,
    registroConselho: false,
    rqe: "",
  });

  // Carregar dados quando cadastroCompleto mudar
  useEffect(() => {
    if (cadastroCompleto) {
      if (cadastroCompleto.pessoal) {
        setPessoalForm({
          nomeCompleto: cadastroCompleto.pessoal.nomeCompleto || "",
          nomeSocial: cadastroCompleto.pessoal.nomeSocial || "",
          sexo: cadastroCompleto.pessoal.sexo || "",
          dataNascimento: cadastroCompleto.pessoal.dataNascimento || "",
          nacionalidade: cadastroCompleto.pessoal.nacionalidade || "Brasileira",
          ufNascimento: cadastroCompleto.pessoal.ufNascimento || "",
          cidadeNascimento: cadastroCompleto.pessoal.cidadeNascimento || "",
          dddCelular: cadastroCompleto.pessoal.dddCelular || "",
          celular: cadastroCompleto.pessoal.celular || "",
          dddResidencial: cadastroCompleto.pessoal.dddResidencial || "",
          telefoneResidencial: cadastroCompleto.pessoal.telefoneResidencial || "",
          dddComercial: cadastroCompleto.pessoal.dddComercial || "",
          telefoneComercial: cadastroCompleto.pessoal.telefoneComercial || "",
          nomeMae: cadastroCompleto.pessoal.nomeMae || "",
          nomePai: cadastroCompleto.pessoal.nomePai || "",
          estadoCivil: cadastroCompleto.pessoal.estadoCivil || "",
          nomeConjuge: cadastroCompleto.pessoal.nomeConjuge || "",
        });
      }
      if (cadastroCompleto.endereco) {
        setEnderecoForm({
          logradouro: cadastroCompleto.endereco.logradouro || "",
          enderecoResidencial: cadastroCompleto.endereco.enderecoResidencial || "",
          numero: cadastroCompleto.endereco.numero || "",
          complemento: cadastroCompleto.endereco.complemento || "",
          bairro: cadastroCompleto.endereco.bairro || "",
          cidade: cadastroCompleto.endereco.cidade || "",
          uf: cadastroCompleto.endereco.uf || "",
          cep: cadastroCompleto.endereco.cep || "",
        });
      }
      if (cadastroCompleto.documentacao) {
        setDocumentacaoForm({
          rg: cadastroCompleto.documentacao.rg || "",
          rgUf: cadastroCompleto.documentacao.rgUf || "",
          rgOrgaoEmissor: cadastroCompleto.documentacao.rgOrgaoEmissor || "",
          rgDataEmissao: cadastroCompleto.documentacao.rgDataEmissao || "",
          numeroPis: cadastroCompleto.documentacao.numeroPis || "",
          numeroCns: cadastroCompleto.documentacao.numeroCns || "",
          cpf: cadastroCompleto.documentacao.cpf || "",
        });
      }
      if (cadastroCompleto.conselho) {
        setConselhoForm({
          conselho: cadastroCompleto.conselho.conselho || "CRM",
          numeroRegistro: cadastroCompleto.conselho.numeroRegistro || "",
          uf: cadastroCompleto.conselho.uf || "",
          codigoValidacao: cadastroCompleto.conselho.codigoValidacao || "",
        });
      }
      if (cadastroCompleto.links) {
        setLinksForm({
          curriculoLattes: cadastroCompleto.links.curriculoLattes || "",
          linkedin: cadastroCompleto.links.linkedin || "",
          orcid: cadastroCompleto.links.orcid || "",
          researchGate: cadastroCompleto.links.researchGate || "",
        });
      }
    }
  }, [cadastroCompleto]);

  const handleSavePessoal = () => {
    savePessoal.mutate({
      userProfileId,
      ...pessoalForm,
      sexo: pessoalForm.sexo as "Masculino" | "Feminino" | "Outro" | null || null,
    });
  };

  const handleSaveEndereco = () => {
    saveEndereco.mutate({
      userProfileId,
      ...enderecoForm,
    });
  };

  const handleSaveDocumentacao = () => {
    saveDocumentacao.mutate({
      userProfileId,
      ...documentacaoForm,
    });
  };

  const handleSaveConselho = () => {
    saveConselho.mutate({
      userProfileId,
      ...conselhoForm,
    });
  };

  const handleSaveLinks = () => {
    saveLinks.mutate({
      userProfileId,
      ...linksForm,
    });
  };

  const handleAddFormacao = () => {
    if (!novaFormacao.curso || !novaFormacao.instituicao) {
      toast.error("Preencha o curso e a instituição");
      return;
    }
    addFormacao.mutate({
      userProfileId,
      curso: novaFormacao.curso,
      instituicao: novaFormacao.instituicao,
      anoConclusao: novaFormacao.anoConclusao ? parseInt(novaFormacao.anoConclusao) : null,
    });
  };

  const handleAddEspecializacao = () => {
    if (!novaEspecializacao.especializacao || !novaEspecializacao.instituicao) {
      toast.error("Preencha a especialização e a instituição");
      return;
    }
    addEspecializacao.mutate({
      userProfileId,
      especializacao: novaEspecializacao.especializacao,
      instituicao: novaEspecializacao.instituicao,
      tituloEspecialista: novaEspecializacao.tituloEspecialista,
      registroConselho: novaEspecializacao.registroConselho,
      rqe: novaEspecializacao.rqe || null,
    });
  };

  // Seções do formulário
  const sections = [
    { id: "pessoal", label: "1. Pessoal", color: "bg-cyan-600" },
    { id: "endereco", label: "2. Endereço", color: "bg-cyan-500" },
    { id: "documentacao", label: "3. Documentação", color: "bg-cyan-500" },
    { id: "profissional", label: "4. Profissional", color: "bg-cyan-500" },
    { id: "perfil", label: "5. Perfil", color: "bg-cyan-500" },
  ];

  return (
    <div className="space-y-4">
      {/* Navegação das seções */}
      <div className="flex gap-1">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id as typeof activeSection)}
            className={`flex-1 py-2 px-4 text-sm font-medium text-white rounded-t transition-colors ${
              activeSection === section.id ? "bg-cyan-600" : "bg-cyan-400 hover:bg-cyan-500"
            }`}
          >
            {section.label}
          </button>
        ))}
      </div>

      {/* Seção 1: Pessoal */}
      {activeSection === "pessoal" && (
        <Card>
          <CardHeader>
            <CardTitle>Informações Pessoais</CardTitle>
            <CardDescription>Dados de identificação do profissional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Nome e dados básicos */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeCompleto">Nome completo *</Label>
                <Input
                  id="nomeCompleto"
                  value={pessoalForm.nomeCompleto}
                  onChange={(e) => setPessoalForm({ ...pessoalForm, nomeCompleto: e.target.value })}
                  placeholder="Nome completo"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeSocial">Nome social/afetivo</Label>
                <Input
                  id="nomeSocial"
                  value={pessoalForm.nomeSocial}
                  onChange={(e) => setPessoalForm({ ...pessoalForm, nomeSocial: e.target.value })}
                  placeholder="Designado à pessoa travesti ou transexual"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataNascimento">Data de nascimento *</Label>
                <Input
                  id="dataNascimento"
                  type="date"
                  value={pessoalForm.dataNascimento}
                  onChange={(e) => setPessoalForm({ ...pessoalForm, dataNascimento: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo *</Label>
                <Select value={pessoalForm.sexo} onValueChange={(v) => setPessoalForm({ ...pessoalForm, sexo: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Masculino">Masculino</SelectItem>
                    <SelectItem value="Feminino">Feminino</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nacionalidade">Nacionalidade *</Label>
                <Input
                  id="nacionalidade"
                  value={pessoalForm.nacionalidade}
                  onChange={(e) => setPessoalForm({ ...pessoalForm, nacionalidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ufNascimento">UF de nascimento *</Label>
                <Select value={pessoalForm.ufNascimento} onValueChange={(v) => setPessoalForm({ ...pessoalForm, ufNascimento: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidadeNascimento">Cidade de nascimento *</Label>
                <Input
                  id="cidadeNascimento"
                  value={pessoalForm.cidadeNascimento}
                  onChange={(e) => setPessoalForm({ ...pessoalForm, cidadeNascimento: e.target.value })}
                />
              </div>
            </div>

            {/* Telefones */}
            <Separator />
            <h4 className="font-medium">Contatos</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Celular *</Label>
                <div className="flex gap-2">
                  <Input
                    className="w-20"
                    placeholder="DDD"
                    value={pessoalForm.dddCelular}
                    onChange={(e) => setPessoalForm({ ...pessoalForm, dddCelular: e.target.value })}
                  />
                  <Input
                    placeholder="Número"
                    value={pessoalForm.celular}
                    onChange={(e) => setPessoalForm({ ...pessoalForm, celular: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefone residencial</Label>
                <div className="flex gap-2">
                  <Input
                    className="w-20"
                    placeholder="DDD"
                    value={pessoalForm.dddResidencial}
                    onChange={(e) => setPessoalForm({ ...pessoalForm, dddResidencial: e.target.value })}
                  />
                  <Input
                    placeholder="Número"
                    value={pessoalForm.telefoneResidencial}
                    onChange={(e) => setPessoalForm({ ...pessoalForm, telefoneResidencial: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Telefone comercial *</Label>
                <div className="flex gap-2">
                  <Input
                    className="w-20"
                    placeholder="DDD"
                    value={pessoalForm.dddComercial}
                    onChange={(e) => setPessoalForm({ ...pessoalForm, dddComercial: e.target.value })}
                  />
                  <Input
                    placeholder="Número"
                    value={pessoalForm.telefoneComercial}
                    onChange={(e) => setPessoalForm({ ...pessoalForm, telefoneComercial: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Filiação */}
            <Separator />
            <h4 className="font-medium">Filiação</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nomeMae">Nome da mãe *</Label>
                <Input
                  id="nomeMae"
                  value={pessoalForm.nomeMae}
                  onChange={(e) => setPessoalForm({ ...pessoalForm, nomeMae: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomePai">Nome do pai</Label>
                <Input
                  id="nomePai"
                  value={pessoalForm.nomePai}
                  onChange={(e) => setPessoalForm({ ...pessoalForm, nomePai: e.target.value })}
                />
              </div>
            </div>

            {/* Estado civil */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estadoCivil">Estado civil *</Label>
                <Select value={pessoalForm.estadoCivil} onValueChange={(v) => setPessoalForm({ ...pessoalForm, estadoCivil: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_CIVIS.map((ec) => (
                      <SelectItem key={ec} value={ec}>{ec}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nomeConjuge">Nome do cônjuge</Label>
                <Input
                  id="nomeConjuge"
                  value={pessoalForm.nomeConjuge}
                  onChange={(e) => setPessoalForm({ ...pessoalForm, nomeConjuge: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSavePessoal} disabled={savePessoal.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Dados Pessoais
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 2: Endereço */}
      {activeSection === "endereco" && (
        <Card>
          <CardHeader>
            <CardTitle>Endereço Residencial</CardTitle>
            <CardDescription>Endereço completo do profissional</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logradouro">Logradouro *</Label>
                <Select value={enderecoForm.logradouro} onValueChange={(v) => setEnderecoForm({ ...enderecoForm, logradouro: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_LOGRADOURO.map((tipo) => (
                      <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="enderecoResidencial">Endereço residencial *</Label>
                <Input
                  id="enderecoResidencial"
                  value={enderecoForm.enderecoResidencial}
                  onChange={(e) => setEnderecoForm({ ...enderecoForm, enderecoResidencial: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numero">Nº *</Label>
                <Input
                  id="numero"
                  value={enderecoForm.numero}
                  onChange={(e) => setEnderecoForm({ ...enderecoForm, numero: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input
                  id="complemento"
                  value={enderecoForm.complemento}
                  onChange={(e) => setEnderecoForm({ ...enderecoForm, complemento: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bairro">Bairro *</Label>
                <Input
                  id="bairro"
                  value={enderecoForm.bairro}
                  onChange={(e) => setEnderecoForm({ ...enderecoForm, bairro: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input
                  id="cidade"
                  value={enderecoForm.cidade}
                  onChange={(e) => setEnderecoForm({ ...enderecoForm, cidade: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">UF *</Label>
                <Select value={enderecoForm.uf} onValueChange={(v) => setEnderecoForm({ ...enderecoForm, uf: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cep">CEP *</Label>
                <Input
                  id="cep"
                  value={enderecoForm.cep}
                  onChange={(e) => setEnderecoForm({ ...enderecoForm, cep: e.target.value })}
                  placeholder="00.000-000"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveEndereco} disabled={saveEndereco.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Endereço
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 3: Documentação */}
      {activeSection === "documentacao" && (
        <Card>
          <CardHeader>
            <CardTitle>Documentos Pessoais</CardTitle>
            <CardDescription>Documentação de identificação</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* RG */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rg">RG *</Label>
                <Input
                  id="rg"
                  value={documentacaoForm.rg}
                  onChange={(e) => setDocumentacaoForm({ ...documentacaoForm, rg: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rgUf">UF *</Label>
                <Select value={documentacaoForm.rgUf} onValueChange={(v) => setDocumentacaoForm({ ...documentacaoForm, rgUf: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="UF" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS_BR.map((uf) => (
                      <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rgOrgaoEmissor">Órgão emissor *</Label>
                <Select value={documentacaoForm.rgOrgaoEmissor} onValueChange={(v) => setDocumentacaoForm({ ...documentacaoForm, rgOrgaoEmissor: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORGAOS_EMISSORES.map((org) => (
                      <SelectItem key={org} value={org}>{org}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rgDataEmissao">Data de emissão *</Label>
                <Input
                  id="rgDataEmissao"
                  type="date"
                  value={documentacaoForm.rgDataEmissao}
                  onChange={(e) => setDocumentacaoForm({ ...documentacaoForm, rgDataEmissao: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>RG digitalizado *</Label>
                <Button variant="outline" className="w-full" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  Identidade
                </Button>
              </div>
            </div>

            {/* PIS, CNS, CPF */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="numeroPis">Nº do PIS *</Label>
                <Input
                  id="numeroPis"
                  value={documentacaoForm.numeroPis}
                  onChange={(e) => setDocumentacaoForm({ ...documentacaoForm, numeroPis: e.target.value })}
                  placeholder="Não sei meu número"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="numeroCns">Nº do cartão nacional de saúde (CNS) *</Label>
                <Input
                  id="numeroCns"
                  value={documentacaoForm.numeroCns}
                  onChange={(e) => setDocumentacaoForm({ ...documentacaoForm, numeroCns: e.target.value })}
                  placeholder="Não sei meu número"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={documentacaoForm.cpf}
                  onChange={(e) => setDocumentacaoForm({ ...documentacaoForm, cpf: e.target.value })}
                  placeholder="000.000.000-00"
                />
              </div>
              <div className="space-y-2">
                <Label>CPF digitalizado *</Label>
                <Button variant="outline" className="w-full" disabled>
                  <FileText className="h-4 w-4 mr-2" />
                  CPF
                </Button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveDocumentacao} disabled={saveDocumentacao.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Documentação
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção 4: Profissional */}
      {activeSection === "profissional" && (
        <div className="space-y-4">
          {/* Informações do Conselho */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Conselho</CardTitle>
              <CardDescription>Registro profissional</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="conselho">Conselho *</Label>
                  <Select value={conselhoForm.conselho} onValueChange={(v) => setConselhoForm({ ...conselhoForm, conselho: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CRM">Conselho Regional de Medicina</SelectItem>
                      <SelectItem value="CRO">Conselho Regional de Odontologia</SelectItem>
                      <SelectItem value="COREN">Conselho Regional de Enfermagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="numeroRegistro">Nº de registro *</Label>
                  <Input
                    id="numeroRegistro"
                    value={conselhoForm.numeroRegistro}
                    onChange={(e) => setConselhoForm({ ...conselhoForm, numeroRegistro: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="conselhoUf">UF *</Label>
                  <Select value={conselhoForm.uf} onValueChange={(v) => setConselhoForm({ ...conselhoForm, uf: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_BR.map((uf) => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Carteira do conselho digitalizada *</Label>
                  <Button variant="outline" className="w-full" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Cart. conselho
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Certidão de regularidade com RQE (digitalizada) *</Label>
                  <Button variant="outline" disabled>
                    <FileText className="h-4 w-4 mr-2" />
                    Cert. conselho
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="codigoValidacao">Código de validação CREMERS *</Label>
                  <Input
                    id="codigoValidacao"
                    value={conselhoForm.codigoValidacao}
                    onChange={(e) => setConselhoForm({ ...conselhoForm, codigoValidacao: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveConselho} disabled={saveConselho.isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Dados do Conselho
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Formações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Formações
              </CardTitle>
              <CardDescription>Graduação e cursos de formação</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de formações existentes */}
              {cadastroCompleto?.formacoes && cadastroCompleto.formacoes.length > 0 && (
                <div className="space-y-2">
                  {cadastroCompleto.formacoes.map((formacao) => (
                    <div key={formacao.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{formacao.curso}</p>
                        <p className="text-sm text-muted-foreground">
                          {formacao.instituicao} {formacao.anoConclusao && `• ${formacao.anoConclusao}`}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFormacao.mutate({ id: formacao.id })}
                        disabled={removeFormacao.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar nova formação */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Adicionar Formação</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Curso *</Label>
                    <Input
                      value={novaFormacao.curso}
                      onChange={(e) => setNovaFormacao({ ...novaFormacao, curso: e.target.value })}
                      placeholder="Ex: Medicina"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instituição *</Label>
                    <Input
                      value={novaFormacao.instituicao}
                      onChange={(e) => setNovaFormacao({ ...novaFormacao, instituicao: e.target.value })}
                      placeholder="Ex: UFRGS"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ano de conclusão</Label>
                    <Input
                      type="number"
                      value={novaFormacao.anoConclusao}
                      onChange={(e) => setNovaFormacao({ ...novaFormacao, anoConclusao: e.target.value })}
                      placeholder="2012"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleAddFormacao} disabled={addFormacao.isPending}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar curso
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Especializações */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Especializações
              </CardTitle>
              <CardDescription>Residências e especializações médicas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lista de especializações existentes */}
              {cadastroCompleto?.especializacoes && cadastroCompleto.especializacoes.length > 0 && (
                <div className="space-y-2">
                  {cadastroCompleto.especializacoes.map((esp) => (
                    <div key={esp.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{esp.especializacao}</p>
                        <p className="text-sm text-muted-foreground">{esp.instituicao}</p>
                        <div className="flex gap-2 mt-1">
                          {esp.tituloEspecialista && <Badge variant="outline">Título de Especialista</Badge>}
                          {esp.registroConselho && <Badge variant="outline">Registro no Conselho</Badge>}
                          {esp.rqe && <Badge variant="secondary">RQE: {esp.rqe}</Badge>}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeEspecializacao.mutate({ id: esp.id })}
                        disabled={removeEspecializacao.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar nova especialização */}
              <div className="p-4 border rounded-lg bg-muted/50">
                <h4 className="font-medium mb-3">Adicionar Especialização</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Especialização *</Label>
                    <Input
                      value={novaEspecializacao.especializacao}
                      onChange={(e) => setNovaEspecializacao({ ...novaEspecializacao, especializacao: e.target.value })}
                      placeholder="Ex: Cirurgia Geral"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Instituição *</Label>
                    <Input
                      value={novaEspecializacao.instituicao}
                      onChange={(e) => setNovaEspecializacao({ ...novaEspecializacao, instituicao: e.target.value })}
                      placeholder="Ex: Hospital de Clínicas"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="tituloEspecialista"
                      checked={novaEspecializacao.tituloEspecialista}
                      onChange={(e) => setNovaEspecializacao({ ...novaEspecializacao, tituloEspecialista: e.target.checked })}
                    />
                    <Label htmlFor="tituloEspecialista">Título de especialista</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="registroConselho"
                      checked={novaEspecializacao.registroConselho}
                      onChange={(e) => setNovaEspecializacao({ ...novaEspecializacao, registroConselho: e.target.checked })}
                    />
                    <Label htmlFor="registroConselho">Registro no conselho</Label>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rqe">RQE</Label>
                    <Input
                      id="rqe"
                      value={novaEspecializacao.rqe}
                      onChange={(e) => setNovaEspecializacao({ ...novaEspecializacao, rqe: e.target.value })}
                      placeholder="Número do RQE"
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-4">
                  <Button onClick={handleAddEspecializacao} disabled={addEspecializacao.isPending}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar especialização
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Seção 5: Perfil */}
      {activeSection === "perfil" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Links Profissionais
            </CardTitle>
            <CardDescription>Currículo e redes profissionais</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="curriculoLattes">Currículo Lattes</Label>
              <Input
                id="curriculoLattes"
                value={linksForm.curriculoLattes}
                onChange={(e) => setLinksForm({ ...linksForm, curriculoLattes: e.target.value })}
                placeholder="https://wwws.cnpq.br/cvlattesweb/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={linksForm.linkedin}
                onChange={(e) => setLinksForm({ ...linksForm, linkedin: e.target.value })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orcid">ORCID</Label>
              <Input
                id="orcid"
                value={linksForm.orcid}
                onChange={(e) => setLinksForm({ ...linksForm, orcid: e.target.value })}
                placeholder="0000-0000-0000-0000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="researchGate">ResearchGate</Label>
              <Input
                id="researchGate"
                value={linksForm.researchGate}
                onChange={(e) => setLinksForm({ ...linksForm, researchGate: e.target.value })}
                placeholder="https://researchgate.net/profile/..."
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveLinks} disabled={saveLinks.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Salvar Links
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
