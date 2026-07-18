import type { LaserInfo } from '../types'

interface LaserPanelProps {
  laser: LaserInfo | null
}

export function LaserPanel({ laser }: LaserPanelProps) {
  const isOn = laser?.is_on ?? false
  const connected = laser?.connected ?? false

  const offStyle: React.CSSProperties = {
    borderColor: 'var(--color-border-subtle)',
    color: 'var(--color-text-tertiary)',
    backgroundColor: 'transparent',
  }

  const onStyle: React.CSSProperties = {
    borderColor: 'var(--color-status-critical)',
    color: 'var(--color-status-critical)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-medium transition-colors"
      style={isOn && connected ? onStyle : offStyle}
    >
      <span
        className="w-[5px] h-[5px] rounded-full"
        style={{
          backgroundColor: isOn && connected ? 'var(--color-status-critical)' : 'var(--color-text-disabled)',
          animation: isOn && connected ? 'pulse-soft 2s ease-in-out infinite' : 'none',
        }}
      />
      LASER {isOn && connected ? 'ON' : 'OFF'}
    </div>
  )
}
