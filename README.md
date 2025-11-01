# FinTrace Atlas: International Financial Oversight Visualization

**Series:** Picyboo Open Source  
**Organization:** Picyboo Cybernetics Inc. (CA)

**Keywords:** Financial Regulation, Regulatory Visualization, Compliance Mapping, International Oversight, Interactive Analytics, MapLibre, Geospatial Data

## About Picyboo Cybernetics

We develop advanced systems across quantum computing, artificial intelligence, and decentralized networks to enable the next generation of technology. Therefore, we distribute select frameworks, implementations, and development tools as open source—enabling developers and institutions to build on our technology foundation.

## Overview

FinTrace Atlas (FTA) is an open, modular framework designed to visualize international financial oversight and regulatory structures. It connects public data sources with interactive representations, revealing how supervisory authorities, legal frameworks, and institutional networks are interlinked across jurisdictions.

Developed as an open-source initiative, FTA serves as a foundation for analytical tools and comparative assessments in the evolving landscape of financial regulation. The framework provides a transparent and accessible overview of regulation and compliance worldwide—supporting research, technology development, and the financial sector alike.

This MapLibre Edition avoids the D3 dependency chain by using MapLibre GL with a bundled GeoJSON layer, providing an interactive choropleth visualization with hover/click interactions, country detail panels, and Zod-validated datasets.

## Repository Purpose

Public tool and research reference for financial sector analysts, regulators, and researchers. Provides an open-source framework for visualizing and analyzing international financial oversight structures.

## Contents

- Interactive geospatial visualization using MapLibre GL
- Bundled `world-countries.geo.json` for polygon layer (no external tiles required)
- Country detail panels with regulatory metadata
- Zod-validated dataset schema
- Official-source metadata only

## Getting Started

1. **Prerequisites:**
   - Node.js 16+
   - npm or yarn

2. **Installation:**
   ```bash
   npm install
   ```

3. **Development:**
   ```bash
   npm run dev
   ```

4. **Build for Production:**
   ```bash
   npm run build
   ```

## Features

- Interactive choropleth maps with hover and click interactions
- Country-specific regulatory detail panels
- No external tile dependencies (bundled GeoJSON)
- Type-safe data validation with Zod
- Responsive design for desktop and mobile

## Status

Actively maintained open-source project. MapLibre Edition (MVP) with core visualization features implemented.

## License

This repository is released under an open-source license; see `LICENSE` for full terms.

## Links

- Website: https://picyboo.com
- Technical Sandbox: https://picyboo.net
- GitHub Organization: https://github.com/Picyboo-Cybernetics
