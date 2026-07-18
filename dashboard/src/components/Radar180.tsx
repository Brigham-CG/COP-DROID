import type { RadarTarget } from '../types'

interface Radar180Props {
  targets?: RadarTarget[]
}

export function Radar180({ targets = [] }: Radar180Props) {
  const cx = 160, cy = 160, r = 140

  const polarToCart = (angleDeg: number, dist: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    const x = cx + dist * Math.cos(rad)
    const y = cy + dist * Math.sin(rad)
    return { x, y }
  }

  const arcPath = (radius: number) => {
    const start = polarToCart(0, radius)
    const end = polarToCart(180, radius)
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 0 1 ${end.x} ${end.y}`
  }

  return (
    <div
      className="rounded-md border border-[--color-border-subtle] bg-[--color-bg-secondary]"
      style={{ padding: '16px' }}
    >
      <h2 className="text-[--color-text-secondary] text-xs font-semibold tracking-widest uppercase mb-3">
        Radar 180°
      </h2>
      <svg viewBox="0 0 320 200" className="w-full" style={{ maxHeight: 180 }}>
        <defs>
          <linearGradient id="sweep-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent-amber)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--color-accent-amber)" stopOpacity="0" />
          </linearGradient>
          <clipPath id="semi-clip">
            <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`} />
          </clipPath>
        </defs>

        <path d={arcPath(r)} fill="none" stroke="var(--color-border-medium)" strokeWidth="0.5" />
        <path d={arcPath(r * 0.66)} fill="none" stroke="var(--color-border-medium)" strokeWidth="0.5" />
        <path d={arcPath(r * 0.33)} fill="none" stroke="var(--color-border-medium)" strokeWidth="0.5" />

        <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="var(--color-border-medium)" strokeWidth="0.5" />
        <line x1={cx} y1={cy} x2={cx - r * 0.5} y2={cy - r * 0.866} stroke="var(--color-border-medium)" strokeWidth="0.5" />
        <line x1={cx} y1={cy} x2={cx + r * 0.5} y2={cy - r * 0.866} stroke="var(--color-border-medium)" strokeWidth="0.5" />

        <g clipPath="url(#semi-clip)">
          <polygon
            points={`${cx},${cy} ${cx + 160},${cy} ${cx - 160},${cy}`}
            fill="url(#sweep-grad)"
            style={{ animation: 'radar-sweep 4s ease-in-out infinite', transformOrigin: `${cx}px ${cy}px` }}
          />
        </g>

        {targets.map((t, i) => {
          const pos = polarToCart(t.angle, (t.distance / 100) * r)
          const opacity = 0.4 + t.confidence * 0.6
          return (
            <g key={i}>
              <circle cx={pos.x} cy={pos.y} r={4} fill="var(--color-accent-white)" opacity={opacity} />
              <circle
                cx={pos.x}
                cy={pos.y}
                r={8}
                fill="none"
                stroke="var(--color-accent-white)"
                strokeWidth="0.5"
                opacity={opacity * 0.3}
              />
            </g>
          )
        })}

        <circle cx={cx} cy={cy} r={3} fill="var(--color-accent-amber)" />
      </svg>
    </div>
  )
}
