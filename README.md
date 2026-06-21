# 📊 MEAL Pro Analytics Studio

<p align="center">
  <img src="public/banner.jpg" alt="MEAL Pro Analytics Studio Banner" width="100%" autocomplete="off" />
</p>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react" alt="React" /></a>
  <a href="https://vite.dev/"><img src="https://img.shields.io/badge/Vite-8.0-646cff?style=for-the-badge&logo=vite" alt="Vite" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/Tailwind_CSS-3.4-38bdf8?style=for-the-badge&logo=tailwind-css" alt="Tailwind CSS" /></a>
  <a href="https://www.chartjs.org/"><img src="https://img.shields.io/badge/Chart.js-4.4-ff6384?style=for-the-badge&logo=chartdotjs" alt="Chart.js" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-Ready-blue?style=for-the-badge&logo=typescript" alt="TypeScript" /></a>
</p>

---

## 🌍 Overview

**MEAL Pro Analytics Studio** is an advanced, highly specialized, and professional data visualization engine designed explicitly for **M&E / MEAL (Monitoring, Evaluation, Accountability, and Learning)** sectors. Highly adapted for NGOs, research institutions, and development projects, the platform offers an immersive dashboard to transform bulk tabular files into highly customized, interactive charts. It is built to ensure complete data security, running entirely on the client-side with native spreadsheet compilers, offline-ready state retention, and a super-resolution chart export engine.

---

## ⚡ Core Architectural Pillars

The application is engineered with high-efficiency frontend paradigms to ensure robust scalability, sub-millisecond response rates, and polished interaction states:

### 🧵 Multithreaded Data Processing (Web Workers)
File uploads often block the browser's main thread and freeze the UI during heavy parsing. This platform circumvents this limitation by delegating heavy tabular conversions to a background sandbox:
- **`excelWorker.js`**: Operates in a distinct thread to parse large multi-sheet Excel files and CSV matrices asynchronously.
- **Client Synchronization**: Raw streams are mapped and structured in the background before yielding back to the controller, keeping the UI at a constant **60 FPS** even with thousands of rows.

### 🧠 Semantic Data Classification Heuristics
Upon file ingestion, a built-in telemetry suite automatically evaluates the incoming dataset to infer schema parameters:
- **Quantitative Continuous Fields**: Detects numbers, ratios, and counts, mapping them to continuous numerical metrics.
- **Categorical & Segmented Columns**: Infers categories, states, and textual tags to determine aggregation groups.
- **Temporal Dimensions**: Locates date systems, formats them uniformly, and sets up appropriate continuous timelines.

### 💾 Durable & Compressing Local State Engine
To preserve high-fidelity session variables without requiring vulnerable database servers, the system includes a zero-dependency local storage engine:
- **LZW Compression (`LZString`)**: Active data tables are compressed by up to **80%** before hitting local registry states, completely bypassing the standard browser **5MB local storage quota**.
- **State Synchronization**: Custom labels, manual aliases, chosen icons, active colors, and layout presets are automatically preserved and restored instantly upon page reload.

---

## ✨ Features Breakdown

### 📊 Advanced 16-Chart Catalog Matrix
The studio contains four distinct categories of data rendering, supporting specific query intents:

| Category | Chart Type | Ideal Use Case |
| :--- | :--- | :--- |
| **Statistical Lines** | `Line Trends` | Chronological progress tracking of quantitative indicators. |
| | `Curved Splines` | Smooth bezier curve paths that minimize visual clutter. |
| | `Stepped Lines` | Discrete step changes reflecting sudden operational shifts. |
| | `Area Volumes` | Visualizing cumulative volume over distinct temporal segments. |
| | `Smooth Areas` | Elegant gradient-filled curves for continuous values. |
| **Pillars & Columns** | `Vertical Columns` | Standalone comparisons across individual project milestones. |
| | `Horizontal Bars` | Ideal layout for items containing extremely long textual labels. |
| | `Stacked Columns` | Breakdown of multi-sector beneficiary splits per location. |
| | `Stacked Horizontals` | Segmented stack comparisons mapped horizontally. |
| **Radial & Proportional**| `Pie Chart` | Classical relative proportion display of static segments. |
| | `Doughnut Ring` | Circular percentage splits with a customizable metrics center. |
| | `Semi-Doughnut` | Compact gauge-type speedometer tracking progress against targets.|
| | `Radar Spider` | Multivariate radar grid useful for visual profile models. |
| | `Polar Area` | Segmented distribution where slices vary by radial distance. |
| **Advanced Analytics** | `Combo Bar & Line` | Dual-axis overlay linking raw counts with percentage trends. |
| | `Scatter Correlation`| Dynamic 2D coordinate canvas to locate bivariate scatter correlations.|

