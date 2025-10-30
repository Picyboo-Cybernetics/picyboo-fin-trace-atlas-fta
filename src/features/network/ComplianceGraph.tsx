import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { clsx } from "clsx";

const readThemeVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name)
  return value ? value.trim() : fallback
}
import {
  buildRegulatorId,
  inferRegulatorCategory,
  useDataset,
  type DatasetState,
} from "../../core/fta/store";

type Mode = "country" | "global";

const ALL_CATEGORIES = "__all__";

interface NodeDatum {
  id: string;
  label: string;
  group: "country" | "reg";
  iso3?: string;
  country?: string;
  scope?: string | null;
  category?: string | null;
  url?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface LinkDatum {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

type Props = {
  iso3: string | null;
  height?: number;
  dataset?: DatasetState;
  selectedRegulatorId?: string | null;
  onSelectRegulator?: (regulatorId: string | null) => void;
};

export default function ComplianceGraph({
  iso3,
  height = 360,
  dataset,
  selectedRegulatorId = null,
  onSelectRegulator,
}: Props) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);
  const simRef = useRef<d3.Simulation<NodeDatum, LinkDatum> | null>(null);

  const [mode, setMode] = useState<Mode>(iso3 ? "country" : "global");
  const [categoryFilter, setCategoryFilter] = useState<string>(ALL_CATEGORIES);
  const [menuOpen, setMenuOpen] = useState(false);

  const fallback = useDataset();
  const { data, byIso3, loading, error } = dataset ?? fallback;

  useEffect(() => {
    if (!iso3 && mode === "country") {
      setMode("global");
    }
  }, [iso3, mode]);

  const categories = useMemo(() => {
    const acc = new Set<string>();
    for (const entry of data) {
      for (const reg of entry.regulators ?? []) {
        acc.add(inferRegulatorCategory(reg));
      }
    }
    return Array.from(acc).sort((a, b) => a.localeCompare(b));
  }, [data]);

  useEffect(() => {
    if (categoryFilter !== ALL_CATEGORIES && !categories.includes(categoryFilter)) {
      setCategoryFilter(ALL_CATEGORIES);
    }
  }, [categories, categoryFilter]);

  const palette = useMemo(() => {
    const base = [
      "var(--graph-color-1)",
      "var(--graph-color-2)",
      "var(--graph-color-3)",
      "var(--graph-color-4)",
      "var(--graph-color-5)",
      "var(--graph-color-6)",
      "var(--graph-color-7)",
      "var(--graph-color-8)",
      "var(--graph-color-9)",
      "var(--graph-color-10)",
      "var(--graph-color-11)",
      "var(--graph-color-12)",
    ];
    return d3.scaleOrdinal<string, string>().domain(categories).range(categories.map((_, idx) => base[idx % base.length]));
  }, [categories]);

  const regulatorColor = useCallback(
    (category?: string | null) => {
      const fallback = "var(--accent)";
      if (!categories.length) return fallback;
      if (!category) {
        const color = palette("Regulator");
        return color ?? fallback;
      }
      const color = palette(category);
      return color ?? fallback;
    },
    [categories, palette]
  );


