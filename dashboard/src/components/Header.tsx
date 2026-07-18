import type { CameraInfo } from '../types'

interface HeaderProps {
  cameras: Record<string, CameraInfo> | null
}

export function Header({ cameras }: HeaderProps) {
  const count = cameras ? Object.keys(cameras).length : 0

  return (
    <header className="flex items-center gap-3.5 px-8 py-[18px] bg-[#111827] border-b border-white/10">
      <div className="w-9 h-9 bg-gradient-to-br from-[#3b82f6] to-[#6366f1] rounded-xl flex items-center justify-center text-lg shrink-0">
        📷
      </div>
      <div>
        <h1 className="text-lg font-semibold tracking-tight">YOLO Vision · Multi-Cámara</h1>
        <span className="text-xs text-[#64748b]">ESP32-CAM · WebSocket Push Mode</span>
      </div>
      <div className="ml-auto flex items-center gap-1.5 bg-[rgba(59,130,246,0.12)] border border-[rgba(59,130,246,0.3)] text-[#3b82f6] px-3 py-1 rounded-full text-xs font-medium">
        {count} cámara{count !== 1 ? 's' : ''}
      </div>
    </header>
  )
}
