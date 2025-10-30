import { useEffect, useMemo, useState } from 'react'
import { Header } from './components/Header'
import { MapPanel } from './components/MapPanel'
import { DetailPanel } from './components/DetailPanel'
import DashboardFTA from './components/DashboardFTA'
import { Footer } from './components/Footer'
import { useDataset } from './core/fta/store'

export default function App() {
  const dataset = useDataset()
  const [selectedIso, setSelectedIso] = useState<string | null>(null)
  const [selectedRegulatorId, setSelectedRegulatorId] = useState<string | null>(null)

  const regulatorIndex = dataset.metrics.regulators

  const selectedRegulator = useMemo(() => {
    if (!selectedRegulatorId) return null
    return regulatorIndex.byId.get(selectedRegulatorId) ?? null
  }, [regulatorIndex.byId, selectedRegulatorId])

  useEffect(() => {
    if (selectedRegulatorId && !regulatorIndex.byId.has(selectedRegulatorId)) {
      setSelectedRegulatorId(null)
    }
  }, [regulatorIndex.items, regulatorIndex.byId, selectedRegulatorId])

  const handleSelectCountry = (iso: string | null) => {
    setSelectedIso(iso)
    if (!iso) {
      setSelectedRegulatorId(null)
      return
    }
    if (selectedRegulator && selectedRegulator.iso3 !== iso) {
      setSelectedRegulatorId(null)
    }
  }

  const handleSelectRegulator = (regulatorId: string | null) => {
    if (!regulatorId) {
      setSelectedRegulatorId(null)
      return
    }
    const record = regulatorIndex.byId.get(regulatorId)
    if (!record) return
    setSelectedIso(record.iso3)
    setSelectedRegulatorId(regulatorId)
  }

  return (
    <div className="app-shell">
      <a id="top" className="sr-only" aria-hidden="true">
        Top
      </a>
      <Header />
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-12">
        <section
          id="about"
          className="panel space-y-6 rounded-3xl px-8 py-10 shadow-soft"
        >
          <header className="space-y-2">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">About</p>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Fin Trace Atlas (FTA)
            </h2>
          </header>
          <div className="space-y-4 text-base leading-relaxed">
            <p>
              Fin Trace Atlas (FTA) is an open, modular framework designed to visualize international financial oversight and
              regulatory structures. It connects public data sources with interactive representations, revealing how
              supervisory authorities, legal frameworks, and institutional networks are interlinked across jurisdictions.
            </p>
            <p>
              Initiated by Picyboo™ Cybernetics Inc. (CA), the project aims to provide a transparent and accessible overview of
              regulation and compliance worldwide—supporting research, technology development, and the financial sector alike.
              Developed as an open-source initiative, FTA serves as a foundation for analytical tools and comparative
              assessments in the evolving landscape of financial regulation.
            </p>
          </div>
        </section>

        <section id="atlas" className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <MapPanel dataset={dataset} onSelect={handleSelectCountry} selectedIso={selectedIso} />
          <DetailPanel
            dataset={dataset}
            selectedIso={selectedIso}
            selectedRegulatorId={selectedRegulatorId}
            onSelectRegulator={handleSelectRegulator}
          />
        </section>

        <section id="insights" className="space-y-8">
          <DashboardFTA
            dataset={dataset}
            selectedIso={selectedIso}
            selectedRegulatorId={selectedRegulatorId}
            onSelectCountry={handleSelectCountry}
            onSelectRegulator={handleSelectRegulator}
          />
        </section>
      </main>
      <Footer />
    </div>
  )
}
