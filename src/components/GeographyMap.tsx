import React, { useState, useMemo, useEffect } from 'react';
import { Globe, ZoomIn, ZoomOut, RefreshCw, Layers, AlertCircle, Palette } from 'lucide-react';
import { ComposableMap, Geographies, Geography, ZoomableGroup, Marker } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { geoCentroid } from 'd3-geo';
import { motion } from 'motion/react';
import { normalizeToPrimaryName } from '../utils/dataNormalization';

interface GeographyMapProps {
  data: Record<string, any>[];
  filteredData: Record<string, any>[];
  selectedCategories?: string[];
  xAxisKey?: string;
  valueKey?: string;
  title: string;
  onDrillDown?: (key: string, val: string) => void;
}

const geoUrlWorld = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const geoUrlIndia = "https://raw.githubusercontent.com/deldersveld/topojson/master/countries/india/india-states.json";

export const GeographyMap: React.FC<GeographyMapProps> = ({ 
  data, 
  filteredData, 
  selectedCategories, 
  xAxisKey, 
  valueKey, 
  title, 
  onDrillDown 
}) => {
  const [mapType, setMapType] = useState<'india' | 'world'>('world');
  const [colorScheme, setColorScheme] = useState<'indigo' | 'emerald' | 'violet'>('indigo');
  const [hoveredItem, setHoveredItem] = useState<{ name: string; val: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState<[number, number]>([0, 20]);
  
  // CDN Pre-fetching & Graceful Error Handling
  const [geoData, setGeoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const geoAnalysis = useMemo(() => {
    let bestKey = xAxisKey || '';
    let bestValKey = valueKey || '';

    if (!bestKey && data && data.length > 0) {
      const keys = Object.keys(data[0]);
      bestKey = keys.find(k => ['state', 'nation', 'country', 'region', 'iso'].includes(k.toLowerCase())) || keys[0] || 'id';
      bestValKey = keys.find(k => k !== bestKey && typeof data[0][k] === 'number') || keys[1] || 'value';
    }

    if (!bestKey) bestKey = 'state';
    if (!bestValKey) bestValKey = 'value';

    let maxValue = 0;
    const mappedValues: Record<string, number> = {};
    let indiaCount = 0;

    data.forEach(item => {
      // Normalize country names uploaded or generated
      const k = normalizeToPrimaryName(String(item[bestKey] || ''));
      const v = Number(item[bestValKey] || 0);
      if (k) {
        mappedValues[k.toUpperCase()] = (mappedValues[k.toUpperCase()] || 0) + v;
        if (mappedValues[k.toUpperCase()] > maxValue) {
          maxValue = mappedValues[k.toUpperCase()];
        }
      }
      
      const kUpper = k.toUpperCase();
      if (['MAHARASHTRA', 'GUJARAT', 'DELHI', 'KERALA', 'PUNJAB', 'TAMIL NADU', 'KARNATAKA', 'INDIA', 'IND'].includes(kUpper)) {
        indiaCount++;
      }
    });

    const autoType: 'india' | 'world' = indiaCount >= data.length * 0.2 && data.length > 0 ? 'india' : 'world';

    return { bestKey, bestValKey, mappedValues, maxValue, autoType };
  }, [data, xAxisKey, valueKey]);

  useEffect(() => {
    setMapType(geoAnalysis.autoType);
    if (geoAnalysis.autoType === 'world') {
      setCenter([0, 20]);
      setZoom(1);
    } else {
      setCenter([82, 22]);
      setZoom(3);
    }
  }, [geoAnalysis.autoType]);

  // Fetch geographic topologies
  useEffect(() => {
    let active = true;
    setLoading(true);
    setFetchError(null);
    const url = mapType === 'india' ? geoUrlIndia : geoUrlWorld;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error("Could not retrieve maps from regional CDN");
        return res.json();
      })
      .then(json => {
        if (active) {
          setGeoData(json);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error("Map fetch failed:", err);
        if (active) {
          setFetchError("CDN Error: Map topologies could not load at this moment. Toggle regional modes to retry.");
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [mapType]);

  const colorScaleConfig = {
    indigo: ["#eef2ff", "#4f46e5"],   // Indigo-50 to Indigo-600
    emerald: ["#ecfdf5", "#059669"],  // Emerald-50 to Emerald-600
    violet: ["#f5f3ff", "#7c3aed"]    // Violet-50 to Violet-600
  };

  const colorScale = useMemo(() => {
    return scaleLinear<string>()
      .domain([0, geoAnalysis.maxValue || 1])
      .range(colorScaleConfig[colorScheme]);
  }, [geoAnalysis.maxValue, colorScheme]);

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-zinc-900/40 p-4 rounded-xl shadow-md border border-slate-100 dark:border-zinc-800 backdrop-blur-sm overflow-hidden min-h-[380px]">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3 mb-3 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="h-5 w-5 text-indigo-500 shrink-0 animate-pulse" />
          <div className="min-w-0">
            <span className="block text-sm font-semibold text-slate-800 dark:text-zinc-100 truncate">
              {title}
            </span>
            <span className="block text-[10px] text-slate-400 dark:text-zinc-500 font-mono truncate">
              Field: {geoAnalysis.bestValKey}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Theme Palette controls (previously simple buttons) */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-800/80 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700/60 shadow-inner">
            <button 
              onClick={() => setColorScheme('indigo')}
              className={`p-1.5 rounded-md transition-all ${colorScheme === 'indigo' ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350'}`}
              title="Indigo Theme"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 block"></span>
            </button>
            <button 
              onClick={() => setColorScheme('emerald')}
              className={`p-1.5 rounded-md transition-all ${colorScheme === 'emerald' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350'}`}
              title="Emerald Theme"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 block"></span>
            </button>
            <button 
              onClick={() => setColorScheme('violet')}
              className={`p-1.5 rounded-md transition-all ${colorScheme === 'violet' ? 'bg-white dark:bg-zinc-700 text-violet-600 dark:text-violet-400 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350'}`}
              title="Violet Theme"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600 block"></span>
            </button>
          </div>

          <div className="h-5 w-px bg-slate-200 dark:bg-zinc-800"></div>

          {/* Map Type toggle switcher */}
          <div className="flex bg-slate-50 dark:bg-zinc-805 p-0.5 rounded-lg border border-slate-200 dark:border-zinc-700/60 shadow-inner">
            <button
              onClick={() => { setMapType('india'); setCenter([82, 22]); setZoom(3); }}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${
                mapType === 'india'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200'
              }`}
            >
              India
            </button>
            <button
              onClick={() => { setMapType('world'); setCenter([0, 20]); setZoom(1); }}
              className={`px-3 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all cursor-pointer ${
                mapType === 'world'
                  ? 'bg-white dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-slate-400 dark:text-zinc-400 hover:text-slate-600 dark:hover:text-zinc-200'
              }`}
            >
              World
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-50/40 dark:bg-zinc-950/20 rounded-xl relative overflow-hidden group border border-slate-100/50 dark:border-zinc-900 border-dashed min-h-[280px]">
        {/* Hover info panel */}
        {hoveredItem && (
          <div className="absolute top-3 left-3 z-10 bg-white/95 dark:bg-zinc-900/95 border border-slate-200 dark:border-zinc-800 p-2.5 rounded-lg shadow-xl pointer-events-none backdrop-blur-sm transition-all animate-in fade-in zoom-in-95 duration-100">
            <p className="font-bold text-xs text-slate-800 dark:text-zinc-150">{hoveredItem.name}</p>
            <p className="font-mono text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
              {geoAnalysis.bestValKey}: {hoveredItem.val.toLocaleString()}
            </p>
          </div>
        )}

        {/* Floating map tools (Zoom & Pan & Reset) */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 inline-flex bg-white/90 dark:bg-zinc-900/90 p-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-md backdrop-blur-sm transition-all focus-within:opacity-100">
          <button 
            onClick={() => setZoom(z => Math.min(z * 1.5, 8))}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <div className="w-full h-px bg-slate-100 dark:bg-zinc-800"></div>
          <button 
            onClick={() => setZoom(z => Math.max(z / 1.5, 1))}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <div className="w-full h-px bg-slate-100 dark:bg-zinc-800"></div>
          <button 
            onClick={() => {
              setZoom(1);
              setCenter(mapType === 'world' ? [0, 20] : [82, 22]);
              if (mapType === 'india') setZoom(3);
            }}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            title="Reset Zoom & Pan"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="absolute inset-0 bg-slate-100/50 dark:bg-zinc-950/40 backdrop-blur-xs flex flex-col items-center justify-center gap-2.5 z-25">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin"></div>
            <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-zinc-400">
              Syncing Regional Geometries...
            </span>
          </div>
        )}

        {/* Failed CDN Topologies Recovery */}
        {fetchError && !loading && (
          <div className="absolute inset-0 bg-red-50/70 dark:bg-red-950/30 flex flex-col items-center justify-center p-6 text-center gap-3 z-25">
            <AlertCircle className="w-8 h-8 text-red-500" />
            <div className="max-w-md">
              <h4 className="text-xs font-bold text-red-800 dark:text-red-400">Map Rendering Failed</h4>
              <p className="text-[10px] text-red-500 mt-1">{fetchError}</p>
            </div>
            <button 
              onClick={() => {
                setLoading(true);
                // Force a state refresh to re-execute effect
                setMapType(prev => prev === 'world' ? 'india' : 'world');
              }}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-semibold transition"
            >
              Re-evaluate Geographies
            </button>
          </div>
        )}

        {!fetchError && !loading && geoData && (
          <ComposableMap
            projection="geoMercator"
            projectionConfig={mapType === "world" ? { scale: 120 } : { center: [82, 22], scale: 800 }}
            className="w-full h-full outline-none"
          >
            <ZoomableGroup zoom={zoom} center={center} onMoveEnd={({ coordinates, zoom }) => {
              setCenter(coordinates as [number, number]);
              setZoom(zoom);
            }}>
              <Geographies geography={geoData}>
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const placeName = geo.properties.name || "";
                    const normalizedPlacePrimary = normalizeToPrimaryName(placeName);

                    // Fuzzy matches with accurate dictionary normalization!
                    const valueMatch = Object.keys(geoAnalysis.mappedValues).find(
                      k => {
                        const uk = k.toUpperCase().trim();
                        if (normalizedPlacePrimary.toUpperCase().trim() === uk) return true;
                        if (geo.id?.toUpperCase() === uk) return true;
                        if (geo.properties.iso_a3?.toUpperCase() === uk) return true;
                        if (geo.properties.iso_a2?.toUpperCase() === uk) return true;
                        return false;
                      }
                    );

                    const val = valueMatch ? geoAnalysis.mappedValues[valueMatch] : 0;
                    const normalizedSelected = selectedCategories?.map(c => normalizeToPrimaryName(c).toUpperCase()) || [];
                    const isSelected = valueMatch ? normalizedSelected.includes(valueMatch) : normalizedSelected.includes(normalizedPlacePrimary.toUpperCase());
                    const hasSelection = normalizedSelected.length > 0;
                    
                    const fillColor = hasSelection
                      ? (isSelected ? (colorScheme === 'emerald' ? '#059669' : colorScheme === 'violet' ? '#7c3aed' : '#4f46e5') : '#e2e8f0 dark:#27272a') 
                      : (val > 0 ? colorScale(val) : "#f8fafc dark:#18181b");

                    return (
                      <motion.path
                        key={geo.rsmKey}
                        d={geo.svgPath}
                        fill={fillColor}
                        initial={false}
                        animate={{ fill: fillColor }}
                        transition={{ duration: 0.4 }}
                        onMouseEnter={() => {
                          setHoveredItem({ name: placeName || (valueMatch || ''), val });
                        }}
                        onMouseLeave={() => setHoveredItem(null)}
                        onClick={() => {
                          const drillEntity = normalizedPlacePrimary || placeName || valueMatch;
                          if (onDrillDown && drillEntity) {
                            onDrillDown(geoAnalysis.bestKey, drillEntity);
                            try {
                              const centroid = geoCentroid(geo as any);
                              if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
                                setCenter(centroid);
                                setZoom(4);
                              }
                            } catch (e) {
                              console.warn("Could not compute centroid projection zoom:", e);
                            }
                          }
                        }}
                        style={{ outline: "none", cursor: 'pointer', stroke: "#cbd5e1", strokeWidth: 0.3 }}
                        whileHover={{ stroke: "#ffffff", strokeWidth: 0.8, fill: isSelected ? "#ef4444" : (colorScheme === 'emerald' ? '#10b981' : colorScheme === 'violet' ? '#8b5cf6' : '#6366f1') }}
                      />
                    );
                  })
                }
              </Geographies>

              {data.filter(d => d.latitude && d.longitude && !isNaN(Number(d.latitude)) && !isNaN(Number(d.longitude))).map((d, i) => (
                <Marker key={i} coordinates={[Number(d.longitude), Number(d.latitude)]}>
                  <circle r={4} fill="#f43f5e" stroke="#fff" strokeWidth={1.5} />
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        )}
        
        {/* Legend */}
        {!fetchError && !loading && (
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-zinc-900/95 p-2 rounded-lg border border-slate-200 dark:border-zinc-800 shadow-sm pointer-events-none backdrop-blur-sm">
            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 mb-1 uppercase tracking-wider">Range</p>
            <div className="flex items-center gap-2">
              <div className={`h-2.5 w-16 rounded bg-gradient-to-r ${
                colorScheme === 'emerald' ? 'from-emerald-50 to-emerald-600' : colorScheme === 'violet' ? 'from-violet-50 to-violet-600' : 'from-indigo-50 to-indigo-600'
              }`}></div>
              <div className="flex flex-col text-[8px] font-mono font-bold text-slate-500 dark:text-zinc-400">
                <span>{geoAnalysis.maxValue.toLocaleString()}</span>
                <span>0</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
