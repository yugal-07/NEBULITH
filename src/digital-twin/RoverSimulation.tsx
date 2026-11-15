import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { routePosition, terrainElevation } from './simulationModel'
import type { CameraMode, RoverState, RoverTelemetry, TerrainProfile } from './types'

type Props = {
  terrain: TerrainProfile
  terrainHeight: number
  temperature: number
  targetSpeed: number
  slipPercent: number
  roverState: RoverState
  cameraMode: CameraMode
  resetSignal: number
  onTelemetry: (telemetry: RoverTelemetry) => void
}

type DustCloud = {
  points: THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial>
  positions: Float32Array
  velocities: Float32Array
  life: Float32Array
  cursor: number
  accumulator: number
}

type SceneHandles = {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  terrainRoot: THREE.Group
  rover: THREE.Group
  wheels: THREE.Mesh[]
  lidar: THREE.Mesh
  statusMaterial: THREE.MeshStandardMaterial
  keyLight: THREE.DirectionalLight
  fillLight: THREE.HemisphereLight
  terrainMaterial: THREE.MeshStandardMaterial | null
  wireMaterial: THREE.MeshBasicMaterial | null
  dust: DustCloud
  progress: number
  currentSpeed: number
  battery: number
  distance: number
  elapsed: number
  motorTemperature: number
  telemetryTimer: number
  initialized: boolean
  previousCameraMode: CameraMode
  frame: number
}

const clamp = (value: number, minimum: number, maximum: number) => Math.min(maximum, Math.max(minimum, value))

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let result = value
    result = Math.imul(result ^ (result >>> 15), result | 1)
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

function disposeObject(root: THREE.Object3D) {
  root.traverse((object) => {
    const mesh = object as THREE.Mesh
    mesh.geometry?.dispose()
    const material = mesh.material
    if (Array.isArray(material)) material.forEach((item) => item.dispose())
    else material?.dispose()
  })
}

function clearGroup(group: THREE.Group) {
  for (const child of [...group.children]) {
    group.remove(child)
    disposeObject(child)
  }
}

