import React, { useEffect } from 'react';
import { SlidersHorizontal, Calendar, Tag, RotateCcw, Plus, Edit2, X } from 'lucide-react';
import { MasterDashboardPayload, DashboardFilter } from '../types';
import { ActiveFilterState, getDashboardDateRangeLimits, getDashboardCategoryOptions } from '../utils/filterEngine';
import { useAppStore } from '../store';

interface FiltersPanelProps {
  payload: MasterDashboardPayload;
  filterState: ActiveFilterState;
  onFilterStateChange: (state: ActiveFilterState) => void;
  onResetFilters: () => void;
  onAddFilter?: () => void;
  onEditFilter?: (filter: DashboardFilter) => void;
  onDeleteFilter?: (id: string) => void;
}

export const FiltersPanel: React.FC<FiltersPanelProps> = ({
  payload,
  filterState,
  onFilterStateChange,
  onResetFilters,
  onAddFilter,
  onEditFilter,
  onDeleteFilter,
}) => {
  const { filters } = payload;
  const attachedDataset = useAppStore((state) => state.attachedDataset);
  const rawRows = attachedDataset?.rows;

  // Initialize date range and category options on load
  useEffect(() => {
    let amendedStateStr = JSON.stringify(filterState);
    const nextState = { ...filterState };
    let stateChanged = false;

    filters.forEach((f) => {
      if (f.type === 'date_range' && !filterState.dateRange) {
        const limits = getDashboardDateRangeLimits(payload, f, rawRows);
        if (limits) {
          nextState.dateRange = { start: limits.min, end: limits.max };
          stateChanged = true;
        }
      }
      
      if (f.type === 'category_select' && !filterState.selectedCategories[f.id]) {
        nextState.selectedCategories[f.id] = [];
        stateChanged = true;
      }
    });

    if (stateChanged && JSON.stringify(nextState) !== amendedStateStr) {
      onFilterStateChange(nextState);
    }
  }, [payload, filters]);

  const handleDateChange = (type: 'start' | 'end', val: string) => {
    const targetFilter = filters.find(f => f.type === 'date_range');
    if (!targetFilter) return;

    const currentRange = filterState.dateRange || { start: '', end: '' };
    const nextRange = {
      ...currentRange,
      [type]: val
    };

    onFilterStateChange({
      ...filterState,
      dateRange: nextRange
    });
  };

  const handleToggleCategory = (filterId: string, option: string) => {
    const currentList = filterState.selectedCategories[filterId] || [];
    let nextList: string[];

    if (currentList.includes(option)) {
      nextList = currentList.filter(o => o !== option);
    } else {
      nextList = [...currentList, option];
    }

    onFilterStateChange({
      ...filterState,
      selectedCategories: {
        ...filterState.selectedCategories,
        [filterId]: nextList
      }
    });
  };

  return (
    <div className="no-print flex items-center justify-between flex-wrap gap-4 py-3 px-1 border-b border-slate-200/60 dark:border-zinc-800/60 select-none">
      <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
        <span className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 shrink-0 mr-1.5">
          <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
          <span>Filters:</span>
        </span>

        {filters.length === 0 ? (
          <span className="text-xs text-slate-400 dark:text-zinc-500 italic">
            No filters yet. Add a filter to narrow down your charts.
          </span>
        ) : (
          <div className="flex items-center gap-2 flex-wrap">
            {filters.map((filter, index) => {
              if (filter.type === 'date_range') {
                const limits = getDashboardDateRangeLimits(payload, filter, rawRows);
                const activeRange = filterState.dateRange || { start: limits?.min || '', end: limits?.max || '' };

                return (
                  <div
                    key={`${filter.id}-${index}`}
                    className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 rounded-full px-3 py-1 text-xs border border-slate-200/40 dark:border-zinc-800/40 transition-all group"
                  >
                    <Calendar className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-zinc-400 font-medium font-sans">{filter.label}:</span>
                    <input
                      type="date"
                      value={activeRange.start}
                      min={limits?.min}
                      max={limits?.max}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 dark:text-zinc-200 font-sans text-xs w-[110px] outline-none"
                    />
                    <span className="text-slate-300 dark:text-zinc-700">-</span>
                    <input
                      type="date"
                      value={activeRange.end}
                      min={limits?.min}
                      max={limits?.max}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                      className="bg-transparent border-none p-0 focus:ring-0 text-slate-700 dark:text-zinc-200 font-sans text-xs w-[110px] outline-none"
                    />
                    
                    <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200 dark:border-zinc-850 shrink-0">
                      {onEditFilter && (
                        <button
                          onClick={() => onEditFilter(filter)}
                          className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit filter"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                      {onDeleteFilter && (
                        <button
                          onClick={() => onDeleteFilter(filter.id)}
                          className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-405 hover:text-rose-500 transition-colors"
                          title="Remove filter"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              if (filter.type === 'category_select') {
                const options = getDashboardCategoryOptions(payload, filter, rawRows);
                const selectedOpts = filterState.selectedCategories[filter.id] || [];

                return (
                  <div
                    key={`${filter.id}-${index}`}
                    className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-zinc-900 rounded-full px-3 py-1 text-xs border border-slate-200/40 dark:border-zinc-800/40 transition-all group"
                  >
                    <Tag className="h-3 w-3 text-slate-400 shrink-0" />
                    <span className="text-slate-500 dark:text-zinc-400 font-medium font-sans">{filter.label}:</span>
                    
                    <select
                      value={selectedOpts[0] || 'all'}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === 'all') {
                          onFilterStateChange({
                            ...filterState,
                            selectedCategories: {
                              ...filterState.selectedCategories,
                              [filter.id]: []
                            }
                          });
                        } else {
                          onFilterStateChange({
                            ...filterState,
                            selectedCategories: {
                              ...filterState.selectedCategories,
                              [filter.id]: [val]
                            }
                          });
                        }
                      }}
                      className="bg-transparent border-none p-0 pr-4 focus:ring-0 cursor-pointer text-slate-700 dark:text-zinc-100 font-semibold outline-none text-xs text-sans"
                    >
                      <option value="all" className="bg-white text-slate-800 dark:bg-zinc-950 dark:text-zinc-200">All</option>
                      {options.map((opt) => (
                        <option key={opt} value={opt} className="bg-white text-slate-800 dark:bg-zinc-[#09090b] dark:text-zinc-200">{opt}</option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 ml-1 pl-1.5 border-l border-slate-200 dark:border-zinc-850 shrink-0">
                      {onEditFilter && (
                        <button
                          onClick={() => onEditFilter(filter)}
                          className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-400 hover:text-indigo-600 transition-colors"
                          title="Edit filter"
                        >
                          <Edit2 className="h-2.5 w-2.5" />
                        </button>
                      )}
                      {onDeleteFilter && (
                        <button
                          onClick={() => onDeleteFilter(filter.id)}
                          className="p-0.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded text-slate-405 hover:text-rose-500 transition-colors"
                          title="Remove filter"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              }

              return null;
            })}
          </div>
        )}
      </div>

      {/* Toolbox actions */}
      <div data-html2canvas-ignore className="flex items-center gap-1.5 shrink-0">
        {onAddFilter && (
          <button
            onClick={onAddFilter}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50/50 dark:text-indigo-400 dark:hover:bg-indigo-950/10 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-800/60"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add filter</span>
          </button>
        )}

        {filters.length > 0 && (
          <button
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-500 dark:text-zinc-400 dark:hover:text-rose-400 rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-200/60 dark:hover:border-zinc-800/60"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Clear all</span>
          </button>
        )}
      </div>
    </div>
  );
};
