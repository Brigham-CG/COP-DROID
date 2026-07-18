import { useDevices } from './hooks/useDevices'
import { Header } from './components/Header'
import { LaserPanel } from './components/LaserPanel'
import { DeviceCard } from './components/DeviceCard'

export default function App() {
  const { devices, error } = useDevices(2000)

  const cameras = devices?.cameras ?? {}
  const laser = devices?.laser ?? null
  const ids = Object.keys(cameras)

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e]">
      <Header cameras={cameras} />

      <main className="flex-1 px-8 py-7 mx-auto w-full" style={{ maxWidth: '1400px' }}>
        <LaserPanel laser={laser} />

        {error && (
          <div className="text-center text-[#ef4444] text-sm py-4">{error}</div>
        )}

        {ids.length === 0 && !error && (
          <div className="text-center text-[#64748b] py-20 text-sm">
            Esperando conexión de dispositivos ESP32-CAM…
          </div>
        )}

        <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))' }}>
          {ids.map((id) => (
            <DeviceCard key={id} deviceId={id} info={cameras[id]} />
          ))}
        </div>
      </main>

      <footer className="text-center py-3.5 text-xs text-[#64748b] border-t border-white/10">
        ESP32-CAM · YOLOv8 · FastAPI · WebSocket &nbsp;|&nbsp; Multi-Device Push Architecture
      </footer>
    </div>
  )
}