function createStarField() {
  const random = seededRandom(9204)
  const positions = new Float32Array(420 * 3)
  for (let index = 0; index < 420; index += 1) {
    const radius = 125 + random() * 75
    const theta = random() * Math.PI * 2
    const phi = Math.acos(1 - random() * 1.25)
    positions[index * 3] = Math.sin(phi) * Math.cos(theta) * radius
    positions[index * 3 + 1] = Math.abs(Math.cos(phi) * radius) + 18
    positions[index * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({ color: '#d9ddff', size: 0.34, transparent: true, opacity: 0.56, depthWrite: false, fog: false })
  const points = new THREE.Points(geometry, material)
  points.name = 'distant-stars'
  return points
}

function createDustCloud() {
  const count = 110
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  const life = new Float32Array(count)
  positions.fill(-1000)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    color: '#a88974',
    size: 0.42,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.32,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  return { points, positions, velocities, life, cursor: 0, accumulator: 0 }
}

function createRover() {
  const rover = new THREE.Group()
  rover.name = 'nebulith-rover'

  const chassisMaterial = new THREE.MeshStandardMaterial({ color: '#c8c7be', metalness: 0.72, roughness: 0.34 })
  const darkMaterial = new THREE.MeshStandardMaterial({ color: '#17191d', metalness: 0.74, roughness: 0.47 })
  const trimMaterial = new THREE.MeshStandardMaterial({ color: '#6266ff', emissive: '#20227d', emissiveIntensity: 0.6, metalness: 0.52, roughness: 0.32 })
  const solarMaterial = new THREE.MeshStandardMaterial({ color: '#121b37', emissive: '#101c4c', emissiveIntensity: 0.3, metalness: 0.45, roughness: 0.26 })
  const glassMaterial = new THREE.MeshStandardMaterial({ color: '#111824', emissive: '#4d68a5', emissiveIntensity: 0.45, metalness: 0.24, roughness: 0.16 })
  const statusMaterial = new THREE.MeshStandardMaterial({ color: '#7fffc1', emissive: '#31d98b', emissiveIntensity: 1.25, roughness: 0.22 })

  const lowerBody = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.72, 3.25), darkMaterial)
  lowerBody.position.y = 1.42
  rover.add(lowerBody)

  const body = new THREE.Mesh(new THREE.BoxGeometry(4.2, 1.22, 2.9), chassisMaterial)
  body.position.y = 2.18
  rover.add(body)

  const nose = new THREE.Mesh(new THREE.BoxGeometry(3.36, 0.42, 0.18), trimMaterial)
  nose.position.set(0, 2.25, 1.54)
  rover.add(nose)

  const equipmentBay = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.62, 1.95), darkMaterial)
  equipmentBay.position.y = 3.06
  rover.add(equipmentBay)

  const solarPanel = new THREE.Mesh(new THREE.BoxGeometry(4.95, 0.12, 2.72), solarMaterial)
  solarPanel.position.set(0, 3.45, -0.05)
  solarPanel.rotation.x = -0.035
  rover.add(solarPanel)

  for (const x of [-1.22, 0, 1.22]) {
    const panelLine = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.025, 2.66), trimMaterial)
    panelLine.position.set(x, 3.52, -0.05)
    rover.add(panelLine)
  }
  for (const z of [-0.88, 0, 0.88]) {
    const panelLine = new THREE.Mesh(new THREE.BoxGeometry(4.9, 0.025, 0.035), trimMaterial)
    panelLine.position.set(0, 3.52, z - 0.05)
    rover.add(panelLine)
  }

  const wheels: THREE.Mesh[] = []
  const wheelGeometry = new THREE.CylinderGeometry(0.77, 0.77, 0.58, 22, 1, false)
  wheelGeometry.rotateZ(Math.PI / 2)
  const wheelMaterial = new THREE.MeshStandardMaterial({ color: '#111216', metalness: 0.44, roughness: 0.82 })
  const hubMaterial = new THREE.MeshStandardMaterial({ color: '#858998', metalness: 0.8, roughness: 0.28 })

  for (const side of [-1, 1]) {
    const rocker = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.18, 4.25), darkMaterial)
    rocker.position.set(side * 2.34, 1.32, 0)
    rocker.rotation.x = side * 0.035
    rover.add(rocker)

    for (const z of [-1.72, 0, 1.72]) {
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.0, 0.14), darkMaterial)
      arm.position.set(side * 2.34, 0.97, z)
      arm.rotation.z = side * -0.24
      rover.add(arm)

      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial)
      wheel.position.set(side * 2.72, 0.76, z)
      wheel.castShadow = true
      rover.add(wheel)
      wheels.push(wheel)

      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.62, 16), hubMaterial)
      hub.geometry.rotateZ(Math.PI / 2)
      hub.position.copy(wheel.position)
      rover.add(hub)
    }
  }

  const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 2.2, 12), darkMaterial)
  mast.position.set(0.55, 4.48, 0.18)
  rover.add(mast)

  const cameraHead = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.5, 0.58), chassisMaterial)
  cameraHead.position.set(0.55, 5.62, 0.18)
  rover.add(cameraHead)

  const cameraGlass = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.22, 0.08), glassMaterial)
  cameraGlass.position.set(0.55, 5.65, 0.5)
  rover.add(cameraGlass)

  const lidar = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.16, 24), trimMaterial)
  lidar.position.set(0.55, 5.98, 0.18)
  rover.add(lidar)

  const antennaStem = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.3, 10), darkMaterial)
  antennaStem.position.set(-1.15, 4.15, -0.44)
  antennaStem.rotation.z = -0.24
  rover.add(antennaStem)

  const antenna = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.07, 8, 24), chassisMaterial)
  antenna.position.set(-1.31, 4.78, -0.44)
  antenna.rotation.x = Math.PI / 2.6
  antenna.rotation.z = -0.2
  rover.add(antenna)

  const statusLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 10), statusMaterial)
  statusLight.position.set(-1.65, 2.6, 1.55)
  rover.add(statusLight)

  const headlampMaterial = new THREE.MeshStandardMaterial({ color: '#eef2ff', emissive: '#bdcaff', emissiveIntensity: 2.1 })
  for (const x of [-1.28, 1.28]) {
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.15, 16), headlampMaterial)
    lamp.position.set(x, 2.22, 1.645)
    rover.add(lamp)
  }

  rover.traverse((object) => {
    const mesh = object as THREE.Mesh
    if (mesh.isMesh) {
      mesh.castShadow = true
      mesh.receiveShadow = true
    }
  })
  rover.scale.setScalar(0.82)

  return { rover, wheels, lidar, statusMaterial }
}

