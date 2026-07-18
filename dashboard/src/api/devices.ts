import type { DevicesResponse } from '../types'

const BASE = import.meta.env.VITE_API_BASE ?? ''

export async function fetchDevices(): Promise<DevicesResponse> {
  const res = await fetch(`${BASE}/devices`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}
