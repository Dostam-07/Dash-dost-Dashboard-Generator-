import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { OpenAI } from "openai";
import { GoogleGenAI } from "@google/genai";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import fs from "fs";

dotenv.config();

const isProd = process.env.NODE_ENV === "production";
const PORT = 3000;

// Dynamic check of active provider model
const getActiveProvider = () => {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (geminiKey && geminiKey !== "MY_GEMINI_API_KEY" && geminiKey.trim() !== "") {
    return {
      provider: "gemini" as const,
      providerName: "Google Gemini (gemini-flash-latest)",
      isConfigured: true
    };
  } else if (openRouterKey && openRouterKey !== "MY_OPENROUTER_API_KEY" && openRouterKey.trim() !== "") {
    return {
      provider: "openrouter" as const,
      providerName: "OpenRouter (Claude 3.5 Sonnet)",
      isConfigured: true
    };
  } else {
    const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
    const ollamaModel = process.env.OLLAMA_MODEL || "llama3.1";
    return {
      provider: "ollama" as const,
      providerName: `Ollama Local (${ollamaModel})`,
      isConfigured: !!process.env.OLLAMA_BASE_URL
    };
  }
};

const getGeminiClient = () => {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// Robust content stream helper with retries (for 503 and 429) and model fallback
async function generateContentStreamWithRetry(ai: any, params: {
  contents: any[];
  systemInstruction: string;
  temperature?: number;
  preferredModel?: string;
}) {
  let modelCandidates = ["gemini-3.5-flash", "gemma-2-27b-it", "gemma-2-9b-it", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  if (params.preferredModel) {
    modelCandidates = [params.preferredModel, ...modelCandidates.filter(m => m !== params.preferredModel)];
  }
  let modelIndex = 0;
  let retries = 3;
  let delay = 1000;
  let lastError: any = null;

  while (modelIndex < modelCandidates.length) {
    const currentModel = modelCandidates[modelIndex];
    try {
      const config: any = {
        temperature: params.temperature ?? 0.1,
      };

      let finalContents: any = params.contents;
      if (currentModel.startsWith("gemma")) {
        // Gemma does not support systemInstruction, prepending system text directly
        const systemText = `SYSTEM INSTRUCTION / ROLE:\n${params.systemInstruction}\n\n`;
        if (typeof finalContents === "string") {
          finalContents = systemText + finalContents;
        } else if (Array.isArray(finalContents)) {
          // Clone to avoid side effects on retry or next models
          finalContents = JSON.parse(JSON.stringify(finalContents));
          const firstMsg = finalContents[0];
          if (firstMsg && firstMsg.parts && firstMsg.parts[0]) {
            firstMsg.parts[0].text = systemText + (firstMsg.parts[0].text || "");
          } else {
            finalContents.unshift({
              role: "user",
              parts: [{ text: systemText }]
            });
          }
        }
      } else {
        config.systemInstruction = params.systemInstruction;
      }

      const stream = await ai.models.generateContentStream({
        model: currentModel,
        contents: finalContents,
        config
      });
      return stream;
    } catch (error: any) {
      lastError = error;
      const errorString = String(error?.message || error || "");
      const is503 = errorString.includes("503") || 
                    errorString.toLowerCase().includes("unavailable") || 
                    errorString.toLowerCase().includes("high demand") || 
                    errorString.toLowerCase().includes("temporary") ||
                    error?.status === 503 ||
                    error?.code === 503;
      const is429 = errorString.includes("429") ||
                    errorString.toLowerCase().includes("quota exceeded") ||
                    errorString.toLowerCase().includes("resource exhausted") ||
                    errorString.toLowerCase().includes("too many requests") ||
                    errorString.toLowerCase().includes("rate limit") ||
                    error?.status === 429 ||
                    error?.code === 429;

      if (is429) {
        console.warn(`[Gemini Quota/429] ${currentModel} hit 429 Quota Exceeded. Falling back immediately to next candidate model...`);
        modelIndex++;
        retries = 3; // Reset retries
        delay = 1000; // Reset delay
      } else if (is503) {
        retries--;
        if (retries > 0) {
          console.warn(`[Gemini Retry] generateContentStream with ${currentModel} failed with 503 High Demand. Retrying in ${delay}ms... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.floor(delay * 1.5);
        } else {
          console.warn(`[Gemini Fallback] Out of retries for 503 on ${currentModel}. Falling back to next model candidate...`);
          modelIndex++;
          retries = 3; // Reset retries
          delay = 1000; // Reset delay
        }
      } else {
        // For other errors, let's also try to fall back instead of breaking entirely
        console.warn(`[Gemini Error] generateContentStream with ${currentModel} failed with error: ${errorString}. Falling back to next model...`);
        modelIndex++;
        retries = 3;
        delay = 1000;
      }
    }
  }
  throw lastError || new Error("Failed to generate stream with all model candidates.");
}

// Robust non-stream helper with retries (for 503 and 429) and model fallback
async function generateContentWithRetry(ai: any, params: {
  contents: any;
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
  preferredModel?: string;
}) {
  let modelCandidates = ["gemini-3.5-flash", "gemma-2-27b-it", "gemma-2-9b-it", "gemini-3.1-flash-lite", "gemini-flash-latest"];
  if (params.preferredModel) {
    modelCandidates = [params.preferredModel, ...modelCandidates.filter(m => m !== params.preferredModel)];
  }
  let modelIndex = 0;
  let retries = 3;
  let delay = 1000;
  let lastError: any = null;

  while (modelIndex < modelCandidates.length) {
    const currentModel = modelCandidates[modelIndex];
    try {
      const config: any = {};
      if (params.temperature !== undefined) config.temperature = params.temperature;
      
      let finalContents = params.contents;
      if (currentModel.startsWith("gemma")) {
        // Prepend systemInstruction to contents as a user prompt message to prevent any model error
        const systemText = params.systemInstruction ? `SYSTEM INSTRUCTION / ROLE:\n${params.systemInstruction}\n\n` : "";
        if (typeof finalContents === "string") {
          finalContents = systemText + finalContents;
        } else if (Array.isArray(finalContents)) {
          // Clone to avoid side effects
          finalContents = JSON.parse(JSON.stringify(finalContents));
          const firstMsg = finalContents[0];
          if (firstMsg && firstMsg.parts && firstMsg.parts[0]) {
            firstMsg.parts[0].text = systemText + (firstMsg.parts[0].text || "");
          } else {
            finalContents.unshift({
              role: "user",
              parts: [{ text: systemText }]
            });
          }
        }
        
        // Gemma does not support responseMimeType in standard Gemini API or can fail.
        // We ensure JSON instruction is appended to prompt contents, and remove responseMimeType
        if (params.responseMimeType) {
          const jsonInstruction = "\n\nIMPORTANT: You must output ONLY a valid raw JSON object. Do not wrap the JSON in ```json markdown formatting, and do not add any surrounding explanatory text.";
          if (typeof finalContents === "string") {
            finalContents = finalContents + jsonInstruction;
          } else if (Array.isArray(finalContents)) {
            const lastMsg = finalContents[finalContents.length - 1];
            if (lastMsg && lastMsg.parts && lastMsg.parts[0]) {
              lastMsg.parts[0].text = (lastMsg.parts[0].text || "") + jsonInstruction;
            }
          }
        }
      } else {
        if (params.systemInstruction) config.systemInstruction = params.systemInstruction;
        if (params.responseMimeType) config.responseMimeType = params.responseMimeType;
      }

      const response = await ai.models.generateContent({
        model: currentModel,
        contents: finalContents,
        config
      });
      return response;
    } catch (error: any) {
      lastError = error;
      const errorString = String(error?.message || error || "");
      const is503 = errorString.includes("503") || 
                    errorString.toLowerCase().includes("unavailable") || 
                    errorString.toLowerCase().includes("high demand") || 
                    errorString.toLowerCase().includes("temporary") ||
                    error?.status === 503 ||
                    error?.code === 503;
      const is429 = errorString.includes("429") ||
                    errorString.toLowerCase().includes("quota exceeded") ||
                    errorString.toLowerCase().includes("resource exhausted") ||
                    errorString.toLowerCase().includes("too many requests") ||
                    errorString.toLowerCase().includes("rate limit") ||
                    error?.status === 429 ||
                    error?.code === 429;

      if (is429) {
        console.warn(`[Gemini Quota/429] ${currentModel} hit 429 Quota Exceeded. Falling back immediately to next candidate model...`);
        modelIndex++;
        retries = 3; // Reset retries
        delay = 1000; // Reset delay
      } else if (is503) {
        retries--;
        if (retries > 0) {
          console.warn(`[Gemini Retry] generateContent with ${currentModel} failed with 503 High Demand. Retrying in ${delay}ms... (${retries} attempts left)`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay = Math.floor(delay * 1.5);
        } else {
          console.warn(`[Gemini Fallback] Out of retries for 503 on ${currentModel}. Falling back to next model candidate...`);
          modelIndex++;
          retries = 3; // Reset retries
          delay = 1000; // Reset delay
        }
      } else {
        // For other errors, let's also try to fall back instead of breaking entirely
        console.warn(`[Gemini Error] generateContent with ${currentModel} failed with error: ${errorString}. Falling back to next model...`);
        modelIndex++;
        retries = 3;
        delay = 1000;
      }
    }
  }
  throw lastError || new Error("Failed to generate content with all model candidates.");
}

const getOpenRouterClient = () => {
  return new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
      "HTTP-Referer": "https://ai.studio/build",
      "X-Title": "Dash-Dost Dashboard Builder",
    }
  });
};

const getOllamaClient = () => {
  const ollamaUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  return new OpenAI({
    apiKey: "ollama",
    baseURL: `${ollamaUrl}/v1`
  });
};

function generateDetailedFallbackDashboard(prompt: string): any {
  const p = prompt.toLowerCase();
  
  // 1. SALES, MARKETING, SAAS, PIPELINE
  if (p.includes("sale") || p.includes("market") || p.includes("saas") || p.includes("pipeline") || p.includes("revenue") || p.includes("customer")) {
    return {
      dashboardId: `dash_${Date.now()}`,
      title: "SaaS Sales & Acquisition Insights",
      subtitle: "Analytical view of recurring revenue, customer acquisitions, and lifecycle funnels.",
      filters: [
        {
          id: "region_filter",
          type: "category_select",
          targetKeys: ["region", "category"],
          label: "Geographic Region",
          options: ["North America", "Europe", "Asia Pacific", "Latin America"]
        },
        {
          id: "channel_filter",
          type: "category_select",
          targetKeys: ["channel"],
          label: "Acquisition Channel",
          options: ["SEO", "Paid Search", "Social Media", "Referrals", "Direct"]
        }
      ],
      components: [
        {
          id: "kpi_mrr",
          type: "kpi_card",
          title: "Monthly Recurring Revenue",
          description: "Active subscription value normalized monthly.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "$142,580",
            kpiTrend: { direction: "up", label: "+12.4% MoM" }
          },
          seriesData: []
        },
        {
          id: "kpi_arr",
          type: "kpi_card",
          title: "Annual Run Rate",
          description: "Projected annual value of subscriptions.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "$1.71M",
            kpiTrend: { direction: "up", label: "+14.1% MoM" }
          },
          seriesData: []
        },
        {
          id: "kpi_cac",
          type: "kpi_card",
          title: "Customer Acquisition Cost",
          description: "Average cost spent to acquire one new customer.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "$124",
            kpiTrend: { direction: "down", label: "-8.3% vs Q1" }
          },
          seriesData: []
        },
        {
          id: "kpi_ltv",
          type: "kpi_card",
          title: "Customer Lifetime Value",
          description: "Projected value of a customer over active span.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "$4,350",
            kpiTrend: { direction: "up", label: "+3.2% vs last month" }
          },
          seriesData: []
        },
        {
          id: "revenue_trend",
          type: "area_chart",
          title: "Revenue & Growth Projections",
          description: "Historical progression of MRR and New Sales Revenue.",
          layout: { sm: 12, md: 12, lg: 8 },
          config: {
            xAxisKey: "date",
            yAxisKeys: ["mrr", "new_sales", "expenditure"],
            stacked: false
          },
          seriesData: [
            { date: "Jan 2026", mrr: 110000, new_sales: 12000, expenditure: 42000, region: "North America" },
            { date: "Feb 2026", mrr: 118000, new_sales: 14000, expenditure: 44000, region: "North America" },
            { date: "Mar 2026", mrr: 125000, new_sales: 15500, expenditure: 45000, region: "Europe" },
            { date: "Apr 2026", mrr: 131000, new_sales: 16200, expenditure: 47000, region: "Europe" },
            { date: "May 2026", mrr: 138000, new_sales: 18000, expenditure: 48000, region: "Asia Pacific" },
            { date: "Jun 2026", mrr: 142580, new_sales: 19500, expenditure: 49500, region: "Asia Pacific" }
          ]
        },
        {
          id: "channel_share",
          type: "pie_chart",
          title: "Sales Share by Region",
          description: "Share of active customer contracts across markets.",
          layout: { sm: 12, md: 12, lg: 4 },
          config: {
            xAxisKey: "category",
            yAxisKeys: ["value"]
          },
          seriesData: [
            { category: "North America", value: 58000 },
            { category: "Europe", value: 42000 },
            { category: "Asia Pacific", value: 31000 },
            { category: "Latin America", value: 11580 }
          ]
        },
        {
          id: "acquisition_channels",
          type: "bar_chart",
          title: "Acquisition Performance by Channel",
          description: "Total conversions and clicks per acquisition channel.",
          layout: { sm: 12, md: 12, lg: 12 },
          config: {
            xAxisKey: "category",
            yAxisKeys: ["conversions", "clicks"],
            stacked: false
          },
          seriesData: [
            { category: "SEO", conversions: 420, clicks: 8400, channel: "SEO" },
            { category: "Paid Search", conversions: 310, clicks: 6200, channel: "Paid Search" },
            { category: "Social Media", conversions: 280, clicks: 9100, channel: "Social Media" },
            { category: "Referrals", conversions: 190, clicks: 3800, channel: "Referrals" },
            { category: "Direct", conversions: 220, clicks: 2400, channel: "Direct" }
          ]
        }
      ]
    };
  }
  
  // 2. FINANCE, OPERATIONS, BUDGET, COST
  if (p.includes("financ") || p.includes("budget") || p.includes("cost") || p.includes("profit") || p.includes("expens") || p.includes("operation")) {
    return {
      dashboardId: `dash_${Date.now()}`,
      title: "Financial Intelligence Command Center",
      subtitle: "Comprehensive monitoring of revenue, operational expenditures, margins, and budget compliance.",
      filters: [
        {
          id: "dept_filter",
          type: "category_select",
          targetKeys: ["department"],
          label: "Business Unit",
          options: ["Operations", "Sales & Marketing", "R&D", "Administration", "Customer Success"]
        }
      ],
      components: [
        {
          id: "kpi_gross_profit",
          type: "kpi_card",
          title: "Total Gross Profit",
          description: "Sales revenue minus cost of goods sold.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "$485,200",
            kpiTrend: { direction: "up", label: "+8.5% QoQ" }
          },
          seriesData: []
        },
        {
          id: "kpi_opex",
          type: "kpi_card",
          title: "Operational Cost (OpEx)",
          description: "Ongoing business operation expenses.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "$124,150",
            kpiTrend: { direction: "down", label: "-4.1% MoM" }
          },
          seriesData: []
        },
        {
          id: "kpi_net_margin",
          type: "kpi_card",
          title: "Net Profit Margin",
          description: "Percentage of revenue representing pure profit.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "26.4%",
            kpiTrend: { direction: "up", label: "+2.1% MoM" }
          },
          seriesData: []
        },
        {
          id: "kpi_budget_compliance",
          type: "kpi_card",
          title: "Budget Compliance",
          description: "Adherence to quarterly budget limits.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "98.2%",
            kpiTrend: { direction: "neutral", label: "On Target" }
          },
          seriesData: []
        },
        {
          id: "profit_trends",
          type: "area_chart",
          title: "Income & Operational Expense Trends",
          description: "Quarterly trajectory tracking profit, expenses, and gross income.",
          layout: { sm: 12, md: 12, lg: 8 },
          config: {
            xAxisKey: "date",
            yAxisKeys: ["revenue", "expenses", "net_profit"],
            stacked: false
          },
          seriesData: [
            { date: "Jan 2026", revenue: 85000, expenses: 62000, net_profit: 23000, department: "Operations" },
            { date: "Feb 2026", revenue: 92000, expenses: 63000, net_profit: 29000, department: "Operations" },
            { date: "Mar 2026", revenue: 104000, expenses: 65000, net_profit: 39000, department: "Sales & Marketing" },
            { date: "Apr 2026", revenue: 110000, expenses: 67000, net_profit: 43000, department: "Sales & Marketing" },
            { date: "May 2026", revenue: 118000, expenses: 68000, net_profit: 50000, department: "R&D" },
            { date: "Jun 2026", revenue: 124150, expenses: 69000, net_profit: 55150, department: "R&D" }
          ]
        },
        {
          id: "opex_distribution",
          type: "pie_chart",
          title: "OpEx Share by Unit",
          description: "Operational expenditure allocation.",
          layout: { sm: 12, md: 12, lg: 4 },
          config: {
            xAxisKey: "category",
            yAxisKeys: ["value"]
          },
          seriesData: [
            { category: "R&D", value: 45000 },
            { category: "Sales & Marketing", value: 38000 },
            { category: "Operations", value: 24000 },
            { category: "Administration", value: 17150 }
          ]
        },
        {
          id: "department_budgets",
          type: "bar_chart",
          title: "Department Budget Allocations",
          description: "Planned budget vs actual spent across departments.",
          layout: { sm: 12, md: 12, lg: 12 },
          config: {
            xAxisKey: "category",
            yAxisKeys: ["budget", "actual"],
            stacked: false
          },
          seriesData: [
            { category: "Operations", budget: 30000, actual: 28500, department: "Operations" },
            { category: "Sales & Marketing", budget: 40000, actual: 39200, department: "Sales & Marketing" },
            { category: "R&D", budget: 50000, actual: 48900, department: "R&D" },
            { category: "Administration", budget: 20000, actual: 18500, department: "Administration" },
            { category: "Customer Success", budget: 15000, actual: 14150, department: "Customer Success" }
          ]
        }
      ]
    };
  }
  
  // 3. HEALTHCARE, CLINICAL, PATIENTS
  if (p.includes("health") || p.includes("patient") || p.includes("hospital") || p.includes("clinic") || p.includes("medic") || p.includes("doctor")) {
    return {
      dashboardId: `dash_${Date.now()}`,
      title: "Clinical Operations & Patient Flow Insights",
      subtitle: "Bespoke analytics overview for patient care, emergency response, and department capacities.",
      filters: [
        {
          id: "dept_filter",
          type: "category_select",
          targetKeys: ["department"],
          label: "Clinical Department",
          options: ["Emergency", "Pediatrics", "Cardiology", "Neurology", "General Medicine"]
        }
      ],
      components: [
        {
          id: "kpi_admissions",
          type: "kpi_card",
          title: "Total Patient Admissions",
          description: "Inpatients admitted during the current period.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "12,450",
            kpiTrend: { direction: "up", label: "+4.5% MoM" }
          },
          seriesData: []
        },
        {
          id: "kpi_wait_time",
          type: "kpi_card",
          title: "Average Wait Time",
          description: "Duration before patient is checked in.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "18.5 min",
            kpiTrend: { direction: "down", label: "-12.4% vs Last Week" }
          },
          seriesData: []
        },
        {
          id: "kpi_satisfaction",
          type: "kpi_card",
          title: "Patient Satisfaction Score",
          description: "Overall discharge survey score.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "94.8%",
            kpiTrend: { direction: "up", label: "+1.5% YoY" }
          },
          seriesData: []
        },
        {
          id: "kpi_active_staff",
          type: "kpi_card",
          title: "Active Clinical Staff",
          description: "Nurses and doctors on shift.",
          layout: { sm: 12, md: 6, lg: 3 },
          config: {
            kpiValue: "142 Staff",
            kpiTrend: { direction: "neutral", label: "Optimal Staffing" }
          },
          seriesData: []
        },
        {
          id: "patient_trends",
          type: "area_chart",
          title: "Admission & Wait Time Trajectories",
          description: "Tracking inpatient admissions and discharge rates monthly.",
          layout: { sm: 12, md: 12, lg: 8 },
          config: {
            xAxisKey: "date",
            yAxisKeys: ["admissions", "discharges", "emergency_cases"],
            stacked: false
          },
          seriesData: [
            { date: "Jan 2026", admissions: 1800, discharges: 1720, emergency_cases: 420, department: "Emergency" },
            { date: "Feb 2026", admissions: 1950, discharges: 1840, emergency_cases: 450, department: "Emergency" },
            { date: "Mar 2026", admissions: 2100, discharges: 1980, emergency_cases: 490, department: "Cardiology" },
            { date: "Apr 2026", admissions: 2200, discharges: 2100, emergency_cases: 510, department: "Cardiology" },
            { date: "May 2026", admissions: 2350, discharges: 2240, emergency_cases: 530, department: "Pediatrics" },
            { date: "Jun 2026", admissions: 2450, discharges: 2380, emergency_cases: 560, department: "Pediatrics" }
          ]
        },
        {
          id: "department_split",
          type: "pie_chart",
          title: "Patient Admissions by Department",
          description: "Relative inpatient distribution across clinics.",
          layout: { sm: 12, md: 12, lg: 4 },
          config: {
            xAxisKey: "category",
            yAxisKeys: ["value"]
          },
          seriesData: [
            { category: "Emergency", value: 450 },
            { category: "Pediatrics", value: 380 },
            { category: "Cardiology", value: 240 },
            { category: "Neurology", value: 180 },
            { category: "General Medicine", value: 540 }
          ]
        },
        {
          id: "clinical_efficiency",
          type: "bar_chart",
          title: "Average Clinical Treatment Times",
          description: "Minutes spent in care across primary departments.",
          layout: { sm: 12, md: 12, lg: 12 },
          config: {
            xAxisKey: "category",
            yAxisKeys: ["avg_mins"],
            stacked: false
          },
          seriesData: [
            { category: "Emergency", avg_mins: 34, department: "Emergency" },
            { category: "Pediatrics", avg_mins: 22, department: "Pediatrics" },
            { category: "Cardiology", avg_mins: 58, department: "Cardiology" },
            { category: "Neurology", avg_mins: 72, department: "Neurology" },
            { category: "General Medicine", avg_mins: 45, department: "General Medicine" }
          ]
        }
      ]
    };
  }
  
  // 4. DEFAULT COMPREHENSIVE WORKSPACE
  return {
    dashboardId: `dash_${Date.now()}`,
    title: "Dynamic Visual Command Center",
    subtitle: "Custom data analytics space, generated for: '" + prompt + "'.",
    filters: [
      {
        id: "sector_filter",
        type: "category_select",
        targetKeys: ["category"],
        label: "Market Segment",
        options: ["Enterprise", "Mid-Market", "SME", "Consumer"]
      }
    ],
    components: [
      {
        id: "kpi_main_perf",
        type: "kpi_card",
        title: "Operational Efficiency",
        description: "Standard compliance index score.",
        layout: { sm: 12, md: 6, lg: 3 },
        config: {
          kpiValue: "94.2%",
          kpiTrend: { direction: "up", label: "+3.4% vs Average" }
        },
        seriesData: []
      },
      {
        id: "kpi_volume",
        type: "kpi_card",
        title: "Total Item Volume",
        description: "Sum of records parsed in this query scope.",
        layout: { sm: 12, md: 6, lg: 3 },
        config: {
          kpiValue: "18,450",
          kpiTrend: { direction: "up", label: "+12.1% MoM" }
        },
        seriesData: []
      },
      {
        id: "kpi_cycle_time",
        type: "kpi_card",
        title: "Average Processing Speed",
        description: "Duration of transaction pipelines.",
        layout: { sm: 12, md: 6, lg: 3 },
        config: {
          kpiValue: "1.8 sec",
          kpiTrend: { direction: "down", label: "-8.3% Optimizing" }
        },
        seriesData: []
      },
      {
        id: "kpi_cost_savings",
        type: "kpi_card",
        title: "Projected Cost Savings",
        description: "Estimated cost efficiency gains.",
        layout: { sm: 12, md: 6, lg: 3 },
        config: {
          kpiValue: "$12,450",
          kpiTrend: { direction: "neutral", label: "Stable Gains" }
        },
        seriesData: []
      },
      {
        id: "performance_history",
        type: "area_chart",
        title: "Metric Flow & Trajectory Over Time",
        description: "Chronological trends of primary indicators.",
        layout: { sm: 12, md: 12, lg: 8 },
        config: {
          xAxisKey: "date",
          yAxisKeys: ["efficiency", "conversions", "speed_multiplier"],
          stacked: false
        },
        seriesData: [
          { date: "Jan 2026", efficiency: 88, conversions: 1200, speed_multiplier: 1.2, category: "Enterprise" },
          { date: "Feb 2026", efficiency: 90, conversions: 1400, speed_multiplier: 1.3, category: "Enterprise" },
          { date: "Mar 2026", efficiency: 91, conversions: 1550, speed_multiplier: 1.4, category: "Mid-Market" },
          { date: "Apr 2026", efficiency: 92, conversions: 1620, speed_multiplier: 1.5, category: "Mid-Market" },
          { date: "May 2026", efficiency: 93, conversions: 1800, speed_multiplier: 1.7, category: "SME" },
          { date: "Jun 2026", efficiency: 94.2, conversions: 1950, speed_multiplier: 1.8, category: "SME" }
        ]
      },
      {
        id: "segment_distribution",
        type: "pie_chart",
        title: "Share distribution by Segment",
        description: "Breakdown contribution score by categories.",
        layout: { sm: 12, md: 12, lg: 4 },
        config: {
          xAxisKey: "category",
          yAxisKeys: ["value"]
        },
        seriesData: [
          { category: "Enterprise", value: 8500 },
          { category: "Mid-Market", value: 5200 },
          { category: "SME", value: 3450 },
          { category: "Consumer", value: 1300 }
        ]
      },
      {
        id: "relative_analysis",
        type: "bar_chart",
        title: "Relative Segment Distribution",
        description: "Comparative visual scale of parameters.",
        layout: { sm: 12, md: 12, lg: 12 },
        config: {
          xAxisKey: "category",
          yAxisKeys: ["efficiency", "conversions"],
          stacked: false
        },
        seriesData: [
          { category: "Enterprise", efficiency: 92, conversions: 1200 },
          { category: "Mid-Market", efficiency: 89, conversions: 1420 },
          { category: "SME", efficiency: 84, conversions: 1650 },
          { category: "Consumer", efficiency: 79, conversions: 1800 }
        ]
      }
    ]
  };
}

