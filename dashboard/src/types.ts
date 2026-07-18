export interface CameraInfo {
  online: boolean
  fps: number | null
  detections: number | null
  last_seen_seconds_ago: number
}

export interface LaserInfo {
  connected: boolean
  clients: string[]
  is_on: boolean
}

export interface BoundingBox {
  x: number
  y: number
  width: number
  height: number
  confidence: number
  label: string
}

export interface RadarTarget {
  angle: number
  distance: number
  confidence: number
}

export type PatrolMode = 'patrol' | 'alert' | 'action'

export interface RobotStatus {
  battery: number
  speed: number
  mode: PatrolMode
  connected: boolean
}

export interface EventLogEntry {
  id: string
  timestamp: number
  message: string
}

export interface DevicesResponse {
  cameras: Record<string, CameraInfo>
  laser: LaserInfo
  bboxes?: Record<string, BoundingBox[]>
  radar_targets?: RadarTarget[]
  status?: RobotStatus
  events?: EventLogEntry[]
}
