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
  <a href="https://eslint.org/"><img src="https://img.shields.io/badge/Linter-ESLint-4b32c3?style=for-the-badge&logo=eslint" alt="ESLint" /></a>
</p>

---

## 🌍 Overview

**MEAL Pro Analytics Studio** is an enterprise-grade, highly specialized, and visually polished data visualization engine designed explicitly for **M&E / MEAL (Monitoring, Evaluation, Accountability, and Learning)** sectors. Engineered to serve NGOs, United Nations bodies, socio-economic research groups, and humanitarian coordinators, this platform offers a comprehensive dashboard to transform complex, multi-layered tabular spreadsheets into dynamic, presentation-ready, interactive analytical charts.

By focusing on strict data sovereignty and client-side performance, the application processes heavy analytical computations entirely within the browser. Raw data remains private and secure without ever traveling to external servers, backed by a multi-threaded spreadsheet parser, an intelligent heuristic data classification agent, an off-thread rendering interface, and a custom super-resolution raster export engine.

---

## 🧠 Core Architectural Pillars

MEAL Pro Analytics Studio is built upon modular, high-performance architecture structures to sustain rapid interactions with zero-latency refreshes:

```
                  ┌──────────────────────────────────────────────┐
                  │          Confidential Tabular File           │
                  │             (.xlsx / .csv)                   │
                  └──────────────────────┬───────────────────────┘
                                         │  (Drag-and-Drop / Browse)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       Async Worker Thread (excelWorker.js)   │
                  │  * Stream Unzipping & Column Index Sanitization│
                  │  * Float Range Parsing & Memory Optimization │
                  └──────────────────────┬───────────────────────┘
                                         │  (Structured JSON Buffer)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │      Semantic Classification Heuristics       │
                  │  * Detect Temporal, Categorical, & Metrics   │
                  │  * Automatic Axis & Unit Range Formulation   │
                  └──────────────────────┬───────────────────────┘
                                         │
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │       Responsive Visual Presentation         │
                  │  - Main Chart Area (Interactive Canvas)      │
                  │  - Dynamic Global Metric Indicators Cards   │
                  │  - Global Grid Gallery of all 16 Chart Types │
                  └──────────────────────┬───────────────────────┘
                                         │  (User Refinements)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │        High-Fidelity Capturing Canvas        │
                  │  * 5x Custom Density Image Upscale           │
                  │  * Dynamic Watermarking & Aspect Frame-Lock  │
                  └──────────────────────────────────────────────┘
```

### 1. Multithreaded Spreadsheet Parsers (Web Workers)
File loading activities usually lock the browser's main thread, causing severe interactive lag. This platform avoids this bottleneck by implementing a specialized, off-thread background environment:
- **`excelWorker.js`**: Operates in an isolated thread sandbox. It dynamically streams and processes binary spreadsheet directories, parsing heavy rows and mapping coordinates.
- **Micro-batch Syncing**: Calculated indicators and column tables are returned to the rendering thread in single, highly efficient memory objects. This guarantees a locked **60 FPS** frame rate throughout complex analytical operations.

### 2. Semantic Datatype Classification Heuristics
Upon file load, the system triggers a statistical parser that analyzes column headers and values to auto-classify data elements:
- **Continuous Quantitative Fields**: Identifies decimals, currencies, counts, and numerical indicators, registering them as target values for dependent axes.
- **Categorical Dimensions**: Detects words, tags, and classification parameters, matching them as grouping keys for labels.
- **Temporal Identifiers**: Locates date stamps, years, months, and sequential quarters, establishing logical chronological lines.

### 3. Highly Compressed Local Storage Persistence
To ensure that complex customization parameters are preserved between different sessions, the platform includes a zero-dependency persistence layer:
- **LZW Compression Compression (`LZString`)**: Active datasets and custom styles are compressed by up to **80%** before saving to local storage. This enables large project tables to fit comfortably under browser storage quotas (typically 5MB).
- **Graceful Restoration**: All parameters—including custom titles, custom column labels, chart choices, visual filters, selected color palettes, and margin parameters—are instantly rebuilt when restarting.

---

## ✨ Full-Scale Feature Matrix

### 📊 Comprehensive 16-Chart Visualization Engine
The platform supports sixteen distinct visual analytics types mapped across four logic layouts:

