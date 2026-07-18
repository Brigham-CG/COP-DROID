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

export interface DevicesResponse {
  cameras: Record<string, CameraInfo>
  laser: LaserInfo
}
