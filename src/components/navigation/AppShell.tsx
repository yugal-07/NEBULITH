import { useMemo, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { CircleUserRound, Search, Sun, X } from 'lucide-react'
import type { ExplorerLocation } from '../../data/locations'
import type { Planet, Section } from '../../types'

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
  const normalizedQuery = query.trim().toLowerCase()
  const results = useMemo(() => {
    if (!normalizedQuery || normalizedQuery.includes(',')) return []
    return locationOptions.filter((location) => location.name.toLowerCase().includes(normalizedQuery)).slice(0, 4)
  }, [locationOptions, normalizedQuery])

  function selectSearchResult(location?: ExplorerLocation) {
    if (location) {
      onLocationSelect(location)
      setQuery(location.name)
    } else {
      const match = query.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/)
      if (!match) return
      const latitude = Number(match[1])
      const longitude = Number(match[2])
      if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return
      onLocationSelect({ name: 'Selected coordinates', body: planet, latitude, longitude, description: 'Coordinate selected from search', terrain: 'Unclassified' })
      setQuery(`${latitude.toFixed(2)}, ${longitude.toFixed(2)}`)
    }
    setSearchOpen(false)
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
              <button
                className={`planet-option ${planet === body ? 'is-selected' : ''}`}
                key={body}
                type="button"
                aria-pressed={planet === body}
                onClick={() => onPlanetChange(body)}
              >
                <span className={`planet-dot ${body.toLowerCase()}`} />{body}
              </button>
            ))}
          </div>

          <nav className="primary-nav" aria-label="Primary navigation">
            {sections.map((section) => (
              <NavLink key={section.path} to={section.path} end={section.path === '/explore'} className={({ isActive }) => `nav-link${isActive || (section.path === '/explore' && window.location.pathname === '/') ? ' active' : ''}`}>
                <span className="nav-dot">•</span>{section.label}
              </NavLink>
            ))}
          </nav>

          <div className="toolbar-utilities">
            <div className={`search-control${searchOpen ? ' search-open' : ''}`}>
              {searchOpen && (
                <form className="search-form" onSubmit={(event) => { event.preventDefault(); selectSearchResult(results[0]) }}>
                  <input
                    autoFocus
                    aria-label="Search places or coordinates"
                    placeholder="Place or lat, lon"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Escape') setSearchOpen(false) }}
                  />
                </form>
              )}
              <button className="utility-button" type="button" aria-label={searchOpen ? 'Close location search' : 'Search locations'} onClick={() => { setSearchOpen((value) => !value); setQuery('') }}>
                {searchOpen ? <X /> : <Search />}
              </button>
              {searchOpen && normalizedQuery && (
                <div className="search-results" role="listbox" aria-label="Location search results">
                  {normalizedQuery.includes(',') ? (
                    <button type="button" onClick={() => selectSearchResult()}><span>◎</span><span>Go to coordinates<small>{query}</small></span><b>{planet.toUpperCase()}</b></button>
                  ) : results.length ? results.map((location) => (
                    <button key={location.name} type="button" onClick={() => selectSearchResult(location)}>
                      <span>◎</span><span>{location.name}<small>{location.description}</small></span><b>{location.body.toUpperCase()}</b>
                    </button>
                  )) : <p>No indexed demonstration locations found.</p>}
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
        <span><span className="status-indicator" /> VISUAL SURFACE MAPS <span className="footer-divider">·</span> SCIENTIFIC DATA NOT CONNECTED</span>
      </footer>
    </div>
  )
}
