import { Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import {
  IMPACT_OPTIONS,
  MAX_DESCRIPTION_LENGTH,
  SEVERITY_OPTIONS,
  SITE_OPTIONS,
  SOURCE_OPTIONS,
} from '../constants'
import {
  resetForm,
  saveDeviation,
  setErrors,
  setField,
  validateForm,
  type DeviationForm as FormValues,
} from '../features/deviation/deviationSlice'
import { AlertIcon, CheckCircleIcon, ResetIcon, SaveIcon, SearchIcon } from './Icons'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <span className="field-error">{message}</span>
}

export default function DeviationForm() {
  const dispatch = useAppDispatch()
  const { form, errors, status, saveError, savedId } = useAppSelector((s) => s.deviation)
  const assessment = useAppSelector((s) => s.ai.assessment)

  const onChange =
    (name: keyof FormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      dispatch(setField({ name, value: e.target.value }))
    }

  const handleSave = () => {
    const found = validateForm(form)
    if (Object.keys(found).length > 0) {
      dispatch(setErrors(found))
      return
    }
    dispatch(saveDeviation())
  }

  return (
    <section className="form-card">
      <div className="card-head">
        <div>
          <h1>Log Deviation</h1>
          <p className="subtitle">
            Record any unexpected event, out-of-specification result or non-conformance.
          </p>
        </div>
        <span className={`badge ${status === 'saved' ? 'badge-green' : 'badge-amber'}`}>
          {status === 'saved' ? 'Saved' : 'Draft'}
        </span>
      </div>

      <form
        className="deviation-form"
        onSubmit={(e) => {
          e.preventDefault()
          handleSave()
        }}
      >
        <h2 className="section-title">1. Deviation Information</h2>
        <div className="grid-2">
          <label className="field">
            <span className="field-label">
              Site / Plant <em>*</em>
            </span>
            <select value={form.site_plant} onChange={onChange('site_plant')}>
              <option value="">Select site / plant</option>
              {SITE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <FieldError message={errors.site_plant} />
          </label>

          <label className="field">
            <span className="field-label">
              Date of Occurrence <em>*</em>
            </span>
            <input type="date" value={form.date_of_occurrence} onChange={onChange('date_of_occurrence')} />
            <FieldError message={errors.date_of_occurrence} />
          </label>

          <label className="field">
            <span className="field-label">
              Title / Short Description <em>*</em>
            </span>
            <input
              type="text"
              maxLength={160}
              placeholder="e.g., OOS result for Assay in Batch ABC-001"
              value={form.title}
              onChange={onChange('title')}
            />
            <FieldError message={errors.title} />
          </label>

          <label className="field">
            <span className="field-label">
              Source <em>*</em>
            </span>
            <select value={form.source} onChange={onChange('source')}>
              <option value="">Select source</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <FieldError message={errors.source} />
          </label>

          <label className="field">
            <span className="field-label">Related Product / Material</span>
            <span className="input-with-icon">
              <input
                type="text"
                placeholder="Search product or material..."
                value={form.product_material}
                onChange={onChange('product_material')}
              />
              <SearchIcon className="input-icon" />
            </span>
          </label>

          <label className="field">
            <span className="field-label">Batch/Lot Number</span>
            <input
              type="text"
              placeholder="Enter batch / lot no."
              value={form.batch_lot_number}
              onChange={onChange('batch_lot_number')}
            />
          </label>
        </div>

        <h2 className="section-title">2. Deviation Details</h2>
        <label className="field">
          <span className="field-label">
            Detailed Description <em>*</em>
          </span>
          <textarea
            rows={5}
            maxLength={MAX_DESCRIPTION_LENGTH}
            placeholder="Describe what happened, where, when and how it was detected..."
            value={form.detailed_description}
            onChange={onChange('detailed_description')}
          />
          <div className="textarea-meta">
            <FieldError message={errors.detailed_description} />
            <span className={`char-count ${form.detailed_description.length >= MAX_DESCRIPTION_LENGTH ? 'char-count-full' : ''}`}>
              {form.detailed_description.length}/{MAX_DESCRIPTION_LENGTH}
            </span>
          </div>
        </label>

        <div className="grid-2">
          <label className="field">
            <span className="field-label">
              Initial Impact <em>*</em>
              {assessment?.impact && (
                <span className={`ai-chip ai-chip-${impactClass(assessment.impact)}`}>
                  AI: {assessment.impact}
                </span>
              )}
            </span>
            <select value={form.initial_impact} onChange={onChange('initial_impact')}>
              <option value="">Select impact</option>
              {IMPACT_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <FieldError message={errors.initial_impact} />
          </label>

          <label className="field">
            <span className="field-label">
              Initial Severity <em>*</em>
              {assessment?.severity && (
                <span className={`ai-chip ai-chip-${impactClass(assessment.severity)}`}>
                  AI: {assessment.severity}
                </span>
              )}
            </span>
            <select value={form.initial_severity} onChange={onChange('initial_severity')}>
              <option value="">Select severity</option>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <FieldError message={errors.initial_severity} />
          </label>
        </div>

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => dispatch(resetForm())}
            disabled={status === 'saving'}
          >
            <ResetIcon /> Reset Form
          </button>
          <button type="submit" className="btn btn-primary" disabled={status === 'saving'}>
            <SaveIcon /> {status === 'saving' ? 'Saving...' : 'Save Deviation'}
          </button>
        </div>

        {Object.keys(errors).length > 0 && (
          <div className="alert alert-error">
            <AlertIcon />
            <span>Please complete the highlighted required fields before saving.</span>
          </div>
        )}
        {saveError && (
          <div className="alert alert-error">
            <AlertIcon />
            <span>{saveError}</span>
          </div>
        )}
        {status === 'saved' && savedId && (
          <div className="alert alert-success">
            <CheckCircleIcon />
            <span>
              Deviation #{savedId} saved successfully.{' '}
              <Link to="/deviations" className="alert-link">
                View all deviations →
              </Link>
            </span>
          </div>
        )}
      </form>
    </section>
  )
}

function impactClass(value: string): string {
  const v = value.toLowerCase()
  if (v === 'critical') return 'critical'
  if (v === 'high' || v === 'major') return 'high'
  if (v === 'medium' || v === 'minor') return 'medium'
  return 'low'
}
