import type { Planet } from '../types'

export type ExplorerLocation = {
  name: string
  body: Planet
  latitude: number
  longitude: number
  description: string
  terrain: string
  researchEvidence?: {
    role: 'target' | 'analog_site' | 'other'
    confidence?: number
    quote: string
    documentTitle: string
    page: number | null
  }
}

export const locations: ExplorerLocation[] = [
  { name: 'Ladakh', body: 'Earth', latitude: 34.15, longitude: 77.57, description: 'High-altitude trans-Himalayan region', terrain: 'Mountain terrain' },
  { name: 'Spiti Valley', body: 'Earth', latitude: 32.25, longitude: 78.03, description: 'Cold desert in the Indian Himalaya', terrain: 'Cold desert' },
  { name: 'Rann of Kutch', body: 'Earth', latitude: 23.73, longitude: 69.86, description: 'Seasonally flooded salt marsh', terrain: 'Salt flat' },
  { name: 'Tycho Crater', body: 'Moon', latitude: -43.31, longitude: -11.36, description: 'Prominent southern lunar impact crater', terrain: 'Impact crater' },
  { name: 'Mare Tranquillitatis', body: 'Moon', latitude: 8.5, longitude: 31.4, description: 'Lunar mare and Apollo 11 landing region', terrain: 'Basaltic plain' },
  { name: 'Jezero Crater', body: 'Mars', latitude: 18.38, longitude: 77.58, description: 'Ancient impact basin and rover exploration site', terrain: 'Impact basin' },
  { name: 'Olympus Mons', body: 'Mars', latitude: 18.65, longitude: -133.8, description: 'Large shield volcano in the Tharsis region', terrain: 'Shield volcano' },
]

export function defaultLocation(body: Planet): ExplorerLocation {
  return locations.find((location) => location.body === body) ?? locations[0]
}

export function formatCoordinate(value: number, axis: 'latitude' | 'longitude') {
  const direction = axis === 'latitude'
    ? value >= 0 ? 'N' : 'S'
    : value >= 0 ? 'E' : 'W'
  return `${Math.abs(value).toFixed(2)}° ${direction}`
}
