import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Plus, 
  Microscope, 
  FileText, 
  Calendar, 
  Building2,
  User,
  Upload,
  Eye,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocumentoUpload, DocumentosList } from "./DocumentoUpload";

interface ProntuarioPatologiaProps {
  pacienteId: number;
  onUpdate?: () => void;
}

export default function ProntuarioPatologia({ pacienteId, onUpdate }: ProntuarioPatologiaProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [patologiaIdParaUpload, setPatologiaIdParaUpload] = useState<number | null>(null);
  
  // Form state
  const [dataColeta, setDataColeta] = useState(new Date().toISOString().split("T")[0]);
  const [dataResultado, setDataResultado] = useState("");
  const [tipoExame, setTipoExame] = useState<string>("");
  const [origemMaterial, setOrigemMaterial] = useState("");
  const [tipoProcedimento, setTipoProcedimento] = useState("");
  const [laboratorio, setLaboratorio] = useState("");
  const [patologistaResponsavel, setPatologistaResponsavel] = useState("");
  const [diagnostico, setDiagnostico] = useState("");
  const [conclusao, setConclusao] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const { data: patologias, isLoading, refetch } = trpc.patologia.list.useQuery({ pacienteId });
  
  const utils = trpc.useUtils();
  const createPatologia = trpc.patologia.create.useMutation({
    onSuccess: () => {
      utils.patologia.list.invalidate({ pacienteId });
      onUpdate?.();
      resetForm();
      setModalAberto(false);
    },
  });

  const resetForm = () => {
    setDataColeta(new Date().toISOString().split("T")[0]);
    setDataResultado("");
    setTipoExame("");
    setOrigemMaterial("");
    setTipoProcedimento("");
    setLaboratorio("");
    setPatologistaResponsavel("");
    setDiagnostico("");
    setConclusao("");
    setObservacoes("");
  };

  const handleSubmit = () => {
    if (!dataColeta || !tipoExame) {
      alert("Preencha a data de coleta e o tipo de exame.");
      return;
    }

    createPatologia.mutate({
      pacienteId,
      dataColeta,
      dataResultado: dataResultado || undefined,
      tipoExame: tipoExame as any,
      origemMaterial: origemMaterial || undefined,
      tipoProcedimento: tipoProcedimento || undefined,
      laboratorio: laboratorio || undefined,
      patologistaResponsavel: patologistaResponsavel || undefined,
      diagnostico: diagnostico || undefined,
      conclusao: conclusao || undefined,
      observacoes: observacoes || undefined,
    });
  };

  const formatarData = (data: string | Date | null): string => {
    if (!data) return "-";
    const d = new Date(data);
    return d.toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Microscope className="h-5 w-5" />
            Patologia
          </h2>
          <p className="text-sm text-gray-500">
            Exames anatomopatológicos, citopatológicos e imunohistoquímica
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" tooltip="Enviar" onClick={() => { setPatologiaIdParaUpload(null); setModalUploadAberto(true); }}>
            <Upload className="h-4 w-4 mr-2" />Upload de Documento
          </Button>
          <Button tooltip="Criar novo registro" onClick={() => setModalAberto(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Exame
          </Button>
        </div>
      </div>

      {/* Lista de exames */}
      {!patologias || patologias.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <Microscope className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum exame de patologia registrado.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              tooltip="Adicionar" onClick={() => setModalAberto(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Registrar Primeiro Exame
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {patologias.map((patologia) => (
            <Card key={patologia.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline">{patologia.tipoExame}</Badge>
                      {patologia.origemMaterial && (
                        <span className="text-gray-600 font-normal">
                          - {patologia.origemMaterial}
                        </span>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Coleta: {formatarData(patologia.dataColeta)}
                      </span>
                      {patologia.dataResultado && (
                        <span className="flex items-center gap-1">
                          <FileText className="h-3 w-3" />
                          Resultado: {formatarData(patologia.dataResultado)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    tooltip="Enviar" onClick={() => {
                      setPatologiaIdParaUpload(patologia.id);
                      setModalUploadAberto(true);
                    }}
                  >
                    <Upload className="h-4 w-4 mr-1" />
                    Anexar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {patologia.laboratorio && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span>{patologia.laboratorio}</span>
                    </div>
                  )}
                  {patologia.patologistaResponsavel && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>{patologia.patologistaResponsavel}</span>
                    </div>
                  )}
                </div>
                
                {patologia.diagnostico && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-1">Diagnóstico</p>
                    <p className="text-sm">{patologia.diagnostico}</p>
                  </div>
                )}
                
                {patologia.conclusao && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs font-medium text-blue-600 mb-1">Conclusão</p>
                    <p className="text-sm">{patologia.conclusao}</p>
                  </div>
                )}

                {/* Documentos anexados */}
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs font-medium text-gray-500 mb-2">Documentos Anexados</p>
                  <DocumentosList pacienteId={pacienteId} categoria="Patologia" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de novo exame */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Microscope className="h-5 w-5" />
              Novo Exame de Patologia
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dataColeta">Data da Coleta *</Label>
                <Input
                  id="dataColeta"
                  type="date"
                  value={dataColeta}
                  onChange={(e) => setDataColeta(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dataResultado">Data do Resultado</Label>
                <Input
                  id="dataResultado"
                  type="date"
                  value={dataResultado}
                  onChange={(e) => setDataResultado(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="tipoExame">Tipo de Exame *</Label>
              <Select value={tipoExame} onValueChange={setTipoExame}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anatomopatológico">Anatomopatológico</SelectItem>
                  <SelectItem value="Citopatológico">Citopatológico</SelectItem>
                  <SelectItem value="Imunohistoquímica">Imunohistoquímica</SelectItem>
                  <SelectItem value="Hibridização in situ">Hibridização in situ</SelectItem>
                  <SelectItem value="Biópsia Líquida">Biópsia Líquida</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="origemMaterial">Origem do Material</Label>
                <Input
                  id="origemMaterial"
                  value={origemMaterial}
                  onChange={(e) => setOrigemMaterial(e.target.value)}
                  placeholder="Ex: Mama direita, Cólon, Pele"
                />
              </div>
              <div>
                <Label htmlFor="tipoProcedimento">Tipo de Procedimento</Label>
                <Input
                  id="tipoProcedimento"
                  value={tipoProcedimento}
                  onChange={(e) => setTipoProcedimento(e.target.value)}
                  placeholder="Ex: Biópsia, Ressecção"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="laboratorio">Laboratório</Label>
                <Input
                  id="laboratorio"
                  value={laboratorio}
                  onChange={(e) => setLaboratorio(e.target.value)}
                  placeholder="Nome do laboratório"
                />
              </div>
              <div>
                <Label htmlFor="patologistaResponsavel">Patologista Responsável</Label>
                <Input
                  id="patologistaResponsavel"
                  value={patologistaResponsavel}
                  onChange={(e) => setPatologistaResponsavel(e.target.value)}
                  placeholder="Nome do patologista"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="diagnostico">Diagnóstico</Label>
              <Textarea
                id="diagnostico"
                value={diagnostico}
                onChange={(e) => setDiagnostico(e.target.value)}
                placeholder="Diagnóstico histopatológico..."
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="conclusao">Conclusão</Label>
              <Textarea
                id="conclusao"
                value={conclusao}
                onChange={(e) => setConclusao(e.target.value)}
                placeholder="Conclusão do laudo..."
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" tooltip="Cancelar operação" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={createPatologia.isPending}
             tooltip="Salvar alterações">
              {createPatologia.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de upload */}
      <DocumentoUpload
        pacienteId={pacienteId}
        categoria="Patologia"
        registroId={patologiaIdParaUpload || undefined}
        isOpen={modalUploadAberto}
        onClose={() => {
          setModalUploadAberto(false);
          setPatologiaIdParaUpload(null);
        }}
        onSuccess={() => {
          refetch();
        }}
      />
    </div>
  );
}
