import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { extractStream, postAssess, postChat, type Assessment } from '../../services/api'
import { setFieldsFromAi, validateForm } from '../deviation/deviationSlice'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
}

interface AiState {
  sourceText: string
  phase: 'idle' | 'extracting' | 'done' | 'error'
  progress: number
  statusMessage: string
  assessment: Assessment | null
  rawInput: string
  sourceFilename: string | null
  error: string | null
  messages: ChatMessage[]
  chatBusy: boolean
  reAssessing: boolean
}

let msgCounter = 0
const nextId = () => `m${++msgCounter}`

const GREETING =
  'Upload a deviation report, lab result, or paste text above. I will automatically extract the relevant details and populate the form for you.'

const initialState: AiState = {
  sourceText: '',
  phase: 'idle',
  progress: 0,
  statusMessage: '',
  assessment: null,
  rawInput: '',
  sourceFilename: null,
  error: null,
  messages: [{ id: nextId(), role: 'assistant', text: GREETING }],
  chatBusy: false,
  reAssessing: false,
}

export const contextFromState = (state: RootState): Record<string, unknown> => ({
  ...state.deviation.form,
  ai_impact: state.ai.assessment?.impact ?? '',
  ai_severity: state.ai.assessment?.severity ?? '',
  ai_reason: state.ai.assessment?.reason ?? '',
})

/**
 * Run the LangGraph extraction pipeline over SSE and push the results into the
 * deviation form as events arrive (live progress + automatic form fill).
 */
export const runExtraction = createAsyncThunk(
  'ai/extract',
  async (opts: { file?: File | null; text?: string }, { dispatch, getState, rejectWithValue }) => {
    try {
      await extractStream(opts, (event) => {
        if (event.event === 'start' || event.event === 'progress') {
          dispatch(
            aiSlice.actions.extractionProgress({
              progress: event.progress,
              message: event.message ?? '',
            }),
          )
        } else if (event.event === 'result' && event.data) {
          const { fields, assessment, raw_input } = event.data
          dispatch(
            setFieldsFromAi({
              site_plant: fields.site_plant ?? '',
              date_of_occurrence: fields.date_of_occurrence ?? '',
              title: fields.title ?? '',
              source: fields.source ?? '',
              product_material: fields.product_material ?? '',
              batch_lot_number: fields.batch_lot_number ?? '',
              detailed_description: fields.detailed_description ?? '',
              initial_impact: assessment.impact ?? '',
              initial_severity: assessment.severity ?? '',
            }),
          )
          dispatch(
            aiSlice.actions.extractionDone({
              assessment,
              rawInput: raw_input,
              filename: event.filename ?? opts.file?.name ?? null,
            }),
          )
        } else if (event.event === 'error') {
          throw new Error(event.message || 'Extraction failed')
        }
      })

      const state = getState() as RootState
      const errors = validateForm(state.deviation.form)
      const missing = Object.keys(errors).length
      dispatch(
        aiSlice.actions.assistantSaid(
          `Extraction complete — I've populated the form with what I found${
            missing ? `; ${missing} required field${missing > 1 ? 's are' : ' is'} still missing` : ''
          }. Please review every field (especially impact and severity) before saving.`,
        ),
      )
      return null
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Extraction failed')
    }
  },
)

export const askAssistant = createAsyncThunk(
  'ai/chat',
  async (message: string, { dispatch, getState, rejectWithValue }) => {
    // A long paste with no question is almost certainly a report, not a question —
    // run extraction instead of answering, so the form gets filled either way.
    if (message.length > 350 && !message.includes('?')) {
      dispatch(
        aiSlice.actions.userAsked(
          message.slice(0, 140).trim() + (message.length > 140 ? '…' : ''),
        ),
      )
      await dispatch(runExtraction({ text: message }))
      return null
    }

    dispatch(aiSlice.actions.userAsked(message))
    try {
      const state = getState() as RootState
      const reply = await postChat(message, contextFromState(state))
      dispatch(aiSlice.actions.assistantSaid(reply))
      return null
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Assistant unavailable')
    }
  },
)

export const reAssess = createAsyncThunk(
  'ai/reAssess',
  async (_, { dispatch, getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState
      const result = await postAssess(contextFromState(state))
      dispatch(aiSlice.actions.assessmentUpdated(result))
      dispatch(
        setFieldsFromAi({
          initial_impact: result.impact ?? '',
          initial_severity: result.severity ?? '',
        }),
      )
      dispatch(
        aiSlice.actions.assistantSaid(
          `Re-assessed: ${result.impact} impact / ${result.severity} severity. ${result.reason ?? ''}`.trim(),
        ),
      )
      return result
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Re-assessment failed')
    }
  },
)

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setSourceText(state, action: PayloadAction<string>) {
      state.sourceText = action.payload
    },
    extractionProgress(
      state,
      action: PayloadAction<{ progress: number; message: string }>,
    ) {
      state.phase = 'extracting'
      state.progress = action.payload.progress
      state.statusMessage = action.payload.message
      state.error = null
    },
    extractionDone(
      state,
      action: PayloadAction<{ assessment: Assessment; rawInput: string; filename: string | null }>,
    ) {
      state.phase = 'done'
      state.progress = 100
      state.statusMessage = 'Extraction complete.'
      state.assessment = action.payload.assessment
      state.rawInput = action.payload.rawInput
      state.sourceFilename = action.payload.filename
      state.error = null
      state.sourceText = ''
    },
    assistantSaid(state, action: PayloadAction<string>) {
      state.messages.push({ id: nextId(), role: 'assistant', text: action.payload })
      state.chatBusy = false
    },
    userAsked(state, action: PayloadAction<string>) {
      state.messages.push({ id: nextId(), role: 'user', text: action.payload })
      state.chatBusy = true
    },
    assessmentUpdated(state, action: PayloadAction<Assessment>) {
      state.assessment = action.payload
    },
    setReAssessing(state, action: PayloadAction<boolean>) {
      state.reAssessing = action.payload
    },
    resetAi() {
      return {
        ...initialState,
        messages: [{ id: nextId(), role: 'assistant' as const, text: GREETING }],
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(runExtraction.pending, (state) => {
        state.phase = 'extracting'
        state.progress = 5
        state.statusMessage = 'Analysing document content and extracting key details...'
        state.error = null
      })
      .addCase(runExtraction.rejected, (state, action) => {
        state.phase = 'error'
        state.progress = 0
        state.statusMessage = ''
        state.error = action.payload as string
        state.messages.push({
          id: nextId(),
          role: 'assistant',
          text: `Sorry — extraction failed: ${action.payload as string}`,
        })
        state.chatBusy = false
      })
      .addCase(askAssistant.rejected, (state, action) => {
        state.chatBusy = false
        state.messages.push({
          id: nextId(),
          role: 'assistant',
          text: `I couldn't reach the AI service: ${action.payload as string}`,
        })
      })
      .addCase(reAssess.pending, (state) => {
        state.reAssessing = true
      })
      .addCase(reAssess.fulfilled, (state) => {
        state.reAssessing = false
      })
      .addCase(reAssess.rejected, (state, action) => {
        state.reAssessing = false
        state.chatBusy = false
        state.messages.push({
          id: nextId(),
          role: 'assistant',
          text: `Re-assessment failed: ${action.payload as string}`,
        })
      })
  },
})

export const {
  setSourceText,
  assistantSaid,
  assessmentUpdated,
  setReAssessing,
  resetAi,
} = aiSlice.actions

export default aiSlice.reducer

/** Alias so components can dispatch slice actions if needed. */
export const aiActions = aiSlice.actions
