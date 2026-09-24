import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { RootState } from '../../app/store'
import { saveDeviationApi, type DeviationPayload } from '../../services/api'

export interface DeviationForm {
  site_plant: string
  date_of_occurrence: string
  title: string
  source: string
  product_material: string
  batch_lot_number: string
  detailed_description: string
  initial_impact: string
  initial_severity: string
}

export const emptyForm: DeviationForm = {
  site_plant: '',
  date_of_occurrence: '',
  title: '',
  source: '',
  product_material: '',
  batch_lot_number: '',
  detailed_description: '',
  initial_impact: '',
  initial_severity: '',
}

interface DeviationState {
  form: DeviationForm
  errors: Record<string, string>
  status: 'draft' | 'saving' | 'saved'
  saveError: string | null
  savedId: number | null
}

const initialState: DeviationState = {
  form: { ...emptyForm },
  errors: {},
  status: 'draft',
  saveError: null,
  savedId: null,
}

export const REQUIRED_FIELDS: (keyof DeviationForm)[] = [
  'site_plant',
  'date_of_occurrence',
  'title',
  'source',
  'detailed_description',
  'initial_impact',
  'initial_severity',
]

export function validateForm(form: DeviationForm): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const field of REQUIRED_FIELDS) {
    if (!String(form[field] ?? '').trim()) errors[field] = 'Required'
  }
  if (form.detailed_description.length > 2000)
    errors.detailed_description = 'Maximum 2000 characters'
  return errors
}

export const saveDeviation = createAsyncThunk(
  'deviation/save',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const errors = validateForm(state.deviation.form)
    if (Object.keys(errors).length > 0) {
      return rejectWithValue('Please complete the required fields.')
    }
    try {
      const saved = await saveDeviationApi(selectPayload(state))
      return saved.id
    } catch (err) {
      return rejectWithValue(err instanceof Error ? err.message : 'Save failed')
    }
  },
)

const deviationSlice = createSlice({
  name: 'deviation',
  initialState,
  reducers: {
    setField(state, action: PayloadAction<{ name: keyof DeviationForm; value: string }>) {
      state.form[action.payload.name] = action.payload.value
      delete state.errors[action.payload.name]
      if (state.status === 'saved') state.status = 'draft'
      state.saveError = null
    },
    /** Fill the form from AI output — empty/null AI values never erase what's there. */
    setFieldsFromAi(state, action: PayloadAction<Partial<DeviationForm>>) {
      for (const [key, value] of Object.entries(action.payload)) {
        if (value === null || value === undefined || value === '') continue
        const field = key as keyof DeviationForm
        if (field in state.form) {
          state.form[field] = String(value)
          delete state.errors[field]
        }
      }
      state.status = 'draft'
      state.saveError = null
      state.savedId = null
    },
    setErrors(state, action: PayloadAction<Record<string, string>>) {
      state.errors = action.payload
    },
    resetForm() {
      return { ...initialState, form: { ...emptyForm } }
    },
    saveSucceeded(state, action: PayloadAction<number>) {
      state.status = 'saved'
      state.savedId = action.payload
      state.saveError = null
      state.errors = {}
    },
    saveDismissed(state) {
      if (state.status === 'saved') state.status = 'draft'
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(saveDeviation.pending, (state) => {
        state.status = 'saving'
        state.saveError = null
      })
      .addCase(saveDeviation.fulfilled, (state, action) => {
        state.status = 'saved'
        state.savedId = action.payload
        state.errors = {}
      })
      .addCase(saveDeviation.rejected, (state, action) => {
        state.status = 'draft'
        state.saveError = (action.payload as string) ?? 'Save failed'
      })
  },
})

export const { setField, setFieldsFromAi, setErrors, resetForm, saveSucceeded, saveDismissed } =
  deviationSlice.actions

export default deviationSlice.reducer

export const selectPayload = (state: RootState): DeviationPayload => {
  const { deviation: form, ai } = state
  return {
    site_plant: form.form.site_plant,
    date_of_occurrence: form.form.date_of_occurrence || null,
    title: form.form.title,
    source: form.form.source,
    product_material: form.form.product_material,
    batch_lot_number: form.form.batch_lot_number,
    detailed_description: form.form.detailed_description,
    initial_impact: form.form.initial_impact,
    initial_severity: form.form.initial_severity,
    ai_impact: ai.assessment?.impact ?? null,
    ai_severity: ai.assessment?.severity ?? null,
    ai_reason: ai.assessment?.reason ?? null,
    raw_input: ai.rawInput || null,
    source_filename: ai.sourceFilename || null,
  }
}
