import { useEffect, useMemo, useState } from 'react'
import { BookOpenText, CalendarDays, ChevronRight, CircleAlert, Clock3, FileSpreadsheet, FileText, Filter, Search, Trash2, X } from 'lucide-react'
import type { ResearchDocument } from '../../lib/api/research'

export type StatusFilter = 'all' | 'queued' | 'parsing' | 'extracting' | 'embedding' | 'ready' | 'failed' | 'needs_ocr'
export type SortMode = 'date-desc' | 'date-asc' | 'name-asc' | 'name-desc'

export function documentTitle(document: ResearchDocument) {
  return document.title?.trim() || document.metadata?.title?.trim() || document.filename
}

function documentSize(document: ResearchDocument) {
  return document.size_bytes ?? document.file_size_bytes
}

export function DocumentLibrary({
  documents,
  selectedIds,
  onToggle,
  onView,
  onDelete,
  onExtract,
}: {
  documents: ResearchDocument[]
  selectedIds: string[]
  onToggle: (document: ResearchDocument) => void
  onView: (id: string) => void
  onDelete: (document: ResearchDocument) => void
  onExtract: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [sort, setSort] = useState<SortMode>('date-desc')
  const filtered = useMemo(() => documents
    .filter((doc) => documentTitle(doc).toLowerCase().includes(search.trim().toLowerCase()) || doc.filename.toLowerCase().includes(search.trim().toLowerCase()))
    .filter((doc) => status === 'all' || doc.status === status)
    .sort((a, b) => {
      if (sort.startsWith('name')) {
        const compare = documentTitle(a).localeCompare(documentTitle(b))
        return sort === 'name-asc' ? compare : -compare
      }
      const first = Date.parse(a.uploaded_at ?? a.created_at ?? '') || 0
      const second = Date.parse(b.uploaded_at ?? b.created_at ?? '') || 0
      return sort === 'date-asc' ? first - second : second - first
    }), [documents, search, sort, status])

  return (
    <section className="research-card research-library-card" aria-labelledby="library-title">
      <div className="research-section-heading">
        <div><span className="research-kicker">02 / SOURCE LIBRARY</span><h2 id="library-title">Document library <em>{documents.length.toString().padStart(2, '0')}</em></h2></div>
        <span className="research-selected-count">{selectedIds.length ? `${selectedIds.length} SELECTED` : 'SELECT READY SOURCES FOR ASK'}</span>
      </div>
      <div className="research-library-tools">
        <label className="research-search"><Search size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search documents" aria-label="Search documents by name" /></label>
        <label className="research-select-wrap"><Filter size={13} /><span className="visually-hidden">Filter by status</span><select value={status} onChange={(event) => setStatus(event.target.value as StatusFilter)} aria-label="Filter documents by status">
          <option value="all">All statuses</option><option value="queued">Queued</option><option value="parsing">Parsing</option><option value="extracting">Extracting</option><option value="embedding">Embedding</option><option value="ready">Ready</option><option value="failed">Failed</option><option value="needs_ocr">Needs OCR</option>
        </select></label>
        <label className="research-select-wrap"><span className="visually-hidden">Sort documents</span><select value={sort} onChange={(event) => setSort(event.target.value as SortMode)} aria-label="Sort documents">
          <option value="date-desc">Newest first</option><option value="date-asc">Oldest first</option><option value="name-asc">Name A–Z</option><option value="name-desc">Name Z–A</option>
        </select></label>
      </div>
      {filtered.length === 0 ? <div className="research-empty-library"><BookOpenText size={19} /><strong>{documents.length ? 'No matching documents' : 'Your library is empty'}</strong><span>{documents.length ? 'Try another name or status filter.' : 'Upload a paper or dataset to begin building your source library.'}</span></div> : (
        <div className="research-document-list" role="list" aria-label="Documents">
          {filtered.map((doc) => <DocumentRow key={doc.id} document={doc} selected={selectedIds.includes(doc.id)} onToggle={onToggle} onView={onView} onDelete={onDelete} onExtract={onExtract} />)}
        </div>
      )}
      <p className="research-library-footnote">Documents are indexed locally for grounded research. File metadata comes from the document or its processing record.</p>
    </section>
  )
}

function DocumentRow({ document: doc, selected, onToggle, onView, onDelete, onExtract }: {
  document: ResearchDocument
  selected: boolean
  onToggle: (document: ResearchDocument) => void
  onView: (id: string) => void
  onDelete: (document: ResearchDocument) => void
  onExtract: (id: string) => void
}) {
  const extension = doc.filename.split('.').pop()?.toLowerCase() ?? ''
  const fileType = (doc.file_type || extension).toLowerCase()
  const Icon = fileType === 'csv' || fileType === 'xlsx' ? FileSpreadsheet : FileText
  const rawProgress = doc.progress ?? 0
  const progress = Math.max(0, Math.min(100, Math.round(rawProgress <= 1 ? rawProgress * 100 : rawProgress)))
  const title = documentTitle(doc)
  return (
    <article className="research-document-row" role="listitem">
      <label className="research-check"><input type="checkbox" checked={selected} disabled={doc.status !== 'ready'} onChange={() => onToggle(doc)} aria-label={`Include ${title} in Ask sources`} /><span /></label>
      <span className={`research-document-type type-${extension}`}><Icon size={17} /></span>
      <div className="research-document-main">
        <div className="research-document-title"><strong title={title}>{title}</strong><span className="research-filetype-label">{fileType.toUpperCase()} · {formatBytes(documentSize(doc))}</span></div>
        <div className="research-document-meta">{authorsText(doc.metadata?.authors)}{doc.metadata?.year ? ` · ${doc.metadata.year}` : ''}{doc.metadata?.doi ? ` · DOI ${doc.metadata.doi}` : ''}</div>
        {doc.error_message && doc.status === 'failed' && <p className="research-document-error"><CircleAlert size={12} /> {doc.error_message}</p>}
        {doc.status === 'needs_ocr' && <p className="research-document-error"><CircleAlert size={12} /> Scanned document with no text layer</p>}
        <div className="research-row-progress"><div className="research-progress"><i style={{ width: `${doc.status === 'ready' ? 100 : progress}%` }} /></div><span>{doc.status === 'ready' ? 'Indexed' : `${progress}%`}</span><span className="research-chunk-count">{doc.chunk_count ?? doc.chunks_ready ?? '—'} chunks</span></div>
      </div>
      <div className="research-document-status"><StatusBadge status={doc.status} /><span><CalendarDays size={11} /> {formatDate(doc.uploaded_at ?? doc.created_at)}</span></div>
      <div className="research-document-actions">
        <button type="button" title="View details" aria-label={`View details for ${title}`} onClick={() => onView(doc.id)}><ChevronRight size={15} /></button>
        <button type="button" title="Extract parameters" aria-label={`Extract parameters from ${title}`} onClick={() => onExtract(doc.id)} disabled={doc.status !== 'ready'}><span className="extract-glyph">↗</span></button>
        <button type="button" title="Delete document" aria-label={`Delete ${title}`} onClick={() => onDelete(doc)}><Trash2 size={14} /></button>
      </div>
    </article>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.replaceAll('_', ' ')
  const Icon = status === 'ready' ? BookOpenText : status === 'failed' || status === 'needs_ocr' ? CircleAlert : Clock3
  return <span className={`research-status status-${status}`}><Icon size={11} /> {label}</span>
}

export function DocumentDrawer({ document, onClose }: { document: ResearchDocument | null; onClose: () => void }) {
  useEffect(() => {
    if (!document) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [document, onClose])

  if (!document) return null
  const metadata = document.metadata ?? {}
  return (
    <div className="research-drawer-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <aside className="research-drawer" role="dialog" aria-modal="true" aria-labelledby="document-drawer-title">
        <div className="research-drawer-heading"><div><span className="research-kicker">DOCUMENT RECORD</span><h2 id="document-drawer-title">Source details</h2></div><button type="button" className="research-icon-button" aria-label="Close details" onClick={onClose}><X size={17} /></button></div>
        <div className="research-drawer-file"><FileText size={20} /><div><strong>{documentTitle(document)}</strong><span>{document.filename}</span></div></div>
        <StatusBadge status={document.status} />
        <dl className="research-detail-list">
          <div><dt>File type</dt><dd>{document.file_type || document.content_type || document.filename.split('.').pop()?.toUpperCase() || 'Unknown'}</dd></div>
          <div><dt>File size</dt><dd>{formatBytes(documentSize(document))}</dd></div>
          <div><dt>Indexed chunks</dt><dd>{document.chunk_count ?? document.chunks_ready ?? 'Not reported'}</dd></div>
          <div><dt>Uploaded</dt><dd>{formatDate(document.uploaded_at ?? document.created_at, true)}</dd></div>
          <div><dt>Authors</dt><dd>{authorsText(metadata.authors) || 'Not provided'}</dd></div>
          <div><dt>Year</dt><dd>{metadata.year || 'Not provided'}</dd></div>
          <div><dt>DOI</dt><dd>{metadata.doi || 'Not provided'}</dd></div>
          <div><dt>Document ID</dt><dd className="research-id-value">{document.id}</dd></div>
        </dl>
        {document.error_message && <p className="research-drawer-error"><CircleAlert size={14} /> {document.error_message}</p>}
      </aside>
    </div>
  )
}

function authorsText(authors: unknown) {
  if (Array.isArray(authors)) return authors.map(String).join(', ')
  return typeof authors === 'string' ? authors : ''
}

function formatBytes(size?: number | null) {
  if (size == null) return 'Size unavailable'
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value?: string | null, precise = false) {
  if (!value) return 'Date unavailable'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Date unavailable'
  return new Intl.DateTimeFormat(undefined, precise ? { dateStyle: 'medium', timeStyle: 'short' } : { dateStyle: 'medium' }).format(date)
}
