import { GorgenLighthouseLoader } from "@/components/GorgenLighthouseLoader";

export default function LoaderDemo() {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold text-white mb-8">
        GORGEN Lighthouse Loader - Demo
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {/* Tamanho SM */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white/10 rounded-xl p-8 flex items-center justify-center">
            <GorgenLighthouseLoader size="sm" />
          </div>
          <span className="text-white/70 text-sm">Small (64px)</span>
        </div>
        
        {/* Tamanho MD */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white/10 rounded-xl p-8 flex items-center justify-center">
            <GorgenLighthouseLoader size="md" />
          </div>
          <span className="text-white/70 text-sm">Medium (96px)</span>
        </div>
        
        {/* Tamanho LG */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white/10 rounded-xl p-8 flex items-center justify-center">
            <GorgenLighthouseLoader size="lg" />
          </div>
          <span className="text-white/70 text-sm">Large (128px)</span>
        </div>
        
        {/* Tamanho XL */}
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white/10 rounded-xl p-8 flex items-center justify-center">
            <GorgenLighthouseLoader size="xl" />
          </div>
          <span className="text-white/70 text-sm">Extra Large (192px)</span>
        </div>
      </div>
      
      {/* Demonstração em fundo claro */}
      <h2 className="text-xl font-semibold text-white mb-4">
        Em fundo claro
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl p-8 flex items-center justify-center">
            <GorgenLighthouseLoader size="sm" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl p-8 flex items-center justify-center">
            <GorgenLighthouseLoader size="md" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl p-8 flex items-center justify-center">
            <GorgenLighthouseLoader size="lg" />
          </div>
        </div>
        <div className="flex flex-col items-center gap-4">
          <div className="bg-white rounded-xl p-8 flex items-center justify-center">
            <GorgenLighthouseLoader size="xl" />
          </div>
        </div>
      </div>
      
      {/* Demonstração grande centralizada */}
      <h2 className="text-xl font-semibold text-white mb-4">
        Visualização em destaque
      </h2>
      <div className="bg-gradient-to-br from-blue-900 to-slate-900 rounded-2xl p-16 flex flex-col items-center justify-center">
        <GorgenLighthouseLoader size="xl" />
        <p className="text-white/80 mt-6 text-lg">Carregando...</p>
      </div>
      
      <p className="text-white/50 text-sm mt-8">
        Página de demonstração temporária - /loader-demo
      </p>
    </div>
  );
}
