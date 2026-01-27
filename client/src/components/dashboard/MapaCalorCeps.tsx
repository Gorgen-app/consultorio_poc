import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { MapPin, ZoomIn, ZoomOut, Layers } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Mapeamento de coordenadas aproximadas para CEPs brasileiros
const COORDENADAS_CEP: Record<string, { lat: number; lng: number; nome: string }> = {
  // Rio Grande do Sul
  '90': { lat: -30.0346, lng: -51.2177, nome: 'Porto Alegre' },
  '91': { lat: -30.0500, lng: -51.1800, nome: 'Porto Alegre' },
  '92': { lat: -29.9400, lng: -51.0800, nome: 'Canoas' },
  '93': { lat: -29.7900, lng: -51.1500, nome: 'São Leopoldo' },
  '94': { lat: -29.6800, lng: -51.0900, nome: 'Gravataí' },
  '95': { lat: -29.1700, lng: -51.1800, nome: 'Caxias do Sul' },
  '96': { lat: -31.7700, lng: -52.3400, nome: 'Pelotas' },
  '97': { lat: -29.6900, lng: -53.8100, nome: 'Santa Maria' },
  '98': { lat: -28.2600, lng: -54.2300, nome: 'Cruz Alta' },
  '99': { lat: -28.6600, lng: -56.0000, nome: 'Uruguaiana' },
  // São Paulo
  '01': { lat: -23.5505, lng: -46.6333, nome: 'São Paulo Centro' },
  '02': { lat: -23.4800, lng: -46.6200, nome: 'São Paulo Norte' },
  '03': { lat: -23.5400, lng: -46.5800, nome: 'São Paulo Leste' },
  '04': { lat: -23.6100, lng: -46.6500, nome: 'São Paulo Sul' },
  '05': { lat: -23.5300, lng: -46.7000, nome: 'São Paulo Oeste' },
  '13': { lat: -22.9100, lng: -47.0600, nome: 'Campinas' },
  // Rio de Janeiro
  '20': { lat: -22.9068, lng: -43.1729, nome: 'Rio de Janeiro' },
  '21': { lat: -22.8800, lng: -43.2500, nome: 'Rio de Janeiro' },
  '22': { lat: -22.9500, lng: -43.1800, nome: 'Rio de Janeiro' },
  // Minas Gerais
  '30': { lat: -19.9167, lng: -43.9345, nome: 'Belo Horizonte' },
  '31': { lat: -19.8700, lng: -43.9700, nome: 'Belo Horizonte' },
  // Paraná
  '80': { lat: -25.4284, lng: -49.2733, nome: 'Curitiba' },
  '81': { lat: -25.4500, lng: -49.2300, nome: 'Curitiba' },
  // Santa Catarina
  '88': { lat: -27.5954, lng: -48.5480, nome: 'Florianópolis' },
  '89': { lat: -26.3000, lng: -48.8500, nome: 'Joinville' },
  // Distrito Federal
  '70': { lat: -15.7942, lng: -47.8822, nome: 'Brasília' },
  '71': { lat: -15.8300, lng: -47.9500, nome: 'Brasília' },
  // Bahia
  '40': { lat: -12.9714, lng: -38.5014, nome: 'Salvador' },
  '41': { lat: -12.9500, lng: -38.4500, nome: 'Salvador' },
  // Pernambuco
  '50': { lat: -8.0476, lng: -34.8770, nome: 'Recife' },
  '51': { lat: -8.0300, lng: -34.9200, nome: 'Recife' },
  // Ceará
  '60': { lat: -3.7172, lng: -38.5433, nome: 'Fortaleza' },
  '61': { lat: -3.7500, lng: -38.5800, nome: 'Fortaleza' },
  // Amazonas
  '69': { lat: -3.1190, lng: -60.0217, nome: 'Manaus' },
  // Pará
  '66': { lat: -1.4558, lng: -48.4902, nome: 'Belém' },
};

// Função para interpolar cor entre azul e vermelho
function getCorIntensidade(intensidade: number): string {
  // Azul claro (baixa concentração) -> Amarelo (média) -> Vermelho (alta)
  if (intensidade <= 0.33) {
    // Azul claro para amarelo
    const t = intensidade / 0.33;
    const r = Math.round(100 + t * 155);
    const g = Math.round(149 + t * 106);
    const b = Math.round(237 - t * 237);
    return `rgb(${r}, ${g}, ${b})`;
  } else if (intensidade <= 0.66) {
    // Amarelo para laranja
    const t = (intensidade - 0.33) / 0.33;
    const r = 255;
    const g = Math.round(255 - t * 100);
    const b = Math.round(0 + t * 0);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Laranja para vermelho vivo
    const t = (intensidade - 0.66) / 0.34;
    const r = 255;
    const g = Math.round(155 - t * 155);
    const b = 0;
    return `rgb(${r}, ${g}, ${b})`;
  }
}

