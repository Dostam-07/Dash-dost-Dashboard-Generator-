import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  RotateCcw,
  Copy,
  Trash2,
  CornerDownLeft,
  FileJson,
  Check,
  Bot,
  User,
  Activity,
  History,
  Database,
  X,
  Layers,
  Minimize2,
  Maximize2,
  Plus,
  Home,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore, loadDashboardFromIDB } from '../store';
import { ChatMessage, MasterDashboardPayload } from '../types';
import { SavedDashboardsManager } from './SavedDashboardsManager';
import { SuggestionChips } from './SuggestionChips';

interface ConversationalPanelProps {
  onRefine: (prompt: string, mode: 'edit' | 'new') => void;
  onClearWorkspace: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isInline?: boolean;
}

export const ConversationalPanel: React.FC<ConversationalPanelProps> = ({
  onRefine,
  onClearWorkspace,
  isCollapsed: propIsCollapsed,
  onToggleCollapse,
  isInline = false,
}) => {
  const {
    chats,
    currentPayload,
    isStreaming,
    streamProgressText,
    saveDashboard,
    setChats,
    setCurrentPayload,
    selectedModel,
    setSelectedModel
  } = useAppStore();

  const [localIsCollapsed, setLocalIsCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('luminate_panel_collapsed');
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const isCollapsed = propIsCollapsed !== undefined ? propIsCollapsed : localIsCollapsed;
  const toggleCollapse = onToggleCollapse !== undefined ? onToggleCollapse : () => {
    setLocalIsCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('luminate_panel_collapsed', JSON.stringify(next));
      return next;
    });
  };

  const [input, setInput] = useState('');
  const [mode, setMode] = useState<'edit' | 'new'>('edit');
  const [copied, setCopied] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onRefine(input, mode);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !isStreaming) {
        onRefine(input, mode);
        setInput('');
      }
    }
  };

  const handleCopyJSON = () => {
    if (!currentPayload) return;
    navigator.clipboard.writeText(JSON.stringify(currentPayload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Modern compilation steps
  const renderStreamingStages = () => {
    if (!isStreaming) return null;
    
    const componentsCount = currentPayload?.components?.length || 0;
    const filtersCount = currentPayload?.filters?.length || 0;
    const titleVal = currentPayload?.title || "";

    const hasTitle = titleVal && titleVal !== "Generating Dashboard...";
    const hasFilters = filtersCount > 0;
    const hasKPIs = currentPayload?.components?.some(c => c.type === 'kpi_card') || false;
    const hasCharts = currentPayload?.components?.some(c => c.type !== 'kpi_card') || false;

    return (
      <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-zinc-900 border border-indigo-100/60 dark:border-zinc-800 space-y-3 font-sans text-[11px] animate-pulse">
        <div className="flex items-center gap-2 mb-1 text-indigo-600 dark:text-indigo-400 font-bold tracking-wide text-[10px]">
          <Activity className="h-4.5 w-4.5 animate-spin" />
          <span>Building your dashboard...</span>
        </div>

        <div className="space-y-2 text-zinc-650 dark:text-zinc-400 font-sans">
          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${hasTitle ? 'bg-emerald-500' : 'bg-indigo-500 animate-ping'}`} />
            <span className={hasTitle ? 'text-emerald-600 dark:text-emerald-450 font-semibold' : 'text-zinc-500'}>
              Setting up dashboard structure {hasTitle ? '✓' : '...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${hasKPIs ? 'bg-emerald-500' : hasTitle ? 'bg-indigo-500 animate-ping' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
            <span className={hasKPIs ? 'text-emerald-600 dark:text-emerald-450 font-semibold' : hasTitle ? 'text-zinc-500' : 'text-zinc-400'}>
              Adding KPI cards {hasKPIs ? '✓' : '...'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${hasCharts ? 'bg-emerald-500' : hasKPIs ? 'bg-indigo-500 animate-ping' : 'bg-zinc-200 dark:bg-zinc-800'}`} />
            <span className={hasCharts ? 'text-emerald-600 dark:text-emerald-450 font-semibold' : hasKPIs ? 'text-zinc-500' : 'text-zinc-400'}>
              Building charts {hasCharts ? '✓' : '...'}
            </span>
          </div>
        </div>
        
        {streamProgressText && (
          <div className="border-t border-indigo-100 dark:border-zinc-800 pt-2 text-[10px] text-zinc-400 dark:text-zinc-500 italic truncate">
            {streamProgressText}
          </div>
        )}
      </div>
    );
  };

  if (isInline) {
    return (
      <div className="no-print flex flex-col bg-white dark:bg-zinc-950 h-full w-full overflow-hidden border-l border-slate-200 dark:border-zinc-900">
        
        {/* Title / Gallery bar */}
        <div className="p-4 border-b border-slate-100 dark:border-zinc-900/80 w-full flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-2 min-w-0 pr-1">
            <Bot className="h-5 w-5 text-indigo-500 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 font-sans truncate">
              AI Assistant
            </span>
          </div>
          
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-lg p-0.5 border border-slate-200/60 dark:border-zinc-800 shadow-inner">
              <button
                 type="button"
                 onClick={() => setMode('edit')}
                 className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer font-sans ${
                   mode === 'edit' 
                     ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20' 
                     : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                 }`}
                 title="Apply changes to the current active dashboard state"
              >
                Refine existing
              </button>
              <button
                 type="button"
                 onClick={() => setMode('new')}
                 className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer font-sans ${
                   mode === 'new' 
                     ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20' 
                     : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
                 }`}
                 title="Compile a fresh new dashboard layout"
              >
                Build new
              </button>
            </div>
            
            <button
              type="button"
              onClick={() => {
                useAppStore.getState().loadSavedDashboardsList();
                setShowHistoryModal(!showHistoryModal);
              }}
              className="p-1.5 px-2 rounded-lg text-xs font-semibold hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-zinc-900 dark:hover:text-indigo-400 inline-flex items-center gap-1 font-sans transition-all border border-slate-200 dark:border-zinc-800 shadow-sm cursor-pointer"
              title="Browse generated boards library"
            >
              <History className="h-4 w-4 shrink-0 text-slate-400 hover:text-indigo-500" />
              <span className="hidden sm:inline text-[11px]">History</span>
            </button>

            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-900/60 transition-all border border-slate-200 dark:border-zinc-800 shadow-sm cursor-pointer ml-0.5"
              title="Minimize Chat Workspace"
            >
              <Minimize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* History view overlay inside the panel */}
        {showHistoryModal && (
          <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-900 shrink-0">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Historical Boards Library</span>
              <button 
                type="button"
                onClick={() => setShowHistoryModal(false)}
                className="text-[10px] font-mono text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
              >
                Close
              </button>
            </div>
            <SavedDashboardsManager 
              onLoadDashboard={async (meta) => {
                const fetched = await loadDashboardFromIDB(meta.dashboardId);
                if (fetched) {
                  setCurrentPayload(fetched);
                  setChats([
                    {
                      id: Math.random().toString(),
                      role: 'user',
                      content: meta.prompt,
                      timestamp: meta.savedAt
                    },
                    {
                      id: Math.random().toString(),
                      role: 'assistant',
                      content: `Loaded dashboard plan: "${meta.title}". Feel free to request changes or refine sections!`,
                      timestamp: new Date().toLocaleTimeString()
                    }
                  ]);
                  setShowHistoryModal(false);
                }
              }}
            />
          </div>
        )}

        {/* Chat Message Scrollable Interface */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 custom-scrollbar bg-slate-50/20 dark:bg-zinc-950/20">
          {chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-4 space-y-3.5 select-none animate-fade-in my-auto h-full">
              <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center border border-slate-200/50 dark:border-zinc-800">
                <Sparkles className="h-5 w-5 text-indigo-500" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-350 font-sans">What would you like to see?</span>
                <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed mx-auto font-sans">
                  Describe a dashboard, ask a question about your data, or pick a template below to get started.
                </p>
              </div>
            </div>
          ) : (
            chats.map((msg) => (
              <div 
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border shrink-0 text-xs ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 border-indigo-600 text-white dark:bg-indigo-500 dark:border-indigo-500 shadow-sm' 
                    : 'bg-white border-slate-200 text-indigo-605 dark:bg-zinc-900 dark:border-zinc-800'
                }`}>
                  {msg.role === 'user' ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block pl-1">
                    {msg.role === 'user' ? 'User' : 'Assistant'} &bull; {msg.timestamp}
                  </span>
                  <div className={`p-3 rounded-2xl text-[11.5px] leading-relaxed font-sans shadow-2xs border ${
                    msg.role === 'user'
                      ? 'bg-indigo-650 border-indigo-600 text-white rounded-tr-none'
                      : 'bg-white border-slate-200 text-slate-755 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-200 rounded-tl-none'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Streaming Progression Animation */}
          {renderStreamingStages()}
        </div>

        {/* Floating Toolbar Quick Actions */}
        {currentPayload && (
          <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 grid grid-cols-2 gap-2 text-[10px] shrink-0">
            <button
              type="button"
              onClick={handleCopyJSON}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-slate-50/20 text-slate-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-800 dark:hover:text-indigo-400 transition-all font-sans shadow-xs cursor-pointer"
              title="Copy compiled JSON configuration"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <FileJson className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
            </button>
            
            <button
              type="button"
              onClick={onClearWorkspace}
              className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-455 hover:bg-rose-50/10 text-slate-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-rose-955 dark:hover:text-rose-400 transition-all font-sans shadow-xs cursor-pointer"
              title="Reset workspace and clear all charts"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Reset workspace</span>
            </button>
          </div>
        )}

        {/* Bottom TextBox Input Box at the absolute footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-900/80 bg-white/80 dark:bg-zinc-950/80 relative shrink-0">
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-sans text-slate-500 dark:text-zinc-400 block font-medium">Try an example:</span>
            </div>
            <SuggestionChips onSelected={(promptText) => {
              setInput(promptText);
              if (textAreaRef.current) {
                setTimeout(() => {
                  textAreaRef.current?.focus();
                }, 50);
              }
            }} />
          </div>

          <div className="flex items-center justify-between mb-2.5 px-0.5 border-b border-slate-50 dark:border-zinc-900 pb-1.5">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-zinc-400 font-sans font-semibold">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
              <span>AI Model:</span>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={isStreaming}
                className="bg-transparent border-none outline-none font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer hover:text-indigo-700 dark:hover:text-indigo-300 py-0.5 px-1 rounded focus:ring-1 focus:ring-indigo-500/25 text-[10px]"
              >
                <option value="gemini-3.5-flash" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Google Gemini 1.5 (Default)</option>
                <option value="gemma-2-27b-it" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Gemma 2 27B IT</option>
                <option value="gemma-2-9b-it" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Gemma 2 9B IT</option>
                <option value="gemini-3.1-flash-lite" className="bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">Gemini 3.1 Flash Lite</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-bold tracking-tight bg-slate-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-slate-100 dark:border-zinc-800">
                {selectedModel.startsWith("gemma") ? "Gemma Mode" : "Gemini Mode"}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="relative flex items-center">
            {useAppStore.getState().attachedData && (
              <div className="flex items-center gap-2 mb-2.5 px-2 py-1.5 bg-indigo-50/80 dark:bg-zinc-900 rounded-lg w-max border border-indigo-100 dark:border-zinc-805 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <span className="text-[10px] text-slate-705 dark:text-zinc-300 font-sans">
                  📎 {useAppStore.getState().attachedData?.fileName}
                </span>
                <button 
                  type="button"
                  onClick={() => useAppStore.getState().setAttachedData(null)}
                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-transform duration-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            <textarea
              ref={textAreaRef}
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={
                isStreaming
                  ? "Building your dashboard..."
                  : mode === 'edit'
                  ? "Ask me to change something about this dashboard..."
                  : "Describe the dashboard you want to build..."
              }
              className="w-full pl-3 pr-11 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-805 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-101 focus:ring-1 focus:ring-indigo-550 focus:border-indigo-555 focus:outline-none transition-all resize-none shadow-xs custom-scrollbar leading-relaxed"
            />
            
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="absolute right-2.5 top-[11px] p-1.5 rounded-lg bg-indigo-610 text-white hover:bg-indigo-710 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
              title="Submit Prompt Command"
            >
              <CornerDownLeft className="h-3.5 w-3.5" />
            </button>
          </form>
          
          <div className="flex items-center justify-end text-[10px] text-slate-410 dark:text-zinc-510 mt-2 font-sans">
            <span>↵ Send &bull; ⇧↵ New line</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Interactive Chip State */}
      <div 
        className={`no-print fixed z-[60] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[transform,opacity] flex flex-col items-end gap-3
          ${isCollapsed 
            ? 'bottom-[80px] sm:bottom-6 right-4 sm:right-6 opacity-100 translate-y-0 scale-100' 
            : 'bottom-[80px] sm:bottom-6 right-4 sm:right-6 opacity-0 translate-y-8 scale-90 pointer-events-none'
          }`}
      >
        <div 
          onClick={toggleCollapse}
          className="w-14 h-14 rounded-full bg-white dark:bg-zinc-900 flex items-center justify-center border border-slate-200/60 dark:border-zinc-800 shadow-xl cursor-pointer hover:border-indigo-500 hover:shadow-2xl transition-all duration-300 group"
          title="Open Conversation Panel"
        >
          <Bot className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform" />
        </div>
      </div>

      {/* Expanded Panel State */}
      <div 
        className={`no-print fixed bottom-0 left-0 right-0 sm:left-auto sm:right-6 z-[60] flex flex-col bg-white dark:bg-zinc-950/98 sm:border sm:border-b-0 border-slate-200 dark:border-zinc-800/80 rounded-t-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.1)] overflow-hidden backdrop-blur-2xl transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] will-change-[transform,opacity] origin-bottom
          ${isCollapsed 
            ? 'h-[85dvh] sm:h-[85vh] w-full sm:w-[440px] opacity-0 translate-y-[20%] scale-95 pointer-events-none'
            : 'h-[85dvh] sm:h-[85vh] w-full sm:w-[440px] opacity-100 translate-y-0 scale-100'
          }`}
      >
        
        {/* Title / Gallery bar */}
      <div className="p-4 border-b border-slate-100 dark:border-zinc-900/80 w-full flex items-center justify-between bg-slate-50/50 dark:bg-zinc-950/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-1">
          <Bot className="h-5 w-5 text-indigo-500 shrink-0" />
          <span className="text-xs font-bold text-slate-800 dark:text-zinc-100 font-sans truncate">
            AI Assistant
          </span>
        </div>
        
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex bg-slate-100 dark:bg-zinc-900 rounded-lg p-0.5 border border-slate-200/60 dark:border-zinc-800 shadow-inner">
            <button
               type="button"
               onClick={() => setMode('edit')}
               className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer font-sans ${
                 mode === 'edit' 
                   ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20' 
                   : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
               }`}
               title="Apply changes to the current active dashboard state"
            >
              Refine existing
            </button>
            <button
               type="button"
               onClick={() => setMode('new')}
               className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer font-sans ${
                 mode === 'new' 
                   ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-250/20' 
                   : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300'
               }`}
               title="Compile a fresh new dashboard layout"
            >
              Build new
            </button>
          </div>
          
          <button
            type="button"
            onClick={onClearWorkspace}
            className="p-1.5 px-2 bg-indigo-50 dark:bg-zinc-900 border border-indigo-200 dark:border-zinc-800 text-indigo-600 dark:text-zinc-300 rounded-lg text-xs font-semibold hover:bg-indigo-100/80 hover:text-indigo-700 dark:hover:bg-zinc-800 dark:hover:text-white inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
            title="Start a new chat session & clear active workspace"
          >
            <Plus className="h-3.5 w-3.5 shrink-0 text-indigo-600 dark:text-indigo-400" />
            <span className="hidden sm:inline text-[11px]">New Chat</span>
          </button>
          
          <button
            type="button"
            onClick={() => {
              useAppStore.getState().loadSavedDashboardsList();
              setShowHistoryModal(!showHistoryModal);
            }}
            className="p-1.5 px-2 rounded-lg text-xs font-semibold hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-zinc-900 dark:hover:text-indigo-400 inline-flex items-center gap-1 font-sans transition-all border border-slate-200 dark:border-zinc-800 shadow-sm cursor-pointer"
            title="Browse generated boards library"
          >
            <History className="h-4 w-4 shrink-0 text-slate-400 hover:text-indigo-500" />
            <span className="hidden sm:inline text-[11px]">History</span>
          </button>

          <button
            type="button"
            onClick={toggleCollapse}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-zinc-900/60 transition-all border border-slate-200 dark:border-zinc-800 shadow-sm cursor-pointer ml-0.5"
            title="Minimize Chat Workspace"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* History view overlay inside the panel */}
      {showHistoryModal && (
        <div className="p-4 bg-slate-50 dark:bg-zinc-900/60 border-b border-slate-100 dark:border-zinc-900 shrink-0">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">Historical Boards Library</span>
            <button 
              type="button"
              onClick={() => setShowHistoryModal(false)}
              className="text-[10px] font-mono text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline"
            >
              Close
            </button>
          </div>
          <SavedDashboardsManager 
            onLoadDashboard={async (meta) => {
              const fetched = await loadDashboardFromIDB(meta.dashboardId);
              if (fetched) {
                setCurrentPayload(fetched);
                setChats([
                  {
                    id: Math.random().toString(),
                    role: 'user',
                    content: meta.prompt,
                    timestamp: meta.savedAt
                  },
                  {
                    id: Math.random().toString(),
                    role: 'assistant',
                    content: `Successfully restored board **${fetched.title}** from local IndexedDB storage.`,
                    timestamp: new Date().toISOString(),
                    associatedPayload: fetched
                  }
                ]);
              }
              setShowHistoryModal(false);
            }}
          />
        </div>
      )}

      {/* Message List Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-slate-50/20 dark:bg-zinc-950/10 min-h-0">
        {chats.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-zinc-900 flex items-center justify-center border border-slate-200/50 dark:border-zinc-800">
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-350 font-sans">What would you like to see?</span>
              <p className="text-[11px] text-slate-400 max-w-[240px] leading-relaxed mx-auto font-sans">
                Describe a dashboard, ask a question about your data, or pick a template below to get started.
              </p>
            </div>
          </div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className={`flex gap-3 max-w-[88%] ${
                chat.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
              }`}
            >
              <div className={`p-3 rounded-2xl text-[11px] sm:text-xs leading-relaxed shadow-sm transition-all ${
                chat.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none border border-indigo-700 font-sans'
                  : 'bg-white border border-slate-200/70 text-slate-700 dark:bg-zinc-900 dark:border-zinc-800/80 dark:text-zinc-200 rounded-tl-none font-medium font-sans'
              }`}>
                {chat.content}
              </div>
            </div>
          ))
        )}

        {/* Streaming Progression Animation */}
        {renderStreamingStages()}
      </div>

      {/* Floating Toolbar Quick Actions */}
      {currentPayload && (
        <div className="px-4 py-2 border-t border-slate-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 grid grid-cols-2 gap-2 text-[10px] shrink-0">
          <button
            type="button"
            onClick={handleCopyJSON}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-slate-50/20 text-slate-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-indigo-800 dark:hover:text-indigo-400 transition-all font-sans shadow-xs cursor-pointer"
            title="Copy compiled JSON configuration"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <FileJson className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied JSON' : 'Copy JSON'}</span>
          </button>
          
          <button
            type="button"
            onClick={onClearWorkspace}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-slate-200 hover:border-rose-450 hover:bg-rose-50/10 text-slate-600 dark:border-zinc-800 dark:text-zinc-400 dark:hover:border-rose-950 dark:hover:text-rose-400 transition-all font-sans shadow-xs cursor-pointer"
            title="Reset workspace and clear all charts"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Reset workspace</span>
          </button>
        </div>
      )}

      {/* Bottom TextBox Input Box at the absolute non-scrolling footer */}
      <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-zinc-900/80 bg-white/80 dark:bg-zinc-950/80 relative shrink-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-xs font-sans text-slate-500 dark:text-zinc-400 block font-medium">Try an example:</span>
          </div>
          <SuggestionChips onSelected={(promptText) => {
            setInput(promptText);
            if (textAreaRef.current) {
              setTimeout(() => {
                textAreaRef.current?.focus();
              }, 50);
            }
          }} />
        </div>

        {useAppStore.getState().attachedData && (
          <div className="flex items-center gap-2 mb-2.5 px-2 py-1.5 bg-indigo-50/80 dark:bg-zinc-900 rounded-lg w-max border border-indigo-100 dark:border-zinc-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <span className="text-[10px] text-slate-700 dark:text-zinc-300 font-sans">
              📎 {useAppStore.getState().attachedData?.fileName}
            </span>
            <button 
              type="button"
              onClick={() => useAppStore.getState().setAttachedData(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 p-0.5 ml-1 rounded-full"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <textarea
            ref={textAreaRef}
            rows={Math.min(4, Math.max(2, input.split('\n').length || 1))}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder={
              isStreaming
                ? "Building your dashboard..."
                : mode === 'edit'
                ? "Ask me to change something about this dashboard..."
                : "Describe the dashboard you want to build..."
            }
            className="w-full pl-3 pr-11 py-2.5 text-xs rounded-xl border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:ring-1 focus:ring-indigo-550 focus:border-indigo-550 focus:outline-none transition-all resize-none shadow-xs custom-scrollbar leading-relaxed scroll-smooth"
          />
          <button
            type="submit"
            disabled={!input.trim() || isStreaming}
            className={`absolute right-1 text-white p-2 rounded-lg transition-all cursor-pointer ${
              input.trim() && !isStreaming
                ? 'bg-indigo-600 hover:bg-indigo-700 shadow-md transform active:scale-95'
                : 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-650'
            }`}
            style={{ bottom: "11px" }}
          >
            <CornerDownLeft className="h-4 w-4" />
          </button>
        </form>
        <div className="flex items-center justify-end text-[10px] text-slate-400 dark:text-zinc-500 mt-2 font-sans">
          <span>↵ Send &bull; ⇧↵ New line</span>
        </div>
      </div>
    </div>
    </>
  );
};
