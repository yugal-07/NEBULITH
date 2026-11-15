import type { Planet } from '../types'

export type TerrainId = 'basalt' | 'regolith' | 'dunes' | 'ice'

export type DriveMode = 'survey' | 'traverse' | 'precision'

export type CameraMode = 'orbit' | 'follow' | 'top'

export type RoverState = 'nominal' | 'adapted' | 'hold' | 'standby'

export type TerrainProfile = {
  id: TerrainId
  name: string
  shortName: string
  body: Planet
  description: string
  surface: string
  color: string
  darkColor: string
  accentColor: string
  traction: number
  roughness: number
  defaultHeight: number
  defaultTemperature: number
  seed: number
}

export type RoverTelemetry = {
  speed: number
  slope: number
  pitch: number
  roll: number
  heading: number
  elevation: number
  battery: number
  powerDraw: number
  motorTemperature: number
  distance: number
  routeProgress: number
  elapsedSeconds: number
}

export type RoverResponse = {
  state: RoverState
  code: string
  label: string
  detail: string
  targetSpeed: number
  tractionPercent: number
  slipPercent: number
  thermalLoadPercent: number
  slopeLimit: number
  flags: string[]
}

export type MissionEvent = {
  id: number
  time: string
  message: string
  tone: 'info' | 'success' | 'warning'
}
