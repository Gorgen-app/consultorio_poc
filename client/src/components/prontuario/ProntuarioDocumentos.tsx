import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Plus, FileText, Pill, ClipboardList, Calendar, 
  FileCheck, Printer, Download, Eye 
} from "lucide-react";

interface Props {
  pacienteId: number;
  pacienteNome: string;
  documentos: any[];
  onUpdate: () => void;
}

const tiposDocumento = [
  { value: "Receita", label: "Receita Simples", icon: Pill, cor: "bg-blue-100 text-blue-700" },
  { value: "Receita Especial", label: "Receita Especial (Controlado)", icon: Pill, cor: "bg-purple-100 text-purple-700" },
  { value: "Solicitação de Exames", label: "Solicitação de Exames", icon: ClipboardList, cor: "bg-emerald-100 text-emerald-700" },
  { value: "Atestado Comparecimento", label: "Atestado de Comparecimento", icon: FileCheck, cor: "bg-yellow-100 text-yellow-700" },
  { value: "Atestado Afastamento", label: "Atestado de Afastamento", icon: Calendar, cor: "bg-orange-100 text-orange-700" },
  { value: "Laudo", label: "Laudo Médico", icon: FileText, cor: "bg-gray-100 text-gray-700" },
  { value: "Protocolo Cirurgia", label: "Protocolo de Cirurgia", icon: FileText, cor: "bg-red-100 text-red-700" },
  { value: "Guia SADT", label: "Guia SADT", icon: FileText, cor: "bg-teal-100 text-teal-700" },
  { value: "Guia Internação", label: "Guia de Internação", icon: FileText, cor: "bg-indigo-100 text-indigo-700" },
];

