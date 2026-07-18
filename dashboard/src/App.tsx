import { useDevices } from './hooks/useDevices'
import { Header } from './components/Header'
import { DeviceCard } from './components/DeviceCard'
import { Radar180 } from './components/Radar180'
import { EventLog } from './components/EventLog'
import { PersonHistory } from './components/PersonHistory'

export default function App() {
  const { devices, error } = useDevices(2000)

  const cameras = devices?.cameras ?? {}
  const laser = devices?.laser ?? null
  const ids = Object.keys(cameras)
  const bboxes = devices?.bboxes ?? {}
  const radarTargets = devices?.radar_targets ?? []
  const status = devices?.status ?? null
  const events = devices?.events ?? []
  const personAnalyses = devices?.person_analyses ?? []

  const hasSomeOnline = ids.some((id) => cameras[id]?.online)
  const primaryId = ids.find((id) => cameras[id]?.online) ?? ids[0]

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <Header connected={hasSomeOnline} cameraCount={ids.length} />

      <main
        className="flex-1 w-full"
        style={{ padding: '16px', maxWidth: 1440, margin: '0 auto' }}
      >
        {error && (
          <div
            className="text-center text-xs font-mono py-3 rounded-md border mb-4"
            style={{
              color: 'var(--color-status-alert)',
              borderColor: 'rgba(245, 158, 11, 0.2)',
              backgroundColor: 'rgba(245, 158, 11, 0.06)',
            }}
          >
            {error}
          </div>
        )}

        {ids.length === 0 && !error && (
          <div className="text-center py-20 text-sm font-mono" style={{ color: 'var(--color-text-tertiary)' }}>
            AWAITING ESP32-CAM CONNECTION…
          </div>
        )}

        {/* Two-column layout */}
        <div className="grid gap-4 lg:grid-cols-[1fr_450px]">
          {/* Left column: radar + camera(s) */}
          <div className="flex flex-col gap-4">
            <Radar180 targets={radarTargets} />

            {primaryId && (
              <DeviceCard
                key={primaryId}
                deviceId={primaryId}
                info={cameras[primaryId]}
                bboxes={bboxes[primaryId]}
              />
            )}

            {ids.length > 1 && (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(ids.length - 1, 2)}, 1fr)` }}>
                {ids.filter((id) => id !== primaryId).map((id) => (
                  <DeviceCard key={id} deviceId={id} info={cameras[id]} bboxes={bboxes[id]} />
                ))}
              </div>
            )}
          </div>

          {/* Right column: status panel & analysis history */}
          <div className="flex flex-col gap-4">
            <EventLog events={events} />

            <PersonHistory analyses={personAnalyses} />

            <div className="text-center text-[--color-text-tertiary] text-xs font-mono py-3 border-t mt-auto" style={{ borderColor: 'var(--color-divider)' }}>
              ESP32-CAM · YOLOv8 · FastAPI
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