function addRouteMarkers(root: THREE.Group, profile: TerrainProfile, relief: number) {
  const ringMaterial = new THREE.MeshBasicMaterial({ color: '#9ea0ff', transparent: true, opacity: 0.62, side: THREE.DoubleSide, depthWrite: false })
  const pinMaterial = new THREE.MeshBasicMaterial({ color: profile.accentColor, transparent: true, opacity: 0.72 })
  for (const progress of [0, 0.25, 0.5, 0.75]) {
    const position = routePosition(progress, profile.id, relief)
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.02, 28), ringMaterial)
    ring.rotation.x = -Math.PI / 2
    ring.position.set(position.x, position.y + 0.22, position.z)
    root.add(ring)

    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 2.3, 6), pinMaterial)
    pin.position.set(position.x, position.y + 1.25, position.z)
    root.add(pin)

    const cap = new THREE.Mesh(new THREE.OctahedronGeometry(0.18, 0), pinMaterial)
    cap.position.set(position.x, position.y + 2.43, position.z)
    root.add(cap)
  }
}

function rebuildTerrain(simulation: SceneHandles, profile: TerrainProfile, relief: number) {
  clearGroup(simulation.terrainRoot)

  const geometry = new THREE.PlaneGeometry(160, 124, 100, 78)
  geometry.rotateX(-Math.PI / 2)
  const position = geometry.getAttribute('position') as THREE.BufferAttribute
  const colors: number[] = []
  const lowColor = new THREE.Color(profile.darkColor).lerp(new THREE.Color(profile.color), 0.33)
  const highColor = new THREE.Color(profile.color).lerp(new THREE.Color(profile.accentColor), 0.35)

  for (let index = 0; index < position.count; index += 1) {
    const x = position.getX(index)
    const z = position.getZ(index)
    const y = terrainElevation(profile.id, x, z, relief)
    position.setY(index, y)
    const mix = clamp(0.46 + y / Math.max(12, relief * 0.9), 0, 1)
    const color = lowColor.clone().lerp(highColor, mix)
    colors.push(color.r, color.g, color.b)
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  geometry.computeVertexNormals()

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    color: '#ffffff',
    metalness: profile.id === 'ice' ? 0.28 : 0.08,
    roughness: profile.id === 'ice' ? 0.64 : 0.92,
    side: THREE.DoubleSide,
  })
  const terrain = new THREE.Mesh(geometry, material)
  terrain.receiveShadow = true
  terrain.name = 'procedural-terrain'
  simulation.terrainRoot.add(terrain)
  simulation.terrainMaterial = material

  const wireMaterial = new THREE.MeshBasicMaterial({ color: profile.accentColor, wireframe: true, transparent: true, opacity: 0.055, depthWrite: false })
  const wire = new THREE.Mesh(geometry, wireMaterial)
  wire.position.y = 0.025
  simulation.terrainRoot.add(wire)
  simulation.wireMaterial = wireMaterial

  const foundation = new THREE.Mesh(
    new THREE.BoxGeometry(163, 1.2, 127),
    new THREE.MeshStandardMaterial({ color: profile.darkColor, metalness: 0.1, roughness: 1 }),
  )
  foundation.position.y = -Math.max(18, relief * 0.36)
  foundation.receiveShadow = true
  simulation.terrainRoot.add(foundation)

  const routePoints = Array.from({ length: 241 }, (_, index) => {
    const point = routePosition(index / 240, profile.id, relief)
    return new THREE.Vector3(point.x, point.y + 0.25, point.z)
  })
  const routeGeometry = new THREE.BufferGeometry().setFromPoints(routePoints)
  const routeMaterial = new THREE.LineDashedMaterial({ color: '#b0b2ff', transparent: true, opacity: 0.72, dashSize: 1.35, gapSize: 0.8, depthWrite: false })
  const route = new THREE.Line(routeGeometry, routeMaterial)
  route.computeLineDistances()
  simulation.terrainRoot.add(route)
  addRouteMarkers(simulation.terrainRoot, profile, relief)

  const random = seededRandom(profile.seed)
  const rockCount = profile.id === 'dunes' ? 22 : profile.id === 'ice' ? 13 : 64
  const rockGeometry = profile.id === 'ice' ? new THREE.OctahedronGeometry(0.62, 0) : new THREE.DodecahedronGeometry(0.62, 0)
  const rockMaterial = new THREE.MeshStandardMaterial({ color: profile.color, roughness: profile.id === 'ice' ? 0.56 : 0.95, metalness: profile.id === 'ice' ? 0.22 : 0.05 })
  const rocks = new THREE.InstancedMesh(rockGeometry, rockMaterial, rockCount)
  const matrix = new THREE.Matrix4()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  const rockPosition = new THREE.Vector3()
  for (let index = 0; index < rockCount; index += 1) {
    const x = (random() - 0.5) * 148
    const z = (random() - 0.5) * 112
    const size = 0.22 + random() * (profile.id === 'dunes' ? 0.65 : 1.25)
    rockPosition.set(x, terrainElevation(profile.id, x, z, relief) + size * 0.36, z)
    quaternion.setFromEuler(new THREE.Euler(random() * Math.PI, random() * Math.PI, random() * Math.PI))
    scale.set(size * (0.72 + random() * 0.8), size * (0.5 + random() * 0.7), size * (0.72 + random() * 0.8))
    matrix.compose(rockPosition, quaternion, scale)
    rocks.setMatrixAt(index, matrix)
  }
  rocks.castShadow = true
  rocks.receiveShadow = true
  simulation.terrainRoot.add(rocks)
  simulation.initialized = false
}

