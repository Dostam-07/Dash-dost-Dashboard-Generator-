import React, { useId } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Activity,
  Minimize,
  Edit,
  Trash2,
  Settings,
  Download,
  Maximize2,
  Minimize2,
  Eye,
  EyeOff,
  AlertTriangle,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { useAppStore } from '../store';
import { DashboardComponent } from '../types';
import { GeographyMap } from './GeographyMap';

import { ActiveFilterState } from '../utils/filterEngine';

interface ChartWrapperProps {
  component: DashboardComponent;
  filteredData: Record<string, any>[];
  filterState?: ActiveFilterState;
  onEditComponent?: (component: DashboardComponent) => void;
  onDeleteComponent?: (id: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: (id: string) => void;
  onDrillDown?: (key: string, val: string) => void;
  colorPalette?: string;
}

const DEFAULT_COLORS = [
  '#6366f1', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
  '#ef4444', // Red
];

// Custom Premium Tooltip
const CustomTooltip = ({ active, payload, label, format = 'formatted' }: any) => {
  const formatLabel = (val: any) => {
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
        return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      } catch (e) {}
    }
    return String(val);
  };

  if (active && payload && payload.length) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white/95 p-3 shadow-xl backdrop-blur-md dark:border-zinc-800/80 dark:bg-zinc-950/95">
        {label && (
          <p className="mb-2 font-mono text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {formatLabel(label)}
          </p>
        )}
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => {
            let val;
            const numVal = Number(entry.value);
            if (typeof entry.value === 'number') {
              if (format === 'raw') {
                val = entry.value;
              } else if (format === 'percentage') {
                val = entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%';
              } else {
                val = entry.value.toLocaleString(undefined, { maximumFractionDigits: 2 });
              }
            } else if (!isNaN(numVal)) {
              if (format === 'raw') {
                val = numVal;
              } else if (format === 'percentage') {
                val = numVal.toLocaleString(undefined, { maximumFractionDigits: 2 }) + '%';
              } else {
                val = numVal.toLocaleString(undefined, { maximumFractionDigits: 2 });
              }
            } else {
              val = entry.value;
            }
            return (
              <div key={index} className="flex items-center gap-2.5">
                <span 
                  className="h-2 w-2 rounded-full ring-2 ring-white/10" 
                  style={{ backgroundColor: entry.color || entry.fill || DEFAULT_COLORS[index % DEFAULT_COLORS.length] }}
                />
                <span className="text-xs text-zinc-650 dark:text-zinc-350 font-medium">
                  {entry.name}:
                </span>
                <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                  {val}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

interface SkeletonProps {
  type: string;
  showGeographicMap?: boolean;
}

export const Skeleton: React.FC<SkeletonProps> = ({ type, showGeographicMap = false }) => {
  const basePulse = "animate-pulse bg-slate-205 dark:bg-zinc-805 rounded-xl";
  
  if (type === 'kpi_card') {
    return (
      <div className="flex flex-col h-full justify-between py-1.5 min-h-[140px] w-full">
        <div className="space-y-3">
          {/* KPI Title Placeholder */}
          <div className={`h-3.5 w-1/3 ${basePulse}`} />
          {/* Huge KPI Value Placeholder */}
          <div className={`h-11 w-1/2 ${basePulse}`} />
        </div>
        <div className="flex items-center gap-2 mt-4">
          {/* Trend Indicator Placeholder */}
          <div className={`h-6 w-24 ${basePulse}`} />
          <div className={`h-3 w-1/4 ${basePulse}`} />
        </div>
      </div>
    );
  }

  if (type === 'pie_chart') {
    return (
      <div className="h-64 sm:h-72 w-full mt-4 flex flex-col items-center justify-center min-h-[256px]">
        <div className="relative h-44 w-44 rounded-full border-12 border-slate-105 dark:border-zinc-900 flex items-center justify-center animate-pulse">
          <div className="absolute inset-2 rounded-full border-12 border-slate-200/50 dark:border-zinc-800/50 transform rotate-45 animate-pulse" />
          <div className="absolute inset-5 rounded-full bg-white dark:bg-zinc-950 flex flex-col items-center justify-center">
            <div className="h-2 w-12 bg-slate-200 dark:bg-zinc-850 rounded-md mb-2" />
            <div className="h-4.5 w-16 bg-slate-300 dark:bg-zinc-700 rounded-md" />
          </div>
        </div>
        <div className="flex gap-3 mt-6 justify-center w-full">
          <div className="h-2.5 w-16 bg-slate-200 dark:bg-zinc-800 rounded-md animate-pulse" />
          <div className="h-2.5 w-16 bg-slate-150 dark:bg-zinc-855 rounded-md animate-pulse" />
          <div className="h-2.5 w-12 bg-slate-100 dark:bg-zinc-900 rounded-md animate-pulse" />
        </div>
      </div>
    );
  }

  if (type === 'map_chart' || type === 'geo_map' || showGeographicMap) {
    return (
      <div className="h-64 sm:h-72 w-full mt-4 flex flex-col items-center justify-center relative overflow-hidden bg-slate-50/40 dark:bg-zinc-900/10 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800/80 animate-pulse min-h-[256px]">
        <Globe className="h-12 w-12 text-slate-300 dark:text-zinc-750 animate-spin" style={{ animationDuration: '6s' }} />
        <div className="mt-4 text-center space-y-2">
          <div className="h-4 w-44 bg-slate-200 dark:bg-zinc-800 rounded-md mx-auto" />
          <div className="h-2 w-28 bg-slate-150 dark:bg-zinc-850 rounded-md mx-auto" />
        </div>
      </div>
    );
  }

  // Default chart grid layout (bar/line/area/scatter)
  return (
    <div className="h-64 sm:h-72 w-full mt-4 flex flex-col justify-end min-h-[256px]">
      {/* Simple chart lines/bars background */}
      <div className="flex-1 w-full grid grid-cols-6 gap-4 items-end px-3 pb-4">
        {[1, 2, 3, 4, 5, 6].map((num) => {
          const hPercent = [35, 75, 45, 90, 60, 80][num - 1];
          return (
            <div key={num} className="flex flex-col items-center justify-end h-full w-full gap-2.5 relative">
              {type === 'bar_chart' ? (
                <div 
                  className={`w-full rounded-t-lg bg-gradient-to-t from-slate-100 to-indigo-100/50 dark:from-zinc-900 dark:to-indigo-950/20 animate-pulse`} 
                  style={{ height: `${hPercent}%` }} 
                />
              ) : type === 'scatter_chart' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div 
                    className="absolute flex items-center justify-center"
                    style={{ bottom: `${hPercent}%` }}
                  >
                    <span className="h-3.5 w-3.5 rounded-full bg-indigo-400 dark:bg-indigo-600 animate-ping absolute" />
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-500 dark:bg-indigo-500 relative" />
                  </div>
                </div>
              ) : (
                // Line or Area - simulate waveform path
                <div className="absolute inset-0 flex items-end">
                  <svg className="w-full h-full text-indigo-150/15 dark:text-indigo-950/25" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path 
                      d={type === 'area_chart' 
                        ? "M0,100 C20,40 40,80 60,30 80,60 100,20 L100,100 Z" 
                        : "M0,60 C20,45 40,75 60,30 80,55 100,20"
                      } 
                      fill={type === 'area_chart' ? "currentColor" : "none"} 
                      stroke="rgba(124, 58, 237, 0.35)" 
                      strokeWidth="2.5" 
                      className="animate-pulse"
                    />
                  </svg>
                </div>
              )}
              {/* Simulated x axis values */}
              <div className="h-2 w-10/12 bg-slate-205 dark:bg-zinc-800 rounded-sm animate-pulse shrink-0" />
            </div>
          );
        })}
      </div>
      {/* Legend Placeholder */}
      <div className="flex gap-3 justify-center py-2 shrink-0">
        <div className="h-2 w-16 bg-slate-200 dark:bg-zinc-800 rounded-sm animate-pulse" />
        <div className="h-2 w-16 bg-slate-200 dark:bg-zinc-800 rounded-sm animate-pulse" />
      </div>
    </div>
  );
};

export const ChartWrapper: React.FC<ChartWrapperProps> = ({
  component,
  filteredData,
  filterState,
  onEditComponent,
  onDeleteComponent,
  isFullscreen = false,
  onToggleFullscreen,
  onDrillDown,
  colorPalette,
}) => {
  const { title, description, type, config } = component;
  const gradientId = useId();
  
  const componentSettings = useAppStore((state) => state.componentSettings);
  const updateComponentSettings = useAppStore((state) => state.updateComponentSettings);
  const isStreaming = useAppStore((state) => state.isStreaming);

  const [isInitializing, setIsInitializing] = React.useState(true);
  const [isFetching, setIsFetching] = React.useState(true);
  
  React.useEffect(() => {
    const hasData = component.seriesData && component.seriesData.length > 0;
    
    if (isStreaming && !hasData) {
      setIsInitializing(true);
      setIsFetching(true);
    } else {
      const timer = setTimeout(() => {
        setIsFetching(false);
        setIsInitializing(false);
      }, 850);
      return () => clearTimeout(timer);
    }
  }, [component.id, filteredData.length, isStreaming, component.seriesData?.length]);

  const settings = componentSettings[component.id] || { 
    legendVisible: true, 
    tooltipFormat: 'formatted',
    trendlineVisible: false,
    highlightAnomalies: false
  };
  const legendVisible = settings.legendVisible !== false;
  const tooltipFormat = settings.tooltipFormat || 'formatted';
  const trendlineVisible = !!settings.trendlineVisible;
  const highlightAnomalies = !!settings.highlightAnomalies;

  // Fallback to seriesData if filteredData is empty (or use full data by fallback)
  const data = filteredData.length > 0 ? filteredData : (component.seriesData || []);

  // State to control settings dropdown menu
  const [showMenu, setShowMenu] = React.useState(false);

  // Auto detect geo fields in the data
  const hasGeoFields = React.useMemo(() => {
    if (!data || data.length === 0) return false;
    const keys = Object.keys(data[0]);
    return keys.some(k => 
      ['state', 'nation', 'country', 'region', 'geography', 'prov', 'city', 'location', 'iso'].includes(k.toLowerCase())
    );
  }, [data]);

  const [showGeographicMap, setShowGeographicMap] = React.useState(type === 'map_chart' || type === 'geo_map' || hasGeoFields);

  React.useEffect(() => {
    if (type === 'map_chart' || type === 'geo_map' || hasGeoFields) {
      setShowGeographicMap(true);
    }
  }, [type, hasGeoFields]);
  const xAxisKey = config.xAxisKey || 'date';
  const formatXAxisTick = React.useCallback((val: any) => {
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
    return typeof val === 'string' && val.length > 12 ? `${val.substring(0, 10)}...` : String(val);
  }, []);
  const yAxisKeys = config.yAxisKeys && config.yAxisKeys.length > 0 ? config.yAxisKeys : ['value'];

  // Calculate standard deviation statistics for anomaly detection
  const seriesStats = React.useMemo(() => {
    const stats: Record<string, { mean: number; stdDev: number }> = {};
    if (!data || data.length === 0) return stats;

    yAxisKeys.forEach((key) => {
      const values = data
        .map(row => Number(row[key]))
        .filter(val => !isNaN(val));

      const count = values.length;
      if (count === 0) return;

      const sum = values.reduce((a, b) => a + b, 0);
      const mean = sum / count;

      const sumSquares = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0);
      const variance = sumSquares / count;
      const stdDev = Math.sqrt(variance);

      stats[key] = { mean, stdDev };
    });

    return stats;
  }, [data, yAxisKeys]);

  // Calculate linear trendlines (y = mx + c)
  const dataWithTrend = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    if (!trendlineVisible) return data;

    const n = data.length;
    // Copy data rows
    const result = data.map(row => ({ ...row }));

    yAxisKeys.forEach((key) => {
      const xValues: number[] = [];
      const yValues: number[] = [];
      for (let i = 0; i < n; i++) {
        const val = Number(data[i][key]);
        if (!isNaN(val)) {
          xValues.push(i);
          yValues.push(val);
        }
      }

      const count = xValues.length;
      if (count < 2) return;

      let sumX = 0;
      let sumY = 0;
      let sumXY = 0;
      let sumX2 = 0;
      for (let j = 0; j < count; j++) {
        const x = xValues[j];
        const y = yValues[j];
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      }

      const denominator = count * sumX2 - sumX * sumX;
      let m = 0;
      let c = 0;
      if (denominator !== 0) {
        m = (count * sumXY - sumX * sumY) / denominator;
        c = (sumY - m * sumX) / count;
      } else {
        c = sumY / count;
      }

      for (let i = 0; i < n; i++) {
        result[i][`${key}_trend`] = Number((m * i + c).toFixed(2));
      }
    });

    return result;
  }, [data, yAxisKeys, trendlineVisible]);

  const renderCustomDot = (key: string, baseColor?: string) => (props: any) => {
    const { cx, cy, value } = props;
    if (!highlightAnomalies) {
      return <circle cx={cx} cy={cy} r={3} fill={baseColor || props.stroke} stroke="white" strokeWidth={1} />;
    }
    const stats = seriesStats[key];
    if (stats) {
      const val = Number(value);
      const { mean, stdDev } = stats;
      const isAnomaly = stdDev > 0 && Math.abs(val - mean) > 1.5 * stdDev;
      if (isAnomaly) {
        return (
          <g key={`anon-${key}-${cx}-${cy}`}>
            <circle cx={cx} cy={cy} r={9} fill="#ef4444" opacity={0.3.toString()} className="animate-pulse" style={{ transformOrigin: `${cx}px ${cy}px` }} />
            <circle cx={cx} cy={cy} r={5} fill="#ef4444" stroke="white" strokeWidth={1.5} />
          </g>
        );
      }
    }
    return <circle cx={cx} cy={cy} r={3} fill={props.stroke} stroke="white" strokeWidth={1} />;
  };

  const handleDownloadCSV = () => {
    if (!data || data.length === 0) return;
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${component.title || 'chart'}_dataset.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Decide what colors to use (configured overrides or fallback palettes)
  const paletteMap: Record<string, string[]> = {
    professional: ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#ef4444'],
    vibrant: ['#FF2A7A', '#1d4ed8', '#10b981', '#f97316', '#a855f7', '#06b6d4', '#14b8a6'],
    'high-contrast': ['#ef4444', '#3b82f6', '#eab308', '#22c55e', '#a855f7', '#ec4899', '#06b6d4'],
    warm: ['#ea580c', '#ca8a04', '#16a34a', '#db2777', '#84cc16', '#4f46e5', '#d97706'],
  };

  const selectedPaletteColors = paletteMap[colorPalette || 'professional'] || DEFAULT_COLORS;
  const colors = config.colors && config.colors.length > 0 ? config.colors : selectedPaletteColors;
  
  const getSeriesColor = (key: string, index: number) => {
    if (config.seriesColors && config.seriesColors[key]) {
      return config.seriesColors[key];
    }
    return colors[index % colors.length];
  };

  const renderChartContent = () => {
    switch (type) {
      case 'bar_chart':
        return (
          <div className={`${isFullscreen ? 'flex-1 h-[65vh] sm:h-[75vh]' : 'h-64 sm:h-72'} w-full mt-4`}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataWithTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.1)" />
                <XAxis 
                  dataKey={xAxisKey} 
                  stroke="#888888" 
                  fontSize={10}
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tickFormatter={formatXAxisTick}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={10}
                  tickLine={false} 
                  axisLine={false}
                  dx={-5}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : (val >= 1000 ? `${(val/1000).toFixed(0)}K` : val)}
                />
                <Tooltip content={<CustomTooltip format={tooltipFormat} />} />
                {legendVisible && yAxisKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 10, marginTop: 10 }} />}
                {yAxisKeys.map((key, i) => (
                  <Bar
                    key={key}
                    dataKey={key}
                    fill={getSeriesColor(key, i)}
                    radius={[4, 4, 0, 0]}
                    stackId={config.stacked ? 'stack' : undefined}
                    animationDuration={600}
                  >
                    {data.map((entry, index) => {
                      const val = Number(entry[key]);
                      const stats = seriesStats[key];
                      const isAnomaly = stats && stats.stdDev > 0 && Math.abs(val - stats.mean) > 1.5 * stats.stdDev;
                      const baseColor = getSeriesColor(key, i);
                      const barColor = highlightAnomalies && isAnomaly ? '#ef4444' : baseColor;
                      return <Cell key={`cell-${index}`} fill={barColor} />;
                    })}
                  </Bar>
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );

      case 'line_chart':
        return (
          <div className={`${isFullscreen ? 'flex-1 h-[65vh] sm:h-[75vh]' : 'h-64 sm:h-72'} w-full mt-4`}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dataWithTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.1)" />
                <XAxis 
                  dataKey={xAxisKey} 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tickFormatter={formatXAxisTick}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-5}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : (val >= 1000 ? `${(val/1000).toFixed(0)}K` : val)}
                />
                <Tooltip content={<CustomTooltip format={tooltipFormat} />} />
                {legendVisible && <Legend wrapperStyle={{ fontSize: 10, marginTop: 10 }} />}
                {yAxisKeys.map((key, i) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={getSeriesColor(key, i)}
                    strokeWidth={2}
                    dot={renderCustomDot(key, getSeriesColor(key, i))}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    animationDuration={600}
                    name={key}
                  />
                ))}
                {trendlineVisible && yAxisKeys.map((key, i) => (
                  <Line
                    key={`${key}_trend`}
                    type="monotone"
                    dataKey={`${key}_trend`}
                    stroke={getSeriesColor(key, i)}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    name={`${key} (Trendline)`}
                    animationDuration={400}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'area_chart':
        return (
          <div className={`${isFullscreen ? 'flex-1 h-[65vh] sm:h-[75vh]' : 'h-64 sm:h-72'} w-full mt-4`}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dataWithTrend} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  {yAxisKeys.map((key, i) => (
                    <linearGradient key={key} id={`${gradientId}_${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={getSeriesColor(key, i)} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={getSeriesColor(key, i)} stopOpacity={0.01} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(120, 120, 120, 0.1)" />
                <XAxis 
                  dataKey={xAxisKey} 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  tickFormatter={formatXAxisTick}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-5}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : (val >= 1000 ? `${(val/1000).toFixed(0)}K` : val)}
                />
                <Tooltip content={<CustomTooltip format={tooltipFormat} />} />
                {legendVisible && <Legend wrapperStyle={{ fontSize: 10, marginTop: 10 }} />}
                {yAxisKeys.map((key, i) => (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={getSeriesColor(key, i)}
                    fill={`url(#${gradientId}_${key})`}
                    strokeWidth={2}
                    stackId={config.stacked ? '1' : undefined}
                    dot={renderCustomDot(key, getSeriesColor(key, i))}
                    animationDuration={600}
                    name={key}
                  />
                ))}
                {trendlineVisible && yAxisKeys.map((key, i) => (
                  <Line
                    key={`${key}_trend`}
                    type="monotone"
                    dataKey={`${key}_trend`}
                    stroke={getSeriesColor(key, i)}
                    strokeWidth={1.5}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={false}
                    name={`${key} (Trendline)`}
                    animationDuration={400}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        );

      case 'pie_chart':
        const pieValueKey = yAxisKeys[0] || 'value';
        return (
          <div className={`${isFullscreen ? 'flex-1 h-[65vh] sm:h-[75vh]' : 'h-64 sm:h-72'} w-full mt-4 flex items-center justify-center`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={3}
                  dataKey={pieValueKey}
                  nameKey={xAxisKey}
                  animationDuration={600}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip format={tooltipFormat} />} />
                {legendVisible && <Legend layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: 9, bottom: 0 }} />}
              </PieChart>
            </ResponsiveContainer>
          </div>
        );

      case 'scatter_chart': {
        const scatterX = xAxisKey;
        const scatterY = yAxisKeys[0] || 'value';

        // Check if the X values are mostly numeric
        const numericXValues = data.map(item => {
          const raw = item[scatterX];
          if (raw === undefined || raw === null || raw === '') return null;
          const cleanStr = String(raw).replace(/[\$,₹,%, ]/g, '').trim();
          const parsed = Number(cleanStr);
          return isNaN(parsed) ? null : parsed;
        });

        const validNumericCount = numericXValues.filter(v => v !== null).length;
        const isXNumeric = data.length > 0 && (validNumericCount >= data.length * 0.7);

        // Map data specifically for the scatter chart, converting X and Y values to clean numbers if numeric
        const scatterData = data.map((item, index) => {
          const rawX = item[scatterX];
          const rawY = item[scatterY];
          
          let cleanX = rawX;
          if (isXNumeric) {
            const cleanStr = String(rawX).replace(/[\$,₹,%, ]/g, '').trim();
            const parsed = Number(cleanStr);
            cleanX = isNaN(parsed) ? 0 : parsed;
          }

          let cleanY = rawY;
          if (typeof rawY !== 'number') {
            const cleanStr = String(rawY).replace(/[\$,₹,%, ]/g, '').trim();
            const parsed = Number(cleanStr);
            cleanY = isNaN(parsed) ? 0 : parsed;
          }

          return {
            ...item,
            [scatterX]: cleanX,
            [scatterY]: cleanY,
            originalX: rawX,
            originalY: rawY
          };
        });

        const finalXAxisType = isXNumeric ? "number" : "category";

        return (
          <div className={`${isFullscreen ? 'flex-1 h-[65vh] sm:h-[75vh]' : 'h-64 sm:h-72'} w-full mt-4`}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 5, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(120, 120, 120, 0.1)" />
                <XAxis 
                  dataKey={scatterX} 
                  type={finalXAxisType} 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  dy={10}
                  domain={isXNumeric ? ['auto', 'auto'] : undefined}
                  tickFormatter={(val) => {
                    if (isXNumeric && typeof val === 'number') {
                      if (val >= 1000000) return `$${(val/1000000).toFixed(1)}M`;
                      if (val >= 1000) return `$${(val/1000).toFixed(0)}K`;
                      return `$${val}`;
                    }
                    return formatXAxisTick(val);
                  }}
                />
                <YAxis 
                  dataKey={scatterY} 
                  type="number" 
                  stroke="#888888" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false}
                  dx={-5}
                  tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : (val >= 1000 ? `${(val/1000).toFixed(0)}K` : val)}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const p = payload[0]?.payload;
                      // Display the Product Name or details if available in item keys besides X and Y
                      const nameKey = Object.keys(p).find(k => k.toLowerCase().includes('name') || k.toLowerCase().includes('item') || k.toLowerCase().includes('title') || k.toLowerCase().includes('category'));
                      const nameVal = nameKey ? p[nameKey] : '';
                      return (
                        <div className="p-3 bg-white border border-slate-200 dark:bg-zinc-950 dark:border-zinc-800 rounded-lg shadow-xl font-mono text-[10px]">
                          {nameVal && <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-100 mb-1.5 font-sans leading-tight border-b border-slate-100 dark:border-zinc-900 pb-1">{String(nameVal)}</p>}
                          <p className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
                            {scatterX}: <span className="text-slate-800 dark:text-zinc-250 font-bold">{isXNumeric ? `$${Number(p[scatterX]).toLocaleString()}` : String(p.originalX || p[scatterX])}</span>
                          </p>
                          <p className="text-rose-500 font-semibold flex items-center gap-1">
                            {scatterY}: <span className="text-slate-800 dark:text-zinc-250 font-bold">{Number(p[scatterY]).toLocaleString()}</span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name={title} data={scatterData} fill={colors[0]} animationDuration={600} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        );
      }

      default:
        return null;
    }
  };

  const renderKPI = () => {
    const trend = config.kpiTrend;
    const value = config.kpiValue || (data.length > 0 && typeof data[data.length - 1][yAxisKeys[0]] !== 'undefined' 
      ? data[data.length - 1][yAxisKeys[0]].toLocaleString()
      : '0');

    return (
      <div className="flex flex-col h-full justify-between">
        <div className="space-y-1">
          <span className="text-xs font-semibold tracking-wider uppercase text-slate-400 dark:text-zinc-500 font-mono">
            Key Metric
          </span>
          <h3 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-zinc-50 font-sans mt-0.5">
            {value}
          </h3>
        </div>
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-2.5">
            <span className={`inline-flex items-center gap-0.5 rounded px-2 py-0.5 text-[10px] font-bold border ${
              trend.direction === 'up' 
                ? 'bg-green-50 text-green-600 border-green-100 dark:bg-zinc-900 dark:text-green-400 dark:border-zinc-800'
                : trend.direction === 'down'
                ? 'bg-rose-50 text-rose-600 border-rose-105 dark:bg-zinc-900 dark:text-rose-450 dark:border-zinc-800'
                : 'bg-slate-50 text-slate-600 border-slate-100 dark:bg-zinc-900/40 dark:text-zinc-400 dark:border-zinc-800'
            }`}>
              {trend.direction === 'up' && <ArrowUpRight className="h-3 w-3 mr-0.5 shrink-0" />}
              {trend.direction === 'down' && <ArrowDownRight className="h-3 w-3 mr-0.5 shrink-0" />}
              {trend.direction === 'neutral' && <Activity className="h-3 w-3 mr-0.5 shrink-0" />}
              {trend.label}
            </span>
            <span className="text-xs text-slate-400 dark:text-zinc-500">since last period</span>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    const isLoading = isInitializing || isFetching || (isStreaming && (!component.seriesData || component.seriesData.length === 0));
    
    return (
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="w-full flex-1 flex flex-col justify-end min-h-[inherit]"
          >
            <Skeleton type={type} showGeographicMap={showGeographicMap} />
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full flex-1 flex flex-col justify-end min-h-[inherit]"
          >
            {type === 'kpi_card' ? (
              renderKPI()
            ) : data.length === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center rounded-xl bg-zinc-50/50 dark:bg-zinc-900/10 border border-dashed border-zinc-200 dark:border-zinc-800">
                <p className="text-xs font-mono text-zinc-400 dark:text-zinc-500">No matching filtered data to plot</p>
              </div>
            ) : type === 'map_chart' || type === 'geo_map' || showGeographicMap ? (
              <div className="w-full mt-2 flex-1">
                <GeographyMap 
                  data={component.seriesData || []}
                  filteredData={data}
                  selectedCategories={Object.values(filterState?.selectedCategories || {}).flat()}
                  xAxisKey={xAxisKey}
                  valueKey={yAxisKeys[0]}
                  title={title}
                  onDrillDown={onDrillDown}
                />
              </div>
            ) : (
              renderChartContent()
            )}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div 
      className={`chart-container-card flex flex-col h-full rounded-2xl bg-white border border-slate-200 p-6 shadow-sm dark:bg-zinc-950 dark:border-zinc-800 hover:shadow-md transition-all duration-300 relative group ${isFullscreen ? 'min-h-[85vh] w-full p-8 md:p-10' : type === 'kpi_card' ? 'min-h-[160px]' : 'min-h-[300px]'}`}
      id={`comp_${component.id}`}
    >
      <div className="mb-3">
        <div className="flex items-start justify-between gap-1.5 flex-wrap">
          <h3 className="font-semibold text-slate-800 dark:text-zinc-100 text-sm tracking-tight flex-1 min-w-[120px]">
            {title}
          </h3>
          <div className="flex items-center gap-1.5 h-6">
            <div 
              data-html2canvas-ignore 
              className={`${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity flex items-center gap-0.5 bg-slate-100/80 hover:bg-slate-100 dark:bg-zinc-900/80 dark:hover:bg-zinc-900 px-1 rounded border border-slate-200/50 dark:border-zinc-800`}
            >
              {hasGeoFields && (
                <button
                  onClick={() => setShowGeographicMap(prev => !prev)}
                  className={`p-1 transition-all cursor-pointer rounded ${showGeographicMap ? 'text-indigo-600 dark:text-indigo-400 bg-slate-200/60 dark:bg-zinc-800/80' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                  title={showGeographicMap ? "View original chart" : "View as Geographic Map"}
                >
                  <Globe className="h-3 w-3" />
                </button>
              )}
              {onEditComponent && (
                <button
                  onClick={() => onEditComponent(component)}
                  className="p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                  title="Edit component properties"
                >
                  <Edit className="h-3 w-3" />
                </button>
              )}
              {onDeleteComponent && (
                <button
                  onClick={() => onDeleteComponent(component.id)}
                  className="p-1 text-slate-400 hover:text-rose-500 transition-all cursor-pointer"
                  title="Delete component"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
              
              {/* Settings / Options Dropdown Menu trigger */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className={`p-1 transition-all cursor-pointer rounded ${showMenu ? 'text-indigo-600 bg-slate-200/50 dark:text-indigo-400 dark:bg-zinc-800/80' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                  title="Options & settings"
                >
                  <Settings className="h-3 w-3" />
                </button>

                {showMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={(e) => { e.stopPropagation(); setShowMenu(false); }} 
                    />
                    <div className="absolute right-0 mt-1.5 w-56 z-50 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 font-sans normal-case text-left">
                      <div className="px-2 py-1.5 border-b border-slate-100 dark:border-zinc-900 mb-1">
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">Chart Options</p>
                      </div>

                      {/* Legend Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateComponentSettings(component.id, { legendVisible: !legendVisible });
                        }}
                        className="w-full flex items-center justify-between text-left px-2 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-1.5">
                          {legendVisible ? <Eye className="h-3.5 w-3.5 text-indigo-500" /> : <EyeOff className="h-3.5 w-3.5 text-slate-400" />}
                          <span>Show Legend</span>
                        </span>
                        <span className={`h-2 w-2 rounded-full ${legendVisible ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      </button>

                      {/* Trendline Toggle (only for line & area charts) */}
                      {['line_chart', 'area_chart'].includes(type) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateComponentSettings(component.id, { trendlineVisible: !trendlineVisible });
                          }}
                          className="w-full flex items-center justify-between text-left px-2 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 font-sans">
                            <TrendingUp className="h-3.5 w-3.5 text-indigo-505" />
                            <span>Linear Trendline</span>
                          </span>
                          <span className={`h-2 w-2 rounded-full ${trendlineVisible ? 'bg-indigo-500' : 'bg-slate-300'}`} />
                        </button>
                      )}

                      {/* Highlight Anomalies Toggle (for line, area, and bar charts) */}
                      {['line_chart', 'area_chart', 'bar_chart'].includes(type) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateComponentSettings(component.id, { highlightAnomalies: !highlightAnomalies });
                          }}
                          className="w-full flex items-center justify-between text-left px-2 py-1.5 text-xs font-semibold rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-700 dark:text-zinc-300 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 font-sans">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-500 font-bold" />
                            <span>Highlight Outliers</span>
                          </span>
                          <span className={`h-2 w-2 rounded-full ${highlightAnomalies ? 'bg-rose-500' : 'bg-slate-300'}`} />
                        </button>
                      )}

                      <div className="px-2 py-1.5">
                        <p className="text-[8px] font-bold uppercase tracking-wide text-slate-400 dark:text-zinc-500 font-mono mb-1">Tooltip Format</p>
                        <div className="grid grid-cols-3 gap-1 bg-slate-50 dark:bg-zinc-900 p-0.5 rounded-lg border border-slate-100 dark:border-zinc-900/40">
                          {(['formatted', 'raw', 'percentage'] as const).map((fmt) => (
                            <button
                              key={fmt}
                              onClick={(e) => {
                                e.stopPropagation();
                                updateComponentSettings(component.id, { tooltipFormat: fmt });
                              }}
                              className={`px-1 py-1 text-[9px] font-semibold rounded-md capitalize transition-all cursor-pointer ${
                                tooltipFormat === fmt 
                                  ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-xs border border-slate-200/50 dark:border-zinc-700/60' 
                                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-zinc-200'
                              }`}
                            >
                              {fmt}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="h-px bg-slate-101 dark:bg-zinc-900 my-1" />

                      {/* Download CSV */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadCSV();
                          setShowMenu(false);
                        }}
                        className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-400" />
                        <span>Download CSV</span>
                      </button>

                      {/* Fullscreen Toggle */}
                      {onToggleFullscreen && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFullscreen(component.id);
                            setShowMenu(false);
                          }}
                          className="w-full flex items-center gap-2 text-left px-2 py-1.5 text-xs font-medium text-slate-700 dark:text-zinc-300 rounded-lg hover:bg-slate-50 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
                        >
                          {isFullscreen ? (
                            <>
                              <Minimize2 className="h-3.5 w-3.5 text-slate-400" />
                              <span>Exit Fullscreen</span>
                            </>
                          ) : (
                            <>
                              <Maximize2 className="h-3.5 w-3.5 text-slate-400" />
                              <span>Deep Analysis</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Quick access Fullscreen button always present on hover */}
            {onToggleFullscreen && (
              <button
                data-html2canvas-ignore
                onClick={() => onToggleFullscreen(component.id)}
                className="opacity-0 group-hover:opacity-100 transition-all p-1 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer"
                title={isFullscreen ? "Minimize view" : "Deep Analysis (Fullscreen)"}
              >
                {isFullscreen ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
              </button>
            )}

            <span className="opacity-0 group-hover:opacity-100 transition-all text-[9px] font-bold font-mono text-slate-400 select-none bg-slate-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-800 shrink-0">
              {type.replace('_', ' ')}
            </span>
          </div>
        </div>
        {description && (
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      
      <div className="flex-1 flex flex-col justify-end">
        {renderContent()}
      </div>
    </div>
  );
};