// Dimensões do mapa SVG do Brasil
const MAPA_WIDTH = 600;
const MAPA_HEIGHT = 600;

// Limites geográficos do Brasil
const BRASIL_BOUNDS = {
  minLat: -33.75,
  maxLat: 5.27,
  minLng: -73.99,
  maxLng: -34.79
};

// Converter coordenadas geográficas para posição no SVG
function geoToSvg(lat: number, lng: number, zoom: number, centerLat: number, centerLng: number): { x: number; y: number } {
  const scale = zoom;
  
  // Normalizar coordenadas
  const normalizedLng = (lng - BRASIL_BOUNDS.minLng) / (BRASIL_BOUNDS.maxLng - BRASIL_BOUNDS.minLng);
  const normalizedLat = (BRASIL_BOUNDS.maxLat - lat) / (BRASIL_BOUNDS.maxLat - BRASIL_BOUNDS.minLat);
  
  // Aplicar zoom e centro
  const centerX = (centerLng - BRASIL_BOUNDS.minLng) / (BRASIL_BOUNDS.maxLng - BRASIL_BOUNDS.minLng);
  const centerY = (BRASIL_BOUNDS.maxLat - centerLat) / (BRASIL_BOUNDS.maxLat - BRASIL_BOUNDS.minLat);
  
  const x = MAPA_WIDTH / 2 + (normalizedLng - centerX) * MAPA_WIDTH * scale;
  const y = MAPA_HEIGHT / 2 + (normalizedLat - centerY) * MAPA_HEIGHT * scale;
  
  return { x, y };
}

interface MapaCalorCepsProps {
  className?: string;
}

