import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, Line, OrbitControls, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { ExplorerLocation } from '../../data/locations'
import { formatCoordinate } from '../../data/locations'
import type { Planet } from '../../types'

type Props = {
  planet: Planet
  location: ExplorerLocation
  grid: boolean
  clouds: boolean
  highContrast: boolean
  onLocationSelect: (location: ExplorerLocation) => void
  controlsRef: React.MutableRefObject<OrbitControlsImpl | null>
}

const texturePaths = [
  '/textures/earth-day.jpg',
  '/textures/earth-clouds.jpg',
  '/textures/moon.jpg',
  '/textures/mars.jpg',
]

function LoadingPlanet() {
  return (
    <Html center>
      <div className="globe-loading"><span className="loading-orbit" />LOADING SURFACE MAP</div>
    </Html>
  )
}

function SurfaceGrid({ enabled }: { enabled: boolean }) {
  const lines = useMemo(() => {
    const output: THREE.Vector3[][] = []
    const radius = 1.008
    const segments = 96
    for (let index = 1; index < 6; index += 1) {
      const lat = (-75 + index * 30) * Math.PI / 180
      const parallel: THREE.Vector3[] = []
      for (let point = 0; point <= segments; point += 1) {
        const lon = point / segments * Math.PI * 2
        parallel.push(new THREE.Vector3(radius * Math.cos(lat) * Math.cos(lon), radius * Math.sin(lat), radius * Math.cos(lat) * Math.sin(lon)))
      }
      output.push(parallel)
    }
    for (let index = 0; index < 12; index += 1) {
      const lon = index / 12 * Math.PI * 2
      const meridian: THREE.Vector3[] = []
      for (let point = 0; point <= segments; point += 1) {
        const lat = (point / segments - .5) * Math.PI
        meridian.push(new THREE.Vector3(radius * Math.cos(lat) * Math.cos(lon), radius * Math.sin(lat), radius * Math.cos(lat) * Math.sin(lon)))
      }
      output.push(meridian)
    }
    return output
  }, [])

  if (!enabled) return null
  return <group>{lines.map((points, index) => <Line key={index} points={points} color="#8b8bfe" transparent opacity={.19} lineWidth={.65} />)}</group>
}

