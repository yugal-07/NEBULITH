export type Study = {
  study_id: string
  title: string
  target_body: 'earth' | 'moon' | 'mars'
  target_region_id: string | null
  mission_profile_id: string | null
  weights: Record<string, number>
  constraints: Record<string, unknown>
  candidate_ids: string[]
  created_at: string
  updated_at: string
  data_snapshot_id: string | null
  algorithm_version: string | null
}

export type CatalogStatus = {
  status: 'not_configured' | 'available'
  message: string
}

const API = import.meta.env.VITE_API_BASE_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => null)
    throw new Error(payload?.error?.message ?? `Request failed (${response.status})`)
  }
  return response.json() as Promise<T>
}

export const api = {
  sources: () => request<CatalogStatus & { items: unknown[] }>('/api/v1/sources'),
  studies: () => request<Study[]>('/api/v1/studies'),
  createStudy: (title: string, target_body: Study['target_body']) =>
    request<Study>('/api/v1/studies', { method: 'POST', body: JSON.stringify({ title, target_body }) }),
}
