import React from 'react';

interface GorgenLighthouseLoaderProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  text?: string;
}

const sizeMap = {
  sm: 48,
  md: 80,
  lg: 120,
  xl: 200,
};

/**
 * GorgenLighthouseLoader - Animação SVG do farol GORGEN
 * 
 * O feixe de luz gira no plano horizontal (axial) como um farol real,
 * criando um efeito de varredura suave.
 */
export function GorgenLighthouseLoader({ 
  size = 'md', 
  className = '',
  text
}: GorgenLighthouseLoaderProps) {
  const dimension = sizeMap[size];
  
  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <svg
        width={dimension}
        height={dimension}
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        className="gorgen-lighthouse-loader"
      >
        <defs>
          {/* Gradiente para o feixe de luz */}
          <linearGradient id="beamGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#FFA500" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </linearGradient>
          
          {/* Gradiente radial para o brilho central */}
          <radialGradient id="glowGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="30%" stopColor="#FFD700" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFA500" stopOpacity="0" />
          </radialGradient>
          
          {/* Filtro de brilho */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Clip path para o feixe */}
          <clipPath id="beamClip">
            <rect x="100" y="0" width="100" height="200" />
          </clipPath>
        </defs>
        
        {/* Fundo circular sutil */}
        <circle cx="100" cy="100" r="95" fill="#F8FAFC" />
        
        {/* Ondas do mar - base do farol */}
        <g transform="translate(100, 145)">
          {/* Onda 1 */}
          <path
            d="M-60 0 Q-45 -8 -30 0 Q-15 8 0 0 Q15 -8 30 0 Q45 8 60 0"
            fill="none"
            stroke="#0D3B66"
            strokeWidth="3"
            strokeLinecap="round"
          >
            <animate
              attributeName="d"
              values="M-60 0 Q-45 -8 -30 0 Q-15 8 0 0 Q15 -8 30 0 Q45 8 60 0;
                      M-60 0 Q-45 8 -30 0 Q-15 -8 0 0 Q15 8 30 0 Q45 -8 60 0;
                      M-60 0 Q-45 -8 -30 0 Q-15 8 0 0 Q15 -8 30 0 Q45 8 60 0"
              dur="2s"
              repeatCount="indefinite"
            />
          </path>
          {/* Onda 2 */}
          <path
            d="M-50 12 Q-35 4 -20 12 Q-5 20 10 12 Q25 4 40 12 Q55 20 70 12"
            fill="none"
            stroke="#0D3B66"
            strokeWidth="2.5"
            strokeLinecap="round"
            opacity="0.7"
          >
            <animate
              attributeName="d"
              values="M-50 12 Q-35 4 -20 12 Q-5 20 10 12 Q25 4 40 12 Q55 20 70 12;
                      M-50 12 Q-35 20 -20 12 Q-5 4 10 12 Q25 20 40 12 Q55 4 70 12;
                      M-50 12 Q-35 4 -20 12 Q-5 20 10 12 Q25 4 40 12 Q55 20 70 12"
              dur="2.5s"
              repeatCount="indefinite"
            />
          </path>
        </g>
        
        {/* Corpo do farol */}
        <g transform="translate(100, 100)">
          {/* Base do farol */}
          <path
            d="M-18 45 L-22 20 L-15 20 L-12 45 Z"
            fill="#0D3B66"
          />
          <path
            d="M18 45 L22 20 L15 20 L12 45 Z"
            fill="#0D3B66"
          />
          
          {/* Torre principal */}
          <path
            d="M-15 20 L-12 -25 L12 -25 L15 20 Z"
            fill="#0D3B66"
          />
          
          {/* Faixas brancas horizontais */}
          <rect x="-14" y="-5" width="28" height="8" fill="white" />
          <rect x="-13" y="8" width="26" height="6" fill="white" />
          
          {/* Lanterna (topo) */}
          <rect x="-10" y="-35" width="20" height="12" fill="#0D3B66" rx="2" />
          
          {/* Vidro da lanterna */}
          <rect x="-8" y="-33" width="16" height="8" fill="#87CEEB" opacity="0.6" />
          
          {/* Teto da lanterna */}
          <path
            d="M-12 -35 L0 -45 L12 -35 Z"
            fill="#0D3B66"
          />
          
          {/* Ponta do teto */}
          <circle cx="0" cy="-47" r="3" fill="#0D3B66" />
        </g>
        
        {/* Feixe de luz girando - efeito de varredura horizontal */}
        <g transform="translate(100, 70)" filter="url(#glow)">
          {/* Feixe principal que gira */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur="3s"
              repeatCount="indefinite"
            />
            
            {/* Feixe cônico */}
            <path
              d="M0 0 L80 -15 L80 15 Z"
              fill="url(#beamGradient)"
              opacity="0.8"
            />
            
            {/* Segundo feixe (oposto) */}
            <path
              d="M0 0 L-80 -15 L-80 15 Z"
              fill="url(#beamGradient)"
              opacity="0.8"
            />
          </g>
          
          {/* Brilho central fixo */}
          <circle cx="0" cy="0" r="8" fill="url(#glowGradient)">
            <animate
              attributeName="r"
              values="6;10;6"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>
        </g>
      </svg>
      
      {text && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {text}
        </span>
      )}
      
      <style>{`
        .gorgen-lighthouse-loader {
          animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * GorgenFullPageLoader - Loader de página inteira com o farol
 */
export function GorgenFullPageLoader({ text = 'Carregando...' }: { text?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
      <GorgenLighthouseLoader size="xl" text={text} />
    </div>
  );
}

/**
 * GorgenInlineLoader - Loader inline pequeno
 */
export function GorgenInlineLoader({ className = '' }: { className?: string }) {
  return <GorgenLighthouseLoader size="sm" className={className} />;
}

export default GorgenLighthouseLoader;