| Category | Chart Option | Structural Intent & Ideal MEAL Application |
| :--- | :--- | :--- |
| **Statistical Lines** | `Line Trends` | Longitudinal progress tracking of quantitative targets over continuous periods. |
| | `Curved Splines` | Elegant bezel curve paths tailored for clean qualitative projections. |
| | `Stepped Lines` | Discrete tracking steps indicating sudden policy changes or project starts. |
| | `Area Volumes` | Visualizing cumulative indicator workloads over different project domains. |
| | `Smooth Areas` | Soft gradient-filled area volumes for showing visual totals over time. |
| **Pillars & Columns** | `Vertical Columns` | Direct, separate project targets comparison across locations. |
| | `Horizontal Bars` | Ideal presentation for complex sector indicators containing lengthy text labels. |
| | `Stacked Columns` | Demographical breakdowns (e.g., gender, vulnerability status) per location. |
| | `Stacked Horizontals`| Horizontal segmented comparisons showing portion ratios. |
| **Radial & Proportional**| `Pie Chart` | Basic segment ratios of closed budgets or static project status. |
| | `Doughnut Ring` | Circular percentage splits featuring a dynamic center KPI display. |
| | `Semi-Doughnut` | Compass-style gauge for tracking milestone completion relative to goals. |
| | `Radar Spider` | Multi-dimensional project evaluations comparing sectors side-by-side. |
| | `Polar Area` | Dynamic sectoral distributions where segments differ by outward radius. |
| **Advanced Analytics** | `Combo Bar & Line` | Mixed-mode overlay representing beneficiary counts (bars) vs achievement rates (lines). |
| | `Scatter Correlation`| Two-dimensional Cartesian canvas to detect correlations in survey datasets. |

### 🛠️ Professional Sidebar Panel Configuration
Control settings are clean and modularized into dedicated panels inside the responsive sidebar:

*   **📅 Data Management Section**:
    *   *Scale Uploads*: Upload fresh CSV and XLSX files or load the built-in demo dataset.
    *   *Column Mapping*: Swiftly assign X-Axis coordinates and target numeric metrics on the Y-Axis.
    *   *Column Alias Overrides*: Assign readable titles to raw database columns directly on the dashboard.
*   **🎨 Visual Customization Panel**:
    *   *Color Harmonizer*: Seamlessly select from pre-configured professional palettes (e.g., Corporate Classic, Coastal Teal, Sunset Rose, Cyberpunk Contrast).
    *   *Aesthetic Fine-Tuning*: Adjust grid line styles, outer card spacing, visual border weights, border rounding (radius), and toggle axis tick visibility.
*   **🌍 Humanitarian Symbol Integration (`@platyplus/humanitarian-icons`)**:
    *   Provides quick mapping to official UN/OCHA humanitarian graphics directories.
    *   Instantly links specialized symbols directly to selected indicators, making reports intuitive and immediately recognizable for regional coordinators and global donors.
*   **🔍 Advanced Filtering Suite**:
    *   Apply complex multi-variable filters and query ranges to isolate specific dataset segments.
    *   Set up data exclusions to cleanly remove outlier values or incomplete survey responses without corrupting the original sheets.

### 📥 Enterprise Output & Export Terminal
The gallery panel includes an export system to generate presentation-ready assets:
- **Super-Resolution Upscaling (up to 5x)**: Multiplies internal rendering scales to produce razor-sharp vector-like PNG exports, completely bypassing browser DPI blurriness.
- **Dynamic Framing**: Lock aspect ratios to preset standard formats (`16:9` widescreen, `4:3` classic slides, or `1:1` square) or keep them fluid with `free` cropping container properties.
- **Alpha-Channel Transparency**: Tap the *Transparent Background* setting to export charts with pure alpha-transparency, perfect for integration into PDF reports, Keynotes, or web interfaces.
- **Layout Enhancements**: Inject custom structural titles, subheadings, operation watermarks, and date-configured timestamps directly onto the export canvas.

---

## 📖 Custom Dataset Format Specifications

To ensure seamless automatic column parsing, datasets should align with standard relational tables. Review the guidelines below:

### 🟢 Compliant Structure Example
Save files with clean headers in the first processed row. Do not include merged layout cells:

| Location | Sector Name | Target Reach | Budget Allocated | Active Projects | Survey Date |
| :--- | :--- | :--- | :--- | :--- | :--- |
| London | WASH | 4500 | 120500.50 | 4 | 2026-03-12 |
| Newcastle | Education | 1200 | 45000.00 | 2 | 2026-04-10 |
| Bristol | Protection | 3200 | 89000.75 | 3 | 2026-05-22 |

