import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Map as MapLibreMap } from 'maplibre-gl'
import { GlobeControls } from '../components/globe/GlobeControls'
import { PlanetaryGlobe, type Basemap, type BodyTilesState } from '../components/globe/PlanetaryGlobe'
import { StarfieldBackground } from '../components/StarfieldBackground'
import type { ExplorerLocation } from '../data/locations'
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

export function Overview({ planet, location, onLocationSelect, researchLocations, onResearchLocationSelect, onClearResearchLocations }: Props) {
  const mapRef = useRef<MapLibreMap | null>(null)
  const [searchParams] = useSearchParams()
  const [mapReady, setMapReady] = useState(false)
  const [grid, setGrid] = useState(false)
  const [basemap, setBasemap] = useState<Basemap>('satellite')
  const [bodyTiles, setBodyTiles] = useState<{ body: Planet; state: BodyTilesState }>({ body: 'Earth', state: 'idle' })
  const [bodyRetryToken, setBodyRetryToken] = useState(0)
  const [aboutOpen, setAboutOpen] = useState(false)
  const focusLat = searchParams.get('lat')
  const focusLng = searchParams.get('lng')

  useEffect(() => {
    if (!mapReady || focusLat == null || focusLng == null) return
    const lat = Number(focusLat)
    const lng = Number(focusLng)
    if (!Number.isFinite(lat) || lat < -90 || lat > 90 || !Number.isFinite(lng) || lng < -180 || lng > 180) return
    mapRef.current?.flyTo({ center: [lng, lat], zoom: 6, duration: 1100, essential: true })
  }, [mapReady, focusLat, focusLng])

  function changeBasemap(next: Basemap) {
    if (planet !== 'Earth' && next === 'street') return
    setBasemap(next)
  }

  function resetView() {
    const center = planet === 'Earth' ? [14, 20] as [number, number] : BODIES[planet].center
    mapRef.current?.flyTo({ center, zoom: 1.25, bearing: 0, pitch: 0, duration: 900, essential: true })
  }

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
            onBodyTilesState={(body, state) => { setBodyTiles({ body, state }); setMapReady(true) }}
            bodyRetryToken={bodyRetryToken}
            mapControlRef={mapRef}
          />
        </div>
        {bodyTiles.body === planet && bodyTiles.state === 'loading' && planet !== 'Earth' && (
          <div className="globe-loading body-tiles-loading" role="status"><span className="loading-orbit" /> Loading {planet} surface</div>
        )}
        {bodyTiles.body === planet && bodyTiles.state === 'error' && planet !== 'Earth' && (
          <div className="globe-loading body-tiles-loading body-tiles-error" role="status">{planet} surface is taking too long to load. <button type="button" onClick={() => setBodyRetryToken((value) => value + 1)}>Retry</button></div>
        )}

        <div className="overview-content">
          <p className="eyebrow"><span className="eyebrow-mark">●</span> PLANETARY EXPLORATION <span className="eyebrow-version">/ v1.0</span></p>
          <h1 id="overview-title"><span className="heading-primary">Explore worlds.</span><span>Discover</span><span>connections.</span></h1>
          <p className="overview-copy">A scientific workspace for planetary terrain, Earth analog research, and the evidence that connects them.</p>
          <div className="overview-actions">
            <span className="hero-cta-label">START EXPLORING</span>
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

        {researchLocations.length > 0 && <div className="overview-research-locations"><LocationResults locations={researchLocations} onSelect={onResearchLocationSelect} onClear={onClearResearchLocations} compact />
        </div>}

        <div className="hero-metadata" aria-hidden="true"><span>INTERACTIVE SURFACE VIEW</span><span>DRAG TO ROTATE <i>·</i> SCROLL TO ZOOM</span></div>
      </section>
    </>
  )
}
