import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import type { ScoreDistributionBucket } from "../../core/fta/store";
import { Badge } from "../../components/ui/Badge";

type Props = {
  buckets: ScoreDistributionBucket[];
  resolveCountry: (iso3: string) => string;
  onSelectCountry?: (iso3: string) => void;
};

export function ScoreDistributionCard({ buckets, resolveCountry, onSelectCountry }: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [activeBucketId, setActiveBucketId] = useState<string | null>(buckets[0]?.id ?? null);

  useEffect(() => {
    if (activeBucketId && buckets.some((bucket) => bucket.id === activeBucketId)) return;
    setActiveBucketId(buckets[0]?.id ?? null);
  }, [activeBucketId, buckets]);

  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const width = svgElement.clientWidth || 360;
    const height = 200;
    const margin = { top: 16, right: 12, bottom: 40, left: 12 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const maxCount = d3.max(buckets, (d) => d.count) ?? 1;
    const x = d3.scaleBand().domain(buckets.map((bucket) => bucket.id)).range([0, chartWidth]).padding(0.3);
    const y = d3.scaleLinear().domain([0, Math.max(1, maxCount)]).range([chartHeight, 0]).nice();

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();
    svg.attr("viewBox", `0 0 ${width} ${height}`);

    const chart = svg.append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);

    const barGroups = chart
      .selectAll<SVGGElement, ScoreDistributionBucket>("g.bar")
      .data(buckets)
      .join("g")
      .attr("class", "bar")
      .attr("transform", (bucket) => `translate(${x(bucket.id) ?? 0}, 0)`);

    barGroups
      .append("rect")
      .attr("x", 0)
      .attr("y", (bucket) => y(bucket.count))
      .attr("width", x.bandwidth())
      .attr("height", (bucket) => chartHeight - y(bucket.count))
      .attr("rx", 10)
      .attr("fill", (bucket) =>
        bucket.id === activeBucketId ? "var(--chart-accent)" : "var(--chart-muted)"
      )
      .attr("opacity", (bucket) => (bucket.count === 0 ? 0.25 : 1))
      .style("cursor", "pointer")
      .on("click", (_, bucket) => {
        setActiveBucketId(bucket.id);
      });

    barGroups
      .append("text")
      .attr("x", x.bandwidth() / 2)
      .attr("y", (bucket) => y(bucket.count) - 6)
      .attr("text-anchor", "middle")
      .attr("font-size", 11)
      .attr("fill", "var(--chart-label)")
      .attr("font-weight", 600)
      .text((bucket) => (bucket.count > 0 ? bucket.count.toString() : ""));

    chart
      .append("g")
      .attr("transform", `translate(0, ${chartHeight})`)
      .call(d3.axisBottom(x).tickFormat((value) => {
        const bucket = buckets.find((item) => item.id === value);
        return bucket ? bucket.label : String(value);
      }))
      .selectAll("text")
      .attr("font-size", 11)
      .attr("font-weight", 500)
      .attr("fill", "var(--chart-axis)")
      .attr("transform", "translate(0,6)");
  }, [activeBucketId, buckets]);

  const activeBucket = useMemo(
    () => (activeBucketId ? buckets.find((bucket) => bucket.id === activeBucketId) ?? null : null),
    [activeBucketId, buckets]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">Score distribution</h3>
        {activeBucket ? <Badge tone="outline">{activeBucket.label}</Badge> : null}
      </div>
      <svg ref={svgRef} className="h-52 w-full" role="img" aria-label="Score distribution" />
      {activeBucket ? (
        <div className="space-y-2">
          <div className="text-sm font-medium">Countries ({activeBucket.count})</div>
          {activeBucket.iso3.length ? (
            <div className="flex flex-wrap gap-2">
              {activeBucket.iso3.map((iso3) => (
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
          ) : (
            <div className="text-xs text-muted">No countries in this range.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
