// src/adapters/FTADashboard.tsx
import RegulationMap from '../features/regmap/RegulationMap';
import ComplianceGraph from '../features/network/ComplianceGraph';
import RegNewsPanel from '../features/news/RegNewsPanel';

export default function FTADashboard() {
  return (
    <div className='fta-grid' style={{ display: 'grid', gap: 16 }}>
      <section>
        <h2>Regulatory Map</h2>
        <RegulationMap height={520} />
      </section>
      <section>
        <h2>Compliance Network</h2>
        <ComplianceGraph iso3={null} height={420} />
      </section>
      <section>
        <h2>Regulatory News</h2>
        <RegNewsPanel countryIso3={null} />
      </section>
    </div>
  );
}
