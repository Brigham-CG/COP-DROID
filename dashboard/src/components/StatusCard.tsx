interface StatusCardProps {
  label: string
  value: string
  unit?: string
  dotColor?: string
}

export function StatusCard({ label, value, unit, dotColor }: StatusCardProps) {
  return (
    <div className="rounded-md border border-[--color-border-subtle] bg-[--color-bg-secondary] flex items-center justify-between"
      style={{ padding: '20px 24px' }}
    >
      <div className="flex flex-col gap-1">
        <span className="text-[--color-text-secondary] text-xs font-semibold tracking-widest uppercase">
          {label}
        </span>
        <span className="text-[--color-text-primary] font-mono text-2xl font-medium tracking-tight">
          {value}
          {unit && <span className="text-[--color-text-tertiary] text-sm ml-1">{unit}</span>}
        </span>
      </div>
      {dotColor && (
        <span
          className="w-[6px] h-[6px] rounded-full shrink-0"
          style={{ backgroundColor: dotColor }}
        />
      )}
    </div>
  )
}
