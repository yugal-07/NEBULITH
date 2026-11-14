import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { GlobeControls } from '../components/globe/GlobeControls'
import { StarfieldBackground } from '../components/StarfieldBackground'
import { formatCoordinate, type ExplorerLocation } from '../data/locations'
import type { Planet } from '../types'

const PlanetaryGlobe = lazy(() => import('../components/globe/PlanetaryGlobe').then((module) => ({ default: module.PlanetaryGlobe })))

type Props = {
  planet: Planet
  location: ExplorerLocation
  onLocationSelect: (location: ExplorerLocation) => void
  highContrast: boolean
}

function TerrainSketch() {
  return (
    <svg className="terrain-sketch" viewBox="0 0 170 112" role="img" aria-label="Illustrative terrain contour sketch">
      <defs>
        <linearGradient id="terrain-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9096ef" stopOpacity=".42" /><stop offset="1" stopColor="#2d3155" stopOpacity=".04" /></linearGradient>
        <pattern id="terrain-grid" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M 14 0 L 0 0 0 14" fill="none" stroke="#8b8bfe" strokeOpacity=".16" strokeWidth=".55" /></pattern>
      </defs>
      <rect width="170" height="112" fill="#10131d" />
      <rect width="170" height="112" fill="url(#terrain-grid)" />
      <path d="M0 82 21 74 36 81 54 59 66 65 83 37 98 52 116 29 127 44 143 32 170 51v61H0Z" fill="url(#terrain-fill)" />
      <path d="M0 82 21 74 36 81 54 59 66 65 83 37 98 52 116 29 127 44 143 32 170 51" fill="none" stroke="#afb3ff" strokeOpacity=".65" strokeWidth="1" />
      <path d="M-4 91c23-10 24 3 45-2s23-15 43-12 29 1 40-8 28 6 50-5M-2 100c21-8 29 3 48-1s26-13 44-9 30 1 44-8 28 5 39-1" fill="none" stroke="#8388d9" strokeOpacity=".46" strokeWidth=".7" />
      <circle cx="115" cy="31" r="2" fill="#c5c4ff" />
    </svg>
  )
}