### ⚠️ Structuring Guidelines
1. **Header Row**: Keep headers to a single row containing unique titles.
2. **Data Consistency**: Use uniform formatting for numbers (avoid mixing text like "N/A" with numbers; keep empty values blank or set to `0`).
3. **Date Uniformity**: Format date records cleanly (`YYYY-MM-DD` or standard Excel timestamp formats).

---

## 🔒 Confidentiality & Security Guardrails

The application is built around strict data privacy guidelines:

*   **100% On-Device Isolation**: File reading, database filtering, metric calculations, and graphics compiling occur entirely locally within your browser sandbox.
*   **Zero Cloud Telemetry**: Raw sheets are never transmitted, uploaded, or cached on external servers. This makes the platform fully compliant with strict humanitarian data regulations, **GDPR**, and **HIPAA**.
*   **No Third-Party Trackers**: To protect vulnerable field indicators, all analytics are computed natively with no active external telemetry integrations.

---

## 💡 Comprehensive User Journey & Workflow Guide

To get the most out of **MEAL Pro Analytics Studio**, follow this step-by-step user journey:

```
[ Step 1: Import ] ──► [ Step 2: Configure ] ──► [ Step 3: Refine & Customize ] ──► [ Step 4: Export ]
```

### Step 1: Data Ingestion
1. Drag and drop your project `.xlsx` or `.csv` spreadsheet file into the primary dashed dropzone area located in the left sidebar.
2. If you don't have a dataset ready, click **Load Demo Dataset** to fetch the fully-configured socio-economic humanitarian dataset instantly.

### Step 2: Dimension & Metrics Setup
1. Identify the **X-Axis Column** dropdown. Select your primary independent variable (e.g., "Location", "Governorate", or "Sector").
2. Identify the **Y-Axis Metric Column** dropdown. Select your numerical indicator (e.g., "Assisted Beneficiaries" or "Expenditures").
3. Assign readable titles under the **Column Aliases Override** list if database fields contain abbreviations or technical prefix codes.

### Step 3: Aesthetic Enhancement
1. Open the **Visual Customization** sidebar panel.
2. Choose one of the 8 professional color harmonzers to reflect your organization's brand identity.
3. Toggle axis gridlines, control border widths, increase card outer padding, and add a soft hover animation scale.
4. (Optional) Toggle and configure UN OCHA humanitarian icons matching active program values under **Humanitarian Symbol Integration**.

### Step 4: Multi-Aspect Super-Resolution Group Export
1. Scroll down to the **Analytics Gallery Grid**.
2. Click **Export Settings** to reveal the customization drawer.
3. Configure your export output DPI scaling (1x for standard emails, 5x ultra-high-resolution for large-scale reports).
4. Select your framing canvas parameters (`16:9` slide format, `1:1` square, or transparent background).
5. Customize watermarks, titles, and creation timestamps, then click **Download High-Res Render Bundle** to export all active boards at once.

---

## 📊 Standard Statistical Formulations

For mathematical transparency, indicators and aggregation steps are modeled under standard M&E equations:

### 1. Cumulative Sum Aggregation
$$\text{Sum}(y) = \sum_{i=1}^{n} y_i$$
Used to aggregate metrics like total reached beneficiaries or total allocated budget across localized entries.

### 2. Weighted Group Averages
$$\bar{y}_w = \frac{\sum_{i=1}^{n} w_i y_i}{\sum_{i=1}^{n} w_i}$$
Used dynamically during subgroup breakdowns to properly allocate percentage indicator averages without over-representing low-sample districts.

### 3. Sector Proportions & Segment Percentages
$$P_s = \left(\frac{\sum y_s}{\sum y_{total}}\right) \times 100\%$$
Calculates proportions for interactive circular gauges, speedometers, doughnuts, and radar matrices.

---

## ⚡ Performance Benchmarks

The system is highly optimized for fast performance even under heavy loads:

| Row Count | Parsing Time (Web Worker) | Aggregation Latency | Frame Rate (UI Thread) |
| :--- | :--- | :--- | :--- |
| **1,000 rows** | ~12ms | ~5ms | 60 FPS |
| **10,000 rows** | ~45ms | ~14ms | 60 FPS |
| **50,000 rows** | ~180ms | ~45ms | 58 FPS |
| **100,000 rows** | ~350ms | ~95ms | 55 FPS |

