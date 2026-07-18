import type { CameraInfo, BoundingBox } from '../types'
import { VideoStream } from './VideoStream'

interface DeviceCardProps {
  deviceId: string
  info: CameraInfo
  bboxes?: BoundingBox[]
}

export function DeviceCard({ deviceId, info, bboxes }: DeviceCardProps) {
  return (
    <div
      className="rounded-md border border-[--color-border-subtle] bg-[--color-bg-secondary] overflow-hidden flex flex-col"
    >
      <div
        className="flex items-center gap-2.5 px-5 py-3 border-b"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <span className="text-sm font-medium truncate text-[--color-text-primary]">{deviceId}</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs">
          <span
            className="w-[5px] h-[5px] rounded-full shrink-0"
            style={{
              backgroundColor: info.online ? 'var(--color-status-active)' : 'var(--color-status-offline)',
            }}
          />
          <span className="text-[--color-text-tertiary] font-mono">
            {info.online ? 'online' : 'offline'}
          </span>
        </span>
      </div>

      <div className="relative bg-black" style={{ aspectRatio: '4/3' }}>
        {info.online ? (
          <VideoStream deviceId={deviceId} bboxes={bboxes} />
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-[--color-text-tertiary] font-mono">
            OFFLINE
          </div>
        )}
      </div>

      <div
        className="flex justify-between px-5 py-2.5 text-xs border-t"
        style={{ borderColor: 'var(--color-divider)' }}
      >
        <span className="text-[--color-text-tertiary]">
          FPS{' '}
          <b className="text-[--color-text-primary] font-mono tabular-nums">{info.fps ?? '—'}</b>
        </span>
        <span className="text-[--color-text-tertiary]">
          DETECT{' '}
          <b className="text-[--color-text-primary] font-mono tabular-nums">{info.detections ?? '—'}</b>
        </span>
        <span className="text-[--color-text-tertiary]">
          SEEN{' '}
          <b className="text-[--color-text-primary] font-mono tabular-nums">
            {info.last_seen_seconds_ago}s
          </b>
        </span>
      </div>
    </div>
  )
}
