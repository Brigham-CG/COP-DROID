import type { GeminiAnalysis } from '../types'

interface PersonAnalysisCardProps {
  analysis: GeminiAnalysis | null
}

export function PersonAnalysisCard({ analysis }: PersonAnalysisCardProps) {
  if (!analysis) return null

  // We define the keys we want to show and their beautiful labels/emojis
  const items = [
    { key: 'genero_y_edad_aproximada', label: 'Género y Edad', icon: '👤' },
    { key: 'etnia_aparente', label: 'Etnia Aparente', icon: '🌍' },
    { key: 'ropa_superior', label: 'Ropa Superior', icon: '👕' },
    { key: 'sombrero', label: 'Sombrero/Cabeza', icon: '🧢' },
    { key: 'accesorios_visibles', label: 'Accesorios', icon: '🎒' },
    { key: 'rasgos_distintivos', label: 'Rasgos Distintivos', icon: '🔍' },
  ]

  return (
    <div className="rounded-xl border border-[--color-accent-green] bg-gradient-to-br from-[--color-bg-secondary] to-[--color-bg-primary] p-5 shadow-lg relative overflow-hidden group transition-all duration-300 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]">
      {/* Dynamic background glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-[--color-accent-green] opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity"></div>
      
      <div className="flex items-center gap-3 mb-4 border-b border-[--color-divider] pb-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[--color-accent-green]/10 text-[--color-accent-green]">
          <span className="text-xl">🤖</span>
        </div>
        <div>
          <h2 className="text-[--color-accent-green] font-bold text-sm tracking-widest uppercase">
            Análisis Forense AI
          </h2>
          <p className="text-[--color-text-tertiary] text-xs">Gemini 2.5 Vision</p>
        </div>
        <div className="ml-auto">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[--color-accent-green] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[--color-accent-green]"></span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ key, label, icon }) => {
          const value = analysis[key]
          if (!value) return null
          
          const isUnknown = typeof value === 'string' && value.toLowerCase().includes('no') && value.toLowerCase().includes('visible')

          return (
            <div 
              key={key} 
              className="flex flex-col bg-[--color-bg-tertiary] rounded-lg p-3 border border-[--color-divider] hover:border-[--color-border-subtle] transition-colors"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm opacity-80">{icon}</span>
                <span className="text-[--color-text-tertiary] text-[10px] font-semibold tracking-wider uppercase">
                  {label}
                </span>
              </div>
              <span className={`text-sm font-medium ${isUnknown ? 'text-[--color-text-tertiary] italic' : 'text-[--color-text-primary]'}`}>
                {value}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
