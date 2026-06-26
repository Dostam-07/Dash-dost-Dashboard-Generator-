# ⚡ Dash-Dost (Dash-Companion)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Model Support](https://img.shields.io/badge/LLM-Gemini%20%7C%20Gemma-indigo.svg)](#-1-multi-model-llm-orchestrator)
[![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%2B%20Vite%20%2B%20Express-cyan.svg)](#%EF%B8%AF-technical-architecture)

> **"Dost"** (/dōst/) *noun* — Friend, companion, or trusted advisor.
> **Dash-Dost** is the ultimate AI-driven analytical companion designed to translate raw data and conversational intents into stunning, production-ready telemetry environments instantly.

---

## 🔍 Project Overview

**Dash-Dost** is an advanced full-stack business intelligence platform that bridges conversational AI with highly flexible layout engines. Whether you upload a complex multi-sheet dataset, connect a live real-time telemetry stream, or issue natural language layout commands, Dash-Dost instantly constructs an eye-catching, responsive Swiss-designed dashboard.

Equipped with **multi-model orchestration**, a **custom layout heuristic engine**, and a **live WebSocket telemetry layer**, Dash-Dost changes dashboarding from a manual design chore into a collaborative AI conversation.

---

## ✨ Features

### 🤖 1. Multi-Model LLM Orchestrator
Choose the brain behind your dashboard. Dash-Dost lets you hot-swap between state-of-the-art models inside the live sidebar:
*   **Google Gemini 1.5/3.5**: Optimized for deep analytical processing, schema-mapping, and smart visual alignment.
*   **Gemma 2 (27B & 9B IT)**: Exceptional open-weights performance specializing in compact layout generation and structural code design.
*   *Conversational context is fully preserved across the entire chat session for iterative modifications.*

### 📐 2. Heuristic Grid Auto-Arrange & Drag-and-Drop
Forget struggling with CSS grids. Dash-Dost supports a premium, highly dynamic placement canvas:
*   **Dynamic Drag & Drop**: Freely reorder cards and adjust positions visually.
*   **Manage Widgets Panel**: Tweak specific column sizes, rename active titles, and toggle visual variables.
*   **Layout Auto-Arrange**: A custom heuristic algorithm that automatically analyzes your active charts and KPIs, optimizing their sizes for maximum readability.

### 🔌 3. Live WebSocket Telemetry Mockup
*   **Bidirectional Socket Stream**: Flashes and fluctuates live data across your active telemetry cards and charts every 5 seconds.
*   **Interactivity-First**: Toggle connection states directly using the real-time "Socket Connection Status" pills.

### ✉️ 4. Server-Persisted Developer Channel
*   An integrated sidebar panel with a contact/feedback form.
*   Stores developer comments, reviews, and bug reports directly on a server-side JSON storage layer.

---

## 🚀 Installation & Quickstart

### Prerequisites
*   [Node.js](https://nodejs.org/) (v18 or above recommended)
*   npm

### Setup
1.  **Clone the project** and navigate into the workspace directory.
2.  **Configure environment variables**:
    Duplicate `.env.example` as `.env` and insert your Gemini API Key:
    ```env
    GEMINI_API_KEY="your_api_key_here"
    ```
3.  **Install dependencies**:
    ```bash
    npm install
    ```
4.  **Launch the dev environment**:
    ```bash
    npm run dev
    ```
5.  **Compile for production**:
    ```bash
    npm run build
    npm run start
    ```

---

## 💡 Usage Examples

*   **Create a Dashboard from Data**: Upload a CSV/Excel file in the main view, then ask: *"Create a dashboard showing a bar chart for sales by region and a KPI card for total revenue."*
*   **Refine a Chart**: Once the dashboard is generated, use the chat panel to refine: *"Add a green trendline to the sales chart"* or *"Merge the top 3 KPIs into a single row."*
*   **Iterative Layout Changes**: Simply drag and drop the generated chart cards to rearrange the dashboard, or use the chat to command structural changes: *"Make the revenue KPI span the full width."*

---

## 🤝 Contribution Guidelines

We welcome contributions to extend the Dash-Dost builder!
*   **Clean Styling**: Stick strictly to Tailwind CSS utility classes and Lucide icons.
*   **TypeScript Integrity**: Maintain complete type safety inside `/src/types.ts`.
*   **Optimized Performance**: Ensure `useEffect` triggers are strictly guarded to prevent infinite layout cycles.
*   **Submit Pull Requests**: Create a new branch for your feature, implement the changes, and open a PR for review.

---

<p align="center">
  Made with ⚡ by the Dash-Dost Developer Team
</p>
