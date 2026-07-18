import { useState } from 'react'
import type { GeminiAnalysis } from '../types'
import { PersonAnalysisCard } from './PersonAnalysisCard'

interface PersonHistoryProps {
  analyses?: GeminiAnalysis[]
}

export function PersonHistory({ analyses = [] }: PersonHistoryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  if (!analyses || analyses.length === 0) return null

  const selectedAnalysis = analyses[selectedIndex]

  return (
    <div className="flex flex-col gap-4 mt-6">
      <div className="flex items-center justify-between border-b border-[--color-divider] pb-2">
        <h3 className="text-[--color-text-primary] text-sm font-semibold tracking-widest uppercase flex items-center gap-2">
          <span>👥</span> Historial de Detecciones
        </h3>
        <span className="text-xs font-mono bg-[--color-status-active] text-[--color-bg-primary] px-2 py-0.5 rounded-full font-bold">
          Total: {analyses.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {analyses.map((analysis, index) => {
          const date = analysis.timestamp ? new Date(analysis.timestamp) : new Date()
          const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
          const isSelected = index === selectedIndex

          return (
            <button
              key={analysis.timestamp || index}
              onClick={() => setSelectedIndex(index)}
              className={`text-xs px-3 py-1.5 rounded-md font-mono transition-colors border ${
                isSelected
                  ? 'bg-[--color-status-active] text-[--color-bg-primary] border-[--color-status-active]'
                  : 'bg-[--color-bg-secondary] text-[--color-text-secondary] border-[--color-border-subtle] hover:border-[--color-status-active] hover:text-[--color-status-active]'
              }`}
            >
              #{analyses.length - index} · {timeString}
            </button>
          )
        })}
      </div>

      {selectedAnalysis && (
        <div className="mt-2">
          <PersonAnalysisCard analysis={selectedAnalysis} />
        </div>
      )}
    </div>
  )
}
