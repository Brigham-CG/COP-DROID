import { useEffect, useRef } from 'react'
import type { EventLogEntry } from '../types'

interface EventLogProps {
  events: EventLogEntry[]
}

export function EventLog({ events }: EventLogProps) {
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [events.length])

  const fmtTime = (ts: number) => {
    const d = new Date(ts)
    return d.toLocaleTimeString('es-ES', { hour12: false })
  }

  return (
    <div
      className="rounded-md border border-[--color-border-subtle] bg-[--color-bg-secondary] flex flex-col"
      style={{ padding: '20px 24px', minHeight: 200 }}
    >
      <h2 className="text-[--color-text-secondary] text-xs font-semibold tracking-widest uppercase mb-3">
        Eventos
      </h2>
      <div ref={listRef} className="flex-1 overflow-y-auto space-y-0" style={{ maxHeight: 280 }}>
        {events.length === 0 && (
          <span className="text-[--color-text-tertiary] text-sm font-mono">
            Sin eventos recientes
          </span>
        )}
        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex gap-3 py-2 border-b border-[--color-divider] last:border-b-0 hover:bg-[--color-bg-tertiary] transition-colors rounded-sm px-1 -mx-1"
          >
            <span className="text-[--color-text-tertiary] font-mono text-xs shrink-0 w-16">
              {fmtTime(ev.timestamp)}
            </span>
            <span 
              className="text-[--color-text-primary] text-sm truncate hover:whitespace-normal hover:overflow-visible cursor-pointer"
              title={ev.message}
            >
              {ev.message}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
