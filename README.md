# FinTrace Atlas (MapLibre Edition, MVP)

Fin Trace Atlas (FTA) is an open, modular framework designed to visualize international financial oversight and regulatory
structures. It connects public data sources with interactive representations, revealing how supervisory authorities, legal
frameworks, and institutional networks are interlinked across jurisdictions.

Initiated by Picyboo™ Cybernetics Inc. (CA), the project provides a transparent and accessible overview of regulation and
compliance worldwide—supporting research, technology development, and the financial sector alike. Developed as an open-source
initiative, FTA serves as a foundation for analytical tools and comparative assessments in the evolving landscape of financial
regulation.

This variant avoids the D3 dependency chain by using MapLibre GL with a bundled GeoJSON layer. Interactive choropleth with
hover/click, country detail panel, Zod‑validated dataset.

## Quick start
```bash
npm i
npm run dev
```
Build:
```bash
npm run build
```

## Notes
- Uses bundled `world-countries.geo.json` for polygon layer (no external tiles required).
- No exploits, only official-source metadata.

## Maintainer
**Picyboo Cybernetics Inc.** – British Columbia, Canada  
Issues and inquiries: contact@picyboo.com