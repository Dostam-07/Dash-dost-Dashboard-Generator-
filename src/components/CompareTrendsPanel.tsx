import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  LineChart,
} from 'recharts';
import {
  GitCompare,
  X,
  TrendingUp,
  Activity,
  Layers,
  Columns,
  Grid,
  ArrowRightLeft,
  Info,
  ChevronDown,
  HelpCircle,
  TrendingDown,
  Shuffle
} from 'lucide-react';
import { DashboardComponent, DashboardFilter } from '../types';
import { filterComponentData, ActiveFilterState } from '../utils/filterEngine';

interface CompareTrendsPanelProps {
  components: DashboardComponent[];
  filters: DashboardFilter[];
  filterState: ActiveFilterState;
  onClose: () => void;
  colorPalette?: string[];
}

export function CompareTrendsPanel({
  components,
  filters,
  filterState,
  onClose,
  colorPalette = ['#6366f1', '#f43f5e', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6']
}: CompareTrendsPanelProps) {
  // Select which two components to compare
  // Default to selecting the first two time-series / numeric chart components
  const eligibleComponents = useMemo(() => {
    return components.filter(c => 
      c.type === 'line_chart' || 
      c.type === 'area_chart' || 
      c.type === 'bar_chart' || 
      c.type === 'scatter_chart'
    );
  }, [components]);

  const [compIdA, setCompIdA] = useState<string>(() => eligibleComponents[0]?.id || '');
  const [compIdB, setCompIdB] = useState<string>(() => eligibleComponents[1]?.id || eligibleComponents[0]?.id || '');

  const compA = useMemo(() => components.find(c => c.id === compIdA), [components, compIdA]);
  const compB = useMemo(() => components.find(c => c.id === compIdB), [components, compIdB]);

  // Allow choosing which Y axis keys to compare if a component has multiple series
  const seriesKeysA = useMemo(() => {
    if (!compA) return [];
    return compA.config.yAxisKeys && compA.config.yAxisKeys.length > 0 
      ? compA.config.yAxisKeys 
      : ['value'];
  }, [compA]);

  const seriesKeysB = useMemo(() => {
    if (!compB) return [];
    return compB.config.yAxisKeys && compB.config.yAxisKeys.length > 0 
      ? compB.config.yAxisKeys 
      : ['value'];
  }, [compB]);

  const [selectedKeyA, setSelectedKeyA] = useState<string>('');
  const [selectedKeyB, setSelectedKeyB] = useState<string>('');

  // Keep selected keys in sync with the components
  React.useEffect(() => {
    if (seriesKeysA.length > 0) {
      setSelectedKeyA(prev => seriesKeysA.includes(prev) ? prev : seriesKeysA[0]);
    }
  }, [seriesKeysA]);

  React.useEffect(() => {
    if (seriesKeysB.length > 0) {
      setSelectedKeyB(prev => seriesKeysB.includes(prev) ? prev : seriesKeysB[0]);
    }
  }, [seriesKeysB]);

  // View modes: 
  // 'dual' - overlay on single dual-axis chart
  // 'side' - side-by-side synchronized independent charts
  // 'scatter' - correlation scatter cloud with regression fit
  const [compareMode, setCompareMode] = useState<'dual' | 'side' | 'scatter'>('dual');

  // Filter the rows for components A & B using actual dashboard parameters
  const filteredDataA = useMemo(() => {
    if (!compA) return [];
    return filterComponentData(compA, filters, filterState);
  }, [compA, filters, filterState]);

  const filteredDataB = useMemo(() => {
    if (!compB) return [];
    return filterComponentData(compB, filters, filterState);
  }, [compB, filters, filterState]);

  // Unified Axis Key: commonly 'date' or a time key
  const xAxisKeyA = compA?.config.xAxisKey || 'date';
  const xAxisKeyB = compB?.config.xAxisKey || 'date';

  // Format Helper for X-axis (Dates)
  const formatXVal = (val: any) => {
    if (val === undefined || val === null) return '';
    const num = Number(val);
    if (!isNaN(num) && num > 30000 && num < 60000) {
      try {
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + num * 24 * 60 * 60 * 1000);
        return jsDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {}
    }
    if (typeof val === 'string' && !isNaN(Date.parse(val)) && isNaN(Number(val))) {
      try {
        const d = new Date(val);
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      } catch (e) {}
    }
    return String(val);
  };

  // Merge the datasets into a unified timeline
  const unifiedTimeline = useMemo(() => {
    if (!compA || !compB) return [];

    // Extract all unique dates or temporal coordinates
    const timesA = filteredDataA.map(row => row[xAxisKeyA]).filter(Boolean);
    const timesB = filteredDataB.map(row => row[xAxisKeyB]).filter(Boolean);

    const allTimes = Array.from(new Set([...timesA, ...timesB]));

    // Try chronological sorting if dates are detectable
    allTimes.sort((a, b) => {
      const numA = Number(a);
      const numB = Number(b);
      
      // If both are numbers (like excel serials)
      if (!isNaN(numA) && !isNaN(numB)) {
        return numA - numB;
      }
      
      // If strings, attempt to parse dates
      const parsedA = Date.parse(String(a));
      const parsedB = Date.parse(String(b));

      if (!isNaN(parsedA) && !isNaN(parsedB)) {
        return parsedA - parsedB;
      }

      // Fallback alphabetical
      return String(a).localeCompare(String(b));
    });

    const keyA = selectedKeyA || seriesKeysA[0] || 'value';
    const keyB = selectedKeyB || seriesKeysB[0] || 'value';

    return allTimes.map(timeVal => {
      // Find row matching this time coordinate
      const matchA = filteredDataA.find(row => String(row[xAxisKeyA]) === String(timeVal));
      const matchB = filteredDataB.find(row => String(row[xAxisKeyB]) === String(timeVal));

      const rawValA = matchA ? matchA[keyA] : null;
      const rawValB = matchB ? matchB[keyB] : null;

      // Extract raw numbers cleanly
      const parseNumeric = (val: any) => {
        if (val === undefined || val === null) return null;
        const cleanStr = String(val).replace(/[\$,₹,%, ]/g, '').trim();
        const num = Number(cleanStr);
        return isNaN(num) ? null : num;
      };

      return {
        label: timeVal,
        formattedLabel: formatXVal(timeVal),
        valueA: parseNumeric(rawValA),
        valueB: parseNumeric(rawValB),
        rawLabelA: rawValA !== null ? String(rawValA) : null,
        rawLabelB: rawValB !== null ? String(rawValB) : null,
      };
    });
  }, [compA, compB, filteredDataA, filteredDataB, xAxisKeyA, xAxisKeyB, selectedKeyA, selectedKeyB, seriesKeysA, seriesKeysB]);

  // Compute correlation analysis
  const correlationCalculations = useMemo(() => {
    // Collect non-null matched pairs
    const validPairs = unifiedTimeline.filter(
      item => item.valueA !== null && item.valueB !== null
    );

    if (validPairs.length < 3) {
      return {
        coefficient: null,
        insight: "Inadequate overlap in timepoints to calculate correlation mathematically.",
        strength: 'neutral',
        slope: 0,
        intercept: 0,
        regressionPoints: []
      };
    }

    const valAValues = validPairs.map(d => d.valueA as number);
    const valBValues = validPairs.map(d => d.valueB as number);
    const n = validPairs.length;

    // Calculate means
    const meanA = valAValues.reduce((s, v) => s + v, 0) / n;
    const meanB = valBValues.reduce((s, v) => s + v, 0) / n;

    // Pearson formula
    let numSum = 0;
    let denSumA = 0;
    let denSumB = 0;

    for (let i = 0; i < n; i++) {
      const diffA = valAValues[i] - meanA;
      const diffB = valBValues[i] - meanB;
      numSum += diffA * diffB;
      denSumA += diffA * diffA;
      denSumB += diffB * diffB;
    }

    const denominator = Math.sqrt(denSumA * denSumB);
    const coefficient = denominator === 0 ? 0 : numSum / denominator;

    // Linear regression line of best fit for scatter chart (y = mx + c)
    // Here, Chart B (Y) is model-regressed on Chart A (X)
    let slope = 0;
    let intercept = 0;
    if (denSumA !== 0) {
      slope = numSum / denSumA;
      intercept = meanB - slope * meanA;
    }

    // Determine plain-english verbal insight
    let strength: 'positive-strong' | 'positive-moderate' | 'neutral' | 'negative-moderate' | 'negative-strong' = 'neutral';
    let insightDescription = '';

    const coeffAbs = Math.abs(coefficient);
    const formatCoeff = coefficient.toFixed(3);

    if (coefficient >= 0.7) {
      strength = 'positive-strong';
      insightDescription = `Strong positive correlation (r = ${formatCoeff}). Both metrics show highly synchronized upward and downward movements. Historically, increments in ${compA?.title || 'Chart A'} correspond to proportional boosts in ${compB?.title || 'Chart B'}.`;
    } else if (coefficient >= 0.3) {
      strength = 'positive-moderate';
      insightDescription = `Moderate positive correlation (r = ${formatCoeff}). A positive trend is visible: when ${compA?.title || 'Chart A'} increases, ${compB?.title || 'Chart B'} generally tends to ride higher alongside it.`;
    } else if (coefficient <= -0.7) {
      strength = 'negative-strong';
      insightDescription = `Strong inverse correlation (r = ${formatCoeff}). An inverse relationship exists: when one metric expands, the other contracts. Movements in ${compA?.title || 'Chart A'} seem to depress values in ${compB?.title || 'Chart B'} synchronously.`;
    } else if (coefficient <= -0.3) {
      strength = 'negative-moderate';
      insightDescription = `Moderate inverse correlation (r = ${formatCoeff}). There is a noticeable inverse trend, indicating as values in ${compA?.title || 'Chart A'} head higher, ${compB?.title || 'Chart B'} frequently drifts lower.`;
    } else {
      strength = 'neutral';
      insightDescription = `No significant correlation (r = ${formatCoeff}). The timeline fluctuations of ${compA?.title || 'Chart A'} and ${compB?.title || 'Chart B'} are mathematically independent, indicating their underlying driving factors do not share a simple direct coupling.`;
    }

    // Generate Regression line start/end coordinate points
    const minA = Math.min(...valAValues);
    const maxA = Math.max(...valAValues);
    const regressionPoints = [
      { x: minA, y: slope * minA + intercept },
      { x: maxA, y: slope * maxA + intercept }
    ];

    return {
      coefficient,
      insight: insightDescription,
      strength,
      slope,
      intercept,
      regressionPoints,
      validCount: n
    };
  }, [unifiedTimeline, compA, compB]);

  // Helper colors
  const colorA = colorPalette[0];
  const colorB = colorPalette[1];

  // Map to beautiful badges based on strength
  const getBadgeStyles = (strength: string) => {
    switch (strength) {
      case 'positive-strong':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900';
      case 'positive-moderate':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200/80 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900';
      case 'negative-strong':
        return 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900';
      case 'negative-moderate':
        return 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900';
      default:
        return 'bg-slate-50 text-slate-500 border-slate-200 dark:bg-zinc-900/30 dark:text-zinc-400 dark:border-zinc-800';
    }
  };

  if (eligibleComponents.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-6 dark:bg-zinc-950 dark:border-zinc-800/80 shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold font-mono uppercase tracking-wider text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
            <GitCompare className="h-4 w-4 text-indigo-505" /> Compare Trends Mode
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex h-32 flex-col items-center justify-center text-center">
          <HelpCircle className="h-8 w-8 text-slate-300 mb-2" />
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            No query or time-series line, area, or bar charts are available to compare. Add interactive charts to this dashboard first.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50/70 border border-slate-200/80 rounded-2xl p-5 mb-6 dark:bg-zinc-950/40 dark:border-zinc-800/80 shadow-md animate-fade-in relative">
      
      {/* HEADER CONTROLS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200/50 pb-4 dark:border-zinc-800/50">
        <div>
          <h3 className="text-xs font-mono uppercase tracking-widest text-indigo-650 dark:text-indigo-400 font-bold mb-1 flex items-center gap-1.5">
            <GitCompare className="h-4 w-4 text-indigo-505 shrink-0" /> Focus-Grid Compare Lounge: Temporal Correlation
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-medium leading-relaxed">
            Correlate dashboard datasets by plotting key time series on a shared clock to confirm lags and lead parameters.
          </p>
        </div>
        
        {/* CLOSING BUTTON */}
        <button 
          onClick={onClose} 
          className="self-end sm:self-auto p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 dark:border-zinc-805 dark:bg-zinc-950 dark:hover:bg-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 cursor-pointer transition-all"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* DROPDOWN SELECTORS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-4 items-end">
        {/* CHART A SELECTION */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full cursor-default" style={{ backgroundColor: colorA }}></span>
            Select Chart A (Left Axis)
          </label>
          <div className="relative">
            <select
              value={compIdA}
              onChange={(e) => setCompIdA(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-8 shadow-2xs focus:outline-none focus:border-indigo-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 transition-all"
            >
              {eligibleComponents.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Sub-series dropdown for Chart A if it has multiple series */}
          {seriesKeysA.length > 1 && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Series Key:</span>
              <select
                value={selectedKeyA}
                onChange={(e) => setSelectedKeyA(e.target.value)}
                className="text-[10px] font-bold text-slate-500 bg-transparent py-0 px-1 hover:text-indigo-600 focus:outline-none dark:text-zinc-400"
              >
                {seriesKeysA.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* SWAP ICON IN THE MIDDLE */}
        <div className="hidden md:flex md:col-span-1 justify-center pb-2.5 text-slate-300 dark:text-zinc-700">
          <button
            onClick={() => {
              const tempId = compIdA;
              setCompIdA(compIdB);
              setCompIdB(tempId);
              const tempKey = selectedKeyA;
              setSelectedKeyA(selectedKeyB);
              setSelectedKeyB(tempKey);
            }}
            title="Swap Chart A & B positions"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-indigo-650 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 transition-all cursor-pointer shadow-3xs"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 shrink-0" />
          </button>
        </div>

        {/* CHART B SELECTION */}
        <div className="md:col-span-4 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono uppercase tracking-wider flex items-center gap-1">
            <span className="w-2 h-2 rounded-full cursor-default" style={{ backgroundColor: colorB }}></span>
            Select Chart B (Right Axis)
          </label>
          <div className="relative">
            <select
              value={compIdB}
              onChange={(e) => setCompIdB(e.target.value)}
              className="w-full text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg py-2.5 pl-3 pr-8 shadow-2xs focus:outline-none focus:border-rose-500 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300 transition-all"
            >
              {eligibleComponents.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title} ({c.type.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Sub-series dropdown for Chart B if it has multiple series */}
          {seriesKeysB.length > 1 && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Series Key:</span>
              <select
                value={selectedKeyB}
                onChange={(e) => setSelectedKeyB(e.target.value)}
                className="text-[10px] font-bold text-slate-500 bg-transparent py-0 px-1 hover:text-indigo-600 focus:outline-none dark:text-zinc-400"
              >
                {seriesKeysB.map(k => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* VIEW ORIENTATION MODES */}
        <div className="md:col-span-3 space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono uppercase tracking-wider block">
            Layout Method
          </label>
          <div className="grid grid-cols-3 bg-slate-100 border border-slate-200 dark:bg-zinc-900/60 dark:border-zinc-850 p-0.5 rounded-lg h-9 items-stretch">
            <button
              onClick={() => setCompareMode('dual')}
              title="Overlay both trends on a shared axis with Left+Right scale"
              className={`flex items-center justify-center gap-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                compareMode === 'dual'
                  ? 'bg-white text-slate-800 shadow-3xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>Overlay</span>
            </button>
            <button
              onClick={() => setCompareMode('side')}
              title="Stacked charts side by side with synchronized tooltip crosshairs"
              className={`flex items-center justify-center gap-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                compareMode === 'side'
                  ? 'bg-white text-slate-800 shadow-3xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Columns className="h-3 w-3" />
              <span>Stacked</span>
            </button>
            <button
              onClick={() => setCompareMode('scatter')}
              title="XY correlation scatter diagram with trend line calculated from Pearson fit"
              className={`flex items-center justify-center gap-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                compareMode === 'scatter'
                  ? 'bg-white text-slate-800 shadow-3xs dark:bg-zinc-800 dark:text-zinc-100'
                  : 'text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              <Grid className="h-3 w-3" />
              <span>Scatter</span>
            </button>
          </div>
        </div>
      </div>

      {/* CORE GRAPH STAGE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 mt-5">
        
        {/* GRAPH VIEW PANEL */}
        <div className="xl:col-span-8 bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-850 p-4 rounded-xl min-h-[290px] flex flex-col justify-between shadow-2xs">
          
          <div className="flex-1 min-h-[240px] flex items-center justify-center relative">
            
            {unifiedTimeline.length === 0 ? (
              <div className="text-center">
                <p className="text-xs text-slate-400">Loading temporal series comparison...</p>
              </div>
            ) : compareMode === 'dual' ? (
              <ResponsiveContainer width="100%" height={250}>
                <ComposedChart data={unifiedTimeline} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-zinc-900" />
                  <XAxis 
                    dataKey="formattedLabel" 
                    stroke="#888888" 
                    fontSize={10} 
                    fontWeight={500}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    yAxisId="left" 
                    stroke={colorA} 
                    fontSize={9} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => typeof v === 'number' && v > 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke={colorB} 
                    fontSize={9} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                    tickFormatter={(v) => typeof v === 'number' && v > 1000 ? `${(v/1000).toFixed(0)}k` : String(v)}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 bg-white/95 dark:bg-zinc-950/95 border border-slate-200 dark:border-zinc-800 rounded-lg shadow-lg backdrop-blur-md">
                            <p className="font-mono text-[10px] text-slate-500 mb-1.5">{label}</p>
                            <div className="space-y-1">
                              <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: colorA }}>
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorA }} />
                                {compA?.title}: <span className="font-mono text-slate-800 dark:text-zinc-200">{payload[0]?.value?.toLocaleString() || 'N/A'}</span>
                              </p>
                              {payload[1] && (
                                <p className="text-xs font-semibold flex items-center gap-1.5" style={{ color: colorB }}>
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorB }} />
                                  {compB?.title}: <span className="font-mono text-slate-800 dark:text-zinc-200">{payload[1]?.value?.toLocaleString() || 'N/A'}</span>
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="valueA" 
                    yAxisId="left" 
                    stroke={colorA} 
                    fill={`${colorA}0b`} 
                    strokeWidth={2.5} 
                    dot={{ r: 2.5, fill: colorA }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="valueB" 
                    yAxisId="right" 
                    stroke={colorB} 
                    strokeWidth={2.5} 
                    dot={{ r: 2.5, fill: colorB }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            ) : compareMode === 'side' ? (
              <div className="w-full space-y-3">
                {/* Side stacked A */}
                <div className="h-[120px] w-full">
                  <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider font-mono" style={{ color: colorA }}>{compA?.title}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={95}>
                    <LineChart data={unifiedTimeline} syncId="compare-sync-id" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" className="dark:stroke-zinc-900" />
                      <XAxis dataKey="formattedLabel" stroke="#888888" hide />
                      <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="py-1 px-2.5 bg-white border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-md shadow-sm">
                                <p className="font-mono text-[9px] text-slate-400 mb-0.5">{label}</p>
                                <p className="text-[10px] font-bold" style={{ color: colorA }}>
                                  {payload[0]?.value?.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="valueA" stroke={colorA} fill={colorA} strokeWidth={2} dot={{ r: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Side stacked B */}
                <div className="h-[120px] w-full border-t border-slate-100 dark:border-zinc-900 pt-1.5">
                  <div className="flex justify-between items-center px-1 mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider font-mono" style={{ color: colorB }}>{compB?.title}</span>
                  </div>
                  <ResponsiveContainer width="100%" height={95}>
                    <LineChart data={unifiedTimeline} syncId="compare-sync-id" margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" className="dark:stroke-zinc-900" />
                      <XAxis dataKey="formattedLabel" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="py-1 px-2.5 bg-white border border-slate-200 dark:bg-zinc-900 dark:border-zinc-800 rounded-md shadow-sm">
                                <p className="font-mono text-[9px] text-slate-400 mb-0.5">{label}</p>
                                <p className="text-[10px] font-bold" style={{ color: colorB }}>
                                  {payload[0]?.value?.toLocaleString()}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line type="monotone" dataKey="valueB" stroke={colorB} fill={colorB} strokeWidth={2} dot={{ r: 2 }} className="cursor-pointer" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : (
              /* Scatter Correlation XY */
              <div className="w-full flex flex-col justify-between">
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 10, right: 10, left: -15, bottom: 2 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" className="dark:stroke-zinc-900" />
                    <XAxis 
                      type="number" 
                      dataKey="valueA" 
                      name={compA?.title} 
                      stroke="#888888" 
                      fontSize={8} 
                      tickLine={false}
                      axisLine={false}
                      label={{ value: compA?.title, position: 'insideBottom', offset: -5, fontSize: 8, fill: '#888888', fontWeight: 'bold' }}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="valueB" 
                      name={compB?.title} 
                      stroke="#888888" 
                      fontSize={8} 
                      tickLine={false}
                      axisLine={false}
                      label={{ value: compB?.title, angle: -90, position: 'insideLeft', offset: 5, fontSize: 8, fill: '#888888', fontWeight: 'bold' }}
                    />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const p = payload[0]?.payload;
                          return (
                            <div className="p-2.5 bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-850 rounded-lg shadow-md font-mono text-[10px]">
                              <p className="text-[9px] text-slate-400 mb-1 font-sans">{p.formattedLabel}</p>
                              <p className="text-indigo-600 font-semibold">{compA?.title}: {p.valueA?.toLocaleString()}</p>
                              <p className="text-rose-500 font-semibold">{compB?.title}: {p.valueB?.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    {/* Points scatter cloud */}
                    <Scatter 
                      name="Temporal Matches" 
                      data={unifiedTimeline.filter(d => d.valueA !== null && d.valueB !== null)} 
                      fill={colorA} 
                      className="cursor-pointer"
                    />
                    
                    {/* Line of best fit */}
                    {correlationCalculations.coefficient !== null && (
                      <Scatter
                        name="Trendline"
                        data={correlationCalculations.regressionPoints}
                        line={{ stroke: colorB, strokeWidth: 2, strokeDasharray: '4 4' }}
                        shape={() => null}
                        legendType="none"
                      />
                    )}
                  </ScatterChart>
                </ResponsiveContainer>
                <div className="flex justify-center mt-1">
                  <span className="text-[10px] text-slate-400 font-medium">
                    Best Fit Line Equation: <span className="font-mono text-slate-600 dark:text-zinc-300">Y = {(correlationCalculations.slope || 0).toFixed(4)}X + {(correlationCalculations.intercept || 0).toFixed(1)}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center border-t border-slate-100/80 pt-2.5 dark:border-zinc-900 text-[10px] text-slate-400 dark:text-zinc-500 font-mono">
            <span>Points: {unifiedTimeline.length} combined intervals</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-semibold" style={{ color: colorA }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorA }}></span>
                {selectedKeyA || seriesKeysA[0]}
              </span>
              <span className="flex items-center gap-1 font-semibold" style={{ color: colorB }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colorB }}></span>
                {selectedKeyB || seriesKeysB[1] || seriesKeysB[0]}
              </span>
            </div>
          </div>
        </div>

        {/* MATH INSIGHTS SIDEBAR */}
        <div className="xl:col-span-4 flex flex-col gap-4">
          
          {/* PEARSON METRIC BOX */}
          <div className="bg-white dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-850 p-4 rounded-xl shadow-2xs flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono uppercase tracking-wider">
                  Correlation Strength ($r$)
                </span>
                <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 font-mono">
                  n = {correlationCalculations.validCount || 0}
                </span>
              </div>
              
              <div className="mt-2.5 mb-3 flex items-baseline gap-1.5">
                <span className="text-3xl font-bold font-mono text-slate-805 tracking-tighter dark:text-zinc-100">
                  {correlationCalculations.coefficient !== null 
                    ? correlationCalculations.coefficient.toFixed(4) 
                    : 'N/A'}
                </span>
                <span className="text-xs text-slate-400 font-mono">r</span>
              </div>

              {correlationCalculations.coefficient !== null && (
                <div className={`text-[10px] px-2 py-1.5 rounded-md border font-bold text-center capitalize mb-3.5 ${getBadgeStyles(correlationCalculations.strength)}`}>
                  {correlationCalculations.strength.replace('-', ' ')} Relationship
                </div>
              )}
              
              <div className="space-y-2 mt-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono flex items-center gap-1 pl-0.5">
                  <Info className="h-3 w-3 text-indigo-505" /> Verbal Summary
                </h4>
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 font-medium leading-relaxed bg-slate-50 border border-slate-200/50 p-2.5 rounded-lg dark:bg-zinc-900/30 dark:border-zinc-850">
                  {correlationCalculations.insight}
                </p>
              </div>
            </div>

            {/* Quick statistical references */}
            {correlationCalculations.coefficient !== null && (
              <div className="pt-3 border-t border-slate-100 dark:border-zinc-900 grid grid-cols-2 gap-3 mt-3">
                <div className="bg-slate-50 dark:bg-zinc-900/40 p-2 rounded-lg border border-slate-100 dark:border-zinc-850/60 text-center">
                  <span className="text-[9px] font-bold font-mono text-slate-400 block uppercase">Shared variance</span>
                  <span className="text-xs font-bold font-mono text-indigo-600 dark:text-indigo-400 mt-0.5 block">
                    {(correlationCalculations.coefficient * correlationCalculations.coefficient * 100).toFixed(1)}% (R²)
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-zinc-900/40 p-2 rounded-lg border border-slate-100 dark:border-zinc-850/60 text-center">
                  <span className="text-[9px] font-bold font-mono text-slate-400 block uppercase">Covariance sign</span>
                  <span className={`text-xs font-bold font-mono mt-0.5 block flex items-center justify-center gap-0.5 ${
                    correlationCalculations.coefficient > 0 ? 'text-emerald-500' : correlationCalculations.coefficient < 0 ? 'text-rose-500' : 'text-slate-500'
                  }`}>
                    {correlationCalculations.coefficient > 0 ? (
                      <>
                        <TrendingUp className="h-3.5 w-3.5" /> Positive
                      </>
                    ) : correlationCalculations.coefficient < 0 ? (
                      <>
                        <TrendingDown className="h-3.5 w-3.5" /> Inverse
                      </>
                    ) : 'None'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
