const BASE = import.meta.env.VITE_API_BASE ?? ''

interface VideoStreamProps {
  deviceId: string
}

export function VideoStream({ deviceId }: VideoStreamProps) {
  return (
    <img
      src={`${BASE}/video/${deviceId}`}
      alt={`Stream ${deviceId}`}
      className="w-full h-full object-contain"
      loading="lazy"
    />
  )
}
