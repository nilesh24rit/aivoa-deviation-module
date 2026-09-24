export interface ExtractedFields {
  site_plant?: string | null
  date_of_occurrence?: string | null
  title?: string | null
  source?: string | null
  product_material?: string | null
  batch_lot_number?: string | null
  detailed_description?: string | null
}

export interface Assessment {
  impact: string | null
  severity: string | null
  reason: string | null
}

export interface ExtractResult {
  fields: ExtractedFields
  assessment: Assessment
  raw_input: string
  filename?: string | null
}

export type SseEvent = {
  event: 'start' | 'progress' | 'result' | 'error'
  progress: number
  message?: string
  node?: string
  filename?: string | null
  data?: ExtractResult
}

export interface DeviationPayload {
  site_plant: string
  date_of_occurrence: string | null
  title: string
  source: string
  product_material: string
  batch_lot_number: string
  detailed_description: string
  initial_impact: string
  initial_severity: string
  ai_impact: string | null
  ai_severity: string | null
  ai_reason: string | null
  raw_input: string | null
  source_filename: string | null
}

export interface SavedDeviation extends DeviationPayload {
  id: number
  status: string
  created_at: string
  updated_at: string
}

async function jsonOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = `Request failed (${res.status})`
    try {
      const body = await res.json()
      if (typeof body.detail === 'string') detail = body.detail
      else if (Array.isArray(body.detail) && body.detail[0]?.msg)
        detail = body.detail[0].msg
    } catch {
      /* keep default message */
    }
    throw new Error(detail)
  }
  return res.json() as Promise<T>
}

/** POST the source to /api/ai/extract and replay SSE events to the callback. */
export async function extractStream(
  opts: { file?: File | null; text?: string },
  onEvent: (e: SseEvent) => void,
): Promise<void> {
  const form = new FormData()
  if (opts.file) form.append('file', opts.file)
  if (opts.text) form.append('text', opts.text)

  const res = await fetch('/api/ai/extract', { method: 'POST', body: form })
  if (!res.ok || !res.body) {
    await jsonOrThrow<never>(res)
    throw new Error('Extraction failed')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const chunks = buffer.split('\n\n')
    buffer = chunks.pop() ?? ''
    for (const chunk of chunks) {
      const line = chunk.trim()
      if (!line.startsWith('data:')) continue
      try {
        onEvent(JSON.parse(line.slice(5)) as SseEvent)
      } catch {
        /* ignore malformed frame */
      }
    }
  }
}

export async function postChat(message: string, context: Record<string, unknown>) {
  const res = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, context }),
  })
  const data = await jsonOrThrow<{ reply: string }>(res)
  return data.reply
}

export async function postAssess(context: Record<string, unknown>) {
  const res = await fetch('/api/ai/assess', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Re-assess with the current form data', context }),
  })
  return jsonOrThrow<Assessment>(res)
}

export async function saveDeviationApi(payload: DeviationPayload) {
  const res = await fetch('/api/deviations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return jsonOrThrow<SavedDeviation>(res)
}

export async function listDeviationsApi(): Promise<SavedDeviation[]> {
  const res = await fetch('/api/deviations')
  return jsonOrThrow<SavedDeviation[]>(res)
}
