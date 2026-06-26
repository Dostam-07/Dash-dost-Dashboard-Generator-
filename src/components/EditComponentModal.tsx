import React, { useState, useEffect } from 'react';
import { X, Sparkles, Plus, Grid, Layers } from 'lucide-react';
import { DashboardComponent, DashboardComponentType, KPITrend } from '../types';

interface EditComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (component: DashboardComponent) => void;
  componentToEdit?: DashboardComponent | null; // null if adding a new one
}

const DEFAULT_PALETTE = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'];

export const EditComponentModal: React.FC<EditComponentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  componentToEdit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<DashboardComponentType>('bar_chart');
  const [tab, setTab] = useState('');
  
  // Layout columns constraints
  const [smCol, setSmCol] = useState(12);
  const [mdCol, setMdCol] = useState(12);
  const [lgCol, setLgCol] = useState(6);

  // Config overrides
  const [xAxisKey, setXAxisKey] = useState('date');
  const [rawYAxisKeys, setRawYAxisKeys] = useState('value');
  const [stacked, setStacked] = useState(false);
  const [rawColors, setRawColors] = useState('#6366f1, #06b6d4, #10b981');
  const [seriesColors, setSeriesColors] = useState<Record<string, string>>({});

  // KPI-specific overrides
  const [kpiValue, setKpiValue] = useState('');
  const [kpiTrendDirection, setKpiTrendDirection] = useState<'up' | 'down' | 'neutral'>('up');
  const [kpiTrendLabel, setKpiTrendLabel] = useState('');

  // Series raw JSON
  const [seriesDataJson, setSeriesDataJson] = useState('');
  const [jsonError, setJsonError] = useState('');

  // Populate form if editing
  useEffect(() => {
    if (componentToEdit) {
      setTitle(componentToEdit.title || '');
      setDescription(componentToEdit.description || '');
      setType(componentToEdit.type || 'bar_chart');
      setTab(componentToEdit.tab || '');
      
      setSmCol(componentToEdit.layout?.sm || 12);
      setMdCol(componentToEdit.layout?.md || 12);
      setLgCol(componentToEdit.layout?.lg || 6);

      setXAxisKey(componentToEdit.config?.xAxisKey || 'date');
      setRawYAxisKeys(componentToEdit.config?.yAxisKeys?.join(', ') || 'value');
      setStacked(!!componentToEdit.config?.stacked);
      setRawColors(componentToEdit.config?.colors?.join(', ') || '#6366f1, #06b6d4, #10b981');
      setSeriesColors(componentToEdit.config?.seriesColors || {});

      setKpiValue(componentToEdit.config?.kpiValue || '');
      setKpiTrendDirection(componentToEdit.config?.kpiTrend?.direction || 'up');
      setKpiTrendLabel(componentToEdit.config?.kpiTrend?.label || '');

      setSeriesDataJson(JSON.stringify(componentToEdit.seriesData || [], null, 2));
      setJsonError('');
    } else {
      // Default initial templates for adding fresh component
      setTitle('SaaS MRR Momentum');
      setDescription('Tracking Monthly Recurring Revenue growth velocities');
      setType('bar_chart');
      setTab('');
      setSmCol(12);
      setMdCol(12);
      setLgCol(6);
      setXAxisKey('date');
      setRawYAxisKeys('value, expansion');
      setStacked(false);
      setRawColors('#6366f1, #06b6d4, #10b981');
      setKpiValue('$48,520');
      setKpiTrendDirection('up');
      setKpiTrendLabel('+12.4%');
      
      const defaultSampleData = [
        { "date": "Q1", "value": 24000, "expansion": 4000 },
        { "date": "Q2", "value": 31000, "expansion": 6200 },
        { "date": "Q3", "value": 39500, "expansion": 5800 },
        { "date": "Q4", "value": 48520, "expansion": 7100 }
      ];
      setSeriesDataJson(JSON.stringify(defaultSampleData, null, 2));
      setJsonError('');
    }
  }, [componentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse seriesData JSON
    let parsedData: any[] = [];
    try {
      const parsed = JSON.parse(seriesDataJson);
      if (!Array.isArray(parsed)) {
        throw new Error('Series data must be an array of objects.');
      }
      parsedData = parsed;
      setJsonError('');
    } catch (err: any) {
      setJsonError(`JSON Error: ${err.message}`);
      return;
    }

    const yAxisKeysList = rawYAxisKeys
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const colorsList = rawColors
      .split(',')
      .map(c => c.trim())
      .filter(c => c.length > 0);

    // Build KPI Trend
    let kpiTrend: KPITrend | undefined = undefined;
    if (kpiTrendLabel || kpiTrendDirection) {
      kpiTrend = {
        direction: kpiTrendDirection,
        label: kpiTrendLabel || 'Live'
      };
    }

    const updatedComponent: DashboardComponent = {
      id: componentToEdit ? componentToEdit.id : `comp_${Date.now()}`,
      title,
      description: description || undefined,
      tab: tab ? tab.trim() : undefined,
      type,
      layout: {
        sm: smCol,
        md: mdCol,
        lg: lgCol
      },
      config: {
        xAxisKey: xAxisKey || 'date',
        yAxisKeys: yAxisKeysList.length > 0 ? yAxisKeysList : ['value'],
        stacked,
        colors: colorsList.length > 0 ? colorsList : undefined,
        seriesColors,
        kpiValue: kpiValue || undefined,
        kpiTrend
      },
      seriesData: parsedData
    };

    onSave(updatedComponent);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 dark:bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl custom-scrollbar flex flex-col">
        
        {/* Header bar */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
              <Layers className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-base font-bold text-slate-800 dark:text-zinc-50 font-sans tracking-tight">
              {componentToEdit ? 'RECONSTRUCT COMPONENT' : 'INVENT CUSTOM CONTAINER'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="p-6 space-y-6 flex-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Component Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Page Tab (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Overview, Financials"
                value={tab}
                onChange={e => setTab(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                title="Slices dashboard widgets into separate page tabs"
              />
            </div>

            <div className="sm:col-span-2 space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Description / Subtitle</label>
              <input
                type="text"
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Chart selector & column widths */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pb-4 border-b border-slate-100 dark:border-zinc-900">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Container Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as DashboardComponentType)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value="kpi_card">Aggregate KPI Block</option>
                <option value="bar_chart">Bar Chart</option>
                <option value="line_chart">Line Chart</option>
                <option value="area_chart">Area Chart</option>
                <option value="pie_chart">Pie Chart</option>
                <option value="scatter_chart">Scatter Chart</option>
                <option value="map_chart">Geographic Map (legacy)</option>
                <option value="geo_map">Geographic Map (geo_map)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grid Size (Desktop)</label>
              <select
                value={lgCol}
                onChange={e => setLgCol(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value={3}>1/4 column (size 3)</option>
                <option value={4}>1/3 column (size 4)</option>
                <option value={6}>1/2 column (size 6)</option>
                <option value={8}>2/3 column (size 8)</option>
                <option value={9}>3/4 column (size 9)</option>
                <option value={12}>Full Width (size 12)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grid Size (Tablet)</label>
              <select
                value={mdCol}
                onChange={e => setMdCol(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
              >
                <option value={6}>Half Width (6)</option>
                <option value={12}>Full Width (12)</option>
              </select>
            </div>
          </div>

          {/* KPI Specific Options (only visible if kpi_card selected) */}
          {type === 'kpi_card' && (
            <div className="p-4 bg-slate-50 dark:bg-zinc-900 rounded-xl space-y-4">
              <span className="text-[10px] font-mono font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                KPI Block Settings
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Static aggregate value</label>
                  <input
                    type="text"
                    placeholder="e.g. $48,520 or 94.2%"
                    value={kpiValue}
                    onChange={e => setKpiValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trend Direction</label>
                  <select
                    value={kpiTrendDirection}
                    onChange={e => setKpiTrendDirection(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
                  >
                    <option value="up">Upwards (Green)</option>
                    <option value="down">Downwards (Red)</option>
                    <option value="neutral">Neutral (Slate)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Trend Text</label>
                  <input
                    type="text"
                    placeholder="e.g. +12.4% or -3.2%"
                    value={kpiTrendLabel}
                    onChange={e => setKpiTrendLabel(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Dataset & Series Configuration */}
          <div className="space-y-4">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block">
              Axis & Schema Configurations
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">X-Axis Key</label>
                <input
                  type="text"
                  required
                  value={xAxisKey}
                  onChange={e => setXAxisKey(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Y-Axis Key(s) (comma sept)</label>
                <input
                  type="text"
                  required
                  value={rawYAxisKeys}
                  onChange={e => setRawYAxisKeys(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Custom Colors (Hex comma list)</label>
                <input
                  type="text"
                  value={rawColors}
                  onChange={e => setRawColors(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                  placeholder="#6366f1, #06b6d4"
                />
              </div>
            </div>

            {/* Tactical Color Customization Swatches Section */}
            {['bar_chart', 'line_chart', 'area_chart', 'pie_chart', 'scatter_chart'].includes(type) && (
              <div className="space-y-3 p-3 bg-slate-50 dark:bg-zinc-900/60 rounded-xl border border-slate-200/50 dark:border-zinc-800/80">
                <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
                  Series Color Picker
                </span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {(rawYAxisKeys.split(',').map(s => s.trim()).filter(Boolean).length > 0
                    ? rawYAxisKeys.split(',').map(s => s.trim()).filter(Boolean)
                    : ['Series 1']
                  ).map((keyName, idx) => {
                    const parsedColors = rawColors.split(',').map(c => c.trim()).filter(Boolean);
                    const currentColor = seriesColors[keyName] || parsedColors[idx] || DEFAULT_PALETTE[idx % DEFAULT_PALETTE.length];
                    const isHex = currentColor.startsWith('#') && currentColor.length === 7;
                    const safeValue = isHex ? currentColor : '#6366f1';

                    const onSwatchChange = (newVal: string) => {
                      setSeriesColors(prev => ({
                        ...prev,
                        [keyName]: newVal
                      }));
                      // Backup to old array format
                      const tempColors = [...parsedColors];
                      while (tempColors.length <= idx) {
                        tempColors.push(DEFAULT_PALETTE[tempColors.length % DEFAULT_PALETTE.length]);
                      }
                      tempColors[idx] = newVal;
                      setRawColors(tempColors.join(', '));
                    };

                    return (
                      <div key={`${keyName}-${idx}`} className="flex items-center gap-2 p-1.5 rounded-lg bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/85">
                        <input
                          type="color"
                          value={safeValue}
                          onChange={(e) => onSwatchChange(e.target.value)}
                          className="w-7 h-7 rounded-md border-0 p-0 cursor-pointer bg-transparent shrink-0"
                          title={`Select color for series "${keyName}"`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 truncate uppercase mt-0.5">{keyName}</p>
                          <input
                            type="text"
                            value={currentColor}
                            onChange={(e) => onSwatchChange(e.target.value)}
                            className="w-full text-[10px] font-mono font-bold bg-transparent border-0 p-0 text-slate-700 dark:text-zinc-300 focus:ring-0 focus:outline-none"
                            placeholder="#6366f1"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="modal_stacked"
                checked={stacked}
                onChange={e => setStacked(e.target.checked)}
                className="rounded border-slate-200 text-indigo-600 focus:ring-indigo-500"
              />
              <label htmlFor="modal_stacked" className="text-xs text-slate-600 dark:text-zinc-300 font-semibold cursor-pointer select-none">
                Stack values (for multi bars / areas)
              </label>
            </div>
          </div>

          {/* Series JSON source */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">RAW SERIES DATA RECORDS (JSON Array)</label>
              <span className="text-[9px] font-mono text-slate-400 bg-slate-50 dark:bg-zinc-900 px-1 rounded">validated on save</span>
            </div>
            <textarea
              required
              rows={6}
              value={seriesDataJson}
              onChange={e => setSeriesDataJson(e.target.value)}
              className="w-full font-mono text-[11px] p-3 rounded-lg border border-slate-200 text-slate-700 bg-slate-50 focus:bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
            />
            {jsonError && (
              <p className="font-mono text-[10px] text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-100 dark:border-red-900/40">
                {jsonError}
              </p>
            )}
          </div>

          {/* Confirm row */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 px-4 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all font-mono shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 px-4 rounded-lg bg-indigo-600 text-xs text-white font-semibold hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all font-mono shadow-md"
            >
              Commit Settings
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
