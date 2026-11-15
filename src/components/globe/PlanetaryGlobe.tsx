import { useEffect, useRef, type MutableRefObject } from 'react'
import maplibregl, { type Map as MapLibreMap, type RasterSourceSpecification } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ExplorerLocation } from '../../data/locations'
import { BODIES, nearestPlanetaryFeature } from '../../data/planetaryFeatures'
import type { Planet } from '../../types'

export type Basemap = 'satellite' | 'street' | 'terrain'

export type BodyTilesState = 'idle' | 'loading' | 'ready' | 'error'

type Props = {
  planet: Planet
  location: ExplorerLocation
  basemap: Basemap
  grid: boolean
  onLocationSelect: (location: ExplorerLocation) => void
  onBodyTilesState: (body: Planet, state: BodyTilesState) => void
  bodyRetryToken: number
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

export function PlanetaryGlobe({ planet, location, basemap, grid, onLocationSelect, onBodyTilesState, bodyRetryToken, mapControlRef }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MapLibreMap | null>(null)
  const mapLoadedRef = useRef(false)
  const gridRef = useRef(grid)
  const currentPlanetRef = useRef(planet)
  const currentLocationRef = useRef(location)
  const lastMapSelectionRef = useRef<string | null>(null)
  const pendingBodyLocationRef = useRef<string | null>(null)
  const previousPlanetRef = useRef<Planet>(planet)
  const transitionCleanupRef = useRef<(() => void) | null>(null)
  const loadedSourceIdsRef = useRef(new Set<string>())
  const basemapRef = useRef(basemap)
  const bodyStateCallbackRef = useRef(onBodyTilesState)
  const selectCallbackRef = useRef(onLocationSelect)

  currentPlanetRef.current = planet
  currentLocationRef.current = location
  basemapRef.current = basemap
  gridRef.current = grid
  bodyStateCallbackRef.current = onBodyTilesState
  selectCallbackRef.current = onLocationSelect

  function locationKey(next: ExplorerLocation) {
    return `${next.body}:${next.latitude.toFixed(6)}:${next.longitude.toFixed(6)}`
  }

  const transitionSequenceRef = useRef(0)
  const retryTokenRef = useRef(bodyRetryToken)

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
    const rememberLoadedSource = (event: maplibregl.MapSourceDataEvent) => {
      if (event.sourceDataType === 'content') loadedSourceIdsRef.current.add(event.sourceId)
    }
    map.on('sourcedata', rememberLoadedSource)
    map.on('load', () => {
      mapLoadedRef.current = true
      map.setProjection({ type: 'globe' })
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
        lastMapSelectionRef.current = `${next.body}:${next.latitude.toFixed(6)}:${next.longitude.toFixed(6)}`
        selectCallbackRef.current(next)
      })
      const initial = currentLocationRef.current
      previousPlanetRef.current = currentPlanetRef.current
      if (currentPlanetRef.current === 'Earth') {
        applyMapLayers(map, 'Earth', basemapRef.current)
        disposeInactivePlanetarySurfaces(map, 'Earth', loadedSourceIdsRef.current)
        bodyStateCallbackRef.current('Earth', 'ready')
      } else {
        pendingBodyLocationRef.current = locationKey(initial)
        map.setMaxZoom(BODIES[currentPlanetRef.current].tileMaxZoom + 1)
        map.setTerrain(null)
        map.setLayoutProperty('earth-hillshade-layer', 'visibility', 'none')
        const bodyAtLoad = currentPlanetRef.current
        ensurePlanetarySurface(map, bodyAtLoad)
        map.setSky({ 'sky-color': BODIES[bodyAtLoad].fogColor, 'horizon-color': BODIES[bodyAtLoad].highColor, 'sky-horizon-blend': 0.18, 'atmosphere-blend': 0.22 })
        map.flyTo({ center: BODIES[bodyAtLoad].center, zoom: 1.25, bearing: 0, pitch: 0, duration: 900, essential: true })
        const transitionId = ++transitionSequenceRef.current
        beginBodyLayerTransition(map, [`${bodyAtLoad.toLowerCase()}-surface`], transitionId, transitionSequenceRef, loadedSourceIdsRef.current, () => {
          applyMapLayers(map, bodyAtLoad, basemapRef.current)
          disposeInactivePlanetarySurfaces(map, bodyAtLoad, loadedSourceIdsRef.current)
        }, state => bodyStateCallbackRef.current(bodyAtLoad, state), cleanup => { transitionCleanupRef.current = cleanup })
      }
      map.setLayoutProperty('coordinate-grid', 'visibility', gridRef.current ? 'visible' : 'none')
    })
    map.on('error', (event) => {
      if (event.error?.message) console.warn('MapLibre tile/style error:', event.error.message)
    })

    return () => {
      // Invalidate pending tile waits before detaching listeners and disposing the shared map.
      ++transitionSequenceRef.current
      transitionCleanupRef.current?.()
      transitionCleanupRef.current = null
      map.off('sourcedata', rememberLoadedSource)
      map.remove()
      mapRef.current = null
      mapLoadedRef.current = false
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
    if (!map || !mapLoadedRef.current) return
    const bodyChanged = previousPlanetRef.current !== planet
    const shouldRetry = retryTokenRef.current !== bodyRetryToken
    retryTokenRef.current = bodyRetryToken
    previousPlanetRef.current = planet
    if (bodyChanged || shouldRetry) {
      ++transitionSequenceRef.current
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
      } else {
        pendingBodyLocationRef.current = locationKey(currentLocationRef.current)
        map.setMaxZoom(BODIES[planet].tileMaxZoom + 1)
        map.setTerrain(null)
        map.setLayoutProperty('earth-hillshade-layer', 'visibility', 'none')
        ensurePlanetarySurface(map, planet)
        map.setSky({ 'sky-color': BODIES[planet].fogColor, 'horizon-color': BODIES[planet].highColor, 'sky-horizon-blend': 0.18, 'atmosphere-blend': 0.22 })
      }
      const defaultCenter = planet === 'Earth' ? [14, 20] as [number, number] : BODIES[planet].center
      map.flyTo({ center: defaultCenter, zoom: 1.25, bearing: 0, pitch: 0, duration: 900, essential: true })

      if (shouldRetry && planet !== 'Earth') {
        const source = map.getSource(`${planet.toLowerCase()}-surface`) as maplibregl.RasterTileSource | undefined
        source?.setTiles([`${BODIES[planet].tileTemplate}?retry=${bodyRetryToken}`])
      }
      bodyStateCallbackRef.current(planet, 'idle')
      const transitionId = transitionSequenceRef.current
      beginBodyLayerTransition(map, target, transitionId, transitionSequenceRef, loadedSourceIdsRef.current, () => {
        applyMapLayers(map, planet, basemap)
        disposeInactivePlanetarySurfaces(map, planet, loadedSourceIdsRef.current)
      }, state => bodyStateCallbackRef.current(planet, state), cleanup => { transitionCleanupRef.current = cleanup })
      return
    }
    if (planet === 'Earth') applyMapLayers(map, planet, basemap)
  }, [planet, basemap, bodyRetryToken])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return
    map.setLayoutProperty('coordinate-grid', 'visibility', grid ? 'visible' : 'none')
  }, [grid])

  useEffect(() => {
    const map = mapRef.current
    if (!map || !mapLoadedRef.current) return
    const key = locationKey(location)
    const bodySwitchLocation = pendingBodyLocationRef.current === key
    if (bodySwitchLocation) {
      pendingBodyLocationRef.current = null
      if (location.name !== 'Surface view') {
        map.flyTo({ center: [location.longitude, location.latitude], zoom: 6, duration: 1100, essential: true })
      }
      return
    }
    if (lastMapSelectionRef.current === key) {
      lastMapSelectionRef.current = null
      return
    }
    map.flyTo({ center: [location.longitude, location.latitude], zoom: 6, duration: 1100, essential: true })
  }, [location, planet])

  return <div ref={containerRef} className="maplibre-globe" aria-label={`${planet} interactive MapLibre globe`} role="application" />
}

