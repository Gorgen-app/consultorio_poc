import React from 'react';

interface GorgenLoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
  fullScreen?: boolean;
}

/**
 * Componente de loading animado do GORGEN com o farol e feixe de luz girando.
 * 
 * @param size - Tamanho do loader: 'small' (64px), 'medium' (120px), 'large' (200px)
 * @param text - Texto opcional a ser exibido abaixo do loader
 * @param className - Classes CSS adicionais
 * @param fullScreen - Se true, exibe o loader centralizado em tela cheia
 */
export function GorgenLoader({ 
  size = 'medium', 
  text, 
  className = '',
  fullScreen = false 
}: GorgenLoaderProps) {
  const sizeMap = {
    small: {
      src: '/assets/loader/gorgen-loader-small.gif',
      width: 64,
      height: 64
    },
    medium: {
      src: '/assets/loader/gorgen-loader.gif',
      width: 120,
      height: 120
    },
    large: {
      src: '/assets/loader/gorgen-loader-large.gif',
      width: 200,
      height: 200
    }
  };

  const { src, width, height } = sizeMap[size];

  const loaderContent = (
    <div className={`flex flex-col items-center justify-center gap-4 ${className}`}>
      <img 
        src={src} 
        alt="Carregando..." 
        width={width} 
        height={height}
        className="animate-pulse-subtle"
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {loaderContent}
      </div>
    );
  }

  return loaderContent;
}

/**
 * Loader inline para uso em botões e campos de input
 */
export function GorgenLoaderInline({ className = '' }: { className?: string }) {
  return (
    <img 
      src="/assets/loader/gorgen-loader-small.gif" 
      alt="Carregando..." 
      width={24} 
      height={24}
      className={`inline-block ${className}`}
    />
  );
}

/**
 * Skeleton loader para cards e listas
 */
export function GorgenLoaderSkeleton({ 
  lines = 3,
  className = '' 
}: { 
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-3">
        <img 
          src="/assets/loader/gorgen-loader-small.gif" 
          alt="Carregando..." 
          width={32} 
          height={32}
        />
        <div className="h-4 bg-muted rounded animate-pulse w-1/3" />
      </div>
      {Array.from({ length: lines }).map((_, i) => (
        <div 
          key={i} 
          className="h-3 bg-muted rounded animate-pulse"
          style={{ width: `${100 - (i * 15)}%` }}
        />
      ))}
    </div>
  );
}

export default GorgenLoader;
