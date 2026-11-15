import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { GlobeControls } from '../components/globe/GlobeControls'
import { PlanetaryGlobe, type Basemap, type LocationMetrics } from '../components/globe/PlanetaryGlobe'
import { StarfieldBackground } from '../components/StarfieldBackground'
import { formatCoordinate, type ExplorerLocation } from '../data/locations'
import { BODIES } from '../data/planetaryFeatures'
import type { Planet } from '../types'
import { LocationResults, type ResearchLocationResult } from '../components/researchLab/LocationResults'

type Props = {
  planet: Planet
  location: ExplorerLocation
  onLocationSelect: (location: ExplorerLocation) => void
  highContrast: boolean
  researchLocations: ResearchLocationResult[]
  onResearchLocationSelect: (location: ResearchLocationResult) => void
  onClearResearchLocations: () => void
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

function displayMetric(value: number | null, unit: string, status: LocationMetrics['status']) {
  if (status === 'loading') return 'Loading…'
  if (status === 'error') return 'Unavailable'
  return value === null ? '—' : `${value.toFixed(1)} ${unit}`
}

export function Overview({ planet, location, onLocationSelect, researchLocations, onResearchLocationSelect, onClearResearchLocations }: Props) {
  const mapRef = useRef<MapLibreMap | null>(null)
  const [searchParams] = useSearchParams()
  const [mapReady, setMapReady] = useState(false)
  const [grid, setGrid] = useState(false)
  const [basemap, setBasemap] = useState<Basemap>('satellite')
  const [bodyTilesLoading, setBodyTilesLoading] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [metrics, setMetrics] = useState<LocationMetrics>({ elevationMeters: null, slopeDegrees: null, terrainClass: null, status: 'loading' })
  const focusLat = searchParams.get('lat')
  const focusLng = searchParams.get('lng')

  useEffect(() => {
    if (!mapReady || focusLat == null || focusLng == null) return
    const lat = Number(focusLat)
    const lng = Number(focusLng)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 6, duration: 1100, essential: true })
  }, [mapReady, focusLat, focusLng])

  function handleMetricsChange(nextMetrics: LocationMetrics) {
    setMetrics(nextMetrics)
    setMapReady(true)
  }

  function changeBasemap(next: Basemap) {
    if (planet !== 'Earth' && next === 'street') return
    setBasemap(next)
  }

  function resetView() {
    const center = planet === 'Earth' ? [14, 20] as [number, number] : BODIES[planet].center
    mapRef.current?.flyTo({ center, zoom: 1.25, bearing: 0, pitch: 0, duration: 900, essential: true })
  }

  const metricsNote = planet === 'Earth'
    ? metrics.status === 'loading'
      ? 'Sampling Terrarium elevation tiles at the selected coordinates.'
      : metrics.status === 'error'
        ? 'Terrarium elevation tiles could not be reached. Retry by selecting the point again.'
        : 'Earth elevation from Terrarium tiles; slope is a local adjacent-pixel estimate, not a landform analysis.'
    : 'Elevation data is not connected for this body yet.'

  return (
    <>
      <section className="overview" aria-labelledby="overview-title">
        <StarfieldBackground />
        <div className="hero-ambient" aria-hidden="true" />
        <div className="planetary-stage" aria-label={`${planet} interactive globe`}>
          <div className="orbital-halo orbital-halo-one" aria-hidden="true" />
          <div className="orbital-halo orbital-halo-two" aria-hidden="true" />
          <PlanetaryGlobe
            planet={planet}
            location={location}
            basemap={basemap}
            grid={grid}
            onLocationSelect={onLocationSelect}
            onMetricsChange={handleMetricsChange}
            onBodyTilesLoading={setBodyTilesLoading}
            mapControlRef={mapRef}
          />
        </div>
        {bodyTilesLoading && planet !== 'Earth' && (
          <div className="globe-loading body-tiles-loading" role="status"><span className="loading-orbit" /> Loading {planet} surface</div>
        )}

        <div className="overview-content">
          <p className="eyebrow"><span className="eyebrow-mark">●</span> PLANETARY EXPLORATION <span className="eyebrow-version">/ v1.0</span></p>
          <h1 id="overview-title"><span className="heading-primary">Explore worlds.</span><span>Discover</span><span>connections.</span></h1>
          <p className="overview-copy">A scientific workspace for planetary terrain, Earth analog research, and the evidence that connects them.</p>
          <div className="overview-actions">
            <Link className="button-primary" to="/explore">START EXPLORING <span aria-hidden="true">↗</span></Link>
            <button className="button-secondary" type="button" aria-expanded={aboutOpen} onClick={() => setAboutOpen((value) => !value)}>{aboutOpen ? 'LESS' : 'LEARN MORE'} <span aria-hidden="true">{aboutOpen ? '−' : '+'}</span></button>
          </div>
          {aboutOpen && <p className="learn-more-copy">Explore planetary imagery, inspect coordinates, and switch between Earth, the Moon, and Mars. Earth elevations are sampled from Terrarium; other scientific analysis datasets are not connected yet.</p>}
        </div>

        <GlobeControls
          planet={planet}
          onZoomIn={() => mapRef.current?.zoomIn({ duration: 250 })}
          onZoomOut={() => mapRef.current?.zoomOut({ duration: 250 })}
          onReset={resetView}
          onResetRotation={() => mapRef.current?.easeTo({ bearing: 0, pitch: 0, duration: 450 })}
          grid={grid}
          onGridChange={setGrid}
          basemap={basemap}
          onBasemapChange={changeBasemap}
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
              <span>{location.body.toUpperCase()} <i>·</i> {(metrics.terrainClass ?? location.terrain).toUpperCase()}</span>
              <small>{location.description}</small>
            </div>
          </div>
          <div className="coordinate-row"><span>COORDINATES</span><b>{formatCoordinate(location.latitude, 'latitude')} / {formatCoordinate(location.longitude, 'longitude')}</b></div>
          <div className="location-metrics">
            <div><span>ELEVATION</span><b>{planet === 'Earth' ? displayMetric(metrics.elevationMeters, 'm', metrics.status) : '—'}</b></div>
            <div><span>SLOPE</span><b>{planet === 'Earth' ? displayMetric(metrics.slopeDegrees, '°', metrics.status) : '—'}</b></div>
            <div><span>TERRAIN CLASS</span><b>{metrics.terrainClass ?? (metrics.status === 'loading' ? 'Loading…' : location.terrain)}</b></div>
          </div>
          <p className="location-disclaimer">{metricsNote}</p>
          {location.researchEvidence && <div className="location-research-evidence"><span>SOURCE EVIDENCE</span><blockquote>“{location.researchEvidence.quote}”</blockquote><small>{location.researchEvidence.documentTitle}{location.researchEvidence.page != null ? ` Â· PAGE ${location.researchEvidence.page}` : ''}</small></div>}
        </aside>

        {researchLocations.length > 0 && <div className="overview-research-locations"><LocationResults locations={researchLocations} onSelect={onResearchLocationSelect} onClear={onClearResearchLocations} compact />
        </div>}

        <div className="hero-metadata" aria-hidden="true"><span>INTERACTIVE SURFACE VIEW</span><span>DRAG TO ROTATE <i>·</i> SCROLL TO ZOOM</span></div>
      </section>
    </>
  )
}
