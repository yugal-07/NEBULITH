export type DocumentStatus = 'queued' | 'parsing' | 'extracting' | 'embedding' | 'ready' | 'failed' | 'needs_ocr' | string

export type DocumentMetadata = {
  title?: string | null
  authors?: string[] | string | null
  year?: number | string | null
  doi?: string | null
  [key: string]: unknown
}

export type ResearchDocument = {
  id: string
  title?: string | null
  filename: string
  file_type?: string | null
  size_bytes?: number | null
  content_type?: string | null
  file_size_bytes?: number | null
  file_hash?: string | null
  status: DocumentStatus
  progress: number
  error_message?: string | null
  metadata?: DocumentMetadata | null
  created_at?: string | null
  uploaded_at?: string | null
  updated_at?: string | null
  chunk_count?: number | null
  chunks_ready?: number | null
}

export type DocumentStatusResponse = Pick<ResearchDocument, 'filename' | 'status' | 'progress' | 'error_message'> & {
  id?: string
  document_id?: string
  chunks_ready?: number
  updated_at?: string | null
}

export type UploadedDocumentResult = {
  id?: string | null
  document_id?: string | null
  filename: string
  status?: DocumentStatus | null
  is_duplicate?: boolean | null
  error?: string | null
}

export type UploadDocumentsResponse = {
  message: string
  total_files: number
  successful_count: number
  failed_count: number
  documents: UploadedDocumentResult[]
}

export type DocumentListParams = { limit?: number; offset?: number }

export type RagConfig = {
  llm_provider: string
  real_llm_configured: boolean
  embedding_model: string
  max_top_k: number
}

export type RagConfigResponse = {
  active_llm_provider?: string
  is_real_llm_configured?: boolean
  llm_provider?: string
  real_llm_configured?: boolean
  embedding_model: string
  embedding_dimension?: number
  max_top_k: number
}

export type RagCitation = {
  chunk_id: string
  document_id: string
  document_title: string
  page_number: number | null
  quote: string
  verified: boolean
}

export type RetrievedChunk = {
  chunk_id: string
  document_id: string
  document_title: string
  page_number: number | null
  section: string | null
  text: string
  similarity_score: number
  bm25_score: number
  hybrid_score: number
}

export type RagQueryRequest = {
  question: string
  document_ids?: string[]
  top_k: number
}

export type RagQueryResponse = {
  question: string
  answer: string
  citations: RagCitation[]
  retrieved_chunks: RetrievedChunk[]
  active_embedding_model: string
  total_chunks_searched: number
}

export type ExtractedParameter = {
  id?: string | null
  document_id: string
  chunk_id?: string | null
  parameter_name: string
  raw_value?: unknown
  normalized_value?: unknown
  unit?: string | null
  normalized_unit?: string | null
  confidence?: number | null
  page_number?: number | null
  verbatim_quote?: string | null
  extraction_method?: string
  is_missing?: boolean
  is_conflict?: boolean
  conflict_details?: Record<string, unknown> | null
}

export type ExtractionResultResponse = {
  document_ids: string[]
  total_parameters_evaluated: number
  found_parameters_count: number
  missing_parameters_count: number
  conflict_count: number
  parameters: ExtractedParameter[]
}

export type DocumentParametersResponse = ExtractedParameter[]

export type DocumentLocation = {
  name: string
  country: string | null
  lat: number | null
  lng: number | null
  quote: string
  page_number: number | null
}

export type DocumentLocationsResponse = {
  document_id: string
  locations: DocumentLocation[]
  source: 'llm' | 'gazetteer_fallback'
}

export type ApiError = Error & { status?: number; details?: unknown }

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')
const DEFAULT_TIMEOUT_MS = 20_000

function errorFromPayload(payload: unknown, status: number): ApiError {
  const body = payload as { detail?: unknown; error?: { message?: string }; message?: string } | null
  const detail = body?.detail
  const detailMessage = Array.isArray(detail)
    ? detail.map((item) => typeof item === 'object' && item !== null && 'msg' in item ? String(item.msg) : String(item)).join('; ')
    : typeof detail === 'string' ? detail : undefined
  const error = new Error(body?.error?.message ?? body?.message ?? detailMessage ?? `Request failed (${status})`) as ApiError
  error.status = status
  error.details = detail
  return error
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T
  const payload = await response.json().catch(() => null)
  if (!response.ok) throw errorFromPayload(payload, response.status)
  return payload as T
}