function applyEnvironment(simulation: SceneHandles, profile: TerrainProfile, temperature: number) {
  const background = new THREE.Color(profile.darkColor).multiplyScalar(0.43)
  if (temperature < -45) background.lerp(new THREE.Color('#061426'), clamp((-temperature - 45) / 150, 0, 0.48))
  if (temperature > 32) background.lerp(new THREE.Color('#2a0b06'), clamp((temperature - 32) / 90, 0, 0.42))
  simulation.scene.background = background
  if (simulation.scene.fog instanceof THREE.FogExp2) simulation.scene.fog.color.copy(background)

  const materialTint = new THREE.Color('#ffffff')
  if (temperature < -70) materialTint.lerp(new THREE.Color('#c4ddff'), 0.16)
  if (temperature > 45) materialTint.lerp(new THREE.Color('#ffd0b4'), 0.13)
  simulation.terrainMaterial?.color.copy(materialTint)
  if (simulation.wireMaterial) simulation.wireMaterial.color.set(profile.accentColor)
  simulation.dust.points.material.color.set(profile.id === 'ice' ? '#d7f2fa' : profile.accentColor)
  simulation.dust.points.material.opacity = profile.id === 'ice' ? 0.18 : 0.31
  simulation.keyLight.color.set(profile.id === 'dunes' ? '#ffd0af' : profile.id === 'ice' ? '#d7efff' : '#e5e6ff')
  simulation.fillLight.groundColor.set(profile.darkColor)
}

