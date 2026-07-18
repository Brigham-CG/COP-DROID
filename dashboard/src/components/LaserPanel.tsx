import type { LaserInfo } from '../types'

interface LaserPanelProps {
  laser: LaserInfo | null
}

export function LaserPanel({ laser }: LaserPanelProps) {
  const connected = laser?.connected ?? false
  const isOn = laser?.is_on ?? false
  const clients = laser?.clients ?? []

  return (
    <div className="bg-[#1a2235] border border-white/10 rounded-xl flex flex-row items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <span
          className="text-2xl transition-all duration-300"
          style={{
            filter: isOn ? 'none' : 'grayscale(1) opacity(0.5)',
            textShadow: isOn ? '0 0 10px red' : 'none',
          }}
        >
          🔴
        </span>
        <strong className="text-[#3b82f6] text-base">Módulo Láser</strong>
        <span className="text-xs text-[#64748b]">
          {connected ? clients.join(', ') : 'Buscando...'}
        </span>
      </div>

      <span
        className="text-xs font-medium px-3 py-1 rounded-full border transition-colors"
        style={
          connected
            ? {
                color: '#22c55e',
                borderColor: 'rgba(34, 197, 94, 0.3)',
                background: 'rgba(34, 197, 94, 0.12)',
              }
            : {
                color: '#64748b',
                borderColor: 'rgba(255,255,255,0.07)',
                background: 'transparent',
              }
        }
      >
        {connected ? 'Conectado' : 'Desconectado'}
      </span>
    </div>
  )
}