async function request<T>(path: string, init: RequestInit = {}, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      headers: { ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }), ...init.headers },
    })
    return await parseResponse<T>(response)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)} seconds.`)
    throw error
  } finally {
    window.clearTimeout(timeout)
  }
}

function uploadDocuments(files: File[], onProgress: (progress: number) => void = () => undefined): Promise<UploadDocumentsResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${API_BASE_URL}/api/v1/documents`)
    xhr.timeout = 120_000
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.min(99, Math.round(event.loaded / event.total * 100)))
    }
    xhr.onload = () => {
      let payload: unknown = null
      try { payload = xhr.responseText ? JSON.parse(xhr.responseText) : null } catch { payload = null }
      if (xhr.status < 200 || xhr.status >= 300) {
        reject(errorFromPayload(payload, xhr.status))
        return
      }
      onProgress(100)
      resolve(payload as UploadDocumentsResponse)
    }
    xhr.onerror = () => reject(new Error('Upload failed. Check your connection and retry.'))
    xhr.ontimeout = () => reject(new Error('Upload timed out after 120 seconds.'))
    const form = new FormData()
    files.forEach((file) => form.append('files', file, file.name))
    xhr.send(form)
  })
}

function uploadFile(file: File, onProgress: (progress: number) => void): Promise<UploadDocumentsResponse> {
  return uploadDocuments([file], (progress) => onProgress(progress))
}

export const researchApi = {
  baseUrl: API_BASE_URL,
  listDocuments: (params: DocumentListParams = {}) => {
    const search = new URLSearchParams()
    if (params.limit != null) search.set('limit', String(params.limit))
    if (params.offset != null) search.set('offset', String(params.offset))
    return request<ResearchDocument[]>(`/api/v1/documents${search.size ? `?${search}` : ''}`)
  },
  listAllDocuments: async () => {
    const pageSize = 200
    const all: ResearchDocument[] = []
    let offset = 0
    while (true) {
      const page = await researchApi.listDocuments({ limit: pageSize, offset })
      if (page.length && page.every((item) => all.some((existing) => existing.id === item.id))) return all
      all.push(...page)
      if (page.length < pageSize) return all
      offset += pageSize
    }
  },
  getDocument: (id: string) => request<ResearchDocument & { chunk_count: number }>(`/api/v1/documents/${encodeURIComponent(id)}`),
  getDocumentStatus: (id: string) => request<DocumentStatusResponse>(`/api/v1/documents/${encodeURIComponent(id)}/status`),
  deleteDocument: (id: string) => request<void>(`/api/v1/documents/${encodeURIComponent(id)}`, { method: 'DELETE' }),
  uploadFile,
  uploadDocuments,
  getRagConfig: async () => {
    const response = await request<RagConfigResponse>('/api/v1/rag/config')
    const provider = response.llm_provider ?? response.active_llm_provider
    const configured = response.real_llm_configured ?? response.is_real_llm_configured
    if (!provider || typeof configured !== 'boolean') throw new Error('The RAG config response is missing provider status fields.')
    return {
      llm_provider: provider,
      real_llm_configured: configured,
      embedding_model: response.embedding_model,
      max_top_k: response.max_top_k,
    } satisfies RagConfig
  },
  query: (body: RagQueryRequest) => request<RagQueryResponse>('/api/v1/rag/query', { method: 'POST', body: JSON.stringify(body) }, 90_000),
  extractDocument: (id: string) => request<ExtractionResultResponse>(`/api/v1/documents/${encodeURIComponent(id)}/extract`, { method: 'POST' }),
  getDocumentParameters: (id: string) => request<DocumentParametersResponse>(`/api/v1/documents/${encodeURIComponent(id)}/parameters`),
  getDocumentLocations: (id: string, refresh = false) => request<DocumentLocationsResponse>(`/api/v1/documents/${encodeURIComponent(id)}/locations${refresh ? '?refresh=true' : ''}`, { method: 'POST' }, 90_000),
  getAnalysisLocations: (documentIds: string[], refresh = false) => request<{ document_ids: string[]; locations: DocumentLocation[]; is_mock: boolean; mock_label?: string | null }>(`/api/v1/analysis/locations${refresh ? '?refresh=true' : ''}`, { method: 'POST', body: JSON.stringify({ document_ids: documentIds }) }, 90_000),
}