export function Overview({ planet, location, onLocationSelect, highContrast }: Props) {
  const controlsRef = useRef<OrbitControlsImpl | null>(null)
  const focusFrame = useRef<number | null>(null)
  const [grid, setGrid] = useState(false)
  const [clouds, setClouds] = useState(true)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [globeReady, setGlobeReady] = useState(false)

  useEffect(() => {
    const timer = window.setTimeout(() => setGlobeReady(true), 180)
    return () => window.clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current)
    const controls = controlsRef.current
    if (!controls) return

    const latitude = location.latitude * Math.PI / 180
    const longitude = (location.longitude + 180) * Math.PI / 180
    const destination = {
      x: -Math.cos(latitude) * Math.cos(longitude) * 3.35,
      y: Math.sin(latitude) * 3.35,
      z: Math.cos(latitude) * Math.sin(longitude) * 3.35,
    }
    const start = controls.object.position.clone()
    const startedAt = performance.now()
    const animate = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / 720)
      const eased = 1 - (1 - progress) ** 3
      controls.object.position.set(
        start.x + (destination.x - start.x) * eased,
        start.y + (destination.y - start.y) * eased,
        start.z + (destination.z - start.z) * eased,
      )
      controls.update()
      if (progress < 1) focusFrame.current = requestAnimationFrame(animate)
      else focusFrame.current = null
    }
    focusFrame.current = requestAnimationFrame(animate)
    return () => { if (focusFrame.current !== null) cancelAnimationFrame(focusFrame.current) }
  }, [location])

  function zoom(amount: number) {
    const controls = controlsRef.current
    if (!controls) return
    const camera = controls.object
    camera.position.setLength(THREEClamp(camera.position.length() + amount, 2.35, 5.2))
    controls.update()
  }

  function resetCamera() {
    const controls = controlsRef.current
    if (!controls) return
    controls.reset()
    controls.object.position.set(0, .05, 3.35)
    controls.update()
  }

  function resetRotation() {
    const controls = controlsRef.current
    if (!controls) return
    const distance = controls.object.position.length()
    controls.object.position.set(0, .05, distance)
    controls.update()
  }

  return (
    <>
      <section className="overview" aria-labelledby="overview-title">
        <StarfieldBackground />
        <div className="hero-ambient" aria-hidden="true" />
        <div className="planetary-stage" aria-label={`${planet} interactive globe`}>
          <div className="orbital-halo orbital-halo-one" aria-hidden="true" />
          <div className="orbital-halo orbital-halo-two" aria-hidden="true" />
          {globeReady ? (
            <Suspense fallback={<div className="globe-boot"><span className="loading-orbit" />PREPARING INTERACTIVE SURFACE</div>}>
              <PlanetaryGlobe
                planet={planet}
                location={location}
                grid={grid}
                clouds={clouds}
                highContrast={highContrast}
                onLocationSelect={onLocationSelect}
                controlsRef={controlsRef}
              />
            </Suspense>
          ) : <div className="globe-boot"><span className="loading-orbit" />PREPARING INTERACTIVE SURFACE</div>}
        </div>

        <div className="overview-content">
          <p className="eyebrow"><span className="eyebrow-mark">●</span> PLANETARY EXPLORATION <span className="eyebrow-version">/ v1.0</span></p>
          <h1 id="overview-title"><span className="heading-primary">Explore worlds.</span><span>Discover</span><span>connections.</span></h1>
          <p className="overview-copy">A scientific workspace for planetary terrain, Earth analog research, and the evidence that connects them.</p>
          <div className="overview-actions">
            <Link className="button-primary" to="/explore">START EXPLORING <span aria-hidden="true">↗</span></Link>
            <button className="button-secondary" type="button" aria-expanded={aboutOpen} onClick={() => setAboutOpen((value) => !value)}>{aboutOpen ? 'LESS' : 'LEARN MORE'} <span aria-hidden="true">{aboutOpen ? '−' : '+'}</span></button>
          </div>
          {aboutOpen && <p className="learn-more-copy">Explore planetary surface maps, inspect coordinates and move between Earth, the Moon and Mars. Scientific analysis datasets are not connected yet.</p>}
        </div>

        <GlobeControls
          planet={planet}
          onZoomIn={() => zoom(-.45)}
          onZoomOut={() => zoom(.45)}
          onReset={resetCamera}
          onResetRotation={resetRotation}
          grid={grid}
          onGridChange={setGrid}
          clouds={clouds}
          onCloudsChange={setClouds}
        />

        <aside className="location-panel" aria-label="Selected location information">
          <div className="location-panel-heading">
            <div><span className="panel-kicker">SELECTED SURFACE LOCATION</span><h2>Location information</h2></div>
            <span className="demo-stamp">DEMO<br />MAP FOCUS</span>
          </div>
          <div className="location-summary">
            <div className="terrain-thumb"><TerrainSketch /><span>ILLUSTRATIVE</span></div>
            <div className="location-name-block">
              <strong>{location.name}</strong>
              <span>{location.body.toUpperCase()} <i>·</i> {location.terrain.toUpperCase()}</span>
              <small>{location.description}</small>
            </div>
          </div>
          <div className="coordinate-row"><span>COORDINATES</span><b>{formatCoordinate(location.latitude, 'latitude')} / {formatCoordinate(location.longitude, 'longitude')}</b></div>
          <div className="location-metrics">
            <div><span>ELEVATION</span><b>—</b></div>
            <div><span>SLOPE</span><b>—</b></div>
            <div><span>TERRAIN CLASS</span><b>{location.terrain}</b></div>
          </div>
          <p className="location-disclaimer">Elevation and slope datasets are not connected. Click the globe or use search to select a location.</p>
        </aside>

        <div className="hero-metadata" aria-hidden="true"><span>INTERACTIVE SURFACE VIEW</span><span>DRAG TO ROTATE <i>·</i> SCROLL TO ZOOM</span></div>
      </section>
    </>
  )
}

function THREEClamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
