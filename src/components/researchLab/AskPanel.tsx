import { useMemo, useState } from 'react'
import { BookOpenText, ChevronDown, ChevronRight, Clipboard, Clock3, LoaderCircle, MessageCircleQuestion, Send, ShieldAlert, Trash2 } from 'lucide-react'
import type { RagCitation, RagConfig, RagQueryResponse, ResearchDocument, RetrievedChunk } from '../../lib/api/research'

type AskHistoryItem = { question: string; response: RagQueryResponse; askedAt: string }

export function AskPanel({ documents, selectedIds, config, configError, onQuery }: {
  documents: ResearchDocument[]
  selectedIds: string[]
  config: RagConfig | null
  configError: string
  onQuery: (question: string, documentIds: string[] | undefined, topK: number) => Promise<RagQueryResponse>
}) {
  const [question, setQuestion] = useState('')
  const [scope, setScope] = useState<'all' | 'selected'>('all')
  const [topK, setTopK] = useState(5)
  const [loading, setLoading] = useState(false)
  const [queryError, setQueryError] = useState('')
  const [active, setActive] = useState<AskHistoryItem | null>(null)
  const [history, setHistory] = useState<AskHistoryItem[]>([])
  const [showPassages, setShowPassages] = useState(false)
  const [expandedCitations, setExpandedCitations] = useState<Set<string>>(new Set())
  const [copied, setCopied] = useState(false)
  const readyIds = useMemo(() => documents.filter((document) => document.status === 'ready').map((document) => document.id), [documents])
  const maxTopK = config?.max_top_k ?? 8
  const topKOptions = [3, 5, 8].filter((value) => value <= maxTopK)
  if (!topKOptions.length && maxTopK > 0) topKOptions.push(maxTopK)
  const selectedReadyIds = selectedIds.filter((id) => readyIds.includes(id))
  const effectiveScopeIds = scope === 'selected' ? selectedReadyIds : readyIds

  async function submit(event?: React.FormEvent) {
    event?.preventDefault()
    if (!question.trim() || loading) return
    if (!effectiveScopeIds.length) {
      setQueryError(scope === 'selected' ? 'Select at least one ready document in the library.' : 'There are no ready documents to search yet.')
      return
    }
    setLoading(true)
    setQueryError('')
    setShowPassages(false)
    setExpandedCitations(new Set())
    try {
      const response = await onQuery(question.trim(), effectiveScopeIds, Math.min(topK, maxTopK))
      const item = { question: question.trim(), response, askedAt: new Date().toISOString() }
      setActive(item)
      setHistory((current) => [item, ...current].slice(0, 5))
    } catch (error) {
      setQueryError(error instanceof Error ? error.message : 'The research query failed.')
    } finally {
      setLoading(false)
    }
  }

  async function copyAnswer() {
    if (!active) return
    try {
      await navigator.clipboard.writeText(active.response.answer)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch { setQueryError('Clipboard access is unavailable in this browser.') }
  }

  function toggleCitation(id: string) {
    setExpandedCitations((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <section className="research-card research-ask-card" aria-labelledby="ask-title">
      <div className="research-section-heading">
        <div><span className="research-kicker">03 / GROUNDED RETRIEVAL</span><h2 id="ask-title">Ask your sources</h2></div>
        <span className="research-ask-mark"><MessageCircleQuestion size={17} /></span>
      </div>
      {config?.real_llm_configured === false && <div className="research-mode-banner"><ShieldAlert size={14} /><span><strong>Mock mode:</strong> answers are not from a real model.</span><span>{config.llm_provider}</span></div>}
      {!config && configError && <div className="research-config-note"><ShieldAlert size={13} /> RAG configuration is not available from this API yet; answer provider mode is unknown.</div>}
      <form onSubmit={(event) => void submit(event)}>
        <label htmlFor="research-question" className="research-kicker">SCIENTIFIC QUESTION</label>
        <textarea id="research-question" value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void submit() } }} placeholder="Ask a question grounded in your uploaded documents…" rows={4} />
        <div className="research-ask-controls">
          <label><span>Search scope</span><select value={scope} onChange={(event) => setScope(event.target.value as 'all' | 'selected')}><option value="all">All ready documents ({readyIds.length})</option><option value="selected" disabled={!selectedReadyIds.length}>Selected documents ({selectedReadyIds.length})</option></select></label>
          <label><span>Sources to retrieve</span><select value={topK} onChange={(event) => setTopK(Number(event.target.value))}>{topKOptions.map((value) => <option key={value} value={value}>{value} sources</option>)}</select></label>
          <button className="research-primary-button research-ask-submit" type="submit" disabled={loading || !question.trim()}>{loading ? <LoaderCircle size={14} className="is-spinning" /> : <Send size={14} />}{loading ? 'Searching' : 'Ask'}</button>
        </div>
      </form>
      {queryError && <p className="research-inline-error" role="alert">{queryError}</p>}

      {active && (
        <div className="research-answer" aria-live="polite">
          <div className="research-answer-heading"><span>ANSWER</span><button type="button" onClick={() => void copyAnswer()}><Clipboard size={13} /> {copied ? 'Copied' : 'Copy answer'}</button></div>
          {active.response.citations.length === 0 ? <div className="research-not-found"><BookOpenText size={16} /><span>Not found in the provided sources</span></div> : <div className="research-answer-copy">{renderAnswer(active.response.answer, active.response.citations, toggleCitation)}</div>}
          {active.response.citations.length > 0 && <CitationList citations={active.response.citations} expanded={expandedCitations} onToggle={toggleCitation} />}
          <button className="research-passages-toggle" type="button" aria-expanded={showPassages} onClick={() => setShowPassages((value) => !value)}>{showPassages ? <ChevronDown size={14} /> : <ChevronRight size={14} />} Show retrieved passages <span>{active.response.retrieved_chunks.length}</span></button>
          {showPassages && <RetrievedPassages passages={active.response.retrieved_chunks} />}
          <div className="research-answer-footnote">{active.response.total_chunks_searched} chunks searched · {active.response.active_embedding_model}</div>
        </div>
      )}

      <div className="research-history">
        <div className="research-history-heading"><span><Clock3 size={13} /> SESSION HISTORY</span>{history.length > 0 && <button type="button" onClick={() => { setHistory([]); setActive(null) }}><Trash2 size={12} /> Clear</button>}</div>
        {history.length === 0 ? <span className="research-history-empty">Your recent questions will appear here.</span> : history.map((item, index) => <button className={`research-history-item${active === item ? ' is-active' : ''}`} key={`${item.askedAt}-${index}`} type="button" onClick={() => { setActive(item); setQuestion(item.question); setQueryError(''); setExpandedCitations(new Set()); setShowPassages(false) }}><span>{item.question}</span><small>{new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(new Date(item.askedAt))}</small></button>)}
      </div>
    </section>
  )
}

