import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  Activity,
  BatteryCharging,
  Camera,
  Check,
  ChevronRight,
  CirclePause,
  CirclePlay,
  Compass,
  Gauge,
  Map,
  Mountain,
  Orbit,
  Radio,
  RotateCcw,
  Route,
  ScanLine,
  ShieldCheck,
  Thermometer,
  TriangleAlert,
  Zap,
} from 'lucide-react'
import type { Planet } from '../types'
import { RoverSimulation } from './RoverSimulation'
import { calculateRoverResponse, formatMissionTime } from './simulationModel'
import { DEFAULT_TERRAIN, TERRAIN_BY_ID, TERRAIN_PROFILES } from './terrainProfiles'
import type { CameraMode, DriveMode, MissionEvent, RoverTelemetry, TerrainId } from './types'
import './digital-twin.css'

type Props = {
  planet: Planet
  onPlanetChange: (planet: Planet) => void
}

const INITIAL_TELEMETRY: RoverTelemetry = {
  speed: 0,
  slope: 0,
  pitch: 0,
  roll: 0,
  heading: 0,
  elevation: 1240,
  battery: 92,
  powerDraw: 145,
  motorTemperature: 28,
  distance: 0,
  routeProgress: 3.5,
  elapsedSeconds: 0,
}

const DRIVE_MODES: { id: DriveMode; label: string; caption: string }[] = [
  { id: 'precision', label: 'Precision', caption: '0.38 m/s' },
  { id: 'survey', label: 'Survey', caption: '0.68 m/s' },
  { id: 'traverse', label: 'Traverse', caption: '1.55 m/s' },
]

const CAMERA_MODES: { id: CameraMode; label: string; icon: typeof Orbit }[] = [
  { id: 'orbit', label: 'Free', icon: Orbit },
  { id: 'follow', label: 'Chase', icon: Camera },
  { id: 'top', label: 'Map', icon: Map },
]

function metric(value: number, digits = 1) {
  return Number.isFinite(value) ? value.toFixed(digits) : '—'
}

