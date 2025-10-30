import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { SCORE_KEYS, type BenchmarkEntry, type ScoreKey } from "../../core/fta/store";

const SCORE_LABELS: Record<ScoreKey, string> = {
  apiMaturity: "API maturity",
  auditReadiness: "Audit readiness",
  reportingCadence: "Reporting cadence",
};

type Props = {
  entries: BenchmarkEntry[];
  onSelectCountry?: (iso3: string) => void;
};

export function BenchmarkCard({ entries, onSelectCountry }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeIso, setActiveIso] = useState<string | null>(entries[0]?.iso3 ?? null);

  const visibleEntries = useMemo(() => entries.slice(0, 5), [entries]);

  useEffect(() => {
    if (activeIso && visibleEntries.some((entry) => entry.iso3 === activeIso)) return;
    setActiveIso(visibleEntries[0]?.iso3 ?? null);
  }, [activeIso, visibleEntries]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const width = svgElement.clientWidth || 420;
    const height = 260;
    const margin = { top: 20, right: 24, bottom: 60, left: 40 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const x = d3.scaleBand().domain(visibleEntries.map((entry) => entry.iso3)).range([0, chartWidth]).padding(0.25);
    const y = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]);
    const color = d3
      .scaleOrdinal<ScoreKey, string>()
      .domain(SCORE_KEYS)
      .range(["var(--chart-accent)", "var(--accent2)", "var(--warning)"]);

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const chart = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const groups = chart
      .selectAll<SVGGElement, BenchmarkEntry>("g.country")
      .data(visibleEntries)
      .join("g")
      .attr("class", "country")
      .attr("transform", (entry) => `translate(${x(entry.iso3) ?? 0}, 0)`);

    const barWidth = x.bandwidth() / SCORE_KEYS.length;

    SCORE_KEYS.forEach((key, index) => {
      groups
        .append("rect")
        .attr("x", index * barWidth)
        .attr("y", (entry) => y(entry.scores[key]))
        .attr("width", Math.max(12, barWidth - 6))
        .attr("height", (entry) => chartHeight - y(entry.scores[key]))
        .attr("rx", 8)
        .attr("fill", color(key))
        .attr("opacity", (entry) => (entry.iso3 === activeIso ? 1 : 0.6))
        .style("cursor", "pointer")
        .on("click", (_, entry) => {
          setActiveIso(entry.iso3);
          onSelectCountry?.(entry.iso3);
        });
    });

    chart
      .append("g")
      .call(d3.axisLeft(y).ticks(5).tickFormat((value) => `${value}`))
      .selectAll("text")
      .attr("font-size", 11)
      .attr("fill", "var(--chart-axis)");

    chart
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(
        d3
          .axisBottom(x)
          .tickFormat((iso) => {
            const entry = visibleEntries.find((item) => item.iso3 === iso);
            return entry ? entry.country : iso;
          })
          .tickPadding(12)
      )
      .selectAll("text")
      .attr("font-size", 11)
      .attr("fill", "var(--chart-label)")
      .attr("font-weight", (iso) => (iso === activeIso ? 700 : 500))
      .attr("transform", "rotate(-15)")
      .style("text-anchor", "end");

    const legend = svg.append("g").attr("transform", `translate(${margin.left}, ${height - 24})`);

    SCORE_KEYS.forEach((key, index) => {
      const group = legend
        .append("g")
        .attr("transform", `translate(${index * 120}, 0)`);

      group
        .append("rect")
        .attr("width", 12)
        .attr("height", 12)
        .attr("rx", 3)
        .attr("fill", color(key));

      group
        .append("text")
        .attr("x", 18)
        .attr("y", 10)
        .attr("font-size", 11)
        .attr("fill", "var(--chart-axis)")
        .text(SCORE_LABELS[key]);
    });
  }, [activeIso, onSelectCountry, visibleEntries]);

  const activeEntry = useMemo(
    () => (activeIso ? visibleEntries.find((entry) => entry.iso3 === activeIso) ?? null : null),
    [activeIso, visibleEntries]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Benchmark comparison</h3>
        {activeEntry ? (
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Rank #{activeEntry.rank}
          </span>
        ) : null}
      </div>
      <svg ref={svgRef} className="h-64 w-full" role="img" aria-label="Benchmark chart" />
      {activeEntry ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <div className="text-sm font-semibold">{activeEntry.country}</div>
            <div className="text-xs text-muted">Composite score: {activeEntry.scores.composite.toFixed(1)}%</div>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted">
            <span>{activeEntry.regulators} regulators</span>
            <span className="inline-block h-2 w-px bg-[var(--line)]" />
            <span>{activeEntry.rules} rule families</span>
          </div>
          {SCORE_KEYS.map((key) => (
            <div
              key={key}
              className="panel flex items-center justify-between rounded-xl px-3 py-2 text-sm"
            >
              <span className="font-medium text-muted">{SCORE_LABELS[key]}</span>
              <span className="font-semibold">{activeEntry.scores[key].toFixed(0)}%</span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
