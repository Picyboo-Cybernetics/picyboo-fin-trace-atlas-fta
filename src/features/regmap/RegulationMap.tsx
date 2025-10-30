// src/features/regmap/RegulationMap.tsx
import { useEffect, useRef } from "react"
import maplibregl from "maplibre-gl"
import "maplibregl/dist/maplibre-gl.css"
import { useDataset } from "../../core/fta/store"

const readThemeVar = (name: string, fallback: string) => {
  if (typeof window === "undefined") return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name)
  return value ? value.trim() : fallback
}

export default function RegulationMap({ height = 520 }: { height?: number }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const { data } = useDataset()

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: "https://demotiles.maplibre.org/style.json",
      center: [10, 20],
      zoom: 1.4
    })
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right")
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const coords: Record<string, [number, number]> = {
      USA: [-98.5, 39.8],
      THA: [100.5, 15.9],
      DEU: [10.0, 51.2]
    }
    const markers = (map as any).__ftaMarkers ?? []
    for (const m of markers) m.remove()
    const newMarkers: any[] = []

    for (const c of data) {
      const xy = coords[c.iso3]
      if (!xy) continue
      const el = document.createElement("div")
      el.className = "fta-marker"
      el.style.width = "10px"
      el.style.height = "10px"
      el.style.borderRadius = "9999px"
      el.style.background = readThemeVar("--accent", "#2F81F7")
      el.title = `${c.country}: ${c.regulators.length} regulators`
      const mk = new maplibregl.Marker({ element: el }).setLngLat(xy).addTo(map)
      newMarkers.push(mk)
    }
    ;(map as any).__ftaMarkers = newMarkers
  }, [data])

  return <div ref={containerRef} style={{ width: "100%", height }} />
}