export default function ProntuarioDocumentos({ pacienteId, pacienteNome, documentos, onUpdate }: Props) {
  
  const [novoDocumento, setNovoDocumento] = useState(false);
  const [tipoSelecionado, setTipoSelecionado] = useState("");
  const [visualizando, setVisualizando] = useState<any>(null);
  
  const [form, setForm] = useState({
    tipoDocumento: "",
    conteudo: "",
    cid10: "",
    diasAfastamento: "",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: "",
    observacoes: "",
  });
  
  const createDocumento = trpc.prontuario.documentos.create.useMutation({
    onSuccess: () => {
      toast.success("Documento criado com sucesso!");
      setNovoDocumento(false);
      setTipoSelecionado("");
      setForm({
        tipoDocumento: "",
        conteudo: "",
        cid10: "",
        diasAfastamento: "",
        dataInicio: new Date().toISOString().split("T")[0],
        dataFim: "",
        observacoes: "",
      });
      onUpdate();
    },
    onError: (error) => {
      toast.error("Erro ao criar documento: " + error.message);
    },
  });
  
  const getTemplateConteudo = (tipo: string) => {
    const hoje = new Date().toLocaleDateString("pt-BR");
    switch (tipo) {
      case "Receita":
        return `RECEITUÁRIO\n\nPaciente: ${pacienteNome}\nData: ${hoje}\n\n1. \n   Uso: \n   Posologia: \n\n2. \n   Uso: \n   Posologia: `;
      case "Receita Especial":
        return `RECEITUÁRIO ESPECIAL\n\nPaciente: ${pacienteNome}\nData: ${hoje}\n\n1. \n   Quantidade: \n   Posologia: `;
      case "Solicitação de Exames":
        return `SOLICITAÇÃO DE EXAMES\n\nPaciente: ${pacienteNome}\nData: ${hoje}\n\nExames solicitados:\n\n1. \n2. \n3. \n\nIndicação clínica: `;
      case "Atestado Comparecimento":
        return `ATESTADO DE COMPARECIMENTO\n\nAtesto para os devidos fins que ${pacienteNome} compareceu a este consultório na data de ${hoje}, no horário de ___:___ às ___:___, para consulta médica.`;
      case "Atestado Afastamento":
        return `ATESTADO MÉDICO\n\nAtesto para os devidos fins que ${pacienteNome} encontra-se sob meus cuidados profissionais, necessitando de afastamento de suas atividades laborais por ___ dias, a partir de ${hoje}.\n\nCID-10: `;
      case "Laudo":
        return `LAUDO MÉDICO\n\nPaciente: ${pacienteNome}\nData: ${hoje}\n\nHistória Clínica:\n\n\nExame Físico:\n\n\nExames Complementares:\n\n\nDiagnóstico:\n\n\nConduta:\n\n`;
      case "Protocolo Cirurgia":
        return `PROTOCOLO DE AGENDAMENTO CIRÚRGICO\n\nPaciente: ${pacienteNome}\nData: ${hoje}\n\nProcedimento proposto:\n\nIndicação:\n\nCID-10:\n\nCaráter: ( ) Eletivo ( ) Urgência\n\nMateriais especiais:\n\nEquipe cirúrgica:\n`;
      default:
        return "";
    }
  };
  
  const handleTipoChange = (tipo: string) => {
    setTipoSelecionado(tipo);
    setForm({
      ...form,
      tipoDocumento: tipo,
      conteudo: getTemplateConteudo(tipo),
    });
  };
  
  const formatarData = (data: string | Date) => {
    return new Date(data).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  
  const getTipoInfo = (tipo: string) => {
    return tiposDocumento.find(t => t.value === tipo) || tiposDocumento[0];
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Documentos Médicos</h2>
          <p className="text-sm text-gray-500">Receitas, atestados, solicitações e guias</p>
        </div>
        <Dialog open={novoDocumento} onOpenChange={setNovoDocumento}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Novo Documento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Emitir Documento Médico</DialogTitle>
            </DialogHeader>
            
            {!tipoSelecionado ? (
              <div className="grid grid-cols-3 gap-4 py-4">
                {tiposDocumento.map((tipo) => (
                  <Card 
                    key={tipo.value}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => handleTipoChange(tipo.value)}
                  >
                    <CardContent className="p-4 flex flex-col items-center text-center">
                      <div className={`p-3 rounded-full ${tipo.cor} mb-2`}>
                        <tipo.icon className="h-6 w-6" />
                      </div>
                      <span className="text-sm font-medium">{tipo.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                  <Badge className={getTipoInfo(tipoSelecionado).cor}>
                    {getTipoInfo(tipoSelecionado).label}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setTipoSelecionado("");
                      setForm({ ...form, tipoDocumento: "", conteudo: "" });
                    }}
                  >
                    Alterar tipo
                  </Button>
                </div>
                
                <div>
                  <Label>Conteúdo do Documento</Label>
                  <Textarea
                    rows={15}
                    className="font-mono text-sm"
                    value={form.conteudo}
                    onChange={(e) => setForm({ ...form, conteudo: e.target.value })}
                  />
                </div>
                
                {(tipoSelecionado === "Atestado Afastamento" || tipoSelecionado === "Laudo") && (
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>CID-10</Label>
                      <Input
                        value={form.cid10}
                        onChange={(e) => setForm({ ...form, cid10: e.target.value })}
                        placeholder="Ex: J06.9"
                      />
                    </div>
                    {tipoSelecionado === "Atestado Afastamento" && (
                      <>
                        <div>
                          <Label>Dias de Afastamento</Label>
                          <Input
                            type="number"
                            value={form.diasAfastamento}
                            onChange={(e) => setForm({ ...form, diasAfastamento: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Data Início</Label>
                          <Input
                            type="date"
                            value={form.dataInicio}
                            onChange={(e) => setForm({ ...form, dataInicio: e.target.value })}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                <div>
                  <Label>Observações Internas (não aparece no documento)</Label>
                  <Textarea
                    rows={2}
                    value={form.observacoes}
                    onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    placeholder="Anotações para controle interno..."
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setNovoDocumento(false);
                setTipoSelecionado("");
              }}>
                Cancelar
              </Button>
              {tipoSelecionado && (
                <Button 
                  onClick={() => createDocumento.mutate({
                    pacienteId,
                    tipo: form.tipoDocumento as "Receita" | "Receita Especial" | "Solicitação de Exames" | "Atestado Comparecimento" | "Atestado Afastamento" | "Laudo Médico" | "Relatório Médico" | "Protocolo Cirurgia" | "Guia SADT" | "Guia Internação" | "Outro",
                    conteudo: form.conteudo,
                    cid10: form.cid10 || null,
                    dataEmissao: new Date(),
                  })}
                  disabled={!form.conteudo || createDocumento.isPending}
                >
                  <FileCheck className="h-4 w-4 mr-2" />
                  Salvar Documento
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Lista de Documentos */}
      {documentos.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum documento emitido.</p>
            <Button className="mt-4" onClick={() => setNovoDocumento(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Emitir Primeiro Documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {documentos.map((doc) => {
            const tipoInfo = getTipoInfo(doc.tipoDocumento);
            return (
              <Card key={doc.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${tipoInfo.cor}`}>
                        <tipoInfo.icon className="h-4 w-4" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{tipoInfo.label}</CardTitle>
                        <CardDescription>{formatarData(doc.createdAt)}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setVisualizando(doc)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button variant="outline" size="sm">
                        <Printer className="h-4 w-4 mr-1" />
                        Imprimir
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 line-clamp-2">{doc.conteudo}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      
      {/* Modal de Visualização */}
      <Dialog open={!!visualizando} onOpenChange={() => setVisualizando(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {visualizando && getTipoInfo(visualizando.tipoDocumento).label}
            </DialogTitle>
          </DialogHeader>
          {visualizando && (
            <div className="space-y-4">
              <div className="p-6 bg-white border rounded-lg shadow-sm">
                <pre className="whitespace-pre-wrap font-sans text-sm">
                  {visualizando.conteudo}
                </pre>
              </div>
              {visualizando.cid10 && (
                <p className="text-sm text-gray-500">CID-10: {visualizando.cid10}</p>
              )}
              <p className="text-xs text-gray-400">
                Emitido em: {formatarData(visualizando.createdAt)}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisualizando(null)}>
              Fechar
            </Button>
            <Button>
              <Printer className="h-4 w-4 mr-2" />
              Imprimir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
