import { lazy, Suspense, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/navigation/AppShell'
import { Overview } from './pages/Overview'
import { WorkspacePage } from './pages/WorkspacePage'
import { MissionWorkspace } from './pages/MissionWorkspace'
import { defaultLocation, type ExplorerLocation, locations } from './data/locations'
import type { Planet, Section } from './types'

const DigitalTwinPage = lazy(() => import('./digital-twin/DigitalTwinPage'))

const sections: Section[] = [
  { label: 'Explore', path: '/explore', eyebrow: '01 / PLANETARY EXPLORER', description: 'Explore surface maps and inspect regions in a shared planetary workspace.' },
  { label: 'Discover', path: '/discover', eyebrow: '02 / EARTH ANALOGS', description: 'Curated candidate discovery with evidence and source coverage.' },
  { label: 'Research', path: '/research', eyebrow: '03 / RESEARCH LAB', description: 'Source registry, scientific documents and research context.' },
  { label: 'Compare', path: '/compare', eyebrow: '04 / COMPARISON STUDIO', description: 'Compare candidate evidence with units, coverage and provenance.' },
  { label: 'Analyze', path: '/analyze', eyebrow: '05 / ANALOG INTELLIGENCE', description: 'Evidence-backed analyses and transferability conditions.' },
  { label: 'Reports', path: '/reports', eyebrow: '06 / RESEARCH OUTPUTS', description: 'Reproducible research briefs and data exports.' },
  { label: 'Digital Twin', path: '/digital-twin', eyebrow: '07 / ROVER SIMULATION', description: 'Interactive rover mobility, terrain and thermal response simulation.' },
]

export default function App() {
  const [planet, setPlanet] = useState<Planet>('Earth')
  const [location, setLocation] = useState<ExplorerLocation>(defaultLocation('Earth'))
  const [highContrast, setHighContrast] = useState(false)

  function changePlanet(nextPlanet: Planet) {
    setPlanet(nextPlanet)
    setLocation(defaultLocation(nextPlanet))
  }

  function selectLocation(nextLocation: ExplorerLocation) {
    setPlanet(nextLocation.body)
    setLocation(nextLocation)
  }

  return (
    <AppShell
      planet={planet}
      locationOptions={locations}
      onPlanetChange={changePlanet}
      onLocationSelect={selectLocation}
      highContrast={highContrast}
      onDisplayToggle={() => setHighContrast((value) => !value)}
      sections={sections}
    >
      <Routes>
        <Route path="/" element={<Overview planet={planet} location={location} onLocationSelect={selectLocation} highContrast={highContrast} />} />
        <Route path="/explore" element={<Overview planet={planet} location={location} onLocationSelect={selectLocation} highContrast={highContrast} />} />
        <Route path="/explorer" element={<Overview planet={planet} location={location} onLocationSelect={selectLocation} highContrast={highContrast} />} />
        <Route path="/workspace" element={<MissionWorkspace planet={planet} />} />
        <Route path="/digital-twin" element={(
          <Suspense fallback={<section className="workspace-page"><p className="eyebrow"><span className="eyebrow-mark">●</span> INITIALIZING DIGITAL TWIN</p><h1>Loading simulation<span className="title-period">.</span></h1></section>}>
            <DigitalTwinPage planet={planet} onPlanetChange={changePlanet} />
          </Suspense>
        )} />
        <Route path="/discovery" element={<WorkspacePage section={{ ...sections[1], path: '/discovery' }} planet={planet} />} />
        <Route path="/comparison" element={<WorkspacePage section={{ ...sections[3], path: '/comparison' }} planet={planet} />} />
        <Route path="/transferability" element={<WorkspacePage section={{ label: 'Transferability', path: '/transferability', eyebrow: 'ANALYZE / ENVIRONMENTAL GAPS', description: 'Compare experiment conditions with explicit environmental limits and evidence status.' }} planet={planet} />} />
        <Route path="/rehearsal" element={<WorkspacePage section={{ label: 'Route rehearsal', path: '/rehearsal', eyebrow: 'MISSION / TERRAIN REHEARSAL', description: 'A bounded terrain and route-planning workspace will be available when verified DEM data is configured.' }} planet={planet} />} />
        {sections.filter((section) => section.path !== '/explore' && section.path !== '/digital-twin').map((section) => (
          <Route key={section.path} path={section.path} element={<WorkspacePage section={section} planet={planet} />} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  )
}
