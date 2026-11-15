import { useEffect, useRef, type MutableRefObject } from 'react'
import maplibregl, { type Map as MapLibreMap, type RasterSourceSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ExplorerLocation } from '../../data/locations'
import { BODIES, nearestPlanetaryFeature } from '../../data/planetaryFeatures'
import type { Planet } from '../../types'

export type Basemap = 'satellite' | 'street' | 'terrain'

export type LocationMetrics = {
  elevationMeters: number | null
  slopeDegrees: number | null
  terrainClass: string | null
  status: 'loading' | 'available' | 'partial' | 'not_available' | 'not_supported' | 'error'
  source?: string
}

type Props = {
  planet: Planet
  location: ExplorerLocation
  basemap: Basemap
  grid: boolean
  onLocationSelect: (location: ExplorerLocation) => void
  onMetricsChange: (metrics: LocationMetrics) => void
  onBodyTilesLoading: (loading: boolean) => void
  mapControlRef: MutableRefObject<MapLibreMap | null>
}

const esriAttribution = 'Tiles © Esri — Sources: Esri, Maxar, Earthstar Geographics, and the GIS User Community'
const osmAttribution = '© OpenStreetMap contributors'

const rasterSource = (tiles: string[], attribution: string, maxzoom = 19): RasterSourceSpecification => ({
  type: 'raster',
  tiles,
  tileSize: 256,
  maxzoom,
  attribution,
})

const planetaryRasterSource = (body: 'Moon' | 'Mars'): RasterSourceSpecification => ({
  type: 'raster',
  tiles: [BODIES[body].tileTemplate],
  tileSize: 256,
  minzoom: 0,
  maxzoom: BODIES[body].tileMaxZoom,
  scheme: 'xyz',
  attribution: BODIES[body].attribution,
})

function gridFeatures() {
  const features: GeoJSON.Feature<GeoJSON.LineString>[] = []
  for (let lat = -75; lat <= 75; lat += 30) {
    const coordinates: GeoJSON.Position[] = []
    for (let lon = -180; lon <= 180; lon += 3) coordinates.push([lon, lat])
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } })
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const coordinates: GeoJSON.Position[] = []
    for (let lat = -85; lat <= 85; lat += 3) coordinates.push([lon, lat])
    features.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates } })
  }
  return { type: 'FeatureCollection' as const, features }
}

function markerElement() {
  const el = document.createElement('div')
  el.className = 'map-location-marker'
  el.setAttribute('role', 'img')
  el.setAttribute('aria-label', 'Selected map location')
  return el
}

