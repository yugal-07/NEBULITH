import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpRight, Database, FolderPlus, RefreshCw } from 'lucide-react'
import type { Planet } from '../types'
import { api, type Study } from '../services/api'

const bodyName = (body: Planet) => body.toLowerCase() as Study['target_body']

export function MissionWorkspace({ planet }: { planet: Planet }) {
  const [studies, setStudies] = useState<Study[]>([])
  const [sourceState, setSourceState] = useState('Checking data catalog…')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setError('')
    try {
      const [items, sources] = await Promise.all([api.studies(), api.sources()])
      setStudies(items)
      setSourceState(sources.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The local API is unavailable.')
      setSourceState('API unavailable')
    }
  }, [])

  useEffect(() => { void refresh() }, [refresh])

  async function createStudy() {
    setBusy(true)
    setError('')
    try {
      await api.createStudy(`${planet} mission study`, bodyName(planet))
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create the study.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mission-workspace">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow"><span className="eyebrow-mark">●</span> LOCAL MISSION WORKSPACE</p>
          <h1>Mission studies<span className="title-period">.</span></h1>
          <p className="workspace-description">Create and revisit research studies. Evidence is added only when its source and coverage are verified.</p>
        </div>
        <button className="create-study-button" type="button" onClick={() => void createStudy()} disabled={busy}>
          <FolderPlus size={16} /> {busy ? 'CREATING…' : 'NEW STUDY'}
        </button>
      </div>

      <div className="workspace-status-card">
        <div className="status-card-icon"><Database size={17} /></div>
        <div><strong>Scientific data catalog</strong><p>{sourceState}</p></div>
        <span className="catalog-state"><i /> NOT CONFIGURED</span>
      </div>

      {error && <div className="workspace-error" role="alert">{error} <button type="button" onClick={() => void refresh()}><RefreshCw size={13} /> Retry</button></div>}

      <div className="study-list-heading"><span>SAVED STUDIES</span><span>{studies.length.toString().padStart(2, '0')}</span></div>
      {studies.length ? <div className="study-list">{studies.map((study) => (
        <article className="study-card" key={study.study_id}>
          <div className="study-card-top"><span className={`planet-dot ${study.target_body}`} />{study.target_body.toUpperCase()}<span>{new Date(study.updated_at).toLocaleDateString()}</span></div>
          <h2>{study.title}</h2>
          <p>Target AOI not selected <span>·</span> Mission profile not selected</p>
          <Link to="/explorer" className="study-open-link">OPEN EXPLORER <ArrowUpRight size={13} /></Link>
        </article>
      ))}</div> : <div className="empty-studies"><span>NO STUDIES YET</span><p>Create a local study to save a target body and continue when data sources are connected.</p><button type="button" onClick={() => void createStudy()} disabled={busy}>CREATE {planet.toUpperCase()} STUDY <ArrowUpRight size={13} /></button></div>}
    </section>
  )
}