function LocationPin({ location }: { location: ExplorerLocation }) {
  const marker = useMemo(() => {
    const latitude = location.latitude * Math.PI / 180
    const longitude = (location.longitude + 180) * Math.PI / 180
    const radius = 1.019
    const position = new THREE.Vector3(
      -radius * Math.cos(latitude) * Math.cos(longitude),
      radius * Math.sin(latitude),
      radius * Math.cos(latitude) * Math.sin(longitude),
    )
    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), position.clone().normalize())
    return { position, quaternion }
  }, [location.latitude, location.longitude])

  return (
    <group position={marker.position} quaternion={marker.quaternion}>
      <mesh>
        <sphereGeometry args={[.014, 12, 12]} />
        <meshBasicMaterial color="#c5c4ff" />
      </mesh>
      <mesh>
        <ringGeometry args={[.023, .029, 32]} />
        <meshBasicMaterial color="#8b8bfe" transparent opacity={.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}

function PlanetSurface({ planet, location, grid, clouds, highContrast, onLocationSelect }: Omit<Props, 'controlsRef'>) {
  const [earth, cloud, moon, mars] = useTexture(texturePaths)
  const groupRef = useRef<THREE.Group>(null)
  const cloudRef = useRef<THREE.Mesh>(null)
  const map = planet === 'Earth' ? earth : planet === 'Moon' ? moon : mars

  useEffect(() => {
    for (const texture of [earth, cloud, moon, mars]) {
      texture.colorSpace = THREE.SRGBColorSpace
      texture.needsUpdate = true
    }
  }, [earth, cloud, moon, mars])

  useEffect(() => {
    groupRef.current?.scale.setScalar(.965)
  }, [planet])

  useFrame((_, delta) => {
    if (groupRef.current) {
      const scale = groupRef.current.scale.x + (1 - groupRef.current.scale.x) * (1 - Math.exp(-delta * 3.5))
      groupRef.current.scale.setScalar(scale)
    }
    if (cloudRef.current) cloudRef.current.rotation.y += delta * .012
  })

  return (
    <group ref={groupRef}>
      <mesh
        onClick={(event) => {
          event.stopPropagation()
          const latitude = (event.uv?.y ?? .5) * 180 - 90
          const longitude = (event.uv?.x ?? .5) * 360 - 180
          onLocationSelect({ name: 'Selected coordinates', body: planet, latitude, longitude, description: 'Point selected on the surface map', terrain: 'Unclassified' })
        }}
      >
        <sphereGeometry args={[1, 96, 96]} />
        <meshStandardMaterial map={map} roughness={planet === 'Earth' ? .9 : 1} metalness={0} />
      </mesh>

      {planet === 'Earth' && clouds && (
        <mesh ref={cloudRef}>
          <sphereGeometry args={[1.008, 64, 64]} />
          <meshBasicMaterial map={cloud} alphaMap={cloud} color="#c3d0ef" transparent opacity={.31} depthWrite={false} />
        </mesh>
      )}

      <mesh scale={planet === 'Earth' ? 1.045 : 1.025}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshBasicMaterial color={planet === 'Mars' ? '#d58e72' : planet === 'Earth' ? '#829ef9' : '#bfc1d2'} transparent opacity={planet === 'Earth' ? .075 : .035} side={THREE.BackSide} />
      </mesh>

      <SurfaceGrid enabled={grid} />
      <LocationPin location={location} />

      <group rotation={[.18, .13, -.1]}>
        <mesh rotation={[Math.PI / 2.7, .28, .2]}>
          <torusGeometry args={[1.36, .0018, 6, 180]} />
          <meshBasicMaterial color="#8b8bfe" transparent opacity={.32} />
        </mesh>
        <mesh rotation={[Math.PI / 2.35, -.18, .55]}>
          <torusGeometry args={[1.48, .001, 6, 180]} />
          <meshBasicMaterial color="#4141fc" transparent opacity={.22} />
        </mesh>
      </group>

      {highContrast && <ambientLight intensity={.38} />}
      <Html position={[0, -1.42, 0]} center distanceFactor={4.3}>
        <div className="globe-caption"><span className="caption-dash" />{planet.toUpperCase()} / SURFACE TEXTURE</div>
      </Html>
    </group>
  )
}

function GlobeScene(props: Props) {
  return (
    <>
      <color attach="background" args={['#080b14']} />
      <ambientLight intensity={props.highContrast ? .43 : .22} />
      <directionalLight position={[-3, 2, 4]} intensity={props.highContrast ? 2.15 : 1.65} />
      <pointLight position={[2.7, -.7, -2.6]} intensity={.45} color="#4141fc" />
      <Suspense fallback={<LoadingPlanet />}>
        <PlanetSurface {...props} />
      </Suspense>
      <OrbitControls
        ref={props.controlsRef}
        enablePan={false}
        enableDamping
        dampingFactor={.055}
        minDistance={2.35}
        maxDistance={5.2}
        autoRotate
        autoRotateSpeed={.22}
        rotateSpeed={.52}
        zoomSpeed={.7}
      />
    </>
  )
}

export function PlanetaryGlobe(props: Props) {
  return (
    <Canvas
      camera={{ position: [0, .05, 3.35], fov: 38 }}
      dpr={[1, 1.55]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      fallback={<div className="canvas-fallback">WebGL is unavailable in this browser.</div>}
    >
      <GlobeScene {...props} />
    </Canvas>
  )
}

export const defaultCameraPosition = new THREE.Vector3(0, .05, 3.35)

export function LocationCoordinates({ location }: { location: ExplorerLocation }) {
  return <>{formatCoordinate(location.latitude, 'latitude')} / {formatCoordinate(location.longitude, 'longitude')}</>
}
