import type { Planet } from '../types'
import { BODIES } from './planetaryFeatures'

export type ExplorerLocation = {
  name: string
  body: Planet
  latitude: number
  longitude: number
  description: string
  terrain: string
}

export const locations: ExplorerLocation[] = [
  { name: 'Spiti Valley', body: 'Earth', latitude: 32.25, longitude: 78.03, description: 'Cold desert in the Indian Himalaya', terrain: 'Cold desert' },
  { name: 'Rann of Kutch', body: 'Earth', latitude: 23.73, longitude: 69.86, description: 'Seasonally flooded salt marsh', terrain: 'Salt flat' },
  { name: 'Mare Tranquillitatis', body: 'Moon', latitude: 8.5, longitude: 31.4, description: 'Lunar mare and Apollo 11 landing region', terrain: 'Basaltic plain' },
  { name: 'Olympus Mons', body: 'Mars', latitude: 18.65, longitude: -133.8, description: 'Large shield volcano in the Tharsis region', terrain: 'Shield volcano' },
]

export function defaultLocation(body: Planet): ExplorerLocation {
  const [longitude, latitude] = body === 'Earth' ? [14, 20] : BODIES[body].center
  return {
    name: 'Surface view',
    body,
    latitude,
    longitude,
    description: 'Interactive planetary surface view',
    terrain: 'Unclassified',
  }
}

export function formatCoordinate(value: number, axis: 'latitude' | 'longitude') {
  const direction = axis === 'latitude'
    ? value >= 0 ? 'N' : 'S'
    : value >= 0 ? 'E' : 'W'
  return `${Math.abs(value).toFixed(2)}° ${direction}`
}