### 🧪 Advanced Filtering & Manual Mapping
- **Bulk Filtering Modes**: Filter records collectively by matching partial inputs or logical column boundaries.
- **Manual Column & Index Aliasing**: Assign custom professional labels directly in the UI to overwrite messy database headers.
- **Humanitarian Symbol Integration (`@platyplus/humanitarian-icons`)**: Connect localized icons from official UN/OCHA humanitarian graphics directories directly to your primary dimensions to make charts instantly recognizable to donors.

### 📥 Enterprise-Grade Export Suite
The export engine is configured with high-fidelity canvas hooks to build publication-ready PDFs, website banners, or presentation slides:
- **Super-Resolution Rasterization (5x Custom Scale)**: Multiplies canvas boundaries internally during renders to compile pristine typography, avoiding default low-DPI browser blurring.
- **Layout & Ratio Constraints**: Export in strict dimensions matching specific presentation standards (`16:9` widescreen, `4:3` classic slide, `1:1` square, or `free` fluid boundaries).
- **Pro Overlays & Watermarks**: Inject dynamic titles, user-defined credits, watermarks, localized timestamps, or export with full Alpha-channel transparency.
- **Export Formats**: Seamless download of high-density PNG graphics, structured Excel (`.xlsx`) books, or raw Excel tables.

---

## 📁 Technical Directory Structure

```bash
├── src/
│   ├── components/
│   │   ├── ChartArea/           # Main display area and chart selectors
│   │   │   ├── ChartHeader.jsx  # Category selector and active chart type state
│   │   │   └── MetricsGrid.jsx  # Dynamic cards rendering numeric summaries
│   │   ├── Sidebar/             # Left control station
│   │   │   └── sections/        # Sectional dashboards (Filters, Styling, Data, Icons)
│   │   ├── ChartEngine.jsx      # Central aggregation engine translating schemas into ChartJS
│   │   ├── ChartGallery.jsx     # Comprehensive grid of active/inactive charts and bulk exports
│   │   ├── DynamicIcon.jsx      # Adaptive SVG handler mapping names to icon paths
│   │   ├── SafeIcon.jsx         # Fallback-aware Lucide SVG gateway wrapper
│   │   └── SkeletonLoader.jsx   # Visual placeholder transitions during async states
│   ├── utils/
│   │   └── excelWorkerClient.js # Gateway mapping requests and callbacks to thread tasks
│   ├── workers/
│   │   └── excelWorker.js       # Background service processing large XML spreadsheets
│   ├── App.jsx                  # Root state controller, layout coordinator, and local storage bindings
│   ├── index.css                # Style directives, Tailwind utilities, and Inter/Mono font bindings
│   └── main.tsx                 # Core bundle mount entry-point
├── public/                      # Static logos, banners, and sample files
├── metadata.json                # Application metadata and runtime settings
├── package.json                 # Core library dependencies and compiler configurations
└── README.md                    # This complete documentation file
```

---

## 🛠️ Step-by-Step Installation & Run Guide

To run the **MEAL Pro Analytics Studio** locally or configure it in your CI pipeline, follow these simple commands:

### Prerequisites
Ensure you have **Node.js** (v18.0.0 or higher) and **npm** (v10.0.0 or higher) installed in your operating environment.

### 1. Initialize & Install Dependencies
Clone the repository and run the standard installer to fetch node packages:
```bash
npm install
```

### 2. Launch Local Development Server
Boot up the fast Vite HMR server to preview modifications immediately:
```bash
npm run dev
```
Open your browser and navigate to the default address: `http://localhost:3000`

### 3. Build & Compile Production-Ready Assets
Compile a highly optimized static bundle ready for robust production deployments:
```bash
npm run build
```
This prepares a standalone, performance-tweaked `dist/` directory consisting of minified chunks, responsive asset paths, and pre-packaged static visual assets. It can be hosted on AWS, Cloud Run, GitHub Pages, or Netlify with zero custom server dependencies.

---

## 💡 Workflow Execution Paradigm

```
[ XLS / CSV Ingestion ] ──────> [ Background Web Worker ] ──────> [ Semantic Schema Inference ]
                                                                             │
                                                                             ▼
[ Custom Excel Download ] <─── [ Multi-Resolution Export ] <─── [ Real-time Custom Styling & Filters ]
```

1.  **Ingestion & Parsing**: Drag and drop a standard data file. Processing happens in a non-blocking UI background thread.
2.  **Aggregation & Analysis**: Select target columns to establish coordinates (your primary independent categories on X and dependent quantities on Y).
3.  **Visualization Tuning**: Refine layout colors (from custom palettes), border sizes, tick parameters, or assign local project-specific humanitarian symbols.
4.  **Bulk Export**: Select specific charts from the comprehensive gallery and export them as ultra-resolution graphics with transparent backgrounds or customized watermarks.

---

<p align="center" style="font-weight: 500; font-size: 13px; color: #64748b; margin-top: 3rem;">
  Engineered with high standards of design and performance to deliver beautiful, reliable data analysis pipelines. 📊🕊️
</p>
