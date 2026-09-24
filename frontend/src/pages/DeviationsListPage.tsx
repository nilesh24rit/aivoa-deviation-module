import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import TopNav from '../components/TopNav'
import { ArrowLeftIcon, SparklesIcon } from '../components/Icons'
import { listDeviationsApi, type SavedDeviation } from '../services/api'

function chipClass(value: string | null): string {
  if (!value) return ''
  const v = value.toLowerCase()
  if (v === 'critical') return 'chip-critical'
  if (v === 'high' || v === 'major') return 'chip-high'
  if (v === 'medium' || v === 'minor') return 'chip-medium'
  return 'chip-low'
}

export default function DeviationsListPage() {
  const [rows, setRows] = useState<SavedDeviation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    listDeviationsApi()
      .then((data) => !cancelled && setRows(data))
      .catch((err) => !cancelled && setError(err instanceof Error ? err.message : 'Failed to load'))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="app-shell">
      <TopNav />
      <main className="page-layout page-layout-single">
        <section className="form-card">
          <div className="card-head">
            <div>
              <h1>Deviations</h1>
              <p className="subtitle">All saved deviation records, newest first.</p>
            </div>
            <Link to="/" className="btn btn-primary">
              <SparklesIcon size={15} /> Log New Deviation
            </Link>
          </div>

          <Link to="/" className="back-link">
            <ArrowLeftIcon /> Back to Log Deviation
          </Link>

          {loading && <p className="muted">Loading saved deviations...</p>}
          {error && <div className="alert alert-error">{error}</div>}

          {!loading && !error && rows.length === 0 && (
            <div className="empty-state">
              <SparklesIcon size={26} />
              <p>No deviations saved yet.</p>
              <Link to="/" className="btn btn-primary">
                Log your first deviation
              </Link>
            </div>
          )}

          {rows.length > 0 && (
            <div className="table-wrap">
              <table className="dev-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Title</th>
                    <th>Site / Plant</th>
                    <th>Batch/Lot</th>
                    <th>Impact</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Saved (UTC)</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>DEV-{String(r.id).padStart(4, '0')}</td>
                      <td className="cell-title" title={r.detailed_description}>
                        {r.title}
                      </td>
                      <td>{r.site_plant || '—'}</td>
                      <td>{r.batch_lot_number || '—'}</td>
                      <td>
                        <span className={`chip ${chipClass(r.initial_impact)}`}>
                          {r.initial_impact || '—'}
                        </span>
                      </td>
                      <td>
                        <span className={`chip ${chipClass(r.initial_severity)}`}>
                          {r.initial_severity || '—'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-blue">{r.status}</span>
                      </td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
