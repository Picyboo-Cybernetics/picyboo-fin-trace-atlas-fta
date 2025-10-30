// src/core/fta/store.ts
import { useEffect, useMemo, useState } from 'react';
import { Dataset, DatasetSchema, NewsItem, NewsItemSchema, Regulator } from './types';

export type ScoreKey = 'apiMaturity' | 'auditReadiness' | 'reportingCadence';

export const SCORE_KEYS: ScoreKey[] = ['apiMaturity', 'auditReadiness', 'reportingCadence'];

export type ScoreSummary = Record<ScoreKey, number> & { composite: number };

export type ScoreDistributionBucket = {
  id: string;
  label: string;
  range: [number, number];
  count: number;
  iso3: string[];
};

export type BenchmarkEntry = {
  iso3: string;
  country: string;
  scores: ScoreSummary;
  regulators: number;
  rules: number;
  rank: number;
};

export type RegulatorSummary = {
  id: string;
  iso3: string;
  country: string;
  name: string;
  category: string | null;
  scope: string | null;
  url?: string;
  ruleCount: number;
};

export type RuleCoverageEntry = {
  code: string;
  title: string;
  countryCount: number;
  regulatorCount: number;
  iso3: string[];
  regulatorIds: string[];
};

export type AggregatedMetrics = {
  totals: {
    countries: number;
    regulators: number;
    rules: number;
  };
  averages: ScoreSummary;
  distribution: ScoreDistributionBucket[];
  benchmark: BenchmarkEntry[];
  regulators: {
    items: RegulatorSummary[];
    byId: Map<string, RegulatorSummary>;
  };
  ruleCoverage: RuleCoverageEntry[];
};

export type DatasetState = {
  data: Dataset;
  byIso3: Map<string, Dataset[number]>;
  loading: boolean;
  error: string | null;
  metrics: AggregatedMetrics;
};

const FALLBACK_DATASET_URL = new URL('../../data/countries.json', import.meta.url).href;

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function buildRegulatorId(iso3: string, regulator: Regulator, index: number): string {
  if (regulator.id?.trim()) {
    return regulator.id.trim();
  }
  const suffix = slugify(`${regulator.name}-${index}`);
  return `reg:${iso3}:${suffix}`;
}

export function inferRegulatorCategory(reg: Pick<Regulator, 'name' | 'category' | 'scope'>): string {
  if (reg.category?.trim()) return reg.category.trim();
  if (reg.scope?.trim()) {
    const fromScope = reg.scope.split(/[\/-]/)[0]?.trim();
    if (fromScope) return fromScope;
  }
  const lower = reg.name.toLowerCase();
  if (lower.includes('bank')) return 'Central Bank';
  if (lower.includes('sec') || lower.includes('securities')) return 'Securities';
  if (lower.includes('aml') || lower.includes('fiu') || lower.includes('financial intelligence')) {
    return 'Financial Intelligence';
  }
  if (lower.includes('authority')) return 'Supervisory Authority';
  return 'Regulator';
}

function computeScoreSummary(values: Partial<Record<ScoreKey, number | null>>): ScoreSummary {
  let compositeTotal = 0;
  let compositeCount = 0;
  const summary = {
    apiMaturity: 0,
    auditReadiness: 0,
    reportingCadence: 0,
    composite: 0,
  } satisfies ScoreSummary;

  for (const key of SCORE_KEYS) {
    const value = values[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      summary[key] = value;
      compositeTotal += value;
      compositeCount += 1;
    }
  }

  summary.composite = compositeCount > 0 ? compositeTotal / compositeCount : 0;
  return summary;
}

async function safeFetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return await res.json() as T;
}

export async function loadDataset(candidates: string[] = ['/fta/seed-dataset.json']): Promise<Dataset> {
  const attempted = new Set<string>();
  const urls = [...candidates, FALLBACK_DATASET_URL];
  let lastError: unknown = null;
  for (const url of urls) {
    if (!url || attempted.has(url)) continue;
    attempted.add(url);
    try {
      const data = await safeFetchJSON<unknown>(url);
      return DatasetSchema.parse(data);
    } catch (error) {
      lastError = error;
    }
  }
  if (lastError) throw lastError instanceof Error ? lastError : new Error('Failed to load dataset');
  return DatasetSchema.parse([]);
}

export async function loadNews(candidates: string[] = ['/fta/seed-news.json']): Promise<NewsItem[]> {
  for (const url of candidates) {
    try {
      const data = await safeFetchJSON<unknown>(url);
      const arr = Array.isArray(data) ? data : [];
      return arr.map(x => NewsItemSchema.parse(x));
    } catch {}
  }
  return [];
}

