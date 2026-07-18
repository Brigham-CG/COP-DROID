import type { CameraInfo } from '../types'
import { VideoStream } from './VideoStream'

interface DeviceCardProps {
  deviceId: string
  info: CameraInfo
}

export function DeviceCard({ deviceId, info }: DeviceCardProps) {
  return (
    <div className="bg-[#1a2235] border border-white/10 rounded-xl overflow-hidden flex flex-col">
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-white/10">
        <span className="text-sm font-semibold truncate">{deviceId}</span>
        <span className="ml-auto flex items-center gap-1.5 text-xs">
          <span
            className={`w-1.5 h-1.5 rounded-full ${info.online ? 'bg-[#22c55e] animate-pulse' : 'bg-[#ef4444]'}`}
          />
          <span>{info.online ? 'online' : 'offline'}</span>
        </span>
      </div>

      <div className="relative bg-black aspect-[4/3] flex items-center justify-center">
        {info.online ? (
          <VideoStream deviceId={deviceId} />
        ) : (
          <span className="text-[#64748b] text-sm">Sin conexión</span>
        )}
      </div>

      <div className="flex justify-between px-4 py-2.5 text-xs text-[#64748b] border-t border-white/10">
        <span>
          FPS: <b className="text-[#f1f5f9] tabular-nums">{info.fps ?? '-'}</b>
        </span>
        <span>
          Detecciones: <b className="text-[#f1f5f9] tabular-nums">{info.detections ?? '-'}</b>
        </span>
        <span>
          Visto: <b className="text-[#f1f5f9] tabular-nums">{info.last_seen_seconds_ago}s</b>
        </span>
      </div>
    </div>
  )
}