  const showTooltip = useCallback((html: string, event: MouseEvent) => {
    const container = containerRef.current;
    if (!container) return;
    let tooltip = container.querySelector<HTMLDivElement>(".fta-graph-tooltip");
    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.className =
        "fta-graph-tooltip graph-tooltip pointer-events-none absolute z-20 min-w-[200px] text-xs";
      container.appendChild(tooltip);
    }
    const bounds = container.getBoundingClientRect();
    const x = event.clientX - bounds.left + 16;
    const y = event.clientY - bounds.top + 16;
    tooltip.innerHTML = html;
    const left = Math.max(12, Math.min(bounds.width - 220, x));
    const top = Math.max(12, Math.min(bounds.height - 120, y));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.opacity = "1";
  }, []);

  const hideTooltip = useCallback(() => {
    const container = containerRef.current;
    const tooltip = container?.querySelector<HTMLDivElement>(".fta-graph-tooltip");
    if (tooltip) {
      tooltip.style.opacity = "0";
    }
  }, []);

  const handleReset = useCallback(() => {
    if (simRef.current) {
      simRef.current.alpha(1).restart();
    }
  }, []);

  const serializeSvg = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return null;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    const serializer = new XMLSerializer();
    return serializer.serializeToString(clone);
  }, []);

  const exportSvg = useCallback(() => {
    const serialized = serializeSvg();
    if (!serialized) return;
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mode === "global" ? "fta-compliance-global.svg" : "fta-compliance-country.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [mode, serializeSvg]);

  const exportPng = useCallback(() => {
    const svg = svgRef.current;
    const serialized = serializeSvg();
    if (!svg || !serialized) return;
    const width = svg.clientWidth || svg.viewBox.baseVal?.width || 960;
    const heightValue = svg.clientHeight || svg.viewBox.baseVal?.height || height;
    const blob = new Blob([serialized], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = heightValue;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = readThemeVar("--bg", "#FFFFFF");
      ctx.fillRect(0, 0, width, heightValue);
      ctx.drawImage(image, 0, 0, width, heightValue);
      URL.revokeObjectURL(url);
      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = mode === "global" ? "fta-compliance-global.png" : "fta-compliance-country.png";
      a.click();
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
    };
    image.src = url;
  }, [height, mode, serializeSvg]);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      if (!exportRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [exportRef, menuOpen]);

  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!svgElement || !container) return;

    const svg = d3.select(svgElement);
    svg.selectAll("*").remove();

    const width = svgElement.clientWidth || 960;
    const heightValue = height;
    const margin = 36;

    svg.attr("viewBox", `0 0 ${width} ${heightValue}`);

    if (loading) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", heightValue / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--muted)")
        .attr("font-size", 14)
        .text("Loading dataset …");
      return;
    }

    if (error) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", heightValue / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--danger)")
        .attr("font-size", 14)
        .text(error);
      return;
    }

    const countries: NodeDatum[] = [];
    const links: LinkDatum[] = [];

    if (mode === "country") {
      if (!iso3) {
        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", heightValue / 2)
          .attr("text-anchor", "middle")
          .attr("fill", "var(--muted)")
          .attr("font-size", 14)
          .text("Select a country to view its regulators");
        return;
      }
      const record = byIso3.get(iso3);
      if (!record) {
        svg
          .append("text")
          .attr("x", width / 2)
          .attr("y", heightValue / 2)
          .attr("text-anchor", "middle")
          .attr("fill", "var(--muted)")
          .attr("font-size", 14)
          .text("No data for selected country");
        return;
      }

      const countryNode: NodeDatum = {
        id: `country:${record.iso3}`,
        label: record.country,
        group: "country",
        iso3: record.iso3,
        country: record.country,
      };
      countries.push(countryNode);

      record.regulators?.forEach((regulator, index) => {
        const resolvedCategory = inferRegulatorCategory(regulator);
        if (categoryFilter !== ALL_CATEGORIES && resolvedCategory !== categoryFilter) return;
        const regulatorNode: NodeDatum = {
          id: buildRegulatorId(record.iso3, regulator, index),
          label: regulator.name,
          group: "reg",
          iso3: record.iso3,
          country: record.country,
          scope: regulator.scope ?? null,
          category: resolvedCategory,
          url: regulator.url,
        };
        countries.push(regulatorNode);
        links.push({ source: countryNode, target: regulatorNode });
      });
    } else {
      for (const record of data) {
        const countryNode: NodeDatum = {
          id: `country:${record.iso3}`,
          label: record.country,
          group: "country",
          iso3: record.iso3,
          country: record.country,
        };
        countries.push(countryNode);
        record.regulators?.forEach((regulator, index) => {
          const resolvedCategory = inferRegulatorCategory(regulator);
          if (categoryFilter !== ALL_CATEGORIES && resolvedCategory !== categoryFilter) return;
          const regulatorNode: NodeDatum = {
            id: buildRegulatorId(record.iso3, regulator, index),
            label: regulator.name,
            group: "reg",
            iso3: record.iso3,
            country: record.country,
            scope: regulator.scope ?? null,
            category: resolvedCategory,
            url: regulator.url,
          };
          countries.push(regulatorNode);
          links.push({ source: countryNode, target: regulatorNode });
        });
      }
    }

    if (countries.length === 0) {
      svg
        .append("text")
        .attr("x", width / 2)
        .attr("y", heightValue / 2)
        .attr("text-anchor", "middle")
        .attr("fill", "var(--muted)")
        .attr("font-size", 14)
        .text("No regulators match the current filters");
      return;
    }

    const simulation = d3
      .forceSimulation<NodeDatum>(countries)
      .force(
        "link",
        d3
          .forceLink<NodeDatum, LinkDatum>(links)
          .id((d) => d.id)
          .distance(mode === "global" ? 110 : 90)
          .strength(0.2)
      )
      .force("charge", d3.forceManyBody<NodeDatum>().strength(mode === "global" ? -160 : -190))
      .force("center", d3.forceCenter(width / 2, heightValue / 2))
      .force("collision", d3.forceCollide<NodeDatum>().radius((d) => (d.group === "country" ? 28 : 22)).strength(0.8))
      .force("x", d3.forceX<NodeDatum>(width / 2).strength(0.05))
      .force("y", d3.forceY<NodeDatum>(heightValue / 2).strength(0.05));

    simRef.current = simulation;

    const accentColor = readThemeVar("--accent", "#2F81F7");
    const accentHighlight = readThemeVar("--accent-2", "#A5D6FF");
    const surfaceColor = readThemeVar("--bg-2", "#161B22");

    const linkLayer = svg
      .append("g")
      .attr("class", "fta-links")
      .attr("stroke", "var(--line)")
      .attr("stroke-width", 1.4)
      .attr("stroke-linecap", "round")
      .attr("opacity", 0.9);

    const nodeLayer = svg.append("g").attr("class", "fta-nodes");
    const labelLayer = svg.append("g").attr("class", "fta-labels").attr("pointer-events", "none");

    const linkSelection = linkLayer
      .selectAll<SVGLineElement, LinkDatum>("line")
      .data(links)
      .enter()
      .append("line");

    const nodeSelection = nodeLayer
      .selectAll<SVGCircleElement, NodeDatum>("circle")
      .data(countries)
      .enter()
      .append("circle")
      .attr("class", (d) => `fta-node fta-node-${d.group}`)
      .attr("r", (d) => (d.group === "country" ? 10 : 7))
      .attr("fill", (d) => (d.group === "country" ? accentColor : regulatorColor(d.category)))
      .attr("stroke", (d) => (d.group === "country" && d.iso3 === iso3 ? accentHighlight : surfaceColor))
      .attr("stroke-width", (d) => (d.group === "country" && d.iso3 === iso3 ? 2.4 : 1.6))
      .call(
        d3
          .drag<SVGCircleElement, NodeDatum>()
          .on("start", (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>, d) => {
            d.fx = Math.max(margin, Math.min(width - margin, event.x));
            d.fy = Math.max(margin, Math.min(heightValue - margin, event.y));
          })
          .on("end", (event: d3.D3DragEvent<SVGCircleElement, NodeDatum, NodeDatum>, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          })
      );

    const labelSelection = labelLayer
      .selectAll<SVGGElement, NodeDatum>("g")
      .data(countries)
      .enter()
      .append("g")
      .attr("class", "fta-label-group");

    labelSelection
      .append("text")
      .attr("class", "fta-label")
      .attr("text-anchor", "middle")
      .attr("font-size", (d) => (d.group === "country" ? 12 : 11))
      .attr("font-weight", (d) => (d.group === "country" ? 600 : 500))
      .attr("fill", "var(--text-default)")
      .attr("y", (d) => (d.group === "country" ? -16 : -14))
      .text((d) => d.label);

    const badgeGroups = labelSelection
      .filter((d) => d.group === "reg" && Boolean(d.category))
      .append("g")
      .attr("class", "fta-badge");

    badgeGroups
      .append("rect")
      .attr("x", -32)
      .attr("y", -10)
      .attr("height", 14)
      .attr("rx", 7)
      .attr("fill", "var(--bg-3)");

    badgeGroups
      .append("text")
      .attr("text-anchor", "middle")
      .attr("font-size", 9)
      .attr("font-weight", 600)
      .attr("fill", (d) => regulatorColor(d.category))
      .attr("dominant-baseline", "middle")
      .text((d) => d.category ?? "Regulator");

    badgeGroups.each(function () {
      const group = d3.select(this as SVGGElement);
      const textNode = group.select<SVGTextElement>("text").node();
      const rect = group.select<SVGRectElement>("rect");
      const width = (textNode?.getBBox().width ?? 0) + 14;
      rect.attr("width", width).attr("x", -width / 2).attr("y", -9);
    });

    const connected = new Map<string, Set<string>>();
    links.forEach((link) => {
      const sourceId = typeof link.source === "string" ? link.source : link.source.id;
      const targetId = typeof link.target === "string" ? link.target : link.target.id;
      if (!connected.has(sourceId)) connected.set(sourceId, new Set());
      if (!connected.has(targetId)) connected.set(targetId, new Set());
      connected.get(sourceId)!.add(targetId);
      connected.get(targetId)!.add(sourceId);
    });

    const applySelectionState = () => {
      nodeSelection
        .classed("is-selected", (node) => {
          if (!selectedRegulatorId) return false;
          if (node.id === selectedRegulatorId) return true;
          const neighbours = connected.get(node.id);
          return neighbours?.has(selectedRegulatorId) ?? false;
        })
        .classed("is-dimmed", (node) => {
          if (!selectedRegulatorId) return false;
          if (node.id === selectedRegulatorId) return false;
          const neighbours = connected.get(node.id);
          return !(neighbours?.has(selectedRegulatorId));
        });

      linkSelection.classed("is-active", (link) => {
        if (!selectedRegulatorId) return false;
        const sourceId = typeof link.source === "string" ? link.source : link.source.id;
        const targetId = typeof link.target === "string" ? link.target : link.target.id;
        return sourceId === selectedRegulatorId || targetId === selectedRegulatorId;
      });
    };

    applySelectionState();

    nodeSelection
      .on("mouseenter", (event, d) => {
        const neighbours = connected.get(d.id) ?? new Set<string>();
        nodeSelection.classed("is-dimmed", (n) => n.id !== d.id && !neighbours.has(n.id));
        linkSelection.classed("is-active", (link) => {
          const sourceId = typeof link.source === "string" ? link.source : link.source.id;
          const targetId = typeof link.target === "string" ? link.target : link.target.id;
          return sourceId === d.id || targetId === d.id;
        });
        const meta: string[] = [];
        if (d.group === "country") {
          meta.push(`<div class=\"text-[11px] text-muted\">Country node</div>`);
        } else {
          if (d.category) meta.push(`<div class=\"font-semibold\">${d.category}</div>`);
          if (d.scope)
            meta.push(`<div class=\"text-muted\"><span class=\"font-medium\">Scope:</span> ${d.scope}</div>`);
          if (d.country)
            meta.push(`<div class=\"text-muted\">Jurisdiction: ${d.country}</div>`);
          if (d.url)
            meta.push(`<div class=\"mt-2\"><a class=\"link hover:underline\" href=\"${d.url}\" target=\"_blank\" rel=\"noreferrer\">Visit website</a></div>`);
        }
        showTooltip(
          `<div class=\"space-y-1\">` +
            `<div class=\"text-sm font-semibold\">${d.label}</div>` +
            meta.join("") +
            `</div>`
          ,
          event as unknown as MouseEvent
        );
      })
      .on("mouseleave", () => {
        applySelectionState();
        hideTooltip();
      })
      .on("click", (event, d) => {
        event.stopPropagation();
        if (d.group !== "reg") return;
        if (!onSelectRegulator) return;
        const nextId = selectedRegulatorId === d.id ? null : d.id;
        onSelectRegulator(nextId);
      });

    simulation.on("tick", () => {
      countries.forEach((node) => {
        node.x = Math.max(margin, Math.min(width - margin, node.x ?? width / 2));
        node.y = Math.max(margin, Math.min(heightValue - margin, node.y ?? heightValue / 2));
      });

      linkSelection
        .attr("x1", (d) => (typeof d.source === "string" ? margin : (d.source.x ?? margin)))
        .attr("y1", (d) => (typeof d.source === "string" ? margin : (d.source.y ?? margin)))
        .attr("x2", (d) => (typeof d.target === "string" ? margin : (d.target.x ?? margin)))
        .attr("y2", (d) => (typeof d.target === "string" ? margin : (d.target.y ?? margin)));

      nodeSelection
        .attr("cx", (d) => d.x ?? width / 2)
        .attr("cy", (d) => d.y ?? heightValue / 2);

      labelSelection.attr("transform", (d) => `translate(${d.x ?? width / 2}, ${d.y ?? heightValue / 2})`);
    });

    return () => {
      simulation.stop();
      hideTooltip();
    };
  }, [
    byIso3,
    categories,
    categoryFilter,
    data,
    error,
    height,
    hideTooltip,
    iso3,
    loading,
    mode,
    palette,
    onSelectRegulator,
    regulatorColor,
    showTooltip,
    selectedRegulatorId,
  ]);

  return (
    <div ref={containerRef} className="graph-shell">
      <svg ref={svgRef} width="100%" height={height} role="img" aria-label="Regulator network" />
      <div className="absolute left-4 top-4 flex flex-wrap gap-2">
        <div className="graph-toolbar text-xs">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              if (!iso3) return;
              setMode("country");
            }}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              mode === 'country' && iso3 ? 'btn-primary' : 'btn-outline',
              !iso3 && 'opacity-50 cursor-not-allowed'
            )}
            disabled={!iso3}
          >
            Country view
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMode("global");
            }}
            className={clsx(
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              mode === 'global' ? 'btn-primary' : 'btn-outline'
            )}
          >
            Global view
          </button>
        </div>
        {categories.length > 1 ? (
          <div className="graph-toolbar text-xs">
            <span className="font-semibold text-muted">Category</span>
            <select
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value);
              }}
              className="graph-select text-xs"
            >
              <option value={ALL_CATEGORIES}>All</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </div>
      <div className="absolute right-4 top-4 flex items-center gap-2" ref={exportRef}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleReset();
          }}
          className="btn-outline rounded-full px-3 py-1 text-xs font-semibold transition-colors"
        >
          Reset layout
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setMenuOpen((open) => !open);
            }}
            className="btn-primary rounded-full px-3 py-1 text-xs font-semibold transition-colors"
          >
            Export
          </button>
          {menuOpen ? (
            <div className="graph-menu absolute right-0 z-30 mt-2 w-40 overflow-hidden text-xs">
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-muted transition-colors hover:bg-[var(--bg-3)] hover:text-accent"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  exportSvg();
                }}
              >
                Export SVG
              </button>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-muted transition-colors hover:bg-[var(--bg-3)] hover:text-accent"
                onClick={(event) => {
                  event.stopPropagation();
                  setMenuOpen(false);
                  exportPng();
                }}
              >
                Export PNG
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
