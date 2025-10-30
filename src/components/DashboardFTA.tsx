import { useCallback, useMemo } from 'react'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'
import { Badge } from './ui/Badge'
import { useDataset } from '../core/fta/store'
import ComplianceGraph from '../features/network/ComplianceGraph'
import RegNewsPanel from '../features/news/RegNewsPanel'
import { ScoreDistributionCard } from '../features/analytics/ScoreDistributionCard'
import { BenchmarkCard } from '../features/analytics/BenchmarkCard'
import { RuleCoverageCard } from '../features/analytics/RuleCoverageCard'

type DatasetState = ReturnType<typeof useDataset>;

type Props = {
  selectedIso: string | null;
  dataset?: DatasetState;
  selectedRegulatorId?: string | null;
  onSelectCountry?: (iso3: string | null) => void;
  onSelectRegulator?: (regulatorId: string | null) => void;
};

export default function DashboardFTA({
  selectedIso,
  dataset,
  selectedRegulatorId,
  onSelectCountry,
  onSelectRegulator
}: Props) {
  const fallback = useDataset();
  const state = dataset ?? fallback;
  const { byIso3, loading, error, metrics } = state;

  const snapshot = useMemo(() => {
    if (!selectedIso) return null;
    const c = byIso3.get(selectedIso);
    if (!c) return null;
    return {
      country: c.country,
      regulators: c.regulators?.length ?? 0,
      rules: c.rules?.length ?? 0,
      scores: c.scores ?? { apiMaturity: 0, auditReadiness: 0, reportingCadence: 0 },
    };
  }, [selectedIso, byIso3]);

  const resolveCountry = useCallback(
    (iso3: string) => byIso3.get(iso3)?.country ?? iso3,
    [byIso3]
  );

  const handleSelectCountry = useCallback(
    (iso3: string) => {
      onSelectCountry?.(iso3);
    },
    [onSelectCountry]
  );

  const handleSelectRegulator = useCallback(
    (regulatorId: string) => {
      onSelectRegulator?.(regulatorId);
    },
    [onSelectRegulator]
  );

  const selectedRegulator = selectedRegulatorId
    ? metrics.regulators.byId.get(selectedRegulatorId) ?? null
    : null;

  return (
    <div className="space-y-6">
      <Card>
        <SectionHeader
          eyebrow="Snapshot"
          title={`Regulatory Intelligence ${selectedIso ? `– ${snapshot?.country}` : ''}`.trim()}
          description="A quick overview of the supervisory landscape and maturity scores for the selected jurisdiction."
        />
        {loading ? (
          <div className="text-sm text-muted">Loading dataset …</div>
        ) : error ? (
          <div className="text-sm text-danger">{error}</div>
        ) : snapshot ? (
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat label="Regulators" value={String(snapshot.regulators)} />
              <Stat label="Rules" value={String(snapshot.rules)} />
              <Stat label="API maturity" value={snapshot.scores.apiMaturity} suffix="%" />
            </div>
            {selectedRegulator ? (
              <div className="panel rounded-2xl border-[var(--accent)] bg-[var(--bg-3)] p-4 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-accent">Focused regulator</p>
                    <div className="mt-1 text-base font-semibold">{selectedRegulator.name}</div>
                    <div className="text-xs text-muted">{selectedRegulator.country}</div>
                  </div>
                  {selectedRegulator.category ? <Badge tone="primary">{selectedRegulator.category}</Badge> : null}
                </div>
                {selectedRegulator.scope ? (
                  <p className="mt-3 text-sm text-muted">{selectedRegulator.scope}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="text-sm text-muted">Select a country on the map to see details.</div>
        )}
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Analytics"
          title="Score distribution"
          description="Compare how jurisdictions are grouped across API maturity scores."
        />
        <ScoreDistributionCard buckets={metrics.distribution} resolveCountry={resolveCountry} onSelectCountry={handleSelectCountry} />
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Benchmarking"
          title="Top performers"
          description="Identify standout regulators shaping the reporting landscape."
        />
        <BenchmarkCard entries={metrics.benchmark} onSelectCountry={handleSelectCountry} />
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Coverage"
          title="Rule families"
          description="Track adoption depth by regulator and cross-border influence."
        />
        <RuleCoverageCard
          entries={metrics.ruleCoverage}
          regulators={metrics.regulators.byId}
          resolveCountry={resolveCountry}
          onSelectCountry={handleSelectCountry}
          onSelectRegulator={handleSelectRegulator}
        />
      </Card>

      <Card>
        <SectionHeader
          eyebrow="Networks"
          title="Compliance network"
          description="Visualise regulatory relationships for the selected market."
        />
        <Compliance
          term="note"
          iso3={selectedIso ?? null}
          dataset={state}
          selectedRegulatorId={selectedRegulatorId}
          onSelectRegulator={onSelectRegulator}
        />
      </Card>

      <Card id="signals">
        <SectionHeader
          eyebrow="Signals"
          title="Regulatory news"
          description="Latest announcements and updates curated for your selection."
        />
        <RegNewsPanel countryIso3={selectedIso ?? null} />
      </Card>
    </div>
  )
}

function Stat({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) {
  return (
    <div className="stat-surface rounded-2xl p-4 shadow-inner">
      <div className="stat-label text-xs font-semibold uppercase tracking-[0.16em]">{label}</div>
      <div className="mt-1 text-2xl font-display">
        {value}
        {suffix ? <span className="ml-1 text-sm stat-suffix">{suffix}</span> : null}
      </div>
    </div>
  )
}

type ComplianceProps = {
  iso3: string | null;
  dataset: DatasetState;
  selectedRegulatorId?: string | null;
  onSelectRegulator?: (regulatorId: string | null) => void;
};

function Compliance({ iso3, dataset, selectedRegulatorId, onSelectRegulator }: ComplianceProps) {
  return (
    <ComplianceGraph
      iso3={iso3}
      height={360}
      dataset={dataset}
      selectedRegulatorId={selectedRegulatorId ?? null}
      onSelectRegulator={onSelectRegulator}
    />
  );
}