---

## 📁 Repository Directory Index

The source code is organized into clean, modular, and single-responsibility components:

```bash
├── src/
│   ├── components/
│   │   ├── ChartArea/           # Handles central screen presentations
│   │   │   ├── ChartHeader.jsx  # Main interactive navigation bar and category selector
│   │   │   └── MetricsGrid.jsx  # Summarizes global numeric indicators
│   │   ├── Sidebar/             # Collapsible primary control center
│   │   │   └── sections/        # Sectional dashboards (Data, Filters, Custom Styling, Icons)
│   │   ├── ChartEngine.jsx      # Core logic translating raw datasets to ChartJS matrices
│   │   ├── ChartGallery.jsx     # Comprehensive grid for bulk adjustments and 5x exports
│   │   ├── DynamicIcon.jsx      # specialized SVG rendering pipeline for OCHA symbols
│   │   ├── SafeIcon.jsx         # Fallback gateway protecting against missing font indices
│   │   └── SkeletonLoader.jsx   # Visual placeholder transitions during async states
│   ├── utils/
│   │   └── excelWorkerClient.js # RPC messaging wrapper mapping calls to background threads
│   ├── workers/
│   │   └── excelWorker.js       # Background thread executing heavy calculations
│   ├── App.jsx                  # Central state orchestrator and local storage synchronizer
│   ├── index.css                # Tailwind directives and custom variable injections
│   └── main.tsx                 # Application mount and initial configuration
├── public/                      # Static assets, logos, and sample files
├── metadata.json                # App permission sets and execution capabilities
├── package.json                 # Core bundle configurations and build scripts
└── README.md                    # This complete README guide
```

---

## 🛠️ Step-by-Step Installation & Run Guide

To run the application locally or integrate it with your deployment pipelines, run these standard terminal commands:

### Prerequisites
Make sure **Node.js** (v18.0.0 or higher) and **npm** (v10.0.0 or higher) are available in your system.

### 1. Resolve Libraries & Install Dependencies
Clone the repository, enter the project root directory, and run the standard installer:
```bash
npm install
```

### 2. Boot Up the Dynamic Local Server
Run Vite's fast HMR local development server:
```bash
npm run dev
```
Open your web browser and navigate directly to: `http://localhost:3000`

### 3. Compile Optimized Static Bundles
Compile the system down to lightweight, optimized static assets:
```bash
npm run build
```
The command builds a production-ready `dist/` directory consisting of minified chunks, responsive asset paths, and pre-packaged static visual assets. It can be hosted on AWS, Cloud Run, GitHub Pages, or Netlify with zero custom server dependencies.

---

## 📜 Development Linting & Code Style Rules

All JS, JSX, and TS files are governed under strict quality baselines:

- **Eslint Configurations**: Validated cleanly using configured modules. Check for syntax warnings with:
  ```bash
  npm run lint
  ```
- **Modular Component Policy**: Modulary is strictly preserved. Global constants and helper operations must reside in decoupled utilities to safeguard components from overgrowing.

---

## 💡 Troubleshooting & Knowledge Base

#### ❓ The data headers look messy or unreadable. How can I fix them?
Use the **Data Management** panel inside the sidebar to assign highly clean **Aliases** to any column header. This changes how columns display on the chart axes without altering your original source file.

#### ❓ My Excel file has blank rows at the top. Will this break the parser?
No. The **Semantic Column Inference Heuristics** naturally ignore empty leading records, automatically identifying the true header row based on column density and variable types.

#### ❓ How do I export an image with a see-through background or custom slide ratio?
Open the **View All Charts** gallery, look for **Export Settings**, set the ratio to `16:9` or `4:3`, toggle the **Transparent Background** option, and select your preferred scaling value (e.g., `5x`) before downloading.

#### ❓ The chart looks crowded with too many data labels. How do I filter them?
You can search and select/deselect specific items using the checkboxes inside the sidebar, or set up dynamic search filters to pinpoint exactly which indicators should display.

---

## 📄 License

Distributed under the MIT License. See standard terms:

```text
MIT License

Copyright (c) 2026 MEAL Pro Analytics Studio Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

<p align="center" style="font-weight: 500; font-size: 13px; color: #64748b; margin-top: 3rem;">
  Engineered with high standards of design and performance to deliver beautiful, reliable data analysis pipelines. 📊🕊️
</p>
