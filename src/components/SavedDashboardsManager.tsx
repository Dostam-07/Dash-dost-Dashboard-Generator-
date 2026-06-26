import React from 'react';
import { History, Trash, Calendar, Sparkles } from 'lucide-react';
import { useAppStore, loadDashboardFromIDB } from '../store';
import { SavedDashboardMeta } from '../types';

interface SavedDashboardsProps {
  onLoadDashboard: (meta: SavedDashboardMeta) => void;
  onClose?: () => void;
}

export const SavedDashboardsManager: React.FC<SavedDashboardsProps> = ({ onLoadDashboard, onClose }) => {
  const { savedDashboards, deleteDashboard, currentPayload } = useAppStore();

  if (savedDashboards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-zinc-50 border border-zinc-100 dark:bg-zinc-900/20 dark:border-zinc-800/40">
        <History className="h-8 w-8 text-zinc-300 dark:text-zinc-600 mb-2" />
        <span className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">No saved dashboards yet</span>
        <p className="text-zinc-400 dark:text-zinc-500 text-xs mt-1 max-w-[200px]">
          Generate a dashboard and it will auto-save to history!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono">
          Local Storage History ({savedDashboards.length})
        </h4>
      </div>
      
      <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {savedDashboards.map((dash, index) => {
          const isActive = currentPayload?.dashboardId === dash.dashboardId;
          return (
            <div 
              key={`${dash.dashboardId}-${index}`} 
              className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all group ${
                isActive 
                  ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/15 dark:bg-indigo-950/15 shadow-sm' 
                  : 'border-zinc-100 bg-white hover:border-indigo-400/40 dark:bg-zinc-950 dark:border-zinc-900 dark:hover:border-indigo-500/40'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1 min-w-0">
                <div className={`h-6 w-6 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-bold font-mono transition-colors ${
                  isActive 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 dark:bg-zinc-900 text-slate-500 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-950/40 group-hover:text-indigo-600'
                }`}>
                  {index + 1}
                </div>
                
                <button
                  onClick={() => {
                    onLoadDashboard(dash);
                    if (onClose) onClose();
                  }}
                  className="flex-1 text-left min-w-0"
                >
                  <h5 className={`text-xs font-semibold truncate transition-colors ${
                    isActive 
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                      : 'text-zinc-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'
                  }`}>
                    {dash.title || "Untitled Dashboard"}
                  </h5>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5 font-mono">
                    Prompt: "{dash.prompt}"
                  </p>
                  <div className="flex items-center gap-1.5 text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
                    <Calendar className="h-2.5 w-2.5" />
                    <span>{new Date(dash.savedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              </div>
              
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm(`Are you sure you want to delete "${dash.title}"?`)) {
                    await deleteDashboard(dash.dashboardId);
                  }
                }}
                className="p-1 px-1.5 rounded-lg border border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 text-zinc-400 hover:text-rose-500 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 transition-all inline-flex items-center justify-center pointer-events-auto h-8 w-8 shrink-0"
                title="Delete dashboard from cache"
              >
                <Trash className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
