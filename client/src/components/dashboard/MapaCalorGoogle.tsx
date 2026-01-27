/**
 * Mapa de Calor com Google Maps
 * Utiliza a HeatmapLayer do Google Maps para visualização
 * de distribuição geográfica dos pacientes por CEP
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { MapPin, Crosshair, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { MapView } from "@/components/Map";

interface CoordenadaCep {
  cep: string;
  latitude: number;
  longitude: number;
  enderecoFormatado: string | null;
  cidade: string | null;
  uf: string | null;
  quantidade?: number;
}

interface MapaCalorGoogleProps {
  className?: string;
}

// Centro padrão (Porto Alegre)
const CENTRO_PADRAO = { lat: -30.0346, lng: -51.2177 };
const ZOOM_PADRAO = 10;

export function MapaCalorGoogle({ className }: MapaCalorGoogleProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const markersRef = useRef<google.maps.marker.AdvancedMarkerElement[]>([]);
  
  const [centro, setCentro] = useState(CENTRO_PADRAO);
  const [geolocalizacaoObtida, setGeolocalizacaoObtida] = useState(false);
  const [mostrarMarcadores, setMostrarMarcadores] = useState(false);
  const [geocodificando, setGeocodificando] = useState(false);
  
  // Buscar coordenadas do backend
  const { data: coordenadas, isLoading, refetch, isRefetching } = trpc.dashboardMetricas.getCoordenadasMapaCalor.useQuery(
    undefined,
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    }
  );
  
  // Buscar estatísticas do cache
  const { data: estatisticas } = trpc.dashboardMetricas.getEstatisticasGeocodificacao.useQuery(
    undefined,
    {
      staleTime: 60 * 1000, // 1 minuto
    }
  );
  
  // Obter geolocalização do usuário
  useEffect(() => {
    if (navigator.geolocation && !geolocalizacaoObtida) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCentro({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setGeolocalizacaoObtida(true);
          
          // Atualizar centro do mapa se já estiver carregado
          if (mapRef.current) {
            mapRef.current.setCenter({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          }
        },
        () => {
          setGeolocalizacaoObtida(true);
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }
  }, [geolocalizacaoObtida]);
  
  // Callback quando o mapa estiver pronto
  const handleMapReady = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    
    // Centralizar na localização do usuário se disponível
    if (geolocalizacaoObtida && centro.lat !== CENTRO_PADRAO.lat) {
      map.setCenter(centro);
    }
  }, [centro, geolocalizacaoObtida]);
  
  // Atualizar heatmap quando coordenadas mudarem
  useEffect(() => {
    if (!mapRef.current || !coordenadas || coordenadas.length === 0) return;
    
    const map = mapRef.current;
    
    // Remover heatmap anterior
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
    }
    
    // Remover marcadores anteriores
    markersRef.current.forEach(marker => {
      marker.map = null;
    });
    markersRef.current = [];
    
    // Criar dados para o heatmap com peso baseado na quantidade
    const heatmapData = coordenadas.map((coord: CoordenadaCep) => ({
      location: new google.maps.LatLng(coord.latitude, coord.longitude),
      weight: coord.quantidade || 1
    }));
    
    // Criar HeatmapLayer
    const heatmap = new google.maps.visualization.HeatmapLayer({
      data: heatmapData,
      map: map,
      radius: 30,
      opacity: 0.7,
      gradient: [
        'rgba(0, 255, 255, 0)',
        'rgba(0, 255, 255, 1)',
        'rgba(0, 191, 255, 1)',
        'rgba(0, 127, 255, 1)',
        'rgba(0, 63, 255, 1)',
        'rgba(0, 0, 255, 1)',
        'rgba(0, 0, 223, 1)',
        'rgba(0, 0, 191, 1)',
        'rgba(0, 0, 159, 1)',
        'rgba(0, 0, 127, 1)',
        'rgba(63, 0, 91, 1)',
        'rgba(127, 0, 63, 1)',
        'rgba(191, 0, 31, 1)',
        'rgba(255, 0, 0, 1)'
      ]
    });
    
    heatmapRef.current = heatmap;
    
    // Criar marcadores se habilitado
    if (mostrarMarcadores) {
      coordenadas.forEach((coord: CoordenadaCep) => {
        const marker = new google.maps.marker.AdvancedMarkerElement({
          map: map,
          position: { lat: coord.latitude, lng: coord.longitude },
          title: `${coord.cidade || 'CEP'} ${coord.cep}: ${coord.quantidade || 1} paciente(s)`
        });
        markersRef.current.push(marker);
      });
    }
    
    // Ajustar bounds para mostrar todos os pontos
    if (coordenadas.length > 0) {
      const bounds = new google.maps.LatLngBounds();
      coordenadas.forEach((coord: CoordenadaCep) => {
        bounds.extend({ lat: coord.latitude, lng: coord.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [coordenadas, mostrarMarcadores]);
  
  // Centralizar na localização do usuário
  const centralizarNaLocalizacao = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const novoCentro = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCentro(novoCentro);
          if (mapRef.current) {
            mapRef.current.setCenter(novoCentro);
            mapRef.current.setZoom(ZOOM_PADRAO);
          }
        }
      );
    }
  };
  
  // Forçar atualização das coordenadas
  const atualizarCoordenadas = async () => {
    setGeocodificando(true);
    await refetch();
    setGeocodificando(false);
  };
  
  // Calcular totais
  const totalPacientes = coordenadas?.reduce((acc: number, c: CoordenadaCep) => acc + (c.quantidade || 1), 0) || 0;
  const totalCeps = coordenadas?.length || 0;
  
  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPin className="h-4 w-4" />
            Mapa de Calor - Google Maps
          </CardTitle>
          <CardDescription className="text-xs">Carregando coordenadas...</CardDescription>
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
              {totalPacientes.toLocaleString()} pacientes em {totalCeps.toLocaleString()} CEPs
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setMostrarMarcadores(!mostrarMarcadores)}
            >
              {mostrarMarcadores ? 'Ocultar' : 'Mostrar'} Marcadores
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={atualizarCoordenadas}
              disabled={isRefetching || geocodificando}
            >
              {(isRefetching || geocodificando) ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Atualizar
            </Button>
          </div>
        </div>
        
        {/* Estatísticas do cache */}
        {estatisticas && estatisticas.total > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline" className="text-[10px]">
              Cache: {estatisticas.sucesso}/{estatisticas.total}
            </Badge>
            {estatisticas.erro > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                <AlertCircle className="h-2 w-2 mr-1" />
                {estatisticas.erro} erros
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        {/* Mapa do Google */}
        <div className="relative rounded-lg overflow-hidden border">
          <MapView
            className="h-[320px]"
            initialCenter={centro}
            initialZoom={ZOOM_PADRAO}
            onMapReady={handleMapReady}
          />
          
          {/* Botão de centralizar */}
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
          
          {/* Indicador de carregamento */}
          {(isRefetching || geocodificando) && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
              <div className="flex items-center gap-2 bg-background px-4 py-2 rounded-lg shadow-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Geocodificando CEPs...</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Legenda */}
        <div className="flex items-center justify-between mt-2 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground">Concentração:</span>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-[10px] text-muted-foreground">Baixa</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-full bg-blue-600" />
              <span className="text-[10px] text-muted-foreground">Média</span>
            </div>
            <div className="flex items-center gap-0.5">
              <div className="w-3 h-3 rounded-full bg-red-600" />
              <span className="text-[10px] text-muted-foreground">Alta</span>
            </div>
          </div>
          
          <span className="text-muted-foreground">
            Powered by Google Maps
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
