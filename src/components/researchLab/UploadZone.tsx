import { useRef, useState, type DragEvent, type ChangeEvent } from 'react'
import { AlertCircle, Check, FileSpreadsheet, FileText, LoaderCircle, RotateCw, Trash2, UploadCloud, X } from 'lucide-react'
import type { UploadDocumentsResponse } from '../../lib/api/research'

export type UploadQueueItem = {
  key: string
  file: File
  status: 'uploading' | 'queued' | 'error'
  progress: number
  message?: string
  documentId?: string
  retryable?: boolean
}

const MAX_FILE_BYTES = 50 * 1024 * 1024
const ALLOWED_EXTENSIONS = new Set(['pdf', 'docx', 'csv', 'xlsx'])

function validateFile(file: File): string | null {
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!ALLOWED_EXTENSIONS.has(extension)) return 'Unsupported file type. Choose PDF, DOCX, CSV, or XLSX.'
  if (file.size > MAX_FILE_BYTES) return 'File exceeds the 50 MB limit.'
  if (file.size === 0) return 'This file is empty.'
  return null
}

function formatBytes(size: number) {
  if (size < 1024 * 1024) return `${Math.max(1, Math.round(size / 1024))} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

export function UploadZone({
  items,
  onAddFiles,
  onRetry,
  onRemove,
  onClear,
}: {
  items: UploadQueueItem[]
  onAddFiles: (files: File[]) => void
  onRetry: (key: string) => void
  onRemove: (key: string) => void
  onClear: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    onAddFiles(Array.from(event.target.files ?? []))
    event.target.value = ''
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setDragging(false)
    onAddFiles(Array.from(event.dataTransfer.files))
  }

  return (
    <section className="research-card research-upload-card" aria-labelledby="upload-title">
      <div className="research-section-heading">
        <div><span className="research-kicker">01 / INGESTION</span><h2 id="upload-title">Upload documents</h2></div>
        <button className="research-quiet-button" type="button" onClick={onClear} disabled={!items.length}>
          <Trash2 size={14} /> Clear queue
        </button>
      </div>
      <input ref={inputRef} className="visually-hidden" type="file" multiple accept=".pdf,.docx,.csv,.xlsx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFiles} aria-label="Choose PDF, DOCX, CSV, or XLSX documents" />
      <div
        className={`research-dropzone${dragging ? ' is-dragging' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={(event) => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false) }}
        onDrop={onDrop}
        role="region"
        aria-label="Document upload drop zone"
      >
        <span className="research-upload-icon"><UploadCloud size={20} /></span>
        <div><strong>Drop research files here</strong><span>PDF, DOCX, CSV, XLSX · up to 50 MB per file</span></div>
        <button className="research-primary-button" type="button" onClick={() => inputRef.current?.click()}><UploadCloud size={14} /> Upload Research</button>
      </div>

      {items.length > 0 && (
        <div className="research-queue" aria-label="Upload queue">
          <div className="research-queue-heading"><span>UPLOAD QUEUE</span><span>{items.filter((item) => item.status === 'uploading').length} ACTIVE · {items.length} FILES</span></div>
          {items.map((item) => {
            const extension = item.file.name.split('.').pop()?.toLowerCase() ?? ''
            const Icon = extension === 'csv' || extension === 'xlsx' ? FileSpreadsheet : FileText
            return (
              <div className={`research-queue-row queue-${item.status}`} key={item.key}>
                <Icon className="research-file-icon" size={16} />
                <div className="research-queue-file"><strong title={item.file.name}>{item.file.name}</strong><span>{formatBytes(item.file.size)}</span>
                  {item.status === 'uploading' && <div className="research-progress"><i style={{ width: `${item.progress}%` }} /></div>}
                  {item.message && <small role={item.status === 'error' ? 'alert' : 'status'}>{item.message}</small>}
                </div>
                {item.status === 'uploading' ? <span className="research-queue-state"><LoaderCircle size={14} className="is-spinning" /> {item.progress}%</span>
                  : item.status === 'queued' ? <span className="research-queue-state is-success"><Check size={14} /> Queued</span>
                    : <span className="research-queue-actions"><span className="research-queue-state is-error"><AlertCircle size={14} /> Error</span>{item.retryable && <button type="button" aria-label={`Retry ${item.file.name}`} onClick={() => onRetry(item.key)}><RotateCw size={14} /></button>}<button type="button" aria-label={`Remove ${item.file.name} from queue`} onClick={() => onRemove(item.key)}><X size={14} /></button></span>}
              </div>
            )
          })}
          <p className="research-queue-note">Accepted files enter the document processing queue; indexing continues in the background.</p>
        </div>
      )}
    </section>
  )
}

export function isAllowedUpload(file: File) {
  return validateFile(file)
}

export type UploadResult = UploadDocumentsResponse
