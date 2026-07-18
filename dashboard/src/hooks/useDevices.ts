import { useEffect, useState, useCallback, useRef } from 'react'
import type { DevicesResponse } from '../types'
import { fetchDevices } from '../api/devices'

interface UseDevicesResult {
  devices: DevicesResponse | null
  error: string | null
}

export function useDevices(pollMs = 2000): UseDevicesResult {
  const [devices, setDevices] = useState<DevicesResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const poll = useCallback(async () => {
    try {
      const data = await fetchDevices()
      setDevices(data)
      setError(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error')
    }
  }, [])

  useEffect(() => {
    poll()
    timerRef.current = setInterval(poll, pollMs)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [poll, pollMs])

  return { devices, error }
}