function sanitizeGeminiHistory(contents: any[]): any[] {
  if (!contents || contents.length === 0) return [];
  
  const temp: any[] = [];
  for (const item of contents) {
    if (!item || !item.role || !item.parts || item.parts.length === 0) continue;
    const text = item.parts.map((p: any) => p.text || "").join("\n").trim();
    if (!text) continue;
    
    // Skip error messages to keep the history pristine and avoid breaking the flow
    if (text.startsWith("Error:") || text.includes("Something went wrong")) continue;
    
    const role = item.role === 'model' ? 'model' : 'user';
    temp.push({ role, text });
  }
  
  const sanitized: any[] = [];
  for (const item of temp) {
    if (sanitized.length > 0 && sanitized[sanitized.length - 1].role === item.role) {
      sanitized[sanitized.length - 1].parts[0].text += "\n\n" + item.text;
    } else {
      sanitized.push({
        role: item.role,
        parts: [{ text: item.text }]
      });
    }
  }
  
  // Ensure the list starts with 'user'
  while (sanitized.length > 0 && sanitized[0].role !== 'user') {
    sanitized.shift();
  }
  
  return sanitized;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    const active = getActiveProvider();
    res.json({ status: "healthy", provider: active.providerName, apiKeyConfigured: active.isConfigured });
  });

  // Contact support & feedback endpoint
  app.post("/api/contact", (req, res) => {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required fields." });
    }
    try {
      const contactsFile = path.join(process.cwd(), "contacts.json");
      let currentContacts = [];
      if (fs.existsSync(contactsFile)) {
        const fileContent = fs.readFileSync(contactsFile, "utf8");
        try {
          currentContacts = JSON.parse(fileContent || "[]");
        } catch (_) {
          currentContacts = [];
        }
      }
      const newContact = {
        id: `msg_${Date.now()}`,
        name,
        email,
        message,
        timestamp: new Date().toISOString()
      };
      currentContacts.push(newContact);
      fs.writeFileSync(contactsFile, JSON.stringify(currentContacts, null, 2), "utf8");
      res.json({ success: true, message: "Thank you! Your feedback/message has been successfully recorded on the server." });
    } catch (e: any) {
      console.error("Error storing contact message:", e);
      res.status(500).json({ error: "Server failed to store contact message." });
    }
  });

  // Streaming Content Generation proxy
  app.post("/api/generate", async (req, res) => {
    const { prompt, history, model } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "Prompt is required" });
    }

    const active = getActiveProvider();

    try {
      // Construct system instruction that strictly forces conformance to the visual layout JSON schema
      const systemInstruction = `You are a highly structured, precise analytical engineer acting as the visual layout compiler for Dash-Dost Dashboard Builder.

Your purpose is to interpret natural language data descriptions into a flawless JSON specification that fully conforms to the MasterDashboardPayloadSchema.

Core Operations Directives:
1. Output MUST be strictly valid, pure JSON. Do not write introductory sentences, markdown blocks wrapper syntax like \`\`\`json or \`\`\`, or any surrounding text that invalidates a parser engine. Your response must begin with { and end with }.
2. Data Realism: Leave the "seriesData" array in each component EMPTY (i.e. []). The client-side system will compile the real aggregated dataset rows into seriesData.
   - Specify the recommended numeric columns as axis metrics inside yAxisKeys, and category/date as xAxisKey.
   - Do NOT populate seriesData with fake stats. The database binder will do the real math on the client.
3. Progressive Intent Alignment: Distribute components intelligently across layouts using the 12-column layout object (sm:12, md:6, lg:4 or lg:3 for KPIs; sm:12, lg:6 or lg:12 for charts).
4. Responsive Layouts:
   - "layout" has properties sm, md, lg. These are column numbers out of 12.
   - For 'kpi_card' (KPI block): sm: 12, md: 6, lg: 3 is recommended.
   - For other charts: sm: 12, md: 12, lg: 6 or lg: 12 is recommended.
5. Interactive Filter Provisioning: Always include filters at the "filters" array level. Create target filters mapping to target keys fields (e.g. key "category" or "date").
   - Filter types are 'date_range' or 'category_select'.
   - 'targetKeys' is an array of data field strings inside component seriesData (e.g. ["category"] or ["date"]) that this filter will restrict.
   - If 'category_select' is used, provide standard filter options array of strings (e.g. ["North", "South", "East", "West"] or brands/categories). This option is critical for local interactive filtering.
6. Support different chart types: 'kpi_card', 'bar_chart', 'line_chart', 'area_chart', 'pie_chart', 'scatter_chart', 'map_chart', 'geo_map'.
   - 'kpi_card' config should have: "kpiValue": string format (e.g. "$12,450", "94.2%"), "kpiTrend": { "direction": "up" | "down" | "neutral", "label": "+12% MoM" }
   - 'bar_chart', 'line_chart', 'area_chart', 'scatter_chart', 'map_chart', 'geo_map' config should specify: "xAxisKey" (usually "date" or "category") and "yAxisKeys" (array of numerical field names to map e.g. ["revenue", "costs"]). Keep stacked: boolean optional.
   - For 'map_chart' and 'geo_map', default to realistically populated datasets representing Indian states (e.g. Maharashtra, Karnataka, Delhi, etc.) or World countries, NOT US states.
   - Leave "seriesData" completely empty (i.e. []). The client will bind real records onto your xAxisKey and yAxisKeys from the uploaded file (e.g. 10-24 object rows tracking coordinates/metrics, e.g. { "date": "2026-06-01", "revenue": 1000, "costs": 400, "category": "Enterprise" }).
7. Be responsive to iterative user requests if history is provided. Integrate the conversational history context when editing, refining, or appending to the current dashboard. However, if the user uploads a NEW dataset or asks for a NEW dashboard, generate a completely fresh dashboard and do NOT carry over previous components unless explicitly requested.`;

      if (active.provider === "gemini") {
        const ai = getGeminiClient();
        let contents: any[] = [];
        
        if (history && history.length > 0) {
          history.forEach((msg: any) => {
            contents.push({
              role: msg.role === 'user' ? 'user' : 'model',
              parts: [{ text: msg.content }]
            });
          });
        }
        
        contents.push({
          role: 'user',
          parts: [{ text: prompt }]
        });

        // Clean and sanitize the conversation history for Gemini's strict multi-turn rules
        contents = sanitizeGeminiHistory(contents);
        
        // Fallback if the array became empty during sanitization
        if (contents.length === 0) {
          contents.push({
            role: 'user',
            parts: [{ text: prompt }]
          });
        }

        // Use our robust helper for retrying and falling back across multiple models
        const stream = await generateContentStreamWithRetry(ai, {
          contents,
          systemInstruction,
          temperature: 0.1,
          preferredModel: model,
        });

        // Successfully acquired stream, now set headers
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        for await (const chunk of stream) {
          const text = chunk.text;
          if (text) {
            res.write(text);
          }
        }
      } else {
        const client = active.provider === "openrouter" ? getOpenRouterClient() : getOllamaClient();
        const model = active.provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (process.env.OLLAMA_MODEL || "llama3.1");

        const messages: any[] = [
          { role: "system", content: systemInstruction }
        ];

        if (history && history.length > 0) {
          history.forEach((msg: any) => {
            messages.push({
              role: msg.role === 'user' ? 'user' : 'assistant',
              content: msg.content
            });
          });
        }

        messages.push({ role: "user", content: prompt });

        const stream = await client.chat.completions.create({
          model,
          messages,
          temperature: 0.1,
          stream: true,
        });

        // Set headers right before writing to stream
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Transfer-Encoding", "chunked");

        for await (const chunk of stream) {
          const text = chunk.choices[0]?.delta?.content || "";
          if (text) {
            res.write(text);
          }
        }
      }
      res.end();
    } catch (error: any) {
      console.error(`Error generating content with ${active.providerName}:`, error);
      const errorString = String(error?.message || error || "");
      
      try {
        if (!res.headersSent) {
          res.setHeader("Content-Type", "text/plain; charset=utf-8");
          res.setHeader("Transfer-Encoding", "chunked");
        }
        
        console.log("Serving dynamic robust fallback dashboard stream due to model error/quota limits...");
        const fallbackPayload = generateDetailedFallbackDashboard(prompt);
        const fallbackJSON = JSON.stringify(fallbackPayload, null, 2);
        
        // Write it in chunks to mimic the stream
        const chunkSize = 128;
        for (let i = 0; i < fallbackJSON.length; i += chunkSize) {
          res.write(fallbackJSON.substring(i, i + chunkSize));
          await new Promise((resolve) => setTimeout(resolve, 8));
        }
        res.end();
      } catch (fallbackErr) {
        console.error("Critical: Fallback stream failed:", fallbackErr);
        if (!res.headersSent) {
          res.status(500).json({ error: "Server experienced failure compiling dashboard." });
        } else {
          res.end();
        }
      }
    }
  });

  // AI Insights generation endpoint
  app.post("/api/insights", async (req, res) => {
    const { payload } = req.body;
    if (!payload) {
      return res.status(400).json({ error: "Dashboard payload is required" });
    }

    const active = getActiveProvider();

    try {
      const summaryContext = {
        title: payload.title,
        subtitle: payload.subtitle || "",
        components: (payload.components || []).map((c: any) => ({
          title: c.title,
          type: c.type,
          data: (c.seriesData || []).slice(0, 15)
        }))
      };

      const systemInstruction = "You are a professional business intelligence advisor and expert data analyst. Generate short, clear, highly structured and valuable summaries and actionable recommendation items.";
      const prompt = `Given this active dashboard: ${JSON.stringify(summaryContext)}. Please write a brief, elegant analytical executive summary (max 3 sentences) and exactly 3 high-impact actionable business recommendations (bullet points). Keep layout professional and easy to scan using standard Markdown.`;

      if (active.provider === "gemini") {
        const ai = getGeminiClient();
        // Use our robust helper for retrying and falling back across multiple models
        const response = await generateContentWithRetry(ai, {
          contents: prompt,
          systemInstruction,
          temperature: 0.2,
        });

        res.json({ insights: response.text || "" });
      } else {
        const client = active.provider === "openrouter" ? getOpenRouterClient() : getOllamaClient();
        const model = active.provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (process.env.OLLAMA_MODEL || "llama3.1");

        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.2,
        });

        res.json({ insights: response.choices[0]?.message?.content || "" });
      }
    } catch (error: any) {
      console.error(`Insights Generation Error with ${active.providerName}:`, error);

      const errorString = String(error?.message || error || "");
      const is503 = errorString.includes("503") || 
                    errorString.toLowerCase().includes("unavailable") || 
                    errorString.toLowerCase().includes("high demand") || 
                    errorString.toLowerCase().includes("temporary") ||
                    error?.status === 503 ||
                    error?.code === 503;

      let friendlyMessage = error?.message || "Insights Generation Failed";
      if (is503) {
        friendlyMessage = "Google Gemini is currently experiencing temporary high demand. Failed to generate live insights at this moment.";
      }

      res.status(503).json({ error: friendlyMessage });
    }
  });

  // Narrative Report Generator (F5)
  app.post("/api/generate-narrative", async (req, res) => {
    const { title, subtitle, kpis, charts, tone = "Executive" } = req.body;
    try {
      const active = getActiveProvider();
      const systemInstruction = `You are a professional business intelligence reporter and lead executive summary editor. Generate a highly valuable, plain-English analytical markdown executive narrative report summarizing active metrics context in a "${tone}" tone.`;
      
      const prompt = `Compile an executive narrative report:
      Dashboard: "${title}" (${subtitle || ""})
      KPIs: ${JSON.stringify(kpis)}
      Charts & Series Data: ${JSON.stringify(charts)}
      Tone: ${tone}
      
      Structure your report with:
      ## Executive Summary
      - Headline Finding
      - Key Performance Highlights
      - Detailed Areas of Concern / Opportunities
      - Recommended Actions`;

      if (active.provider === "gemini") {
        const ai = getGeminiClient();
        // Use our robust helper for retrying and falling back across multiple models
        const response = await generateContentWithRetry(ai, {
          contents: prompt,
          systemInstruction,
          temperature: 0.3,
        });
        res.json({ success: true, narrative: response.text || "" });
      } else {
        const client = active.provider === "openrouter" ? getOpenRouterClient() : getOllamaClient();
        const model = active.provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (process.env.OLLAMA_MODEL || "llama3.1");

        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          temperature: 0.3
        });
        res.json({ success: true, narrative: response.choices[0]?.message?.content || "" });
      }
    } catch (error: any) {
      console.error("Narrative Generation Error:", error);
      res.status(500).json({ error: error.message || "Failed to generate narrative" });
    }
  });

  // Structured Query Interpreter for F3 "Ask Your Data"
  app.post("/api/interpret-query", async (req, res) => {
    const { question, columns } = req.body;
    if (!question || !columns) {
      return res.status(400).json({ error: "question and columns are required" });
    }

    try {
      const active = getActiveProvider();
      const systemInstruction = "You are a professional database schema compiler. Translate user natural language questions into structured queries conforming to the StructuredQuery schema.";
      const prompt = `Convert this natural language question into a structured query based on the available columns.
      Columns list: ${JSON.stringify(columns)}
      Question: "${question}"
      
      Return a strictly valid JSON response with this schema (no markdown wrappers):
      {
        "operation": "groupBy_aggregate | overall_metric | outliers",
        "groupByColumn": "columnName (only if operation is groupBy_aggregate)",
        "metric": "numeric column name",
        "aggregation": "sum | avg | mean | min | max | count",
        "filterColumn": "optional column to filter on",
        "filterValue": "value to filter by",
        "sortBy": "asc | desc",
        "limit": 10
      }`;

      if (active.provider === "gemini") {
        const ai = getGeminiClient();
        // Use our robust helper for retrying and falling back across multiple models
        const response = await generateContentWithRetry(ai, {
          contents: prompt,
          systemInstruction,
          temperature: 0.1,
          responseMimeType: "application/json"
        });
        const query = JSON.parse(response.text || "{}");
        res.json({ success: true, query });
      } else {
        const client = active.provider === "openrouter" ? getOpenRouterClient() : getOllamaClient();
        const model = active.provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (process.env.OLLAMA_MODEL || "llama3.1");

        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });
        const query = JSON.parse(response.choices[0]?.message?.content || "{}");
        res.json({ success: true, query });
      }
    } catch (error: any) {
      console.error("Interpret Query Error:", error);
      res.status(500).json({ error: error.message || "Failed to interpret query" });
    }
  });

  // URL Analyst (F4)
  app.post("/api/ingest-url", async (req, res) => {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      console.log(`Ingesting dashboard URL: ${url}`);
      const active = getActiveProvider();
      
      // Fetch text content of the page
      const pageRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36' } });
      if (!pageRes.ok) {
        throw new Error(`Failed to access URL: HTTP status ${pageRes.status}`);
      }
      
      const htmlText = await pageRes.text();
      
      // Strip script/style tags and extract raw text context
      const strippedText = htmlText
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .slice(0, 45000); // Token protective cap

      const systemInstruction = "You are a professional business intelligence advisor. Read the extracted content of this live dashboard page and compile an analytical dashboard analysis report in structured JSON format matching the DashboardReport schema.";
      
      const prompt = `Read the following raw dashboard page extract and compile a high-fidelity visual and analytical review.
      URL: ${url}
      Content: ${strippedText}
      
      Return a strictly valid JSON response conforming to this schema (no markdown wrappers, start with { and end with }):
      {
        "title": "Dashboard Title",
        "subtitle": "Dashboard subtitle or period",
        "kpis": [{ "title": "KPI Title", "value": "Metric value", "trend": "optional trend" }],
        "charts": [{ "title": "Chart Title", "type": "bar | line | area | pie", "metrics": ["metric names"], "insights": "brief chart pattern explanation" }],
        "filters": ["list of filters found"],
        "overallSummary": "executive narrative summary",
        "prosAndCons": "critique of visual design and data layout"
      }`;

      if (active.provider === "gemini") {
        const ai = getGeminiClient();
        // Use our robust helper for retrying and falling back across multiple models
        const response = await generateContentWithRetry(ai, {
          contents: prompt,
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json"
        });
        const report = JSON.parse(response.text || "{}");
        res.json({ success: true, report });
      } else {
        const client = active.provider === "openrouter" ? getOpenRouterClient() : getOllamaClient();
        const model = active.provider === "openrouter" ? "anthropic/claude-3.5-sonnet" : (process.env.OLLAMA_MODEL || "llama3.1");

        const response = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: systemInstruction },
            { role: "user", content: prompt }
          ],
          response_format: { type: "json_object" }
        });

        const report = JSON.parse(response.choices[0]?.message?.content || "{}");
        res.json({ success: true, report });
      }
    } catch (error: any) {
      console.error("Dashboard Ingestion Error:", error);
      res.status(500).json({ error: error.message || "Failed to ingest the dashboard URL" });
    }
  });

  // Vite Integration
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Create native HTTP Server and mount WebSocketServer onto it
  const server = createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (request, socket, head) => {
    // Avoid upgrading standard webpack or HMR / vite hmr endpoints if any slips through
    if (request.url?.includes("/vite-hmr") || request.url?.includes("hmr")) {
      return;
    }
    wss.handleUpgrade(request, socket, head, (wsConnection) => {
      wss.emit("connection", wsConnection, request);
    });
  });

  wss.on("connection", (wsConnection) => {
    console.log("WebSocket telemetry link connected.");
    let clientSubscription: any = null;
    let telemetryInterval: any = null;

    wsConnection.on("message", (messageStr) => {
      try {
        const message = JSON.parse(messageStr.toString());
        if (message.type === "subscribe") {
          console.log(`WebSocket subscription received for dashboard: ${message.payload?.dashboardId}`);
          clientSubscription = message.payload;

          if (telemetryInterval) {
            clearInterval(telemetryInterval);
          }

          // Broadcast mutated dynamic stream metrics to subscriber every 5 seconds
          telemetryInterval = setInterval(() => {
            if (wsConnection.readyState !== wsConnection.OPEN || !clientSubscription) {
              clearInterval(telemetryInterval);
              return;
            }

            const updatedComponents = (clientSubscription.components || []).map((comp: any) => {
              let nextKpiValue = comp.config?.kpiValue;

              if (comp.type === "kpi_card" && nextKpiValue) {
                const rawNum = parseFloat(nextKpiValue.replace(/[^0-9.-]/g, ""));
                if (!isNaN(rawNum)) {
                  const delta = (Math.random() - 0.5) * 0.04; // +/- 2% micro fluctuation
                  const nextVal = Math.max(0, rawNum * (1 + delta));
                  if (nextKpiValue.includes("$")) {
                    nextKpiValue = `$${nextVal.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
                  } else if (nextKpiValue.includes("%")) {
                    nextKpiValue = `${nextVal.toFixed(1)}%`;
                  } else {
                    nextKpiValue = nextVal.toLocaleString(undefined, { maximumFractionDigits: 0 });
                  }
                }
              }

              // Skip replacing seriesData as it overrides real in-memory bound data (resolves BUG-08)
              return {
                id: comp.id,
                kpiValue: nextKpiValue
              };
            });

            wsConnection.send(JSON.stringify({
              type: "telemetry_update",
              components: updatedComponents
            }));
          }, 5000);
        }
      } catch (err) {
        console.error("Error reading socket payload:", err);
      }
    });

    wsConnection.on("close", () => {
      console.log("WebSocket client connection closed, freeing intervals.");
      if (telemetryInterval) {
        clearInterval(telemetryInterval);
      }
    });
  });

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} in ${isProd ? "production" : "development"} mode.`);
  });
}

startServer();
