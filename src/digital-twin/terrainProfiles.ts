import type { Planet } from '../types'
import type { TerrainId, TerrainProfile } from './types'

export const TERRAIN_PROFILES: TerrainProfile[] = [
  {
    id: 'basalt',
    name: 'Basalt field',
    shortName: 'Basalt',
    body: 'Earth',
    description: 'Fractured volcanic rock with firm, high-grip traversal lanes.',
    surface: 'Rock / compacted fines',
    color: '#505662',
    darkColor: '#151920',
    accentColor: '#8d93a1',
    traction: 0.86,
    roughness: 0.57,
    defaultHeight: 28,
    defaultTemperature: 18,
    seed: 17,
  },
  {
    id: 'regolith',
    name: 'Lunar regolith',
    shortName: 'Regolith',
    body: 'Moon',
    description: 'Powdered surface material with shallow impacts and concealed slip.',
    surface: 'Fine regolith / ejecta',
    color: '#8a8883',
    darkColor: '#1e1e20',
    accentColor: '#d0cdc6',
    traction: 0.67,
    roughness: 0.42,
    defaultHeight: 22,
    defaultTemperature: -82,
    seed: 29,
  },
  {
    id: 'dunes',
    name: 'Martian dunes',
    shortName: 'Dunes',
    body: 'Mars',
    description: 'Wind-shaped sand ridges where wheel sink and lateral slip dominate.',
    surface: 'Loose sand / dust',
    color: '#8e4d35',
    darkColor: '#25140f',
    accentColor: '#dc8158',
    traction: 0.48,
    roughness: 0.34,
    defaultHeight: 36,
    defaultTemperature: -58,
    seed: 43,
  },
  {
    id: 'ice',
    name: 'Polar ice shelf',
    shortName: 'Polar ice',
    body: 'Earth',
    description: 'Low-friction ice with pressure ridges and thermal constraints.',
    surface: 'Glacial ice / frost',
    color: '#8ba8b5',
    darkColor: '#122029',
    accentColor: '#aee8f6',
    traction: 0.39,
    roughness: 0.25,
    defaultHeight: 18,
    defaultTemperature: -34,
    seed: 61,
  },
]

export const TERRAIN_BY_ID = Object.fromEntries(
  TERRAIN_PROFILES.map((profile) => [profile.id, profile]),
) as Record<TerrainId, TerrainProfile>

export const DEFAULT_TERRAIN: Record<Planet, TerrainId> = {
  Earth: 'basalt',
  Moon: 'regolith',
  Mars: 'dunes',
}