export function PlanetaryGlobe({ planet, location, basemap, grid, onLocationSelect, onMetricsChange, onBodyTilesLoading, mapControlRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const currentPlanetRef = useRef(planet)
  const currentLocationRef = useRef(location)
  const lastMapSelectionRef = useRef<string | null>(null)
  const pendingBodyLocationRef = useRef<string | null>(null)
  const previousPlanetRef = useRef<Planet>(planet)
  const transitionCleanupRef = useRef<(() => void) | null>(null)
  const basemapRef = useRef(basemap)
  const metricsCallbackRef = useRef(onMetricsChange)
  const bodyLoadingCallbackRef = useRef(onBodyTilesLoading)
  const selectCallbackRef = useRef(onLocationSelect)

  currentPlanetRef.current = planet
  currentLocationRef.current = location
  basemapRef.current = basemap
  metricsCallbackRef.current = onMetricsChange
  bodyLoadingCallbackRef.current = onBodyTilesLoading
  selectCallbackRef.current = onLocationSelect

  function locationKey(next: ExplorerLocation) {
    return `${next.body}:${next.latitude.toFixed(6)}:${next.longitude.toFixed(6)}`
  }

  async function loadEarthMetrics(lon: number, lat: number) {
    metricsCallbackRef.current({ elevationMeters: null, slopeDegrees: null, terrainClass: null, status: 'loading', source: 'Terrarium elevation tiles' })
    try {
      const query = new URLSearchParams({ lon: String(lon), lat: String(lat) })
      const response = await fetch(`/api/v1/terrain/sample?${query}`)
      if (!response.ok) throw new Error(`Terrain sample failed: ${response.status}`)
      const result = await response.json() as { elevation_m: number | null; slope_degrees: number | null; terrain_class: string | null; coverage_status: string; source: string }
      metricsCallbackRef.current({
        elevationMeters: result.elevation_m,
        slopeDegrees: result.slope_degrees,
        terrainClass: result.terrain_class,
        status: result.coverage_status === 'available' ? 'available' : result.coverage_status === 'partial' ? 'partial' : 'not_available',
        source: result.source,
      })
    } catch {
      metricsCallbackRef.current({ elevationMeters: null, slopeDegrees: null, terrainClass: null, status: 'error', source: 'Terrarium elevation tiles' })
    }
  }

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'earth-satellite': rasterSource(['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], esriAttribution),
          'earth-street': rasterSource(['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], osmAttribution),
          'earth-topographic': rasterSource(['https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'], 'Tiles © Esri; Sources: Esri, HERE, Garmin, FAO, NOAA, USGS, EPA, and the GIS User Community'),
          'terrarium-dem': { type: 'raster-dem', tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'], tileSize: 256, maxzoom: 15, encoding: 'terrarium', attribution: 'Elevation tiles © AWS / Mapzen' },
          'moon-surface': planetaryRasterSource('Moon'),
          'mars-surface': planetaryRasterSource('Mars'),
          grid: { type: 'geojson', data: gridFeatures() },
        },
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#080b14' } },
          { id: 'earth-satellite-layer', type: 'raster', source: 'earth-satellite', layout: { visibility: 'visible' }, paint: { 'raster-fade-duration': 200 } },
          { id: 'earth-street-layer', type: 'raster', source: 'earth-street', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 200 } },
          { id: 'earth-topographic-layer', type: 'raster', source: 'earth-topographic', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 200 } },
          { id: 'earth-hillshade-layer', type: 'hillshade', source: 'terrarium-dem', layout: { visibility: 'none' }, paint: { 'hillshade-exaggeration': 0.45 } },
          { id: 'moon-surface-layer', type: 'raster', source: 'moon-surface', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0, 'raster-resampling': 'linear' } },
          { id: 'mars-surface-layer', type: 'raster', source: 'mars-surface', layout: { visibility: 'none' }, paint: { 'raster-fade-duration': 0, 'raster-resampling': 'linear' } },
          { id: 'coordinate-grid', type: 'line', source: 'grid', layout: { visibility: 'none' }, paint: { 'line-color': '#9392ff', 'line-width': 0.65, 'line-opacity': 0.33 } },
        ],
      },
      center: [14, 20],
      zoom: 1.25,
      minZoom: 0,
      maxZoom: 18,
      maxPitch: 60,
      renderWorldCopies: false,
      attributionControl: { compact: true },
      dragRotate: true,
      pitchWithRotate: true,
      scrollZoom: true,
      touchZoomRotate: true,
    })
    mapRef.current = map
    mapControlRef.current = map
    map.on('load', () => {
      map.setProjection({ type: 'globe' })
      markerRef.current = new maplibregl.Marker({ element: markerElement(), anchor: 'center' })
        .setLngLat([currentLocationRef.current.longitude, currentLocationRef.current.latitude])
        .addTo(map)
      map.on('click', (event) => {
        const selectedPlanet = currentPlanetRef.current
        const nearest = selectedPlanet === 'Earth' ? null : nearestPlanetaryFeature(selectedPlanet, event.lngLat.lat, event.lngLat.lng)
        const next: ExplorerLocation = selectedPlanet === 'Earth'
          ? {
              name: 'Selected coordinates',
              body: selectedPlanet,
              latitude: event.lngLat.lat,
              longitude: event.lngLat.lng,
              description: 'Point selected on the interactive surface map',
              terrain: 'Unclassified',
            }
          : {
              name: nearest?.name ?? 'Unnamed region',
              body: selectedPlanet,
              latitude: event.lngLat.lat,
              longitude: event.lngLat.lng,
              description: nearest?.description ?? 'No curated surface feature is nearby.',
              terrain: nearest?.terrain ?? 'Unclassified',
            }
        markerRef.current?.setLngLat([next.longitude, next.latitude]).addTo(map)
        lastMapSelectionRef.current = `${next.body}:${next.latitude.toFixed(6)}:${next.longitude.toFixed(6)}`
        selectCallbackRef.current(next)
        if (next.body === 'Earth') void loadEarthMetrics(next.longitude, next.latitude)
        else metricsCallbackRef.current({ elevationMeters: null, slopeDegrees: null, terrainClass: null, status: 'not_supported', source: 'Elevation data is not connected for this body yet' })
      })
      const initial = currentLocationRef.current
      if (currentPlanetRef.current === 'Earth') void loadEarthMetrics(initial.longitude, initial.latitude)
        previousPlanetRef.current = currentPlanetRef.current
        if (currentPlanetRef.current === 'Earth') {
          applyMapLayers(map, 'Earth', basemapRef.current)
        } else {
          pendingBodyLocationRef.current = locationKey(initial)
          markerRef.current.remove()
          map.setMaxZoom(BODIES[currentPlanetRef.current].tileMaxZoom + 1)
        map.setTerrain(null)
        map.setLayoutProperty('earth-hillshade-layer', 'visibility', 'none')
          map.setSky({ 'sky-color': BODIES[currentPlanetRef.current].fogColor, 'horizon-color': BODIES[currentPlanetRef.current].highColor, 'sky-horizon-blend': 0.18, 'atmosphere-blend': 0.22 })
          map.flyTo({ center: BODIES[currentPlanetRef.current].center, zoom: 1.25, duration: 900, essential: true })
          beginBodyLayerTransition(map, [`${currentPlanetRef.current.toLowerCase()}-surface`], () => applyMapLayers(map, currentPlanetRef.current, basemapRef.current), bodyLoadingCallbackRef.current, cleanup => { transitionCleanupRef.current = cleanup })
          metricsCallbackRef.current({ elevationMeters: null, slopeDegrees: null, terrainClass: null, status: 'not_supported', source: 'Elevation data is not connected for this body yet' })
        }
      map.setLayoutProperty('coordinate-grid', 'visibility', grid ? 'visible' : 'none')
    })
    map.on('error', (event) => {
      if (event.error?.message) console.warn('MapLibre tile/style error:', event.error.message)
    })

    return () => {
      markerRef.current?.remove()
      markerRef.current = null
      transitionCleanupRef.current?.()
      transitionCleanupRef.current = null
      map.remove()
      mapRef.current = null
      mapControlRef.current = null
    }
  // Initial map creation intentionally reads the first location from refs; prop updates are applied below.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    let cancelled = false
    const urls = Object.values(BODIES).flatMap((body) => {
      const bodyName = body.tileTemplate.includes('/moon/') ? 'moon' : 'mars'
      return [0, 1, 2].flatMap((zoom) => Array.from({ length: 2 ** zoom }, (_, x) =>
        Array.from({ length: 2 ** zoom }, (_, y) => `/tiles/${bodyName}/${zoom}/${x}/${y}.jpg`),
      ).flat())
    })
    const timer = window.setTimeout(() => {
      if (cancelled) return
      for (let index = 0; index < urls.length; index += 12) {
        const batch = urls.slice(index, index + 12)
        void Promise.all(batch.map((url) => fetch(url, { cache: 'force-cache' }).catch(() => undefined)))
      }
    }, 250)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    const bodyChanged = previousPlanetRef.current !== planet
    previousPlanetRef.current = planet
    if (bodyChanged) {
      transitionCleanupRef.current?.()
      transitionCleanupRef.current = null
      lastMapSelectionRef.current = null
      const target = planet === 'Earth'
        ? basemap === 'street' ? ['earth-street'] : basemap === 'terrain' ? ['earth-topographic', 'terrarium-dem'] : ['earth-satellite']
        : [`${planet.toLowerCase()}-surface`]

      if (planet === 'Earth') {
        pendingBodyLocationRef.current = locationKey(currentLocationRef.current)
        map.setMaxZoom(18)
        map.setSky({ 'sky-color': 'transparent', 'horizon-color': 'transparent', 'fog-color': 'transparent', 'fog-ground-blend': 1, 'atmosphere-blend': 0 })
        markerRef.current?.setLngLat([currentLocationRef.current.longitude, currentLocationRef.current.latitude]).addTo(map)
        map.flyTo({ center: [currentLocationRef.current.longitude, currentLocationRef.current.latitude], zoom: 6, duration: 1100, essential: true })
        void loadEarthMetrics(currentLocationRef.current.longitude, currentLocationRef.current.latitude)
      } else {
        pendingBodyLocationRef.current = locationKey(currentLocationRef.current)
        markerRef.current?.remove()
        map.setMaxZoom(BODIES[planet].tileMaxZoom + 1)
        map.setTerrain(null)
        map.setLayoutProperty('earth-hillshade-layer', 'visibility', 'none')
        map.setSky({ 'sky-color': BODIES[planet].fogColor, 'horizon-color': BODIES[planet].highColor, 'sky-horizon-blend': 0.18, 'atmosphere-blend': 0.22 })
        map.flyTo({ center: BODIES[planet].center, zoom: 1.25, duration: 900, essential: true })
        metricsCallbackRef.current({ elevationMeters: null, slopeDegrees: null, terrainClass: null, status: 'not_supported', source: 'Elevation data is not connected for this body yet' })
      }

      beginBodyLayerTransition(map, target, () => applyMapLayers(map, planet, basemap), bodyLoadingCallbackRef.current, cleanup => { transitionCleanupRef.current = cleanup })
      return
    }
    if (planet === 'Earth') applyMapLayers(map, planet, basemap)
  }, [planet, basemap])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    map.setLayoutProperty('coordinate-grid', 'visibility', grid ? 'visible' : 'none')
  }, [grid])

  useEffect(() => {
    const map = mapRef.current
    if (!map?.isStyleLoaded()) return
    const key = locationKey(location)
    const bodySwitchLocation = pendingBodyLocationRef.current === key
    if (planet === 'Earth' || !bodySwitchLocation) markerRef.current?.setLngLat([location.longitude, location.latitude]).addTo(map)
    if (bodySwitchLocation) {
      pendingBodyLocationRef.current = null
      if (location.researchEvidence) {
        markerRef.current?.setLngLat([location.longitude, location.latitude]).addTo(map)
        map.flyTo({ center: [location.longitude, location.latitude], zoom: 6, duration: 1100, essential: true })
      }
      return
    }
    if (lastMapSelectionRef.current === key) {
      lastMapSelectionRef.current = null
      return
    }
    map.flyTo({ center: [location.longitude, location.latitude], zoom: 6, duration: 1100, essential: true })
    if (planet === 'Earth') void loadEarthMetrics(location.longitude, location.latitude)
    else onMetricsChange({ elevationMeters: null, slopeDegrees: null, terrainClass: null, status: 'not_supported', source: 'Elevation data is not connected for this body yet' })
  }, [location, onMetricsChange, planet])

  return <div ref={containerRef} className="maplibre-globe" aria-label={`${planet} interactive MapLibre globe`} role="application" />
}

