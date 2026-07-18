interface HeaderProps {
  connected: boolean
  cameraCount: number
}

export function Header({ connected, cameraCount }: HeaderProps) {
  return (
    <header
      className="flex items-center px-8 border-b select-none"
      style={{
        paddingTop: 18,
        paddingBottom: 18,
        borderColor: 'var(--color-divider)',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="w-8 h-8 rounded flex items-center justify-center font-mono text-sm font-medium tracking-tight"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border-subtle)',
            color: 'var(--color-accent-amber)',
          }}
        >
          CD
        </div>
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-[--color-text-primary]">
            COP-DROID
          </h1>
          <span className="text-xs text-[--color-text-tertiary] tracking-wide">
            Autonomous Surveillance 24/7
          </span>
        </div>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <span className="text-[--color-text-tertiary] font-mono text-xs">
          {cameraCount} cam{cameraCount !== 1 ? 's' : ''}
        </span>
        <span
          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full border"
          style={{
            borderColor: connected ? 'rgba(74, 222, 128, 0.3)' : 'var(--color-border-subtle)',
            color: connected ? 'var(--color-status-active)' : 'var(--color-text-tertiary)',
            backgroundColor: connected ? 'rgba(74, 222, 128, 0.08)' : 'transparent',
          }}
        >
          <span
            className="w-[5px] h-[5px] rounded-full"
            style={{
              backgroundColor: connected ? 'var(--color-status-active)' : 'var(--color-status-offline)',
            }}
          />
          {connected ? 'Connected' : 'Disconnected'}
        </span>
      </div>
    </header>
  )
}