export default function DigitalTwinPage({ planet, onPlanetChange }: Props) {
  const [terrainId, setTerrainId] = useState<TerrainId>(DEFAULT_TERRAIN[planet])
  const initialProfile = TERRAIN_BY_ID[DEFAULT_TERRAIN[planet]]
  const [terrainHeight, setTerrainHeight] = useState(initialProfile.defaultHeight)
  const [temperature, setTemperature] = useState(initialProfile.defaultTemperature)
  const [driveMode, setDriveMode] = useState<DriveMode>('survey')
  const [cameraMode, setCameraMode] = useState<CameraMode>('orbit')
  const [running, setRunning] = useState(true)
  const [autonomy, setAutonomy] = useState(true)
  const [resetSignal, setResetSignal] = useState(0)
  const [telemetry, setTelemetry] = useState<RoverTelemetry>(INITIAL_TELEMETRY)
  const eventId = useRef(3)
  const telemetryRef = useRef(telemetry)
  telemetryRef.current = telemetry
  const [events, setEvents] = useState<MissionEvent[]>([
    { id: 3, time: 'T+00:00', message: 'Autonomous route RT-02 loaded and validated.', tone: 'success' },
    { id: 2, time: 'T+00:00', message: 'Mobility and thermal response models online.', tone: 'info' },
    { id: 1, time: 'T+00:00', message: 'Procedural terrain mesh initialized.', tone: 'info' },
  ])

  const profile = TERRAIN_BY_ID[terrainId]
  const response = useMemo(() => calculateRoverResponse({
    profile,
    temperature,
    terrainHeight,
    slope: telemetry.slope,
    mode: driveMode,
    autonomy,
    running,
  }), [autonomy, driveMode, profile, running, temperature, telemetry.slope, terrainHeight])

  const logEvent = useCallback((message: string, tone: MissionEvent['tone'] = 'info') => {
    eventId.current += 1
    const nextEvent: MissionEvent = {
      id: eventId.current,
      time: formatMissionTime(telemetryRef.current.elapsedSeconds),
      message,
      tone,
    }
    setEvents((current) => [nextEvent, ...current].slice(0, 5))
  }, [])

  useEffect(() => {
    const selectedProfile = TERRAIN_BY_ID[terrainId]
    if (selectedProfile.body === planet) return
    const nextProfile = TERRAIN_BY_ID[DEFAULT_TERRAIN[planet]]
    setTerrainId(nextProfile.id)
    setTerrainHeight(nextProfile.defaultHeight)
    setTemperature(nextProfile.defaultTemperature)
    logEvent(`${nextProfile.name} environment loaded from planetary selector.`)
  }, [logEvent, planet, terrainId])

  const previousResponse = useRef(response.code)
  useEffect(() => {
    if (previousResponse.current === response.code) return
    const isWarning = response.state === 'hold' || response.state === 'adapted'
    logEvent(`${response.label}: ${response.detail}`, isWarning ? 'warning' : 'success')
    previousResponse.current = response.code
  }, [logEvent, response.code, response.detail, response.label, response.state])

  const resetSimulation = useCallback(() => {
    setResetSignal((value) => value + 1)
    setTelemetry(INITIAL_TELEMETRY)
    setRunning(true)
    logEvent('Simulation state and rover route reset.', 'success')
  }, [logEvent])

  useEffect(() => {
    const handleKeyboard = (event: globalThis.KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target?.matches('input, select, textarea, button, a')) return
      if (event.repeat) return
      if (event.code === 'Space') {
        event.preventDefault()
        setRunning((value) => !value)
      } else if (event.key.toLowerCase() === 'r') {
        resetSimulation()
      } else if (event.key.toLowerCase() === 'c') {
        setCameraMode((current) => current === 'orbit' ? 'follow' : current === 'follow' ? 'top' : 'orbit')
      }
    }
    window.addEventListener('keydown', handleKeyboard)
    return () => window.removeEventListener('keydown', handleKeyboard)
  }, [resetSimulation])

  function selectTerrain(nextId: TerrainId) {
    const nextProfile = TERRAIN_BY_ID[nextId]
    setTerrainId(nextId)
    setTerrainHeight(nextProfile.defaultHeight)
    setTemperature(nextProfile.defaultTemperature)
    onPlanetChange(nextProfile.body)
    logEvent(`${nextProfile.name} profile loaded; controls set to reference conditions.`, 'success')
  }

  function selectDriveMode(nextMode: DriveMode) {
    setDriveMode(nextMode)
    const mode = DRIVE_MODES.find((item) => item.id === nextMode)
    logEvent(`${mode?.label ?? nextMode} drive law selected.`)
  }

  function toggleAutonomy() {
    setAutonomy((enabled) => {
      logEvent(`Autonomous protection ${enabled ? 'disabled' : 'enabled'}.`, enabled ? 'warning' : 'success')
      return !enabled
    })
  }

  const temperaturePercent = ((temperature + 160) / 240) * 100
  const batteryDegrees = `${clamp(telemetry.battery, 0, 100) * 3.6}deg`
  const pageStyle = { '--terrain-accent': profile.accentColor } as CSSProperties
  const batteryStyle = { '--battery-angle': batteryDegrees } as CSSProperties

  return (
    <section className="digital-twin-page" style={pageStyle} aria-labelledby="digital-twin-title">
      <header className="dt-intro">
        <div>
          <p className="dt-breadcrumb"><span>NEBULITH</span><ChevronRight /> OPERATIONS <ChevronRight /> DIGITAL TWIN</p>
          <h1 id="digital-twin-title">Rover mobility <span>digital twin.</span></h1>
        </div>
        <div className="dt-intro-meta" aria-label="Simulation status">
          <span><i className="dt-live-dot" /> SIMULATION LIVE</span>
          <span>MODEL DT–04</span>
          <span>{profile.body.toUpperCase()} / {profile.shortName.toUpperCase()}</span>
        </div>
      </header>

      <div className="dt-workbench">
        <aside className="dt-panel dt-environment-panel" aria-label="Environment controls">
          <div className="dt-panel-heading">
            <div><span>01</span><div><strong>Environment inputs</strong><small>MODEL PARAMETERS</small></div></div>
            <Mountain />
          </div>

          <div className="dt-control-section">
            <div className="dt-section-label"><span>TERRAIN PROFILE</span><b>04 AVAILABLE</b></div>
            <div className="dt-terrain-grid">
              {TERRAIN_PROFILES.map((terrainOption) => (
                <button
                  className={`dt-terrain-option terrain-${terrainOption.id}${terrainOption.id === terrainId ? ' selected' : ''}`}
                  type="button"
                  aria-pressed={terrainOption.id === terrainId}
                  key={terrainOption.id}
                  onClick={() => selectTerrain(terrainOption.id)}
                >
                  <span className="dt-terrain-preview"><i /><i /></span>
                  <span><strong>{terrainOption.shortName}</strong><small>{terrainOption.body}</small></span>
                  {terrainOption.id === terrainId && <Check aria-hidden="true" />}
                </button>
              ))}
            </div>
            <p className="dt-terrain-description">{profile.description}</p>
          </div>

          <div className="dt-control-section dt-range-section">
            <div className="dt-range-heading">
              <label htmlFor="terrain-height"><Mountain /> TERRAIN HEIGHT</label>
              <output htmlFor="terrain-height">{terrainHeight} <small>m</small></output>
            </div>
            <input
              id="terrain-height"
              type="range"
              min="6"
              max="68"
              step="1"
              value={terrainHeight}
              style={{ '--range-progress': `${((terrainHeight - 6) / 62) * 100}%` } as CSSProperties}
              onChange={(event) => setTerrainHeight(Number(event.target.value))}
              onPointerUp={() => logEvent(`Terrain vertical relief set to ${terrainHeight} m.`)}
              onBlur={() => logEvent(`Terrain vertical relief set to ${terrainHeight} m.`)}
            />
            <div className="dt-range-scale"><span>6 M / LOW</span><span>68 M / SEVERE</span></div>
            <p>Changes mesh relief, route grade, wheel load and autonomous slope response.</p>
          </div>

          <div className="dt-control-section dt-range-section">
            <div className="dt-range-heading">
              <label htmlFor="ambient-temperature"><Thermometer /> AMBIENT TEMPERATURE</label>
              <output htmlFor="ambient-temperature">{temperature > 0 ? '+' : ''}{temperature}<small>°C</small></output>
            </div>
            <div className="dt-temperature-track" aria-hidden="true"><i style={{ left: `${temperaturePercent}%` }} /></div>
            <input
              id="ambient-temperature"
              className="dt-temperature-range"
              type="range"
              min="-160"
              max="80"
              step="1"
              value={temperature}
              style={{ '--range-progress': `${temperaturePercent}%` } as CSSProperties}
              onChange={(event) => setTemperature(Number(event.target.value))}
              onPointerUp={() => logEvent(`Ambient model updated to ${temperature}°C.`)}
              onBlur={() => logEvent(`Ambient model updated to ${temperature}°C.`)}
            />
            <div className="dt-range-scale"><span>−160°C</span><span>+80°C</span></div>
            <p>Temperature changes heater load, battery demand and the safe drive envelope.</p>
          </div>

          <div className="dt-environment-summary">
            <div><span>TARGET BODY</span><b><i className={`planet-dot ${profile.body.toLowerCase()}`} />{profile.body}</b></div>
            <div><span>SUBSTRATE</span><b>{profile.surface}</b></div>
            <div><span>BASE TRACTION</span><b>{Math.round(profile.traction * 100)}%</b></div>
          </div>

          <button className={`dt-protection-toggle${autonomy ? ' enabled' : ''}`} type="button" role="switch" aria-checked={autonomy} onClick={toggleAutonomy}>
            <span><ShieldCheck /><span><strong>Autonomous protection</strong><small>Thermal, grade & traction holds</small></span></span>
            <i><b /></i>
          </button>
        </aside>

        <section className="dt-viewport-panel" aria-label="Three dimensional rover simulation">
          <div className="dt-viewport-toolbar">
            <div><span className="dt-live-dot" /><strong>LIVE TWIN</strong><i>RT–02 / AUTONOMOUS ROUTE</i></div>
            <div><Radio /><span>LINK 98%</span><b>{formatMissionTime(telemetry.elapsedSeconds)}</b></div>
          </div>

          <div className="dt-scene">
            <RoverSimulation
              terrain={profile}
              terrainHeight={terrainHeight}
              temperature={temperature}
              targetSpeed={response.targetSpeed}
              slipPercent={response.slipPercent}
              roverState={response.state}
              cameraMode={cameraMode}
              resetSignal={resetSignal}
              onTelemetry={setTelemetry}
            />

            <div className="dt-scene-scanlines" aria-hidden="true" />
            <div className="dt-scene-readout dt-readout-left" aria-hidden="true">
              <span>ALT <b>{metric(telemetry.elevation, 1)} M</b></span>
              <span>HDG <b>{metric(telemetry.heading, 0).padStart(3, '0')}°</b></span>
              <span>VEL <b>{metric(telemetry.speed, 2)} M/S</b></span>
            </div>
            <div className="dt-scene-readout dt-readout-right" aria-hidden="true">
              <span>PROCEDURAL MESH</span>
              <b>{terrainHeight} M RELIEF / {temperature}°C</b>
            </div>

            <div className={`dt-response-pill is-${response.state}`} role="status" aria-live="polite">
              {response.state === 'hold' ? <TriangleAlert /> : response.state === 'nominal' ? <Check /> : <Activity />}
              <span><small>ROVER RESPONSE</small><strong>{response.label}</strong></span>
            </div>

            <div className="dt-target-reticle" aria-hidden="true"><i /><i /><span /></div>
            <div className="dt-compass" aria-hidden="true" style={{ transform: `rotate(${-telemetry.heading}deg)` }}><b>N</b><i /><span /></div>
            <div className="dt-scale-marker" aria-hidden="true"><i /><span>20 M</span></div>
            <div className="dt-canvas-help">DRAG TO ORBIT <i>·</i> SCROLL TO ZOOM <i>·</i> C CAMERA</div>
          </div>

          <div className="dt-transport">
            <button className={`dt-play-button${running ? ' running' : ''}`} type="button" onClick={() => setRunning((value) => !value)}>
              {running ? <CirclePause /> : <CirclePlay />}
              <span><small>{running ? 'SIMULATION RUNNING' : 'SIMULATION PAUSED'}</small><strong>{running ? 'PAUSE DRIVE' : 'RESUME DRIVE'}</strong></span>
            </button>

            <div className="dt-control-group dt-drive-modes" role="group" aria-label="Drive mode">
              <span>DRIVE LAW</span>
              <div>{DRIVE_MODES.map((mode) => (
                <button className={mode.id === driveMode ? 'selected' : ''} type="button" aria-pressed={mode.id === driveMode} key={mode.id} onClick={() => selectDriveMode(mode.id)}>
                  {mode.label}<small>{mode.caption}</small>
                </button>
              ))}</div>
            </div>

            <div className="dt-control-group dt-camera-modes" role="group" aria-label="Camera mode">
              <span>CAMERA</span>
              <div>{CAMERA_MODES.map((mode) => {
                const Icon = mode.icon
                return <button className={mode.id === cameraMode ? 'selected' : ''} type="button" aria-pressed={mode.id === cameraMode} aria-label={`${mode.label} camera`} key={mode.id} onClick={() => setCameraMode(mode.id)}><Icon /><small>{mode.label}</small></button>
              })}</div>
            </div>

            <button className="dt-reset-button" type="button" onClick={resetSimulation}><RotateCcw /><span>RESET<small>R KEY</small></span></button>
          </div>
        </section>

        <aside className="dt-panel dt-telemetry-panel" aria-label="Rover telemetry">
          <div className="dt-panel-heading">
            <div><span>02</span><div><strong>Rover telemetry</strong><small>NEB–R6 / LIVE</small></div></div>
            <ScanLine />
          </div>

          <div className={`dt-status-card is-${response.state}`}>
            <div className="dt-status-icon">{response.state === 'hold' ? <TriangleAlert /> : response.state === 'nominal' ? <ShieldCheck /> : <Gauge />}</div>
            <div><small>SYSTEM RESPONSE</small><strong>{response.label}</strong><p>{response.detail}</p></div>
          </div>

          <div className="dt-energy-block">
            <div className="dt-battery-dial" style={batteryStyle}>
              <div><BatteryCharging /><strong>{metric(telemetry.battery, 0)}<small>%</small></strong><span>BATTERY</span></div>
            </div>
            <div className="dt-energy-stats">
              <div><span>POWER DRAW</span><b>{metric(telemetry.powerDraw, 0)} W</b></div>
              <div><span>MOTOR TEMP</span><b>{metric(telemetry.motorTemperature, 1)}°C</b></div>
              <div><span>THERMAL LOAD</span><b>{metric(response.thermalLoadPercent, 0)}%</b></div>
            </div>
          </div>

          <div className="dt-telemetry-grid">
            <div><span><Gauge /> VELOCITY</span><b>{metric(telemetry.speed, 2)}<small>m/s</small></b></div>
            <div><span><Mountain /> LOCAL SLOPE</span><b>{metric(telemetry.slope, 1)}<small>deg</small></b></div>
            <div><span><Compass /> PITCH / ROLL</span><b>{metric(telemetry.pitch, 1)}° <i>/</i> {metric(telemetry.roll, 1)}°</b></div>
            <div><span><Route /> DISTANCE</span><b>{metric(telemetry.distance, 1)}<small>m</small></b></div>
          </div>

          <div className="dt-mobility-bars">
            <div className="dt-section-label"><span>MOBILITY ESTIMATE</span><b>LIVE MODEL</b></div>
            <div><span>AVAILABLE TRACTION <b>{metric(response.tractionPercent, 0)}%</b></span><i><b style={{ width: `${response.tractionPercent}%` }} /></i></div>
            <div className={response.slipPercent > 50 ? 'warning' : ''}><span>PREDICTED WHEEL SLIP <b>{metric(response.slipPercent, 0)}%</b></span><i><b style={{ width: `${response.slipPercent}%` }} /></i></div>
            <div><span>ROUTE COMPLETION <b>{metric(telemetry.routeProgress, 0)}%</b></span><i><b style={{ width: `${telemetry.routeProgress}%` }} /></i></div>
          </div>

          <div className="dt-active-protocols">
            <div className="dt-section-label"><span>ACTIVE PROTOCOLS</span><b>{response.flags.length.toString().padStart(2, '0')}</b></div>
            <div>{response.flags.length
              ? response.flags.map((flag) => <span key={flag}><Zap />{flag}</span>)
              : <span className="nominal"><Check />STANDARD MOBILITY</span>}
            </div>
          </div>

          <div className="dt-health-list">
            <div><span><i /> SIX-WHEEL DRIVE</span><b>ONLINE</b></div>
            <div><span><i /> NAVIGATION LIDAR</span><b>TRACKING</b></div>
            <div><span><i /> UHF TELEMETRY</span><b>98%</b></div>
          </div>
        </aside>
      </div>

      <div className="dt-lower-deck">
        <section className="dt-event-log" aria-labelledby="mission-events-title">
          <div className="dt-lower-heading"><div><Activity /><span><strong id="mission-events-title">Mission events</strong><small>AUTONOMOUS SYSTEM LOG</small></span></div><b>{events.length.toString().padStart(2, '0')} ENTRIES</b></div>
          <div>{events.map((event) => (
            <div className={`dt-event is-${event.tone}`} key={event.id}><span>{event.time}</span><i /><p>{event.message}</p></div>
          ))}</div>
        </section>
        <aside className="dt-model-note">
          <div className="dt-lower-heading"><div><ShieldCheck /><span><strong>Model boundary</strong><small>ENGINEERING DEMONSTRATOR</small></span></div></div>
          <p>Terrain, temperatures and telemetry in this workspace are deterministic simulation outputs. They demonstrate rover response logic and are not measured surface data or mission safety certification.</p>
          <div><span>HEIGHTFIELD</span><b>PROCEDURAL v1.0</b><span>CONTROL LOOP</span><b>LOCAL / 120 MS</b></div>
        </aside>
      </div>
    </section>
  )
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value))
}