function applyMapLayers(map: MapLibreMap, planet: Planet, basemap: Basemap) {
  const ids = ['earth-satellite-layer', 'earth-street-layer', 'earth-topographic-layer', 'moon-surface-layer', 'mars-surface-layer']
  for (const id of ids) {
    if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', 'none')
  }
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

function ensurePlanetarySurface(map: MapLibreMap, body: 'Moon' | 'Mars') {
  const sourceId = `${body.toLowerCase()}-surface`
  const layerId = `${sourceId}-layer`
  if (!map.getSource(sourceId)) map.addSource(sourceId, planetaryRasterSource(body))
  if (!map.getLayer(layerId)) {
    map.addLayer({
      id: layerId,
      type: 'raster',
      source: sourceId,
      layout: { visibility: 'none' },
      paint: { 'raster-fade-duration': 0, 'raster-resampling': 'linear' },
    }, map.getLayer('coordinate-grid') ? 'coordinate-grid' : undefined)
  }
}

function disposeInactivePlanetarySurfaces(map: MapLibreMap, activeBody: Planet, loadedSourceIds: Set<string>) {
  for (const body of ['Moon', 'Mars'] as const) {
    if (activeBody === body) continue
    const sourceId = `${body.toLowerCase()}-surface`
    const layerId = `${sourceId}-layer`
    if (map.getLayer(layerId)) map.removeLayer(layerId)
    if (map.getSource(sourceId)) map.removeSource(sourceId)
    loadedSourceIds.delete(sourceId)
  }
}

function beginBodyLayerTransition(
  map: MapLibreMap,
  sourceIds: string[],
  transitionId: number,
  currentTransitionId: MutableRefObject<number>,
  loadedSourceIds: Set<string>,
  activateTarget: () => void,
  onStateChange: (state: BodyTilesState) => void,
  registerCleanup: (cleanup: () => void) => void,
) {
  const sourceSet = new Set(sourceIds)
  const targetLayerIds = sourceIds.map((sourceId) => sourceId === 'terrarium-dem' ? 'earth-hillshade-layer' : `${sourceId}-layer`)
  let cameraSettled = !map.isMoving()
  let sawIdle = false
  let settled = false
  let disposed = false

  for (const id of targetLayerIds) map.setLayoutProperty(id, 'visibility', 'visible')

  const cleanupListeners = () => {
    map.off('sourcedata', onSourceData)
    map.off('moveend', onMoveEnd)
    map.off('idle', onIdle)
    window.clearTimeout(loadingTimer)
    window.clearTimeout(timeoutTimer)
  }

  const finish = (state: 'ready' | 'error') => {
    if (settled) return
    settled = true
    cleanupListeners()
    if (disposed || transitionId !== currentTransitionId.current) return
    // Only the latest body transition may commit layers or loading state; stale tile events are ignored.
    activateTarget()
    onStateChange(state)
    registerCleanup(() => undefined)
  }

  const checkReady = () => {
    if (disposed || transitionId !== currentTransitionId.current) return
    if (cameraSettled && sawIdle && sourceIds.every((sourceId) => loadedSourceIds.has(sourceId) && map.isSourceLoaded(sourceId))) finish('ready')
  }
  const onSourceData = (event: maplibregl.MapSourceDataEvent) => {
    if (event.sourceId && sourceSet.has(event.sourceId) && event.sourceDataType === 'content') loadedSourceIds.add(event.sourceId)
    checkReady()
  }
  const onMoveEnd = () => {
    cameraSettled = true
    checkReady()
  }
  const onIdle = () => {
    sawIdle = true
    checkReady()
  }
  const loadingTimer = window.setTimeout(() => { if (!settled && !disposed && transitionId === currentTransitionId.current) onStateChange('loading') }, 300)
  const timeoutTimer = window.setTimeout(() => finish('error'), 20000)

  map.on('sourcedata', onSourceData)
  map.on('moveend', onMoveEnd)
  map.on('idle', onIdle)
  registerCleanup(() => {
    disposed = true
    cleanupListeners()
  })
  checkReady()
}