function updateDust(simulation: SceneHandles, delta: number, profile: TerrainProfile) {
  const dust = simulation.dust
  const positionAttribute = dust.points.geometry.getAttribute('position') as THREE.BufferAttribute
  const roverPosition = simulation.rover.position
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(simulation.rover.quaternion)
  const right = new THREE.Vector3(1, 0, 0).applyQuaternion(simulation.rover.quaternion)
  dust.accumulator += simulation.currentSpeed * delta * (profile.id === 'ice' ? 5 : 18)
  let spawnCount = Math.floor(dust.accumulator)
  dust.accumulator -= spawnCount

  while (spawnCount > 0) {
    const index = dust.cursor
    dust.cursor = (dust.cursor + 1) % dust.life.length
    const randomA = Math.random() - 0.5
    const randomB = Math.random()
    const base = index * 3
    dust.positions[base] = roverPosition.x - forward.x * 2.1 + right.x * randomA * 3
    dust.positions[base + 1] = roverPosition.y + 0.25 + randomB * 0.35
    dust.positions[base + 2] = roverPosition.z - forward.z * 2.1 + right.z * randomA * 3
    dust.velocities[base] = -forward.x * (0.3 + randomB * 0.7) + right.x * randomA * 0.55
    dust.velocities[base + 1] = 0.22 + randomB * 0.52
    dust.velocities[base + 2] = -forward.z * (0.3 + randomB * 0.7) + right.z * randomA * 0.55
    dust.life[index] = 0.65 + randomB * 0.85
    spawnCount -= 1
  }

  for (let index = 0; index < dust.life.length; index += 1) {
    if (dust.life[index] <= 0) continue
    const base = index * 3
    dust.life[index] -= delta
    if (dust.life[index] <= 0) {
      dust.positions[base + 1] = -1000
      continue
    }
    dust.positions[base] += dust.velocities[base] * delta
    dust.positions[base + 1] += dust.velocities[base + 1] * delta
    dust.positions[base + 2] += dust.velocities[base + 2] * delta
  }
  positionAttribute.needsUpdate = true
}