function applyMapLayers(map: MapLibreMap, planet: Planet, basemap: Basemap) {
  const ids = ['earth-satellite-layer', 'earth-street-layer', 'earth-topographic-layer', 'moon-surface-layer', 'mars-surface-layer']
  for (const id of ids) map.setLayoutProperty(id, 'visibility', 'none')
  if (planet === 'Earth') {
    const layer = basemap === 'street' ? 'earth-street-layer' : basemap === 'terrain' ? 'earth-topographic-layer' : 'earth-satellite-layer'
    map.setLayoutProperty(layer, 'visibility', 'visible')
    map.setLayoutProperty('earth-hillshade-layer', 'visibility', basemap === 'terrain' ? 'visible' : 'none')
    map.setTerrain(basemap === 'terrain' ? { source: 'terrarium-dem', exaggeration: 1.05 } : null)
  } else {
    map.setLayoutProperty('earth-hillshade-layer', 'visibility', 'none')
    map.setTerrain(null)
    map.setLayoutProperty(`${planet.toLowerCase()}-surface-layer`, 'visibility', 'visible')
  }
}

function beginBodyLayerTransition(
  map: MapLibreMap,
  sourceIds: string[],
  activateTarget: () => void,
  onLoadingChange: (loading: boolean) => void,
  registerCleanup: (cleanup: () => void) => void,
) {
  const sourceSet = new Set(sourceIds)
  const targetLayerIds = sourceIds.map((sourceId) => sourceId === 'terrarium-dem' ? 'earth-hillshade-layer' : `${sourceId}-layer`)
  let cameraSettled = !map.isMoving()
  let sawTileContent = false
  let settled = false

  for (const id of targetLayerIds) map.setLayoutProperty(id, 'visibility', 'visible')

  const cleanupListeners = () => {
    map.off('sourcedata', onSourceData)
    map.off('moveend', onMoveEnd)
    map.off('idle', onIdle)
    window.clearTimeout(loadingTimer)
    window.clearTimeout(timeoutTimer)
  }

  const finish = (success: boolean) => {
    if (settled) return
    settled = true
    cleanupListeners()
    if (success) activateTarget()
    else for (const id of targetLayerIds) map.setLayoutProperty(id, 'visibility', 'none')
    onLoadingChange(false)
    registerCleanup(() => undefined)
  }

  const checkReady = () => {
    if (cameraSettled && sawTileContent && sourceIds.every((sourceId) => map.isSourceLoaded(sourceId))) finish(true)
  }
  const onSourceData = (event: maplibregl.MapSourceDataEvent) => {
    if (event.sourceId && sourceSet.has(event.sourceId) && event.sourceDataType === 'content') sawTileContent = true
    checkReady()
  }
  const onMoveEnd = () => {
    cameraSettled = true
    checkReady()
  }
  const onIdle = () => checkReady()
  const loadingTimer = window.setTimeout(() => { if (!settled) onLoadingChange(true) }, 300)
  const timeoutTimer = window.setTimeout(() => finish(false), 20000)

  map.on('sourcedata', onSourceData)
  map.on('moveend', onMoveEnd)
  map.on('idle', onIdle)
  registerCleanup(() => finish(false))
  checkReady()
}
