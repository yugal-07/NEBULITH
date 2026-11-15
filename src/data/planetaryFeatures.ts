import type { ExplorerLocation } from './locations'
import type { Planet } from '../types'

export type LocalBody = Exclude<Planet, 'Earth'>

export type NamedSurfaceFeature = ExplorerLocation & { searchRadiusKm: number }

export const BODIES: Record<LocalBody, {
  center: [longitude: number, latitude: number]
  tileTemplate: string
  tileMaxZoom: number
  radiusKm: number
  attribution: string
  fogColor: string
  highColor: string
  features: NamedSurfaceFeature[]
}> = {
  Moon: {
    center: [23.4729, 0.6741],
    tileTemplate: '/tiles/moon/{z}/{x}/{y}.jpg',
    tileMaxZoom: 5,
    radiusKm: 1737.4,
    attribution: 'NASA SVS / LRO / LROC WAC; color map by Ernie Wright',
    fogColor: '#9295a2',
    highColor: '#c2c5d4',
    features: [
      { name: 'Tycho Crater', body: 'Moon', latitude: -43.31, longitude: -11.36, description: 'Bright-rayed southern impact crater with a prominent central peak.', terrain: 'Crater Highlands', searchRadiusKm: 220 },
      { name: 'Copernicus', body: 'Moon', latitude: 9.62, longitude: -20.08, description: 'Large young impact crater west of Mare Imbrium.', terrain: 'Impact Crater', searchRadiusKm: 160 },
      { name: 'Apollo 11 Site', body: 'Moon', latitude: 0.6741, longitude: 23.4729, description: 'The first crewed lunar landing site in southwestern Mare Tranquillitatis.', terrain: 'Lunar Mare', searchRadiusKm: 120 },
      { name: 'Mare Tranquillitatis', body: 'Moon', latitude: 8.5, longitude: 31.4, description: 'Broad basaltic plain that includes the Apollo 11 landing region.', terrain: 'Basaltic Plain', searchRadiusKm: 650 },
      { name: 'Shackleton Crater', body: 'Moon', latitude: -89.9, longitude: 0, description: 'Impact crater beside the lunar south pole.', terrain: 'Polar Crater', searchRadiusKm: 100 },
      { name: 'Mare Imbrium', body: 'Moon', latitude: 32.8, longitude: -15.6, description: 'Vast northern impact basin filled by ancient basaltic lava.', terrain: 'Basaltic Plain', searchRadiusKm: 850 },
      { name: 'South Pole-Aitken Basin', body: 'Moon', latitude: -53, longitude: 169, description: 'Ancient, immense impact basin across the lunar far-side south.', terrain: 'Impact Basin', searchRadiusKm: 1800 },
    ],
  },
  Mars: {
    center: [-59.2, -13.9],
    tileTemplate: '/tiles/mars/{z}/{x}/{y}.jpg',
    tileMaxZoom: 5,
    radiusKm: 3396.2,
    attribution: 'USGS Astrogeology / NASA Ames / NASA / JPL; Viking MDIM 2.1',
    fogColor: '#b58d7d',
    highColor: '#d5a895',
    features: [
      { name: 'Olympus Mons', body: 'Mars', latitude: 18.65, longitude: -133.8, description: 'Giant shield volcano in the Tharsis volcanic province.', terrain: 'Shield Volcano', searchRadiusKm: 550 },
      { name: 'Valles Marineris', body: 'Mars', latitude: -13.9, longitude: -59.2, description: 'System of immense tectonic canyons near the Martian equator.', terrain: 'Canyon System', searchRadiusKm: 1400 },
      { name: 'Gale Crater', body: 'Mars', latitude: -5.4, longitude: 137.8, description: 'Impact crater explored by the Curiosity rover.', terrain: 'Impact Crater', searchRadiusKm: 220 },
      { name: 'Jezero Crater', body: 'Mars', latitude: 18.38, longitude: 77.58, description: 'Ancient lake basin and landing site of the Perseverance rover.', terrain: 'Impact Crater', searchRadiusKm: 180 },
      { name: 'Hellas Planitia', body: 'Mars', latitude: -42.4, longitude: 70.5, description: 'Large southern impact basin with a low, broad floor.', terrain: 'Impact Basin', searchRadiusKm: 1100 },
      { name: 'Tharsis', body: 'Mars', latitude: 3, longitude: -110, description: 'Broad volcanic rise hosting several of Mars’s largest volcanoes.', terrain: 'Volcanic Province', searchRadiusKm: 1600 },
      { name: 'Utopia Planitia', body: 'Mars', latitude: 46.7, longitude: 117.5, description: 'Northern lowland basin and landing region of Viking 2.', terrain: 'Impact Basin', searchRadiusKm: 1200 },
    ],
  },
}

export function planetaryFeatures(body: LocalBody): NamedSurfaceFeature[] {
  return BODIES[body].features
}

export function nearestPlanetaryFeature(body: LocalBody, latitude: number, longitude: number): NamedSurfaceFeature | null {
  const radius = BODIES[body].radiusKm
  const radians = Math.PI / 180
  let nearest: NamedSurfaceFeature | null = null
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const feature of BODIES[body].features) {
    const lat1 = latitude * radians
    const lat2 = feature.latitude * radians
    const dLat = lat2 - lat1
    const dLon = ((feature.longitude - longitude + 540) % 360 - 180) * radians
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
    const distance = 2 * radius * Math.asin(Math.min(1, Math.sqrt(a)))
    if (distance < nearestDistance) {
      nearest = feature
      nearestDistance = distance
    }
  }

  return nearest && nearestDistance <= nearest.searchRadiusKm ? nearest : null
}
