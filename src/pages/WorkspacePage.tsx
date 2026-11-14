import { Link } from 'react-router-dom'
import type { Planet, Section } from '../types'

export function WorkspacePage({ section, planet }: { section: Section; planet: Planet }) {
  return (
    <section className="workspace-page">
      <p className="eyebrow"><span className="eyebrow-mark">●</span> {section.eyebrow}</p>
      <h1>{section.label}<span className="title-period">.</span></h1>
      <p className="workspace-description">{section.description}</p>
      <div className="phase-note">
        <div className="phase-note-top"><span>APPLICATION FOUNDATION</span><span>PHASE 01 / ACTIVE BODY: {planet.toUpperCase()}</span></div>
        <div className="phase-note-body">
          <span className="phase-number">01</span>
          <p>NEBULITH is being assembled incrementally. This route is connected and ready for its planned workspace.</p>
          <Link to="/" className="text-link">RETURN TO OVERVIEW <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  )
}
