import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import countriesGeo from '../assets/geo/world.geo.json'
import type { DatasetState } from '../core/fta/store'
import { Card } from './ui/Card'
import { SectionHeader } from './ui/SectionHeader'

type MLMap = maplibregl.Map
type Props = { dataset: DatasetState; onSelect: (iso3: string | null) => void; selectedIso: string | null }

const readThemeVar = (name: string, fallback: string) => {
  if (typeof window === 'undefined') return fallback
  const value = getComputedStyle(document.documentElement).getPropertyValue(name)
  return value ? value.trim() : fallback
}

const getISO3 = (p: any): string | null => {
  const v =
    p?.['ISO3166-1-Alpha-3'] ||
    p?.ISO_A3 ||
    p?.iso_a3 ||
    p?.ADM0_A3 ||
    p?.cca3 ||
    p?.ISO3 ||
    p?.ISO3_CODE ||
    null
  return v ? String(v).toUpperCase() : null
}

export function MapPanel({ dataset, onSelect, selectedIso }: Props) {
  const { byIso3, loading, error } = dataset
  const mapRef = useRef<MLMap | null>(null)
  const containerId = 'fta-map'

  const features = useMemo(() => {
    const fc = {
      type: 'FeatureCollection' as const,
      features: (countriesGeo as any).features.map((ft: any) => {
        const p = ft.properties || {}
        const iso3 = getISO3(p)
        const rec = iso3 ? byIso3.get(iso3) : null
        const s = rec?.scores?.apiMaturity
        const score = Number.isFinite(s as any) ? Number(s) : -1
        return { ...ft, properties: { ...p, ISO_A3: iso3, score } }
      })
    }
    return fc
  }, [byIso3])

  useLayoutEffect(() => {
    if (mapRef.current) return
    const el = document.getElementById(containerId)
    if (!el) return

    const surface = readThemeVar('--bg-3', '#EEF2F7')
    const neutral = readThemeVar('--bg-2', '#F6F8FA')
    const accent = readThemeVar('--accent', '#2F81F7')
    const textColor = readThemeVar('--text-default', '#111827')
    const strokeBase = readThemeVar('--bg', '#FFFFFF')
    const danger = readThemeVar('--danger', '#F47070')
    const warning = readThemeVar('--warning', '#F4BD61')
    const success = readThemeVar('--success', '#3FB950')

    const map = new maplibregl.Map({
      container: el,
      style: {
        version: 8,
        sources: {},
        layers: [{ id: 'bg', type: 'background', paint: { 'background-color': surface } }]
      },
      center: [10, 20],
      zoom: 1.2
    })
    mapRef.current = map
    ;(window as any).ftaMap = map // optional fürs Debugging

    map.on('load', () => {
      map.addSource('countries', { type: 'geojson', data: features as any })

      map.addLayer({
        id: 'countries-fill',
        type: 'fill',
        source: 'countries',
        paint: {
          'fill-color': [
            'match',
            ['get', 'score'],
            -1, neutral,
            ['interpolate', ['linear'], ['to-number', ['get', 'score']], 0, danger, 40, warning, 70, success]
          ],
          'fill-opacity': 0.9,
          'fill-antialias': true
        }
      })

      map.addLayer({
        id: 'countries-line',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': strokeBase, 'line-width': 0.5 }
      })

      map.addLayer({
        id: 'hover-line',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': textColor, 'line-width': 2 },
        filter: ['==', ['get', 'ISO_A3'], '___']
      })

      map.addLayer({
        id: 'selected-line',
        type: 'line',
        source: 'countries',
        paint: { 'line-color': accent, 'line-width': 3 },
        filter: ['==', ['get', 'ISO_A3'], '___']
      })

      map.on('mousemove', 'countries-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer'
        const f = (e as any).features?.[0]
        const iso = getISO3(f?.properties) ?? '___'
        map.setFilter('hover-line', ['==', ['get', 'ISO_A3'], iso])
      })

      map.on('mouseleave', 'countries-fill', () => {
        map.getCanvas().style.cursor = ''
        map.setFilter('hover-line', ['==', ['get', 'ISO_A3'], '___'])
      })

      map.setFilter('selected-line', ['==', ['get', 'ISO_A3'], selectedIso ?? '___'])

      map.on('click', 'countries-fill', (e) => {
        const f = (e as any).features?.[0]
        const iso3 = getISO3(f?.properties)
        console.log('Clicked ISO3:', iso3, f?.properties)
        onSelect(iso3 ?? null)
      })
    })

    return () => { map.remove(); mapRef.current = null; (window as any).ftaMap = null }
  }, [features, onSelect, selectedIso])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const source = map.getSource('countries') as maplibregl.GeoJSONSource | undefined
    if (!source) return
    source.setData(features as any)
  }, [features])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!map.getLayer('selected-line')) return
    const iso = selectedIso ?? undefined
    map.setFilter('selected-line', ['==', ['get', 'ISO_A3'], iso ?? '___'])
  }, [selectedIso])

  return (
    <Card className="p-0">
      <SectionHeader
        eyebrow="Atlas"
        title="Global compliance heatmap"
        description="Interact with the FinTrace Atlas to surface regulator performance and drill into each jurisdiction."
        className="px-6 pt-6"
      />
      <div className="px-6 pb-6">
        <div className="relative h-[520px] w-full overflow-hidden rounded-[2.2rem] border border-transparent">
          <div id={containerId} className="h-full w-full" />
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-[var(--bg-2)] text-sm text-muted">
              Loading map …
            </div>
          ) : null}
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center rounded-[inherit] bg-[var(--bg-2)] text-sm text-danger">
              {error}
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  )
}
