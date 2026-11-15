import { LoaderCircle, MapPin, X } from 'lucide-react'
import type { DocumentLocation } from '../../lib/api/research'

export type ResearchLocationResult = DocumentLocation & { document_title: string; source: 'llm' | 'gazetteer_fallback' }

export function UploadProgress({ phase, message }: { phase: 'reading' | 'scanning' | null; message?: string }) {
  if (!phase && !message) return null
  const label = message ?? (phase === 'reading' ? 'Reading document...' : 'AI is scanning for locations...')
  return (
    <div className="research-document-progress" role="status" aria-live="polite">
      {phase && <LoaderCircle size={15} className="is-spinning" />}
      <span>{label}</span>
    </div>
  )
}

export function LocationResults({
  locations,
  onSelect,
  onClear,
  compact = false,
}: {
  locations: ResearchLocationResult[]
  onSelect: (location: ResearchLocationResult) => void
  onClear: () => void
  compact?: boolean
}) {
  return (
    <section className={`research-card research-location-results${compact ? ' is-compact' : ''}`} aria-labelledby="research-location-results-title">
      <div className="research-section-heading">
        <div>
          <span className="research-kicker">DOCUMENT EXTRACTION</span>
          <h2 id="research-location-results-title">Locations mentioned in your documents</h2>
        </div>
        {locations.length > 0 && <button type="button" className="research-quiet-button" onClick={onClear} aria-label="Clear document location results"><X size={13} /> Clear results</button>}
      </div>
      {locations.length === 0 ? <p className="research-location-empty">Upload a research document to find locations mentioned in its verified source text.</p> : <ul className="research-location-list">
        {locations.map((location, index) => {
          const resolved = location.lat != null && location.lng != null
          return <li className="research-location-item" key={`${location.document_title}-${location.name}-${location.page_number}-${index}`}>
            <div className="research-location-details">
              <MapPin size={15} />
              <div className="research-location-main">
                <strong>{location.name}</strong>
                <small>{location.country || 'Country not specified'} <i>·</i> {resolved ? `${location.lat!.toFixed(4)}°, ${location.lng!.toFixed(4)}°` : 'No coordinates found'} <i>·</i> {location.page_number == null ? 'Page unavailable' : `Page ${location.page_number}`}</small>
                <small className="research-location-source">{location.document_title}</small>
                <blockquote>“{location.quote}”</blockquote>
              </div>
            </div>
            <div className="research-location-actions">
              {location.source === 'gazetteer_fallback' && <span className="research-gazetteer-badge">Gazetteer match (no AI)</span>}
              <button type="button" className="research-view-earth" disabled={!resolved} onClick={() => onSelect(location)}>View on Earth</button>
            </div>
          </li>
        })}
      </ul>}
    </section>
  )
}
