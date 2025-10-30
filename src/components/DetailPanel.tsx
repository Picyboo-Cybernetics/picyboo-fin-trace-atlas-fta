import type { DatasetState } from '../core/fta/store'
import { buildRegulatorId } from '../core/fta/store'
import { clsx } from 'clsx'
import type { CountryRecord } from '../domain/schema'
import { ScoreBadge } from './ScoreBadge'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'
import { Badge } from './ui/Badge'

type Props = {
  dataset: DatasetState
  selectedIso: string | null
  selectedRegulatorId?: string | null
  onSelectRegulator?: (regulatorId: string | null) => void
}

export function DetailPanel({ dataset, selectedIso, selectedRegulatorId, onSelectRegulator }: Props) {
  const { loading, error, byIso3 } = dataset
  const record: CountryRecord | null = selectedIso ? byIso3.get(selectedIso) ?? null : null

  if (loading)
    return (
      <Card>
        <SectionHeader eyebrow="Insights" title="Country details" />
        <p className="text-sm text-muted">Loading country information …</p>
      </Card>
    )

  if (error)
    return (
      <Card>
        <SectionHeader eyebrow="Insights" title="Country details" />
        <p className="text-sm text-danger">{error}</p>
      </Card>
    )

  if (!record)
    return (
      <Card>
        <SectionHeader eyebrow="Insights" title="Country details" />
        <p className="text-sm text-muted">Select a country with data.</p>
      </Card>
    )

  return (
    <Card>
      <SectionHeader
        eyebrow="Insights"
        title={record.country}
        description={`Jurisdiction code ${record.iso3}`}
        actions={record.sources.length ? <Badge tone="outline">{record.sources.length} sources</Badge> : null}
      />

      <dl className="grid grid-cols-1 gap-3 text-sm">
        <ScoreRow label="API maturity" value={record.scores.apiMaturity} />
        <ScoreRow label="Audit readiness" value={record.scores.auditReadiness} />
        <ScoreRow label="Reporting cadence" value={record.scores.reportingCadence} />
      </dl>

      <div className="space-y-3">
        <h3 className="font-semibold">Regulators</h3>
        <ul className="space-y-3">
          {record.regulators.map((r, index) => {
            const regulatorId = buildRegulatorId(record.iso3, r, index)
            const isSelected = regulatorId === selectedRegulatorId
            return (
              <li key={regulatorId}>
                <div
                  className={clsx(
                    'panel rounded-2xl p-4 transition',
                    isSelected
                      ? 'border-[var(--accent)] bg-[var(--bg-3)] shadow-soft'
                      : 'hover:border-[var(--accent)]'
                  )}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-base font-semibold text-accent transition-colors hover:text-accent-strong"
                      >
                        {r.name}
                      </a>
                      {r.scope ? <p className="text-xs text-muted">Scope: {r.scope}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      {r.category ? <Badge tone="outline">{r.category}</Badge> : null}
                      {onSelectRegulator ? (
                        <button
                          type="button"
                          onClick={() => onSelectRegulator(isSelected ? null : regulatorId)}
                          className={clsx(
                            'rounded-full px-4 py-1 text-xs font-semibold transition',
                            isSelected ? 'btn-primary shadow-soft' : 'btn-outline'
                          )}
                          aria-pressed={isSelected}
                        >
                          {isSelected ? 'Selected' : 'Focus'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Rule families</h3>
        <ul className="space-y-2 text-sm text-muted">
          {record.rules.map((r) => (
            <li key={r.code} className="section-soft rounded-xl px-3 py-2 shadow-inner">
              <span className="font-semibold">{r.code}</span>: {r.title}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Official sources</h3>
        <ul className="space-y-2 text-sm">
          {record.sources.map((s, i) => (
            <li key={i}>
              <a className="underline-offset-4 transition hover:underline" href={s} target="_blank" rel="noreferrer">
                {s}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  )
}

function ScoreRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-surface flex items-center justify-between rounded-2xl px-4 py-3 shadow-inner">
      <dt className="stat-label text-xs font-semibold uppercase tracking-[0.16em]">{label}</dt>
      <dd>
        <ScoreBadge score={value} />
      </dd>
    </div>
  )
}