export function useDataset(opts?: { sources?: string[] }): DatasetState {
  const [data, setData] = useState<Dataset>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        setData(await loadDataset(opts?.sources));
      } catch (e: any) {
        setError(e?.message ?? 'error');
        setData([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [opts?.sources?.join('|')]);

  const byIso3 = useMemo(() => {
    const m = new Map<string, Dataset[number]>();
    for (const c of data) m.set(c.iso3, c);
    return m;
  }, [data]);

  const metrics = useMemo<AggregatedMetrics>(() => {
    const totals = {
      countries: data.length,
      regulators: 0,
      rules: 0,
    };

    const scoreTotals: Record<ScoreKey, { total: number; count: number }> = {
      apiMaturity: { total: 0, count: 0 },
      auditReadiness: { total: 0, count: 0 },
      reportingCadence: { total: 0, count: 0 },
    };

    const bucketDefinitions: Array<{ id: string; label: string; range: [number, number]; iso3: Set<string> }> = [
      { id: '0-20', label: '0 – 20', range: [0, 20], iso3: new Set() },
      { id: '20-40', label: '20 – 40', range: [20, 40], iso3: new Set() },
      { id: '40-60', label: '40 – 60', range: [40, 60], iso3: new Set() },
      { id: '60-80', label: '60 – 80', range: [60, 80], iso3: new Set() },
      { id: '80-100', label: '80 – 100', range: [80, 100], iso3: new Set() },
    ];

    const benchmarkBase: Array<Omit<BenchmarkEntry, 'rank'>> = [];
    const regulatorItems: RegulatorSummary[] = [];
    const ruleCoverageMap = new Map<string, {
      code: string;
      title: string;
      countries: Set<string>;
      regulators: Set<string>;
    }>();

    data.forEach((record) => {
      const regulators = record.regulators ?? [];
      const rules = record.rules ?? [];
      totals.regulators += regulators.length;
      totals.rules += rules.length;

      SCORE_KEYS.forEach((key) => {
        const raw = record.scores?.[key];
        if (typeof raw === 'number' && Number.isFinite(raw)) {
          scoreTotals[key].total += raw;
          scoreTotals[key].count += 1;
        }
      });

      const summary = computeScoreSummary(record.scores ?? {});
      const hasScore = SCORE_KEYS.some((key) => {
        const value = record.scores?.[key];
        return typeof value === 'number' && Number.isFinite(value);
      });
      if (hasScore) {
        const safeComposite = Math.max(0, Math.min(100, summary.composite));
        const bucketIndex = Math.min(
          bucketDefinitions.length - 1,
          Math.floor(safeComposite === 100 ? 4 : safeComposite / 20)
        );
        bucketDefinitions[bucketIndex].iso3.add(record.iso3);
      }
      benchmarkBase.push({
        iso3: record.iso3,
        country: record.country,
        scores: summary,
        regulators: regulators.length,
        rules: rules.length,
      });

      regulators.forEach((regulator, index) => {
        const id = buildRegulatorId(record.iso3, regulator, index);
        const category = inferRegulatorCategory(regulator);
        regulatorItems.push({
          id,
          iso3: record.iso3,
          country: record.country,
          name: regulator.name,
          category: category ?? null,
          scope: regulator.scope ?? null,
          url: regulator.url,
          ruleCount: rules.length,
        });
      });

      rules.forEach((rule) => {
        const existing = ruleCoverageMap.get(rule.code) ?? {
          code: rule.code,
          title: rule.title,
          countries: new Set<string>(),
          regulators: new Set<string>(),
        };
        existing.countries.add(record.iso3);
        regulators.forEach((regulator, index) => {
          existing.regulators.add(buildRegulatorId(record.iso3, regulator, index));
        });
        ruleCoverageMap.set(rule.code, existing);
      });
    });

    const averages: ScoreSummary = {
      apiMaturity: scoreTotals.apiMaturity.count
        ? scoreTotals.apiMaturity.total / scoreTotals.apiMaturity.count
        : 0,
      auditReadiness: scoreTotals.auditReadiness.count
        ? scoreTotals.auditReadiness.total / scoreTotals.auditReadiness.count
        : 0,
      reportingCadence: scoreTotals.reportingCadence.count
        ? scoreTotals.reportingCadence.total / scoreTotals.reportingCadence.count
        : 0,
      composite: 0,
    };

    const compositeParts = SCORE_KEYS.filter((key) => scoreTotals[key].count > 0);
    averages.composite = compositeParts.length
      ? compositeParts.reduce((acc, key) => acc + averages[key], 0) / compositeParts.length
      : 0;

    const distribution: ScoreDistributionBucket[] = bucketDefinitions.map((bucket) => ({
      id: bucket.id,
      label: bucket.label,
      range: bucket.range,
      count: bucket.iso3.size,
      iso3: Array.from(bucket.iso3).sort(),
    }));

    const benchmark = benchmarkBase
      .sort((a, b) => b.scores.composite - a.scores.composite)
      .map((entry, index) => ({
        ...entry,
        rank: index + 1,
      }));

    const regulatorsSorted = [...regulatorItems].sort((a, b) => {
      if (b.ruleCount !== a.ruleCount) return b.ruleCount - a.ruleCount;
      if (a.country !== b.country) return a.country.localeCompare(b.country);
      return a.name.localeCompare(b.name);
    });

    const regulatorById = new Map<string, RegulatorSummary>();
    regulatorsSorted.forEach((item) => {
      regulatorById.set(item.id, item);
    });

    const ruleCoverage: RuleCoverageEntry[] = Array.from(ruleCoverageMap.values())
      .map((entry) => ({
        code: entry.code,
        title: entry.title,
        countryCount: entry.countries.size,
        regulatorCount: entry.regulators.size,
        iso3: Array.from(entry.countries).sort(),
        regulatorIds: Array.from(entry.regulators),
      }))
      .sort((a, b) => {
        if (b.countryCount !== a.countryCount) return b.countryCount - a.countryCount;
        return a.code.localeCompare(b.code);
      });

    return {
      totals,
      averages,
      distribution,
      benchmark,
      regulators: {
        items: regulatorsSorted,
        byId: regulatorById,
      },
      ruleCoverage,
    } satisfies AggregatedMetrics;
  }, [data]);

  return { data, byIso3, loading, error, metrics };
}

export function useNews(opts?: { sources?: string[] }) {
  const [items, setItems] = useState<NewsItem[]>([]);
  useEffect(() => {
    loadNews(opts?.sources).then(setItems);
  }, [opts?.sources?.join('|')]);
  return items;
}
