import { useEffect, useRef, useState } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { ACCEPTED_FILE_TYPES, SUPPORTED_FORMATS } from '../constants'
import {
  askAssistant,
  reAssess,
  runExtraction,
  setSourceText,
} from '../features/ai/aiSlice'
import {
  AlertIcon,
  CheckCircleIcon,
  DocIcon,
  SendIcon,
  SparklesIcon,
} from './Icons'

function chipClass(value: string | null): string {
  if (!value) return ''
  const v = value.toLowerCase()
  if (v === 'critical') return 'chip-critical'
  if (v === 'high' || v === 'major') return 'chip-high'
  if (v === 'medium' || v === 'minor') return 'chip-medium'
  return 'chip-low'
}

/** Flatten markdown/HTML leftovers from the model into readable plain text. */
function cleanMessageText(text: string): string {
  return text
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|tr)>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/^\s*\|.*\|\s*$/gm, (line) => {
      // drop markdown table separator rows like |---|---|
      if (/^[\s|:-]+$/.test(line)) return ''
      return line.replace(/\s*\|\s*/g, '  ·  ').replace(/^\s*\|\s*/, '').replace(/\s*\|\s*$/, '')
    })
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export default function AIAssistantPanel() {
  const dispatch = useAppDispatch()
  const {
    sourceText,
    phase,
    progress,
    statusMessage,
    assessment,
    sourceFilename,
    error,
    messages,
    chatBusy,
    reAssessing,
  } = useAppSelector((s) => s.ai)
  const form = useAppSelector((s) => s.deviation.form)

  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [question, setQuestion] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const busy = phase === 'extracting'

  const extractFile = (chosen: File) => {
    setFile(chosen)
    void dispatch(runExtraction({ file: chosen }))
  }

  const extractFromText = () => {
    if (!sourceText.trim() || busy) return
    setFile(null)
    void dispatch(runExtraction({ text: sourceText }))
  }

  const runPrimary = () => {
    if (busy) return
    if (sourceText.trim()) extractFromText()
    else if (file) void dispatch(runExtraction({ file }))
  }

  const submitQuestion = (e: React.FormEvent) => {
    e.preventDefault()
    const q = question.trim()
    if (!q || chatBusy) return
    setQuestion('')
    void dispatch(askAssistant(q))
  }

  const hasSource = sourceText.trim().length > 0 || file !== null

  return (
    <aside className="ai-panel">
      <div className="ai-head">
        <span className="ai-icon">
          <SparklesIcon size={17} />
        </span>
        <h2>AI Deviation Assistant</h2>
        <span className="beta-badge">BETA</span>
      </div>

      {/* ---- source input ---- */}
      <div
        className={`dropzone ${dragOver ? 'dropzone-over' : ''} ${busy ? 'dropzone-busy' : ''}`}
        onClick={() => !busy && fileInput.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          if (!busy) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const dropped = e.dataTransfer.files?.[0]
          if (dropped && !busy) extractFile(dropped)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !busy) fileInput.current?.click()
        }}
      >
        <span className="dropzone-icon">
          <DocIcon />
        </span>
        <p>
          Drag &amp; drop supporting document here <span className="dz-link">or click to browse</span>
        </p>
        {file && <span className="file-chip">{file.name}</span>}
        {!file && sourceFilename && phase === 'done' && (
          <span className="file-chip">{sourceFilename}</span>
        )}
        <input
          ref={fileInput}
          type="file"
          hidden
          accept={ACCEPTED_FILE_TYPES}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => {
            const chosen = e.target.files?.[0]
            if (chosen) extractFile(chosen)
            e.target.value = ''
          }}
        />
      </div>

      <div className="or-divider">
        <span>Or</span>
      </div>

      <textarea
        className="paste-box"
        rows={3}
        placeholder="Paste deviation details / notes (report, email, lab result...)"
        value={sourceText}
        onChange={(e) => dispatch(setSourceText(e.target.value))}
        disabled={busy}
      />

      <button
        type="button"
        className="btn btn-primary btn-block"
        onClick={runPrimary}
        disabled={busy || !hasSource}
      >
        <SparklesIcon size={15} />
        {busy ? 'Extracting...' : 'Extract with AI & Fill Form'}
      </button>

      <div className="formats-note">
        <span className="formats-title">
          <CheckCircleIcon size={15} /> Supported formats: {SUPPORTED_FORMATS}
        </span>
        <span className="formats-sub">Max file size: 10MB</span>
      </div>

      {/* ---- extraction progress ---- */}
      {(busy || phase === 'done' || phase === 'error') && (
        <div className="progress-section">
          <div className="progress-head">
            <span className="progress-label">Extraction Progress</span>
            <span className="progress-pct">{progress}%</span>
          </div>
          <div className="progress-track">
            <div
              className={`progress-fill ${phase === 'error' ? 'progress-fill-error' : ''}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className={`progress-msg ${phase === 'error' ? 'progress-msg-error' : ''}`}>
            {phase === 'error' ? (
              <>
                <AlertIcon size={14} /> {error}
              </>
            ) : (
              statusMessage
            )}
          </p>
        </div>
      )}

      {/* ---- AI impact & severity recommendation ---- */}
      {assessment && (
        <div className="assessment-card">
          <div className="assessment-head">
            <SparklesIcon size={14} />
            <span>AI Impact &amp; Severity Assessment</span>
            <button
              type="button"
              className="link-btn"
              onClick={() => void dispatch(reAssess())}
              disabled={reAssessing || !form.detailed_description}
            >
              {reAssessing ? 'Re-assessing...' : 'Re-assess'}
            </button>
          </div>
          <div className="assessment-chips">
            <span className={`chip ${chipClass(assessment.impact)}`}>
              Impact: {assessment.impact ?? '—'}
            </span>
            <span className={`chip ${chipClass(assessment.severity)}`}>
              Severity: {assessment.severity ?? '—'}
            </span>
          </div>
          {assessment.reason && <p className="assessment-reason">{assessment.reason}</p>}
        </div>
      )}

      {/* ---- assistant chat ---- */}
      <div className="assistant-label">AI Assistant</div>
      <div className="messages" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`msg msg-${m.role}`}>
            {m.role === 'assistant' && (
              <span className="msg-avatar">
                <SparklesIcon size={13} />
              </span>
            )}
            <div className="msg-bubble">{cleanMessageText(m.text)}</div>
          </div>
        ))}
        {chatBusy && (
          <div className="msg msg-assistant">
            <span className="msg-avatar">
              <SparklesIcon size={13} />
            </span>
            <div className="msg-bubble msg-typing">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEnd} />
      </div>

      <form className="chat-bar" onSubmit={submitQuestion}>
        <input
          type="text"
          placeholder="Ask me anything about deviations..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={chatBusy}
        />
        <button type="submit" className="chat-send" aria-label="Send" disabled={chatBusy || !question.trim()}>
          <SendIcon size={16} />
        </button>
      </form>

      <p className="disclaimer">AI responses may include errors. Please verify information.</p>
    </aside>
  )
}
