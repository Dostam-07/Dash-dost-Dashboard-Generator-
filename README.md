# ⚡ Dash-Dost (Dash-Companion)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Model Support](https://img.shields.io/badge/LLM-Gemini%20%7C%20Gemma-indigo.svg)](#-1-multi-model-llm-orchestrator)
[![Build Status](https://img.shields.io/badge/Build-Passing-emerald.svg)](#-installation--quickstart)
[![Tech Stack](https://img.shields.io/badge/Stack-React%2018%20%2B%20Vite%20%2B%20Express-cyan.svg)](#%EF%B8%AF-technical-architecture)

> **"Dost"** (/dōst/) *noun* — Friend, companion, or trusted advisor.
> **Dash-Dost** is the ultimate AI-driven analytical companion designed to translate raw data and conversational intents into stunning, production-ready telemetry environments instantly.

---

## 🔍 What is Dash-Dost?

**Dash-Dost** is an advanced full-stack business intelligence platform that bridges conversational AI with highly flexible layout engines. Whether you upload a complex multi-sheet dataset, connect a live real-time telemetry stream, or issue natural language layout commands, Dash-Dost instantly constructs an eye-catching, responsive Swiss-designed dashboard. 

Equipped with **multi-model orchestration**, a **custom layout heuristic engine**, and a **live WebSocket telemetry layer**, Dash-Dost changes dashboarding from a manual design chore into a collaborative AI conversation.

---

## ✨ Key Capabilities

### 🤖 1. Multi-Model LLM Orchestrator
Choose the brain behind your dashboard. Dash-Dost lets you hot-swap between state-of-the-art models inside the live sidebar:
*   **Google Gemini 1.5 (Default)**: Optimized for deep analytical processing, schema-mapping, and smart visual alignment.
*   **Gemini 3.1 Flash Lite**: Lightning-fast compilation and interactive real-time updates.
*   **Gemma 2 (27B & 9B IT)**: Exceptional open-weights performance specializing in compact layout generation and structural code design.
*   *Conversational context is fully preserved across the entire chat session for iterative modifications (e.g. "Add a green trendline to the sales chart", "Merge the top KPIs").*

### 📐 2. Heuristic Grid Auto-Arrange & Drag-and-Drop
Forget struggling with CSS grids. Dash-Dost supports a premium, highly dynamic placement canvas:
*   **Dynamic Drag & Drop**: Freely reorder cards and adjust positions visually.
*   **Manage Widgets Panel**: Tweak specific column sizes (`3/12`, `4/12`, `6/12`, or `12/12`), rename active titles, and toggle visual variables.
*   **Layout Auto-Arrange**: A custom heuristic algorithm that automatically analyzes your active charts and KPIs, optimizing their sizes for maximum readability.

### 🔌 3. Live WebSocket Telemetry Mockup
*   **Bidirectional Socket Stream**: Flashes and fluctuates live data across your active telemetry cards and charts every 5 seconds.
*   **Interactivity-First**: Toggle connection states directly using the real-time "Socket Connection Status" pills. See immediately how your charts animate on live updates.

### ✉️ 4. Server-Persisted Developer Channel
*   An integrated sidebar panel with a contact/feedback form.
*   Stores developer comments, reviews, and bug reports directly on a server-side JSON storage layer (`contacts.json`).

---

## 🎨 Aesthetic Vision & Style Guide

Dash-Dost is crafted around Swiss/Modern minimalism to maximize data scannability and eye comfort:
*   **Visual Rhythm**: Soft, premium light backgrounds paired with high-contrast slate borders, paired with deep dark mode options to prevent eye strain during overnight analysis.
*   **Typography**: Paired display typography with structured `"JetBrains Mono"` metadata sub-headings to create a polished, technical vibe.
*   **Micro-Interactions**: Features spring layout transitions, fading entries, and subtle pulse feedback states powered by `motion` and `Tailwind CSS`.

---

## 🗺️ Technical Architecture

Dash-Dost's full-stack pipeline manages rapid streaming generations:

```
┌────────────────────────┐      Streaming Prompt       ┌────────────────────────┐
│     React 18 + Vite    │ ──────────────────────────> │   Express API Server   │
│ (Conversational Panel) │ <────────────────────────── │  (server.ts / Node)    │
└────────────────────────┘      Server-Sent Events     └────────────────────────┘
          ▲                                                         │
          │                                                         ▼
┌────────────────────────┐                               ┌────────────────────────┐
│    Zustand Store +     │                               │   Google GenAI SDK &   │
│   Client-Side Parser   │ <──────────────────────────── │   Model Cascade Engine │
└────────────────────────┘        Streaming Chunks       └────────────────────────┘
```

1.  **Strict Streaming JSON Repair**: The server streams compiled JSON tokens back to the client using Server-Sent Events (SSE). Our custom state repair machine parses intermediate JSON schemas mid-flight so you can watch your charts build in real-time.
2.  **Fallback Model Cascade**: If a model encounters 503 high-demand or 429 quota limits, the backend automatically cascades to secondary model candidates to ensure a zero-interruption developer experience.
3.  **Strict Chat Hygiene**: Sanitizes and standardizes conversation history to conform strictly to Gemini's strict multi-turn rules, preventing history conflicts during extensive chat sessions.

---

## ⚙️ Installation & Quickstart

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

## 🤝 Contributing Framework

We love active companions extending the builder!
*   **Clean Styling**: Stick strictly to Tailwind CSS utility classes and Lucide icons.
*   **TypeScript Integrity**: Maintain complete type safety inside `/src/types.ts`.
*   **Optimized Performance**: Ensure `useEffect` triggers are strictly guarded to prevent infinite layout cycles.

---

<p align="center">
  Made with ⚡ by the Dash-Dost Developer Team
</p>
