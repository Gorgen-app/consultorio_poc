/**
 * Componentes de Loading do GORGEN
 * Utiliza o GIF animado do farol com feixe de luz girando
 */

interface GorgenLoadingScreenProps {
  message?: string;
}

export function GorgenLoadingScreen({ message = "Carregando..." }: GorgenLoadingScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
      <div className="flex flex-col items-center">
        {/* GIF animado do farol */}
        <img 
          src="/assets/loader/gorgen-loader-large.gif" 
          alt="Carregando..." 
          className="w-48 h-48 mb-4"
        />
        
        {/* Mensagem */}
        <p className="text-gray-500 text-sm">{message}</p>
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
            <img 
              src="/assets/loader/gorgen-loader-large.gif" 
              alt="Carregando..." 
              className="w-36 h-36 object-contain"
            />
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
  const sizeClasses = {
    small: { width: 16, height: 16 },
    default: { width: 24, height: 24 },
    large: { width: 32, height: 32 },
  };

  const { width, height } = sizeClasses[size];

  return (
    <div className="flex items-center justify-center gap-2">
      <img 
        src="/assets/loader/gorgen-loader-small.gif" 
        alt="Carregando..." 
        width={width}
        height={height}
        className="object-contain"
      />
    </div>
  );
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
    <img 
      src="/assets/loader/gorgen-loader-small.gif" 
      alt="Carregando..." 
      width={20}
      height={20}
      className="inline-block"
    />
  );
}

/**
 * Loader centralizado para uso em containers
 */
export function GorgenCenteredLoader({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <img 
        src="/assets/loader/gorgen-loader.gif" 
        alt="Carregando..." 
        width={120}
        height={120}
      />
      {message && (
        <p className="text-gray-500 text-sm mt-4">{message}</p>
      )}
    </div>
  );
}
