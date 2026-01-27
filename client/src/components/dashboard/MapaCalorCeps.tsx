import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { MapPin, ZoomIn, ZoomOut, Layers, Crosshair, Ruler } from "lucide-react";
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

// Dimensões do mapa SVG
const MAPA_WIDTH = 600;
const MAPA_HEIGHT = 500;

// Limites geográficos do Brasil
const BRASIL_BOUNDS = {
  minLat: -33.75,
  maxLat: 5.27,
  minLng: -73.99,
  maxLng: -34.79
};

// Zoom padrão para escala 1cm:5km (aproximadamente)
// Em um monitor típico, 1cm ≈ 38px, e 5km em coordenadas ≈ 0.045 graus
// Zoom 3.5 dá uma boa aproximação dessa escala
const ZOOM_PADRAO = 3.5;
const ZOOM_MIN = 1;
const ZOOM_MAX = 10;

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

// Calcular escala em km baseada no zoom
function calcularEscalaKm(zoom: number): number {
  // Em zoom 1, a largura do mapa representa aproximadamente 4000km
  // A barra de escala tem 100px de largura
  const kmPorPixelBase = 4000 / MAPA_WIDTH;
  const kmPorPixel = kmPorPixelBase / zoom;
  return Math.round(kmPorPixel * 100); // 100px de barra
}

interface MapaCalorCepsProps {
  className?: string;
}

export function MapaCalorCeps({ className }: MapaCalorCepsProps) {
  const [nivelAgrupamento, setNivelAgrupamento] = useState<'regiao' | 'subregiao' | 'completo'>('regiao');
  const [zoom, setZoom] = useState(ZOOM_PADRAO);
  const [centerLat, setCenterLat] = useState(-30.0346); // Porto Alegre como padrão
  const [centerLng, setCenterLng] = useState(-51.2177);
  const [geolocalizacaoObtida, setGeolocalizacaoObtida] = useState(false);
  
  // Obter geolocalização do usuário ao montar o componente
  useEffect(() => {
    if (navigator.geolocation && !geolocalizacaoObtida) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenterLat(position.coords.latitude);
          setCenterLng(position.coords.longitude);
          setGeolocalizacaoObtida(true);
        },
        (error) => {
          console.log('Geolocalização não disponível:', error.message);
          // Manter Porto Alegre como padrão
          setGeolocalizacaoObtida(true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [geolocalizacaoObtida]);
  
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
          raio: Math.max(6, Math.min(25, 6 + item.intensidade * 19)),
          regiao: coords.nome
        };
      })
      .filter(Boolean);
  }, [data, zoom, centerLat, centerLng]);
  
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.3, ZOOM_MAX));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.3, ZOOM_MIN));
  
  // Centralizar na localização do usuário
  const centralizarNaLocalizacao = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenterLat(position.coords.latitude);
          setCenterLng(position.coords.longitude);
          setZoom(ZOOM_PADRAO);
        },
        () => {
          // Se falhar, manter posição atual
        }
      );
    }
  };
  
  // Escala atual em km
  const escalaKm = calcularEscalaKm(zoom);
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Mapa de Calor - Distribuição por CEP
          </CardTitle>
          <CardDescription className="text-xs">Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-[350px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="pb-2 space-y-1">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <MapPin className="h-4 w-4 text-primary" />
              Mapa de Calor - Distribuição por CEP
            </CardTitle>
            <CardDescription className="text-xs">
              {data?.total || 0} pacientes com CEP cadastrado
            </CardDescription>
          </div>
          
          <Select value={nivelAgrupamento} onValueChange={(v: any) => setNivelAgrupamento(v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <Layers className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regiao">Por Região</SelectItem>
              <SelectItem value="subregiao">Por Sub-região</SelectItem>
              <SelectItem value="completo">CEP Completo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Mapa SVG */}
        <div className="relative border rounded-lg overflow-hidden bg-gradient-to-b from-sky-50 to-sky-100 dark:from-slate-800 dark:to-slate-900">
          <svg 
            viewBox={`0 0 ${MAPA_WIDTH} ${MAPA_HEIGHT}`} 
            className="w-full h-[320px]"
          >
            {/* Contorno simplificado do Brasil */}
            <path
              d="M180,50 L280,30 L380,40 L450,80 L500,150 L520,250 L510,350 L480,420 L420,480 L350,520 L280,540 L200,530 L140,480 L100,400 L80,300 L90,200 L120,120 Z"
              fill="#d1fae5"
              stroke="#10b981"
              strokeWidth="1.5"
              opacity="0.4"
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
                        r={ponto?.raio ? ponto.raio * 1.8 : 10}
                        fill={ponto?.cor}
                        opacity="0.25"
                        filter="url(#blur)"
                      />
                      {/* Círculo principal */}
                      <circle
                        cx={ponto?.x}
                        cy={ponto?.y}
                        r={ponto?.raio || 6}
                        fill={ponto?.cor}
                        stroke="white"
                        strokeWidth="1.5"
                        opacity="0.9"
                        className="cursor-pointer hover:opacity-100 transition-opacity"
                      />
                      {/* Número de pacientes */}
                      {zoom >= 2.5 && ponto?.quantidade && ponto.quantidade >= 3 && (
                        <text
                          x={ponto?.x}
                          y={ponto?.y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          fill="white"
                          fontSize="9"
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
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>
          </svg>
          
          {/* Controles de zoom - posicionados sobre o mapa */}
          <div className="absolute top-3 right-3 flex flex-col gap-1 bg-white/90 dark:bg-slate-800/90 rounded-lg p-1.5 shadow-md">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleZoomIn} 
              title="Aumentar zoom"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <div className="h-24 flex items-center justify-center px-1">
              <Slider
                value={[zoom]}
                onValueChange={([v]) => setZoom(v)}
                min={ZOOM_MIN}
                max={ZOOM_MAX}
                step={0.2}
                orientation="vertical"
                className="h-full"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={handleZoomOut} 
              title="Diminuir zoom"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Botão de centralizar na localização */}
          <div className="absolute top-3 left-3">
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 text-xs gap-1 shadow-md"
              onClick={centralizarNaLocalizacao}
              title="Centralizar na minha localização"
            >
              <Crosshair className="h-3 w-3" />
              Minha localização
            </Button>
          </div>
          
          {/* Régua de escala */}
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-800/90 rounded px-2 py-1 shadow-md">
            <div className="flex items-center gap-2">
              <Ruler className="h-3 w-3 text-muted-foreground" />
              <div className="flex flex-col items-center">
                <div className="w-[60px] h-1 bg-slate-700 dark:bg-slate-300 rounded-full relative">
                  <div className="absolute -left-0.5 -top-0.5 w-0.5 h-2 bg-slate-700 dark:bg-slate-300" />
                  <div className="absolute -right-0.5 -top-0.5 w-0.5 h-2 bg-slate-700 dark:bg-slate-300" />
                </div>
                <span className="text-[10px] text-muted-foreground mt-0.5">{escalaKm} km</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legenda compacta */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Concentração:</span>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-full" style={{ background: getCorIntensidade(0) }} />
              <span className="text-[10px] text-muted-foreground">Baixa</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-full" style={{ background: getCorIntensidade(0.5) }} />
              <span className="text-[10px] text-muted-foreground">Média</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-full" style={{ background: getCorIntensidade(1) }} />
              <span className="text-[10px] text-muted-foreground">Alta</span>
            </div>
          </div>
          
          <span className="text-muted-foreground">
            {pontosNoMapa.length} regiões
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