export function CitationList({ citations, expanded, onToggle }: { citations: RagCitation[]; expanded: Set<string>; onToggle: (id: string) => void }) {
  return <div className="research-citation-list"><div className="research-citation-heading">SOURCES · {citations.length}</div>{citations.map((citation, index) => {
    const isExpanded = expanded.has(citation.chunk_id)
    return <div className="research-citation" key={`${citation.chunk_id}-${index}`}>
      <button className="research-citation-trigger" type="button" aria-expanded={isExpanded} onClick={() => onToggle(citation.chunk_id)}><span className="research-citation-number">[{index + 1}]</span><span className="research-citation-title">{citation.document_title}<small>{citation.page_number == null ? 'Page unavailable' : `Page ${citation.page_number}`}</small></span>{!citation.verified && <span className="research-unverified">UNVERIFIED</span>}{isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</button>
      {isExpanded && <blockquote className="research-citation-quote">“{citation.quote}”</blockquote>}
    </div>
  })}</div>
}

function RetrievedPassages({ passages }: { passages: RetrievedChunk[] }) {
  if (!passages.length) return <p className="research-history-empty">No retrieved passages were returned.</p>
  return <div className="research-retrieved-passages">{passages.map((passage, index) => <details key={passage.chunk_id}><summary><span>[{index + 1}] {passage.document_title}</span><small>{passage.page_number == null ? 'Page —' : `Page ${passage.page_number}`} · score {passage.hybrid_score.toFixed(3)}</small></summary><p>{passage.text}</p></details>)}</div>
}

function renderAnswer(answer: string, citations: RagCitation[], onToggle: (id: string) => void) {
  const pieces = answer.split(/(\[\d+\])/g)
  return pieces.map((piece, index) => {
    const citationIndex = /^\[(\d+)\]$/.exec(piece)
    if (!citationIndex) return <span key={index}>{piece}</span>
    const citation = citations[Number(citationIndex[1]) - 1]
    if (!citation) return <span className="research-invalid-citation" key={index}>{piece}</span>
    return <button className={`research-inline-citation${citation.verified ? '' : ' is-unverified'}`} type="button" key={index} onClick={() => onToggle(citation.chunk_id)} aria-label={`Expand source ${citationIndex[1]}: ${citation.document_title}`}>{piece}</button>
  })
}

