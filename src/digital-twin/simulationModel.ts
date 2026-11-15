import type { DriveMode, RoverResponse, TerrainId, TerrainProfile } from './types'

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

function crater(x: number, z: number, centerX: number, centerZ: number, radius: number) {
  const distance = Math.hypot(x - centerX, z - centerZ)
  const bowl = -Math.exp(-(distance * distance) / (radius * radius * 0.72)) * 0.31
  const rim = Math.exp(-((distance - radius) ** 2) / (radius * 1.25)) * 0.15
  return bowl + rim
}

/** A deterministic, bounded height field. World units are treated as metres. */
export function terrainElevation(id: TerrainId, x: number, z: number, relief: number) {
  let normalized = 0

  if (id === 'basalt') {
    const broad = Math.sin(x * 0.075) * 0.12 + Math.cos(z * 0.083) * 0.1
    const fractured = Math.sin((x + z) * 0.21) * Math.cos((x - z) * 0.145) * 0.052
    const ridge = Math.tanh(Math.sin((x - 14) * 0.047 + z * 0.018) * 2.2) * 0.07
    normalized = broad + fractured + ridge + crater(x, z, -32, 19, 10) * 0.35
  } else if (id === 'regolith') {
    const rolling = Math.sin(x * 0.052) * 0.075 + Math.cos(z * 0.061) * 0.068
    normalized = rolling
      + crater(x, z, -27, 15, 13)
      + crater(x, z, 29, -21, 8) * 0.7
      + crater(x, z, 14, 27, 5) * 0.42
  } else if (id === 'dunes') {
    const sweep = x * 0.115 + z * 0.038
    const primary = Math.sin(sweep) * 0.17
    const crest = Math.sin(sweep * 2 + 0.55) * 0.055
    const crosswind = Math.sin(z * 0.072 - x * 0.018) * 0.055
    normalized = primary + crest + crosswind
  } else {
    const shelf = Math.sin(x * 0.044) * 0.055 + Math.cos(z * 0.052) * 0.048
    const pressureRidge = Math.exp(-((z + Math.sin(x * 0.065) * 15 - 4) ** 2) / 34) * 0.17
    const fracture = -Math.exp(-((x + z * 0.3 - 22) ** 2) / 18) * 0.065
    normalized = shelf + pressureRidge + fracture
  }

  return normalized * relief
}

export function routePosition(progress: number, terrain: TerrainId, relief: number) {
  const angle = progress * Math.PI * 2
  const x = Math.sin(angle) * 43 + Math.sin(angle * 2) * 7
  const z = Math.cos(angle) * 31 + Math.sin(angle * 3) * 5
  return { x, y: terrainElevation(terrain, x, z, relief), z }
}

type ResponseInput = {
  profile: TerrainProfile
  temperature: number
  terrainHeight: number
  slope: number
  mode: DriveMode
  autonomy: boolean
  running: boolean
}

const MODE_SPEED: Record<DriveMode, number> = {
  survey: 0.68,
  traverse: 1.55,
  precision: 0.38,
}

export function calculateRoverResponse({ profile, temperature, terrainHeight, slope, mode, autonomy, running }: ResponseInput): RoverResponse {
  const coldStress = clamp((-temperature - 48) / 92, 0, 1)
  const heatStress = clamp((temperature - 34) / 46, 0, 1)
  const thermalStress = Math.max(coldStress, heatStress)
  const thermalFactor = clamp(1 - thermalStress * 0.73, 0.18, 1)
  const reliefPenalty = clamp((terrainHeight - 22) / 92, 0, 0.42)
  const slopePenalty = clamp(slope / 43, 0, 0.74)
  const effectiveTraction = clamp(profile.traction - reliefPenalty * 0.13 - slopePenalty * 0.08, 0.2, 0.95)
  const slip = clamp((1 - effectiveTraction) * 73 + slope * 0.78 + (mode === 'traverse' ? 6 : mode === 'precision' ? -5 : 0), 2, 94)
  const slopeLimit = profile.id === 'ice' ? 21 : profile.id === 'dunes' ? 26 : 32
  const thermalCritical = temperature <= -136 || temperature >= 72
  const slopeCritical = slope >= slopeLimit
  const slipCritical = slip >= 68
  const flags: string[] = []

  if (coldStress > 0.25) flags.push('BATTERY HEATERS')
  if (heatStress > 0.25) flags.push('THERMAL LIMIT')
  if (slip > 42) flags.push('TRACTION CONTROL')
  if (slope > slopeLimit * 0.72) flags.push('SLOPE WATCH')

  const physicalFactor = thermalFactor * clamp(1 - slopePenalty * 0.68, 0.32, 1) * clamp(effectiveTraction + 0.18, 0.45, 1)
  let targetSpeed = MODE_SPEED[mode] * physicalFactor
  let state: RoverResponse['state'] = 'nominal'
  let code = 'NOMINAL'
  let label = 'Nominal traverse'
  let detail = 'Mobility, thermal and power margins are inside the configured envelope.'

  if (!running) {
    state = 'standby'
    code = 'PAUSED'
    label = 'Simulation paused'
    detail = 'Drive command is held at zero while environment telemetry remains active.'
    targetSpeed = 0
  } else if (autonomy && (thermalCritical || slopeCritical || slipCritical)) {
    state = 'hold'
    targetSpeed = 0
    if (thermalCritical) {
      code = 'THERMAL_HOLD'
      label = temperature < 0 ? 'Thermal warm-up hold' : 'Thermal cool-down hold'
      detail = `Ambient temperature is outside the autonomous drive envelope (${temperature < 0 ? '−136' : '72'}°C threshold).`
    } else if (slopeCritical) {
      code = 'SLOPE_HOLD'
      label = 'Slope safety hold'
      detail = `Local grade exceeds the ${slopeLimit}° limit for ${profile.shortName.toLowerCase()}.`
    } else {
      code = 'TRACTION_HOLD'
      label = 'Traction recovery hold'
      detail = 'Predicted wheel slip is above 68%; the rover is waiting for a safer drive command.'
    }
  } else if (thermalStress > 0.18 || slip > 36 || slope > slopeLimit * 0.62) {
    state = 'adapted'
    code = thermalStress > 0.42 ? 'THERMAL_LIMITED' : slip > 48 ? 'TRACTION_LIMITED' : 'GRADE_LIMITED'
    label = thermalStress > 0.42 ? 'Thermal speed limit' : slip > 48 ? 'Adaptive traction mode' : 'Grade-aware speed limit'
    detail = thermalStress > 0.42
      ? 'Drive speed is reduced to preserve battery and actuator temperature margins.'
      : slip > 48
        ? 'Torque is being redistributed across the six-wheel rocker-bogie drive.'
        : 'The controller reduced velocity for the current local grade.'
  }

  return {
    state,
    code,
    label,
    detail,
    targetSpeed,
    tractionPercent: effectiveTraction * 100,
    slipPercent: slip,
    thermalLoadPercent: clamp(18 + thermalStress * 82, 0, 100),
    slopeLimit,
    flags,
  }
}

export function formatMissionTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0')
  const seconds = (safeSeconds % 60).toString().padStart(2, '0')
  return `T+${minutes}:${seconds}`
}