export function MapaCalorCeps({ className }: MapaCalorCepsProps) {
  const [nivelAgrupamento, setNivelAgrupamento] = useState<'regiao' | 'subregiao' | 'completo'>('regiao');
  const [zoom, setZoom] = useState(1);
  const [centerLat, setCenterLat] = useState(-15.0);
  const [centerLng, setCenterLng] = useState(-55.0);
  
  const { data, isLoading } = trpc.dashboardMetricas.pacDistribuicaoCep.useQuery({
    nivelAgrupamento
  });
  
  // Processar dados para o mapa
  const pontosNoMapa = useMemo(() => {
    if (!data?.dados) return [];
    
    return data.dados
      .map(item => {
        const prefixo2 = item.cep.substring(0, 2);
        const coords = COORDENADAS_CEP[prefixo2];
        
        if (!coords) return null;
        
        // Adicionar pequena variação para CEPs com mais dígitos
        let lat = coords.lat;
        let lng = coords.lng;
        
        if (item.cep.length > 2) {
          const variacao = parseInt(item.cep.substring(2, 5) || '0', 10) / 50000;
          lat += (variacao - 0.01) * (Math.random() * 0.5 + 0.75);
          lng += (variacao - 0.01) * (Math.random() * 0.5 + 0.75);
        }
        
        const pos = geoToSvg(lat, lng, zoom, centerLat, centerLng);
        
        return {
          ...item,
          x: pos.x,
          y: pos.y,
          cor: getCorIntensidade(item.intensidade),
          raio: Math.max(8, Math.min(30, 8 + item.intensidade * 22)),
          regiao: coords.nome
        };
      })
      .filter(Boolean);
  }, [data, zoom, centerLat, centerLng]);
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.5, 5));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.5, 0.5));
  
  // Centralizar em uma região específica
  const centralizarRegiao = (regiao: string) => {
    const regioes: Record<string, { lat: number; lng: number }> = {
      'brasil': { lat: -15.0, lng: -55.0 },
      'sul': { lat: -28.0, lng: -51.5 },
      'sudeste': { lat: -22.5, lng: -45.0 },
      'nordeste': { lat: -10.0, lng: -38.0 },
      'norte': { lat: -3.0, lng: -55.0 },
      'centro-oeste': { lat: -15.5, lng: -50.0 },
    };
    
    if (regioes[regiao]) {
      setCenterLat(regioes[regiao].lat);
      setCenterLng(regioes[regiao].lng);
      if (regiao !== 'brasil') {
        setZoom(2);
      } else {
        setZoom(1);
      }
    }
  };
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa de Calor - Distribuição por CEP
          </CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Mapa de Calor - Distribuição por CEP
            </CardTitle>
            <CardDescription>
              {data?.total || 0} pacientes com CEP cadastrado
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={nivelAgrupamento} onValueChange={(v: any) => setNivelAgrupamento(v)}>
              <SelectTrigger className="w-[140px]">
                <Layers className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regiao">Por Região</SelectItem>
                <SelectItem value="subregiao">Por Sub-região</SelectItem>
                <SelectItem value="completo">CEP Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Controles de zoom e navegação */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} title="Diminuir zoom">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <div className="w-32">
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={0.5}
                max={5}
                step={0.1}
              />
            </div>
            <Button variant="outline" size="icon" onClick={handleZoomIn} title="Aumentar zoom">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground ml-2">{(zoom * 100).toFixed(0)}%</span>
          </div>
          
          <div className="flex items-center gap-1 flex-wrap">
            <Button variant="ghost" size="sm" onClick={() => centralizarRegiao('brasil')}>Brasil</Button>
            <Button variant="ghost" size="sm" onClick={() => centralizarRegiao('sul')}>Sul</Button>
            <Button variant="ghost" size="sm" onClick={() => centralizarRegiao('sudeste')}>Sudeste</Button>
            <Button variant="ghost" size="sm" onClick={() => centralizarRegiao('nordeste')}>Nordeste</Button>
            <Button variant="ghost" size="sm" onClick={() => centralizarRegiao('norte')}>Norte</Button>
            <Button variant="ghost" size="sm" onClick={() => centralizarRegiao('centro-oeste')}>Centro-Oeste</Button>
          </div>
        </div>
        
        {/* Mapa SVG */}
        <div className="relative border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900">
          <svg 
            viewBox={`0 0 ${MAPA_WIDTH} ${MAPA_HEIGHT}`} 
            className="w-full h-[400px]"
            style={{ background: 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)' }}
          >
            {/* Contorno simplificado do Brasil */}
            <path
              d="M180,50 L280,30 L380,40 L450,80 L500,150 L520,250 L510,350 L480,420 L420,480 L350,520 L280,540 L200,530 L140,480 L100,400 L80,300 L90,200 L120,120 Z"
              fill="#d1fae5"
              stroke="#10b981"
              strokeWidth="2"
              opacity="0.5"
            />
            
            {/* Pontos do mapa de calor */}
            <TooltipProvider>
              {pontosNoMapa.map((ponto, index) => (
                <Tooltip key={`${ponto?.cep}-${index}`}>
                  <TooltipTrigger asChild>
                    <g>
                      {/* Círculo de fundo com blur para efeito de calor */}
                      <circle
                        cx={ponto?.x}
                        cy={ponto?.y}
                        r={ponto?.raio ? ponto.raio * 1.5 : 12}
                        fill={ponto?.cor}
                        opacity="0.3"
                        filter="url(#blur)"
                      />
                      {/* Círculo principal */}
                      <circle
                        cx={ponto?.x}
                        cy={ponto?.y}
                        r={ponto?.raio || 8}
                        fill={ponto?.cor}
                        stroke="white"
                        strokeWidth="2"
                        opacity="0.85"
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                      />
                      {/* Número de pacientes */}
                      {zoom >= 1.5 && ponto?.quantidade && ponto.quantidade >= 5 && (
                        <text
                          x={ponto?.x}
                          y={ponto?.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize="10"
                          fontWeight="bold"
                        >
                          {ponto.quantidade}
                        </text>
                      )}
                    </g>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-sm">
                      <p className="font-semibold">CEP: {ponto?.cep}</p>
                      <p>{ponto?.regiao}</p>
                      <p className="text-primary font-medium">{ponto?.quantidade} paciente{ponto?.quantidade !== 1 ? 's' : ''}</p>
                      {ponto?.cidades && <p className="text-xs text-muted-foreground">{ponto.cidades}</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>
            
            {/* Filtro de blur para efeito de calor */}
            <defs>
              <filter id="blur">
                <feGaussianBlur stdDeviation="5" />
              </filter>
            </defs>
          </svg>
        </div>
        
        {/* Legenda */}
        <div className="flex items-center justify-between mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Concentração:</span>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ background: getCorIntensidade(0) }} />
              <span className="text-xs">Baixa</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ background: getCorIntensidade(0.5) }} />
              <span className="text-xs">Média</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-4 h-4 rounded-full" style={{ background: getCorIntensidade(1) }} />
              <span className="text-xs">Alta</span>
            </div>
          </div>
          
          <div className="text-muted-foreground">
            {pontosNoMapa.length} regiões com pacientes
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