export function RoverSimulation({ terrain, terrainHeight, temperature, targetSpeed, slipPercent, roverState, cameraMode, resetSignal, onTelemetry }: Props) {
  const mountRef = useRef<HTMLDivElement>(null)
  const simulationRef = useRef<SceneHandles | null>(null)
  const [webglError, setWebglError] = useState('')
  const latestRef = useRef({ terrain, terrainHeight, temperature, targetSpeed, slipPercent, roverState, cameraMode })
  const telemetryCallbackRef = useRef(onTelemetry)
  latestRef.current = { terrain, terrainHeight, temperature, targetSpeed, slipPercent, roverState, cameraMode }
  telemetryCallbackRef.current = onTelemetry

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' })
    } catch {
      setWebglError('WebGL is unavailable in this browser. Enable hardware acceleration to run the terrain twin.')
      return
    }

    const scene = new THREE.Scene()
    scene.fog = new THREE.FogExp2('#080a10', 0.0082)
    const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 420)
    camera.position.set(43, 31, 49)

    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.06
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.65))
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D rover digital twin. Drag to orbit and scroll to zoom.')
    renderer.domElement.setAttribute('role', 'img')
    mount.appendChild(renderer.domElement)

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.065
    controls.minDistance = 11
    controls.maxDistance = 145
    controls.maxPolarAngle = Math.PI * 0.49
    controls.target.set(0, 1.5, 0)

    const fillLight = new THREE.HemisphereLight('#9baeff', '#181311', 1.42)
    scene.add(fillLight)
    const keyLight = new THREE.DirectionalLight('#e5e6ff', 3.25)
    keyLight.position.set(28, 54, 23)
    keyLight.castShadow = true
    keyLight.shadow.mapSize.set(1024, 1024)
    keyLight.shadow.camera.left = -72
    keyLight.shadow.camera.right = 72
    keyLight.shadow.camera.top = 72
    keyLight.shadow.camera.bottom = -72
    keyLight.shadow.camera.near = 1
    keyLight.shadow.camera.far = 150
    keyLight.shadow.bias = -0.0007
    scene.add(keyLight)

    const rimLight = new THREE.DirectionalLight('#5a62ff', 1.2)
    rimLight.position.set(-42, 24, -38)
    scene.add(rimLight)
    scene.add(createStarField())

    const terrainRoot = new THREE.Group()
    terrainRoot.name = 'terrain-root'
    scene.add(terrainRoot)
    const roverParts = createRover()
    scene.add(roverParts.rover)
    const dust = createDustCloud()
    scene.add(dust.points)

    const simulation: SceneHandles = {
      scene,
      camera,
      renderer,
      controls,
      terrainRoot,
      rover: roverParts.rover,
      wheels: roverParts.wheels,
      lidar: roverParts.lidar,
      statusMaterial: roverParts.statusMaterial,
      keyLight,
      fillLight,
      terrainMaterial: null,
      wireMaterial: null,
      dust,
      progress: 0.035,
      currentSpeed: 0,
      battery: 92,
      distance: 0,
      elapsed: 0,
      motorTemperature: 28,
      telemetryTimer: 0,
      initialized: false,
      previousCameraMode: latestRef.current.cameraMode,
      frame: 0,
    }
    simulationRef.current = simulation
    rebuildTerrain(simulation, latestRef.current.terrain, latestRef.current.terrainHeight)
    applyEnvironment(simulation, latestRef.current.terrain, latestRef.current.temperature)

    const resize = () => {
      const width = Math.max(1, mount.clientWidth)
      const height = Math.max(1, mount.clientHeight)
      renderer.setSize(width, height, false)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    resize()
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    const clock = new THREE.Clock()
    const matrix = new THREE.Matrix4()
    const targetQuaternion = new THREE.Quaternion()
    const surfaceNormal = new THREE.Vector3()
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()
    const targetPosition = new THREE.Vector3()
    const cameraPosition = new THREE.Vector3()
    const cameraLookAt = new THREE.Vector3()

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05)
      const config = latestRef.current
      const desiredSpeed = simulation.battery > 1 ? config.targetSpeed : 0
      simulation.currentSpeed += (desiredSpeed - simulation.currentSpeed) * Math.min(1, delta * (desiredSpeed === 0 ? 3.4 : 1.85))
      simulation.progress = (simulation.progress + (simulation.currentSpeed * delta) / 238) % 1
      simulation.distance += Math.max(0, simulation.currentSpeed) * delta
      simulation.elapsed += delta

      const point = routePosition(simulation.progress, config.terrain.id, config.terrainHeight)
      const ahead = routePosition(simulation.progress + 0.002, config.terrain.id, config.terrainHeight)
      const behind = routePosition(simulation.progress - 0.002, config.terrain.id, config.terrainHeight)
      const sample = 0.75
      const hLeft = terrainElevation(config.terrain.id, point.x - sample, point.z, config.terrainHeight)
      const hRight = terrainElevation(config.terrain.id, point.x + sample, point.z, config.terrainHeight)
      const hBack = terrainElevation(config.terrain.id, point.x, point.z - sample, config.terrainHeight)
      const hFront = terrainElevation(config.terrain.id, point.x, point.z + sample, config.terrainHeight)

      surfaceNormal.set(hLeft - hRight, sample * 2, hBack - hFront).normalize()
      forward.set(ahead.x - behind.x, ahead.y - behind.y, ahead.z - behind.z).normalize()
      right.crossVectors(surfaceNormal, forward).normalize()
      forward.crossVectors(right, surfaceNormal).normalize()
      matrix.makeBasis(right, surfaceNormal, forward)
      targetQuaternion.setFromRotationMatrix(matrix)
      targetPosition.set(point.x, point.y + 0.08, point.z)

      if (!simulation.initialized) {
        simulation.rover.position.copy(targetPosition)
        simulation.rover.quaternion.copy(targetQuaternion)
        simulation.initialized = true
      } else {
        simulation.rover.position.lerp(targetPosition, Math.min(1, delta * 8))
        simulation.rover.quaternion.slerp(targetQuaternion, Math.min(1, delta * 6))
      }

      for (const wheel of simulation.wheels) wheel.rotation.x -= (simulation.currentSpeed * delta) / 0.63
      simulation.lidar.rotation.y += delta * (config.roverState === 'hold' ? 0.7 : 2.4)

      const stateColor = config.roverState === 'hold' ? '#ff6d59' : config.roverState === 'adapted' ? '#ffbf69' : config.roverState === 'standby' ? '#9d9fff' : '#6dffc0'
      simulation.statusMaterial.color.set(stateColor)
      simulation.statusMaterial.emissive.set(stateColor)

      const heaterDraw = config.temperature < -20 ? clamp((-config.temperature - 20) * 4.8, 0, 620) : 0
      const coolingDraw = config.temperature > 38 ? clamp((config.temperature - 38) * 6.2, 0, 410) : 0
      const powerDraw = 145 + simulation.currentSpeed * 245 + config.slipPercent * 1.85 + heaterDraw + coolingDraw
      simulation.battery = Math.max(0, simulation.battery - (powerDraw * delta * 100) / (2850 * 3600))
      const motorTarget = clamp(26 + simulation.currentSpeed * 15 + config.slipPercent * 0.12 + Math.max(0, config.temperature) * 0.1 - Math.max(0, -config.temperature) * 0.025, -18, 92)
      simulation.motorTemperature += (motorTarget - simulation.motorTemperature) * Math.min(1, delta * 0.18)

      updateDust(simulation, delta, config.terrain)

      if (config.cameraMode !== simulation.previousCameraMode && config.cameraMode === 'orbit') {
        controls.target.copy(simulation.rover.position).add(new THREE.Vector3(0, 1.7, 0))
      }
      simulation.previousCameraMode = config.cameraMode

      if (config.cameraMode === 'follow') {
        controls.enabled = false
        camera.up.set(0, 1, 0)
        cameraPosition.copy(simulation.rover.position).addScaledVector(forward, -13).addScaledVector(surfaceNormal, 7.2).addScaledVector(right, 2.8)
        camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 3.2))
        cameraLookAt.copy(simulation.rover.position).addScaledVector(forward, 5).addScaledVector(surfaceNormal, 1.8)
        camera.lookAt(cameraLookAt)
      } else if (config.cameraMode === 'top') {
        controls.enabled = false
        camera.up.set(0, 0, -1)
        cameraPosition.copy(simulation.rover.position).add(new THREE.Vector3(0.01, 54, 0.01))
        camera.position.lerp(cameraPosition, 1 - Math.exp(-delta * 3))
        camera.lookAt(simulation.rover.position)
      } else {
        camera.up.set(0, 1, 0)
        controls.enabled = true
        controls.update()
      }

      simulation.telemetryTimer += delta
      if (simulation.telemetryTimer >= 0.12) {
        simulation.telemetryTimer = 0
        const slope = THREE.MathUtils.radToDeg(Math.acos(clamp(surfaceNormal.y, -1, 1)))
        const pitch = THREE.MathUtils.radToDeg(Math.asin(clamp(forward.y, -1, 1)))
        const roll = THREE.MathUtils.radToDeg(Math.asin(clamp(right.y, -1, 1)))
        const heading = (THREE.MathUtils.radToDeg(Math.atan2(forward.x, forward.z)) + 360) % 360
        telemetryCallbackRef.current({
          speed: simulation.currentSpeed,
          slope,
          pitch,
          roll,
          heading,
          elevation: 1240 + point.y,
          battery: simulation.battery,
          powerDraw,
          motorTemperature: simulation.motorTemperature,
          distance: simulation.distance,
          routeProgress: simulation.progress * 100,
          elapsedSeconds: simulation.elapsed,
        })
      }

      renderer.render(scene, camera)
      simulation.frame = requestAnimationFrame(animate)
    }
    simulation.frame = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(simulation.frame)
      resizeObserver.disconnect()
      controls.dispose()
      disposeObject(scene)
      renderer.dispose()
      renderer.domElement.remove()
      simulationRef.current = null
    }
  }, [])

  useEffect(() => {
    const simulation = simulationRef.current
    if (!simulation) return
    rebuildTerrain(simulation, terrain, terrainHeight)
    applyEnvironment(simulation, terrain, temperature)
  }, [terrain, terrainHeight])

  useEffect(() => {
    const simulation = simulationRef.current
    if (simulation) applyEnvironment(simulation, terrain, temperature)
  }, [temperature, terrain])

  useEffect(() => {
    const simulation = simulationRef.current
    if (!simulation) return
    simulation.progress = 0.035
    simulation.currentSpeed = 0
    simulation.battery = 92
    simulation.distance = 0
    simulation.elapsed = 0
    simulation.motorTemperature = 28
    simulation.initialized = false
    simulation.camera.position.set(43, 31, 49)
    simulation.camera.up.set(0, 1, 0)
    simulation.controls.target.set(0, 1.5, 0)
    simulation.controls.update()
  }, [resetSignal])

  return (
    <div className="dt-canvas-mount" ref={mountRef}>
      {webglError && <div className="dt-webgl-error" role="alert"><strong>3D VIEW UNAVAILABLE</strong><span>{webglError}</span></div>}
    </div>
  )
}
