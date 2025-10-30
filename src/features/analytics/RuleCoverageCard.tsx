import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { RegulatorSummary, RuleCoverageEntry } from "../../core/fta/store";

type Props = {
  entries: RuleCoverageEntry[];
  regulators: Map<string, RegulatorSummary>;
  resolveCountry: (iso3: string) => string;
  onSelectCountry?: (iso3: string) => void;
  onSelectRegulator?: (regulatorId: string) => void;
};

export function RuleCoverageCard({
  entries,
  regulators,
  resolveCountry,
  onSelectCountry,
  onSelectRegulator,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeRule, setActiveRule] = useState<string | null>(entries[0]?.code ?? null);

  const visibleEntries = useMemo(() => entries.slice(0, 6), [entries]);

  useEffect(() => {
    if (activeRule && visibleEntries.some((entry) => entry.code === activeRule)) return;
    setActiveRule(visibleEntries[0]?.code ?? null);
  }, [activeRule, visibleEntries]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const width = svgElement.clientWidth || 420;
    const height = 240;
    const margin = { top: 20, right: 16, bottom: 24, left: 160 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const y = d3
      .scaleBand()
      .domain(visibleEntries.map((entry) => entry.code))
      .range([0, chartHeight])
      .padding(0.3);

    const maxCoverage = d3.max(visibleEntries, (entry) => entry.countryCount) ?? 1;
    const x = d3.scaleLinear().domain([0, Math.max(maxCoverage, 1)]).range([0, chartWidth]);

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const chart = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    chart
      .selectAll<SVGRectElement, RuleCoverageEntry>("rect")
      .data(visibleEntries)
      .join("rect")
      .attr("x", 0)
      .attr("y", (entry) => y(entry.code) ?? 0)
      .attr("width", (entry) => x(entry.countryCount))
      .attr("height", y.bandwidth())
      .attr("rx", 12)
      .attr("fill", (entry) =>
        entry.code === activeRule ? "var(--chart-positive)" : "var(--chart-positive-muted)"
      )
      .style("cursor", "pointer")
      .on("click", (_, entry) => {
        setActiveRule(entry.code);
      });

    chart
      .append("g")
      .attr("class", "y-axis")
      .call(
        d3
          .axisLeft(y)
          .tickFormat((code) => {
            const entry = visibleEntries.find((item) => item.code === code);
            return entry ? `${entry.code} · ${entry.title}` : code;
          })
          .tickSize(0)
      )
      .selectAll("text")
      .attr("font-size", 11)
      .attr("fill", (code) =>
        code === activeRule ? "var(--chart-positive-contrast)" : "var(--chart-axis)"
      )
      .call((text) => text.each(function () {
        const self = d3.select(this);
        const lines = self.text().split("·");
        if (lines.length > 1) {
          const [code, title] = lines;
          self.text(code.trim());
          self
            .append("tspan")
            .attr("x", -4)
            .attr("dy", "1.4em")
            .attr("font-size", 10)
            .attr("fill", "var(--chart-muted)")
            .text(title.trim());
        }
      }));

    chart
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat((value) => `${value}`))
      .selectAll("text")
      .attr("font-size", 11)
      .attr("fill", "var(--chart-axis)");
  }, [activeRule, visibleEntries]);

  const activeEntry = useMemo(
    () => (activeRule ? visibleEntries.find((entry) => entry.code === activeRule) ?? null : null),
    [activeRule, visibleEntries]
  );

  const activeRegulators = useMemo(() => {
    if (!activeEntry) return [] as RegulatorSummary[];
    return activeEntry.regulatorIds
      .map((id) => regulators.get(id))
      .filter((value): value is RegulatorSummary => Boolean(value))
      .slice(0, 6);
  }, [activeEntry, regulators]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Rule coverage</h3>
        {activeEntry ? (
          <span className="text-xs font-medium text-muted">
            {activeEntry.countryCount} countries · {activeEntry.regulatorCount} regulators
          </span>
        ) : null}
      </div>
      <svg ref={svgRef} className="h-60 w-full" role="img" aria-label="Rule coverage" />
      {activeEntry ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="text-sm font-semibold">Countries</div>
            <div className="flex flex-wrap gap-2">
              {activeEntry.iso3.map((iso3) => (
                <button
                  key={iso3}
                  type="button"
                  onClick={() => onSelectCountry?.(iso3)}
                  className="btn-outline rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                >
                  {resolveCountry(iso3)}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-semibold">Regulators</div>
            {activeRegulators.length ? (
              <ul className="space-y-2 text-sm">
                {activeRegulators.map((regulator) => (
                  <li
                    key={regulator.id}
                    className="panel flex items-center justify-between gap-3 rounded-xl px-3 py-2"
                  >
                    <div>
                      <div className="font-semibold">{regulator.name}</div>
                      <div className="text-xs text-muted">
                        {regulator.country} · {regulator.category ?? "Regulator"}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSelectRegulator?.(regulator.id)}
                      className="btn-primary rounded-full px-3 py-1 text-xs font-semibold transition-colors"
                    >
                      Drill down
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-xs text-muted">No regulator information available.</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
