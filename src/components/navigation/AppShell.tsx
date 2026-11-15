import { useEffect, useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CircleUserRound, Search, Sun, X } from 'lucide-react'
import type { ExplorerLocation } from '../../data/locations'
import { planetaryFeatures } from '../../data/planetaryFeatures'
import type { Planet, Section } from '../../types'

type GeocodeResult = { name: string; latitude: number; longitude: number }

type Props = {
  planet: Planet
  onPlanetChange: (planet: Planet) => void
  onLocationSelect: (location: ExplorerLocation) => void
  locationOptions: ExplorerLocation[]
  highContrast: boolean
  onDisplayToggle: () => void
  sections: Section[]
  children: React.ReactNode
}

export function AppShell({ planet, onPlanetChange, onLocationSelect, locationOptions, highContrast, onDisplayToggle, sections, children }: Props) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchBusy, setSearchBusy] = useState(false)
  const [searchError, setSearchError] = useState('')
  const [geocodeResults, setGeocodeResults] = useState<GeocodeResult[]>([])
  const normalizedQuery = query.trim().toLowerCase()
  const localResults = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.includes(',')) return []
    const candidates = planet === 'Earth' ? locationOptions : planetaryFeatures(planet)
    return candidates.filter((location) => location.name.toLowerCase().includes(normalizedQuery)).slice(0, 4)
  }, [locationOptions, normalizedQuery, planet])

  useEffect(() => {
    setGeocodeResults([])
    setSearchError('')
  }, [planet])

  function selectCoordinate() {
    const match = query.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/)
    if (!match) return
    const latitude = Number(match[1])
    const longitude = Number(match[2])
    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      setSearchError('Latitude must be within ±90° and longitude within ±180°.')
      return
    }
    onLocationSelect({ name: 'Selected coordinates', body: planet, latitude, longitude, description: 'Coordinate selected from search', terrain: 'Unclassified' })
    setQuery(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
    closeSearch()
  }

  function selectLocal(location: ExplorerLocation) {
    onLocationSelect(location)
    setQuery(location.name)
    closeSearch()
  }

  function selectGeocoded(result: GeocodeResult) {
    const name = result.name.split(',')[0]?.trim() || result.name
    onLocationSelect({ name, body: 'Earth', latitude: result.latitude, longitude: result.longitude, description: result.name, terrain: 'Unclassified' })
    setQuery(name)
    closeSearch()
  }

  function closeSearch() {
    setSearchOpen(false)
    setSearchError('')
    setGeocodeResults([])
  }

  async function submitSearch() {
    if (query.includes(',')) {
      selectCoordinate()
      return
    }
    if (query.trim().length < 2) {
      setSearchError('Enter a place name or coordinates.')
      return
    }
    if (planet !== 'Earth') {
      const match = localResults[0]
      if (match) {
        selectLocal(match)
        return
      }
      setSearchError(`No curated ${planet} feature matches that search.`)
      return
    }
    setSearchBusy(true)
    setSearchError('')
    try {
      const params = new URLSearchParams({ q: query.trim() })
      const response = await fetch(`/api/v1/geocode?${params}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) throw new Error(payload?.error?.message ?? 'Place search is unavailable.')
      const result = payload as { items: GeocodeResult[] }
      setGeocodeResults(result.items)
      if (!result.items.length) setSearchError('Nominatim found no matching places.')
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Place search is unavailable.')
    } finally {
      setSearchBusy(false)
    }
  }

  return (
    <div className={`app-shell${highContrast ? ' high-contrast' : ''}`}>
      <header className="toolbar-position">
        <div className="topbar">
          <Link className="brand" to="/" aria-label="NEBULITH home">
            <span className="brand-mark" aria-hidden="true"><i /><i /><i /></span>
            <span className="brand-wordmark">NEBULITH</span>
          </Link>

          <div className="planet-switcher" role="group" aria-label="Select planetary body">
            {(['Earth', 'Moon', 'Mars'] as const).map((body) => (
              <button className={`planet-option ${planet === body ? 'is-selected' : ''}`} key={body} type="button" aria-pressed={planet === body} onClick={() => onPlanetChange(body)}>
                <span className={`planet-dot ${body.toLowerCase()}`} />{body}
              </button>
            ))}
          </div>

          <nav className="primary-nav" aria-label="Primary navigation">
            {sections.map((section) => (
              <NavLink key={section.path} to={section.path} end={section.path === '/explore'} className={({ isActive }) => `nav-link${isActive || (section.path === '/explore' && window.location.pathname === '/') ? ' active' : ''}`}>
                <span className="nav-dot">•</span>
              </NavLink>
            ))}
          </nav>

          <div className="toolbar-utilities">
            <div className={`search-control${searchOpen ? ' search-open' : ''}`}>
              {searchOpen && (
                <form className="search-form" onSubmit={(event) => { event.preventDefault(); void submitSearch() }}>
                  <input autoFocus aria-label="Search places or coordinates" placeholder="Place or lat, lon" value={query} onChange={(event) => { setQuery(event.target.value); setSearchError(''); setGeocodeResults([]) }} onKeyDown={(event) => { if (event.key === 'Escape') closeSearch() }} />
                </form>
              )}
              <button className="utility-button" type="button" aria-label={searchOpen ? 'Close location search' : 'Search locations'} onClick={() => { if (searchOpen) closeSearch(); else { setSearchOpen(true); setQuery('') } }}>
                {searchOpen ? <X /> : <Search />}
              </button>
              {searchOpen && normalizedQuery && (
                <div className="search-results" role="listbox" aria-label="Location search results">
                  {normalizedQuery.includes(',') ? (
                    <button type="button" onClick={selectCoordinate}><span>⌖</span><span>Go to coordinates<small>{query}</small></span><b>{planet.toUpperCase()}</b></button>
                  ) : geocodeResults.length ? geocodeResults.map((result) => (
                    <button key={`${result.latitude}:${result.longitude}`} type="button" onClick={() => selectGeocoded(result)}><span>⌖</span><span>{result.name}<small>Nominatim · OpenStreetMap</small></span><b>EARTH</b></button>
                  )) : localResults.map((location) => (
                    <button key={location.name} type="button" onClick={() => selectLocal(location)}><span>⌖</span><span>{location.name}<small>{location.description}</small></span><b>{location.body.toUpperCase()}</b></button>
                  ))}
                  {!normalizedQuery.includes(',') && (planet === 'Earth'
                    ? <button className="search-geocode-action" type="button" disabled={searchBusy} onClick={() => void submitSearch()}><span>{searchBusy ? '…' : '⌕'}</span><span>{searchBusy ? 'Searching…' : 'Search with Nominatim'}<small>Manual search · Earth locations</small></span><b>↵</b></button>
                    : <button className="search-geocode-action" type="button" onClick={() => void submitSearch()}><span>⌕</span><span>Search curated {planet} features<small>Local landmark list · no geocoding</small></span><b>↵</b></button>)}
                  {searchError && <p role="status" className="search-error">{searchError}</p>}
                </div>
              )}
            </div>
            <button className={`utility-button display-toggle${highContrast ? ' selected' : ''}`} type="button" aria-label={`Display mode: ${highContrast ? 'high contrast' : 'cinematic'}`} aria-pressed={highContrast} onClick={onDisplayToggle}><Sun /></button>
            <Link className="utility-button workspace-button" to="/workspace" aria-label="Open workspace"><CircleUserRound /><span>WORKSPACE</span></Link>
          </div>
        </div>
      </header>
      <main className="main-content">{children}</main>
      <footer className="app-footer">
        <span>NEBULITH <span className="footer-separator">/</span> PLANETARY EXPLORATION</span>
        <span><span className="status-indicator" /> SURFACE IMAGERY <span className="footer-divider">·</span> ELEVATION COVERAGE IS LOCATION-DEPENDENT</span>
      </footer>
    </div>
  )
}
