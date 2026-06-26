# Product Requirements Document (PRD): Dash-Dost Analytics Dashboard

## 1. Goal
Provide an intuitive, interactive analytics dashboard that empowers users to visualize their data, explore geographic insights, and apply dynamic filters to derive actionable insights from uploaded datasets.

## 2. Key Features

### 2.1 LLM Backend - Custom OpenAI SDK
- **Multi-Provider Engine**: Built around custom OpenAPI client routing supporting high-performance OpenRouter endpoint (`https://openrouter.ai/api/v1`) with config options for high-tier models.
- **Local Fallback**: Automatically cascades to a local Ollama service (`http://localhost:11434/v1` targeting `llama3.1`) if the primary service is unavailable or key is missing.
- **Server Sent Events (SSE)**: Fully supports real-time streaming for direct visual assembly steps.

### 2.2 Geographic Data Visualization
- **Choropleth Map**: Real-time rendering of geographic data with animated color transitions.
- **Normalization Engine**: Automatically maps ISO-3166-1 alpha-2, alpha-3, and varied colloquial regional names into standardized keys using a robust 250-country fuzzy matching database.
- **CDN Resilience**: Asynchronously retrieves topologies from reliable CDNs, accompanied by an active loading progress indicator and dedicated network recovery panel.
- **Custom Visual Palettes**: Enables dynamic toggling between Indigo, Emerald, and Violet color theme spectrums.
- **Drill-down & Interactivity**: Select regions (countries/states) to:
  - Zoom and center the map on the selected entity with smooth centroid transitions.
  - Apply a global 'category_select' filter automatically for that entity, synchronizing all dashboard widgets.
  - Multi-select capability to aggregate and compare entities across the dashboard.
  - Visual focus: Highlight selected regions while dimming non-selected areas.

### 2.3 Interactive Filter Engine
- **Global Data Filtering**: Synchronizes filters across the entire dashboard.
- **Dynamic Updates**: Modifying filters triggers a holistic re-evaluation of all displayed metrics/charts. Bidirectional synchronization between Map selection and filter engine. Supports persistent selection retention across page refreshes.

### 2.4 Visual Section Containers
- Organize dashboard components into logical visual sections with titles and descriptions, improving visual hierarchy.

### 2.5 Local-First Management & Synchronization
- **State Persistence**: Utilizes IndexedDB (`idb-keyval`) for high-fidelity, local-first dashboard session state and historical chat logs persistence.
- **Metadata Anti-Pollution**: Cleanses background auto-saving workflows to preserve original, descriptive natural language prompts under list directories.
- **Thorough State Pruner**: Safely and recursively purges all database collections (layout, conversation traces, session filters, and active markers) upon deletion.

### 2.6 Data Processing
- **Parsing**: Efficient CSV/Excel ingestion via PapaParse/XLSX.
- **Normalization Engine**: Implements robust logic to reconcile uploaded naming/code conventions (ISO-3166) with internal standards for high-fidelity mapping.

## 3. Architecture
- **Backend Proxy**: Express + Vite server with direct SSE endpoints.
- **Client-Side**: React 18, Vite, Tailwind v4, Motion/React (for animations), Recharts, React Simple Maps, D3 Scale.
- **State**: Centralized store (Zustand) managing filters, dashboard state, and active data payloads.
- **Persistence**: Hybrid storage utilizing IndexedDB for bulky visual objects and local storage for speedy indices.
