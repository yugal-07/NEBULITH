import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, BookOpenText, Database, FlaskConical, LoaderCircle, RefreshCw } from 'lucide-react'
import { AskPanel } from '../components/researchLab/AskPanel'
import { DocumentDrawer, DocumentLibrary } from '../components/researchLab/DocumentLibrary'
import { isAllowedUpload, UploadZone, type UploadQueueItem } from '../components/researchLab/UploadZone'
import { LocationResults, UploadProgress, type ResearchLocationResult } from '../components/researchLab/LocationResults'
import { researchApi, type ExtractedParameter, type RagConfig, type ResearchDocument } from '../lib/api/research'

type LabTab = 'library' | 'ask' | 'parameters'

type Props = {
  locations: ResearchLocationResult[]
  onLocationsFound: (locations: ResearchLocationResult[]) => void
  onLocationSelect: (location: ResearchLocationResult) => void
  onClearLocations: () => void
}

function temporaryId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

function activeIngestion(status: string) {
  return !['ready', 'failed', 'needs_ocr'].includes(status)
}

export function ResearchLab({ locations, onLocationsFound, onLocationSelect, onClearLocations }: Props) {
  const [documents, setDocuments] = useState<ResearchDocument[]>([])
  const [queue, setQueue] = useState<UploadQueueItem[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [ragConfig, setRagConfig] = useState<RagConfig | null>(null)
  const [ragConfigError, setRagConfigError] = useState('')
  const [documentLoading, setDocumentLoading] = useState(true)
  const [backendError, setBackendError] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<LabTab>('library')
  const [drawerDocument, setDrawerDocument] = useState<ResearchDocument | null>(null)
  const [drawerError, setDrawerError] = useState('')
  const [extractedParameters, setExtractedParameters] = useState<ExtractedParameter[]>([])
  const [parameterDocument, setParameterDocument] = useState<ResearchDocument | null>(null)
  const [parameterError, setParameterError] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [toast, setToast] = useState('')
  const [pendingLocationIds, setPendingLocationIds] = useState<string[]>([])
  const [scanningLocations, setScanningLocations] = useState(false)
  const [locationScanError, setLocationScanError] = useState('')
  const [retryLocationIds, setRetryLocationIds] = useState<string[]>([])
  const uploadsRef = useRef<Promise<void>>(Promise.resolve())
  const activeIds = useMemo(() => documents.filter((document) => activeIngestion(document.status)).map((document) => document.id).join(','), [documents])

  const refreshDocuments = useCallback(async (showLoading = false) => {
    if (showLoading) setRefreshing(true)
    try {
      const listed = await researchApi.listAllDocuments()
      setDocuments(listed)
      setSelectedIds((current) => current.filter((id) => listed.some((document) => document.id === id && document.status === 'ready')))
      setBackendError('')
    } catch (error) {
      setBackendError(error instanceof Error ? error.message : 'The Research API is unavailable.')
    } finally {
      setDocumentLoading(false)
      setRefreshing(false)
    }
  }, [])

  const loadRagConfig = useCallback(async () => {
    try {
      setRagConfig(await researchApi.getRagConfig())
      setRagConfigError('')
    } catch (error) {
      setRagConfig(null)
      setRagConfigError(error instanceof Error ? error.message : 'RAG configuration is unavailable.')
    }
  }, [])

  useEffect(() => {
    void refreshDocuments()
    void loadRagConfig()
  }, [refreshDocuments, loadRagConfig])

  useEffect(() => {
    if (!activeIds) return
    let polling = false
    const poll = async () => {
      if (polling) return
      polling = true
      try {
        const ids = activeIds.split(',')
        const results = await Promise.allSettled(ids.map((id) => researchApi.getDocumentStatus(id)))
        const updates = new Map<string, { status: string; progress: number; error_message?: string | null; chunks_ready?: number }>()
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const value = result.value
            updates.set(value.document_id ?? value.id ?? ids[index], value)
          }
        })
        if (results.length && results.every((result) => result.status === 'rejected')) {
          setBackendError('The backend is not responding to document status requests.')
        } else if (updates.size) {
          setBackendError('')
        }
        if (updates.size) setDocuments((current) => current.map((document) => {
          const update = updates.get(document.id)
          return update ? { ...document, ...update, id: document.id, chunk_count: update.chunks_ready ?? document.chunk_count } : document
        }))
      } finally { polling = false }
    }
    const interval = window.setInterval(() => void poll(), 2000)
    return () => window.clearInterval(interval)
  }, [activeIds])

  const scanLockRef = useRef(false)
  useEffect(() => {
    if (!pendingLocationIds.length || scanLockRef.current || backendError) return
    const pendingDocuments = pendingLocationIds.map((id) => documents.find((document) => document.id === id))
    if (pendingDocuments.some((document) => !document)) return
    if (pendingDocuments.some((document) => activeIngestion(document!.status))) return

    const readyIds = pendingDocuments.filter((document) => document?.status === 'ready').map((document) => document!.id)
    const failedDocuments = pendingDocuments.filter((document) => document && ['failed', 'needs_ocr'].includes(document.status)) as ResearchDocument[]
    scanLockRef.current = true
    setLocationScanError(failedDocuments.map((document) => `${document.filename}: ${document.status === 'needs_ocr' ? 'Scanned document with no text layer.' : document.error_message || 'Document processing failed.'}`).join(' '))
    if (!readyIds.length) {
      setPendingLocationIds((current) => current.filter((id) => !pendingLocationIds.includes(id)))
      scanLockRef.current = false
      return
    }

    setScanningLocations(true)
    void Promise.allSettled(readyIds.map((id) => researchApi.getDocumentLocations(id))).then((outcomes) => {
      const found: ResearchLocationResult[] = []
      const failures: string[] = []
      const scannedTitles = new Set<string>()
      outcomes.forEach((outcome, index) => {
        if (outcome.status === 'rejected') {
          const failure = outcome.reason as { status?: number; message?: string } | undefined
          failures.push(failure?.status === 404 ? 'Location scan is not available on this backend' : failure?.status === 409 ? 'This document is not ready for a location scan.' : failure?.message || 'Location scanning failed.')
          return
        }
        const doc = documents.find((item) => item.id === readyIds[index])
        scannedTitles.add(doc?.title || doc?.filename || 'Research document')
        found.push(...outcome.value.locations.map((location) => ({
          ...location,
          document_title: doc?.title || doc?.filename || 'Research document',
          source: outcome.value.source,
        })))
      })
      if (outcomes.some((outcome) => outcome.status === 'fulfilled')) {
        const byEvidence = new Map<string, ResearchLocationResult>()
        for (const item of locations.filter((location) => !scannedTitles.has(location.document_title))) byEvidence.set(`${item.document_title}:${item.name}:${item.page_number}`, item)
        for (const item of found) byEvidence.set(`${item.document_title}:${item.name}:${item.page_number}`, item)
        onLocationsFound([...byEvidence.values()])
      }
      if (failures.length) setLocationScanError([failedDocuments.map((document) => `${document.filename}: ${document.status === 'needs_ocr' ? 'Scanned document with no text layer.' : document.error_message || 'Document processing failed.'}`).join(' '), failures.join(' ')].filter(Boolean).join(' '))
      setRetryLocationIds(readyIds.filter((_, index) => outcomes[index].status === 'rejected'))
      if (!failures.length) setRetryLocationIds([])
      setPendingLocationIds((current) => current.filter((id) => !pendingLocationIds.includes(id)))
    }).catch((error: unknown) => {
      const failure = error as { status?: number; message?: string } | undefined
      setLocationScanError(failure?.status === 404 ? 'Location scan is not available on this backend' : failure?.message || 'Location scanning failed.')
      setRetryLocationIds(readyIds)
      setBackendError(error instanceof TypeError ? 'The backend is not responding to location scan requests.' : '')
      setPendingLocationIds((current) => current.filter((id) => !pendingLocationIds.includes(id)))
    }).finally(() => {
      scanLockRef.current = false
      setScanningLocations(false)
    })
  }, [pendingLocationIds, documents, backendError, locations, onLocationsFound])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function updateQueue(key: string, updater: (item: UploadQueueItem) => UploadQueueItem) {
    setQueue((current) => current.map((item) => item.key === key ? updater(item) : item))
  }

  const performUpload = useCallback(async (item: UploadQueueItem) => {
    updateQueue(item.key, (current) => ({ ...current, status: 'uploading', progress: 0, message: 'Starting secure upload…', retryable: true } as UploadQueueItem))
    try {
      const result = await researchApi.uploadFile(item.file, (progress) => updateQueue(item.key, (current) => ({ ...current, progress })))
      const uploaded = result.documents?.[0]
      if (!uploaded) throw new Error('The API did not return a document result.')
      if (uploaded.error) {
        updateQueue(item.key, (current) => ({ ...current, status: 'error', progress: 100, retryable: true, message: uploaded.error ?? 'The API rejected this file.' }))
        await refreshDocuments()
        return
      }
      updateQueue(item.key, (current) => ({ ...current, status: 'queued', progress: 100, documentId: uploaded.document_id ?? uploaded.id ?? undefined, message: uploaded.is_duplicate ? 'This file already exists in the library.' : 'Uploaded; processing in the background.' }))
      const documentId = uploaded.document_id ?? uploaded.id
      if (documentId) setPendingLocationIds((current) => current.includes(documentId) ? current : [...current, documentId])
      await refreshDocuments()
    } catch (error) {
      updateQueue(item.key, (current) => ({ ...current, status: 'error', progress: 0, retryable: true, message: error instanceof Error ? error.message : 'Upload failed.' } as UploadQueueItem))
    }
  }, [refreshDocuments])

  function addFiles(files: File[]) {
    if (!files.length) return
    const newItems: UploadQueueItem[] = files.map((file) => {
      const validationError = isAllowedUpload(file)
      return { key: temporaryId(), file, status: validationError ? 'error' : 'uploading', progress: 0, message: validationError ?? 'Waiting to upload…', retryable: !validationError }
    })
    setQueue((current) => [...current, ...newItems])
    const accepted = newItems.filter((item) => !isAllowedUpload(item.file))
    if (accepted.length) {
      uploadsRef.current = uploadsRef.current.then(async () => {
        for (const item of accepted) await performUpload(item)
      })
    }
  }

  function retryUpload(key: string) {
    const item = queue.find((candidate) => candidate.key === key)
    if (!item || !item.retryable) return
    uploadsRef.current = uploadsRef.current.then(() => performUpload(item))
  }

  function retryLocationScan() {
    if (!retryLocationIds.length) return
    setLocationScanError('')
    setPendingLocationIds((current) => [...new Set([...current, ...retryLocationIds])])
    setRetryLocationIds([])
  }

  function toggleDocumentSelection(document: ResearchDocument) {
    const wasSelected = selectedIds.includes(document.id)
    setSelectedIds((current) => wasSelected ? current.filter((id) => id !== document.id) : [...current, document.id])
    if (!wasSelected && document.status === 'ready') {
      setLocationScanError('')
      setPendingLocationIds((current) => current.includes(document.id) ? current : [...current, document.id])
    }
  }

  async function openDocument(id: string) {
    setDrawerError('')
    const cached = documents.find((document) => document.id === id) ?? null
    setDrawerDocument(cached)
    try { setDrawerDocument(await researchApi.getDocument(id)) }
    catch (error) { setDrawerError(error instanceof Error ? error.message : 'Details could not be loaded.') }
  }

  async function deleteDocument(document: ResearchDocument) {
    if (!window.confirm(`Delete “${document.metadata?.title || document.filename}” from your library?`)) return
    try {
      await researchApi.deleteDocument(document.id)
      setDrawerDocument((current) => current?.id === document.id ? null : current)
      setSelectedIds((current) => current.filter((id) => id !== document.id))
      setToast('Document deleted from the library.')
      await refreshDocuments()
    } catch (error) { setToast(error instanceof Error ? error.message : 'Document could not be deleted.') }
  }

  async function submitQuestion(question: string, documentIds: string[] | undefined, topK: number) {
    return researchApi.query({ question, document_ids: documentIds, top_k: topK })
  }

  async function extractParameters(id: string) {
    const document = documents.find((candidate) => candidate.id === id) ?? null
    setParameterDocument(document)
    setActiveTab('parameters')
    setExtracting(true)
    setParameterError('')
    setExtractedParameters([])
    try {
      const result = await researchApi.extractDocument(id)
      setExtractedParameters(result.parameters)
      const saved = await researchApi.getDocumentParameters(id)
      if (saved.length) setExtractedParameters(saved)
    } catch (error) {
      setParameterError(error instanceof Error ? error.message : 'Parameter extraction is unavailable.')
    } finally { setExtracting(false) }
  }

  const connectionState = backendError ? 'offline' : documentLoading ? 'checking' : 'online'
  const readingDocument = pendingLocationIds.some((id) => {
    const document = documents.find((item) => item.id === id)
    return !document || activeIngestion(document.status)
  })

  return (
    <section className="research-lab">
      <header className="research-lab-header">
        <div><p className="eyebrow"><span className="eyebrow-mark">●</span> 03 / SCIENTIFIC KNOWLEDGE</p><h1>Research Lab<span className="title-period">.</span></h1><p className="workspace-description">Build a traceable library and ask grounded questions across your research sources.</p></div>
        <div className={`research-connection connection-${connectionState}`} role="status"><i />{connectionState === 'online' ? 'API CONNECTED' : connectionState === 'checking' ? 'CONNECTING' : 'BACKEND OFFLINE'}</div>
      </header>

      {backendError ? <div className="research-offline-panel"><span className="research-offline-icon"><AlertCircle size={18} /></span><div><strong>Backend offline</strong><p>{backendError}</p><span>Check that the NEBULITH API is running at {researchApi.baseUrl}.</span></div><button className="research-primary-button" type="button" onClick={() => { setDocumentLoading(true); void refreshDocuments(true); void loadRagConfig() }}><RefreshCw size={14} /> Retry connection</button></div> : (
        <>
          <UploadZone items={queue} onAddFiles={addFiles} onRetry={retryUpload} onRemove={(key) => setQueue((current) => current.filter((item) => item.key !== key))} onClear={() => setQueue((current) => current.filter((item) => item.status === 'uploading'))} />
          <UploadProgress phase={scanningLocations ? 'scanning' : readingDocument ? 'reading' : null} />
          {locationScanError && <div className="research-scan-error" role="alert"><span>{locationScanError}</span>{retryLocationIds.length > 0 && <button type="button" className="research-quiet-button" onClick={retryLocationScan}>Retry location scan</button>}</div>}
          <LocationResults locations={locations} onSelect={onLocationSelect} onClear={onClearLocations} />
          <nav className="research-lab-tabs" aria-label="Research Lab sections" role="tablist">
            <button type="button" role="tab" aria-selected={activeTab === 'library'} className={activeTab === 'library' ? 'is-active' : ''} onClick={() => setActiveTab('library')}><Database size={14} /> Library <span>{documents.length}</span></button>
            <button type="button" role="tab" aria-selected={activeTab === 'ask'} className={activeTab === 'ask' ? 'is-active' : ''} onClick={() => setActiveTab('ask')}><BookOpenText size={14} /> Ask sources</button>
            <button type="button" role="tab" aria-selected={activeTab === 'parameters'} className={activeTab === 'parameters' ? 'is-active' : ''} onClick={() => setActiveTab('parameters')}><FlaskConical size={14} /> Parameters <span className="research-tab-soon">SOON</span></button>
            <button className="research-refresh-button" type="button" disabled={refreshing || documentLoading} onClick={() => void refreshDocuments(true)} aria-label="Refresh document library">{refreshing || documentLoading ? <LoaderCircle size={14} className="is-spinning" /> : <RefreshCw size={14} />} Refresh</button>
          </nav>

          {documentLoading ? <div className="research-state-card"><LoaderCircle size={18} className="is-spinning" /><span>Loading your source library…</span></div> : (
            <>
              <div className={`research-workspace-grid${activeTab === 'ask' ? ' is-ask' : ''}`} hidden={activeTab === 'parameters'}>
                <div className="research-library-pane" hidden={activeTab === 'ask'}><DocumentLibrary documents={documents} selectedIds={selectedIds} onToggle={toggleDocumentSelection} onView={(id) => void openDocument(id)} onDelete={(document) => void deleteDocument(document)} onExtract={(id) => void extractParameters(id)} /></div>
                <div className="research-ask-pane"><AskPanel documents={documents} selectedIds={selectedIds} config={ragConfig} configError={ragConfigError} onQuery={submitQuestion} /></div>
              </div>
              <div className="research-parameters-placeholder" hidden={activeTab !== 'parameters'}><span className="research-placeholder-icon"><FlaskConical size={19} /></span><span className="research-kicker">PARAMETER EXTRACTION</span><h2>Environmental parameters</h2><p>{parameterDocument ? `Source: ${parameterDocument.title || parameterDocument.filename}` : 'Extract verified environmental values from an indexed source.'}</p>{parameterError && <p className="research-inline-error" role="alert">{parameterError}</p>}{extracting ? <div className="research-state-card"><LoaderCircle size={17} className="is-spinning" /> Extracting and checking source quotes…</div> : extractedParameters.length ? <div className="research-parameters-list">{extractedParameters.map((item, index) => <article key={item.id ?? `${item.parameter_name}-${index}`}><div><strong>{item.parameter_name.replaceAll('_', ' ')}</strong><span>{item.is_missing ? 'NOT FOUND' : item.is_conflict ? 'CONFLICT' : 'EXTRACTED'}</span></div><p>{item.normalized_value == null ? String(item.raw_value ?? 'No value reported') : String(item.normalized_value)} {item.normalized_unit ?? item.unit ?? ''}</p>{item.page_number != null && <small>PAGE {item.page_number}</small>}{item.verbatim_quote && <blockquote>“{item.verbatim_quote}”</blockquote>}</article>)}</div> : <><div className="research-endpoint-note"><code>POST /api/v1/documents/{'{id}'}/extract</code><code>GET /api/v1/documents/{'{id}'}/parameters</code></div><span className="research-history-empty">Choose “Extract parameters” on an indexed document to review verified values and source quotes.</span></>}</div>
            </>
          )}
        </>
      )}
      {drawerError && <div className="research-toast is-error" role="alert">{drawerError}</div>}
      {toast && <div className="research-toast" role="status">{toast}</div>}
      <DocumentDrawer document={drawerDocument} onClose={() => { setDrawerDocument(null); setDrawerError('') }} />
    </section>
  )
}
