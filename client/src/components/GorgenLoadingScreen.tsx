/**
 * Componentes de Loading do GORGEN
 * Utiliza animação SVG do farol com feixe de luz girando no plano horizontal
 */

import { GorgenLighthouseLoader, GorgenFullPageLoader, GorgenInlineLoader as LighthouseInlineLoader } from './GorgenLighthouseLoader';

interface GorgenLoadingScreenProps {
  message?: string;
}

export function GorgenLoadingScreen({ message = "Carregando..." }: GorgenLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
      <div className="flex flex-col items-center">
        {/* Animação SVG do farol */}
        <GorgenLighthouseLoader size="xl" text={message} />
      </div>
    </div>
  );
}

export function GorgenLoadingSkeleton() {
  return (
    <div className="min-h-screen flex">
      {/* Painel esquerdo - Skeleton */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0056A4] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0056A4] to-[#002B49]" />
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12">
          <div className="w-48 h-48 bg-white/10 rounded-full flex items-center justify-center mb-8 backdrop-blur-sm">
            <GorgenLighthouseLoader size="lg" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4 tracking-wide">GORGEN</h1>
          <p className="text-xl text-white/80 text-center max-w-md">
            Gestão em Saúde
          </p>
        </div>
        <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-[#002B49]/50 to-transparent" />
      </div>

      {/* Painel direito - Skeleton */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[#F5F7FA]">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Skeleton do título */}
            <div className="text-center mb-8">
              <div className="h-8 bg-gray-200 rounded w-48 mx-auto mb-4 animate-pulse" />
              <div className="h-4 bg-gray-100 rounded w-64 mx-auto animate-pulse" />
            </div>

            {/* Skeleton dos campos */}
            <div className="space-y-5">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                <div className="h-12 bg-gray-100 rounded animate-pulse" />
              </div>
              <div className="h-12 bg-[#0056A4]/30 rounded animate-pulse mt-6" />
            </div>

            {/* Skeleton do link */}
            <div className="h-4 bg-gray-100 rounded w-40 mx-auto mt-8 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function GorgenInlineLoader({ size = "default" }: { size?: "small" | "default" | "large" }) {
  const sizeMap = {
    small: 'sm' as const,
    default: 'sm' as const,
    large: 'md' as const,
  };

  return <LighthouseInlineLoader className={size === 'small' ? 'scale-75' : ''} />;
}

export function GorgenCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-12 h-12 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-3 bg-gray-100 rounded w-24" />
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-100 rounded w-full" />
        <div className="h-3 bg-gray-100 rounded w-3/4" />
      </div>
    </div>
  );
}

export function GorgenTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-6 py-4 border-b">
        <div className="flex gap-4">
          <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-28 animate-pulse" />
        </div>
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-b last:border-b-0">
          <div className="flex gap-4 items-center">
            <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-32 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
            <div className="h-4 bg-gray-100 rounded w-28 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Loader para uso em botões durante ações assíncronas
 */
export function GorgenButtonLoader() {
  return (
    <div className="inline-flex items-center justify-center w-5 h-5">
      <svg
        width="20"
        height="20"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="animate-spin"
      >
        <circle
          cx="100"
          cy="100"
          r="80"
          fill="none"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinecap="round"
          strokeDasharray="400"
          strokeDashoffset="300"
          opacity="0.8"
        />
      </svg>
    </div>
  );
}

/**
 * Loader centralizado para uso em containers
 */
export function GorgenCenteredLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <GorgenLighthouseLoader size="lg" text={message} />
    </div>
  );
}

// Re-exportar o loader de página inteira
export { GorgenFullPageLoader };
