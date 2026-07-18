import { useRef, useEffect, useState } from 'react'
import type { BoundingBox } from '../types'

const BASE = import.meta.env.VITE_API_BASE ?? ''

interface VideoStreamProps {
  deviceId: string
  bboxes?: BoundingBox[]
}

export function VideoStream({ deviceId, bboxes = [] }: VideoStreamProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState({ w: 640, h: 480 })

  useEffect(() => {
    const img = imgRef.current
    if (!img) return
    const onLoad = () => setNatural({ w: img.naturalWidth || 640, h: img.naturalHeight || 480 })
    img.addEventListener('load', onLoad)
    if (img.complete) onLoad()
    return () => img.removeEventListener('load', onLoad)
  }, [deviceId])

  return (
    <div className="relative bg-black w-full" style={{ aspectRatio: '4/3' }}>
      <img
        ref={imgRef}
        src={`${BASE}/video/${deviceId}`}
        alt={`Stream ${deviceId}`}
        className="w-full h-full object-contain"
        loading="lazy"
      />
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox={`0 0 ${natural.w} ${natural.h}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {bboxes.map((box, i) => (
          <g key={i}>
            <rect
              x={box.x}
              y={box.y}
              width={box.width}
              height={box.height}
              fill="transparent"
              stroke="var(--color-accent-white)"
              strokeWidth={1.5}
              rx={2}
            />
            <rect
              x={box.x}
              y={box.y - 16}
              width={box.width}
              height={16}
              fill="rgba(0,0,0,0.8)"
              rx={2}
            />
            <text
              x={box.x + 4}
              y={box.y - 4}
              fill="var(--color-accent-white)"
              fontSize={11}
              fontFamily="'JetBrains Mono', monospace"
              fontWeight={400}
            >
              {box.label} {Math.round(box.confidence * 100)}%
            </text>
          </g>
        ))}
      </svg>
      {bboxes.length === 0 && (
        <div
          className="absolute top-2 left-2 text-[10px] font-mono px-1.5 py-0.5 rounded"
          style={{
            backgroundColor: 'rgba(0,0,0,0.7)',
            color: 'var(--color-text-tertiary)',
          }}
        >
          NO DETECTIONS
        </div>
      )}
    </div>
  )
}
