# Angle Creator

A lightweight, frontend-only tool for creating pie charts and angle guides. Built with React, TypeScript, and HTML Canvas — no backend required.

## Features

### Pie Chart Creator

- Define segments via an editable data table (label, value, color)
- Specify segment sizes as **percentage**, **degrees**, **radians**, or **gradians**
- Three display modes: **color**, **3D drop-shadow**, or **black & white**
- Three shape options: **circle**, **rounded square**, or **square**
- Toggle segment labels and legend independently
- Adjustable canvas size (200–800px)
- Export to **PNG**, **JPEG**, or **PDF**

### Angle Guide

- Base line from center to right (0°) with optional label
- Add angles with **relative** (from previous angle) or **absolute** (from base) positioning
- Toggle absolute angle annotations per entry
- Custom per-angle colors or a global line color
- Background: **white** or **transparent** (shown with checkerboard preview)
- Same shape options and angle units as the pie creator
- Export to **PNG**, **JPEG**, or **PDF**

## Getting Started

```bash
npm install
npm run dev
```

Open the URL printed in the terminal (default `http://localhost:5173`).

### Build for Production

```bash
npm run build
npm run preview
```

### Run Tests

```bash
npm test
```

## Project Structure

```
angle-creator/
├── index.html                        Entry point
├── package.json
├── tsconfig.json
├── vite.config.ts                    Vite configuration
├── vitest.config.ts                  Test configuration
└── src/
    ├── main.tsx                      React root mount
    ├── App.tsx                       App shell with tab navigation
    ├── index.css                     Global styles (dark theme)
    ├── types.ts                      Shared TypeScript types
    ├── components/
    │   ├── PieCreator.tsx            Pie chart controls & canvas
    │   └── AngleGuide.tsx            Angle guide controls & canvas
    ├── utils/
    │   ├── math.ts                   Angle unit conversions & formatting
    │   ├── colors.ts                 Color palette, darkening, B&W shading
    │   ├── shapes.ts                 Canvas shape clipping & outlines
    │   ├── drawPie.ts                Pie chart rendering logic
    │   ├── drawAngle.ts              Angle guide rendering logic
    │   ├── export.ts                 PNG / JPEG / PDF export
    │   └── uid.ts                    Simple unique ID generator
    └── test/
        ├── setup.ts                  Test environment setup
        ├── App.test.tsx              App navigation tests
        ├── PieCreator.test.tsx       Pie chart component tests
        ├── AngleGuide.test.tsx       Angle guide component tests
        ├── math.test.ts             Math utility tests
        ├── colors.test.ts           Color utility tests
        └── drawAngle.test.ts        Angle computation tests
```

## Use Cases

- **Presentations** — quickly generate pie charts with exact angle values for slides or reports.
- **Education** — create angle diagrams for math, geometry, or trigonometry lessons. Students can see how relative and absolute angles relate.
- **Design mockups** — export clean pie charts or angle guides as images for use in design tools.
- **Data visualization prototyping** — experiment with segment sizes using different units (%, °, rad, gon) before committing to a charting library.
- **Print materials** — export to PDF for worksheets, handouts, or posters with precise angle measurements.

## Tech Stack

| Tool | Purpose |
|------|---------|
| [React](https://react.dev) | UI components |
| [TypeScript](https://www.typescriptlang.org) | Type safety |
| [Vite](https://vite.dev) | Dev server & bundler |
| [Vitest](https://vitest.dev) | Unit testing |
| [jsPDF](https://github.com/parallax/jsPDF) | PDF export |

## License

MIT
