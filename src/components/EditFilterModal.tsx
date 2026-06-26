import React, { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { DashboardFilter, FilterType } from '../types';

interface EditFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (filter: DashboardFilter) => void;
  filterToEdit?: DashboardFilter | null;
}

export const EditFilterModal: React.FC<EditFilterModalProps> = ({
  isOpen,
  onClose,
  onSave,
  filterToEdit,
}) => {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<FilterType>('category_select');
  const [targetKeysRaw, setTargetKeysRaw] = useState('');
  const [optionsRaw, setOptionsRaw] = useState('');

  useEffect(() => {
    if (filterToEdit) {
      setLabel(filterToEdit.label || '');
      setType(filterToEdit.type || 'category_select');
      setTargetKeysRaw(filterToEdit.targetKeys?.join(', ') || '');
      setOptionsRaw(filterToEdit.options?.join(', ') || '');
    } else {
      setLabel('Region');
      setType('category_select');
      setTargetKeysRaw('region');
      setOptionsRaw('Americas, EMEA, APAC');
    }
  }, [filterToEdit, isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const targetKeys = targetKeysRaw
      .split(',')
      .map(k => k.trim())
      .filter(k => k.length > 0);

    const options = optionsRaw
      .split(',')
      .map(o => o.trim())
      .filter(o => o.length > 0);

    const updatedFilter: DashboardFilter = {
      id: filterToEdit ? filterToEdit.id : `filter_${Date.now()}`,
      type,
      label,
      targetKeys: targetKeys.length > 0 ? targetKeys : ['category'],
      options: type === 'category_select' ? (options.length > 0 ? options : undefined) : undefined,
    };

    onSave(updatedFilter);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 dark:bg-black/70 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-zinc-900">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 dark:bg-indigo-950/40 rounded-lg text-indigo-600 dark:text-indigo-400">
              <SlidersHorizontal className="h-4.5 w-4.5" />
            </span>
            <h2 className="text-base font-bold text-slate-800 dark:text-zinc-50 font-sans tracking-tight">
              {filterToEdit ? 'REFINE FILTER NODE' : 'ADD INTERACTIVE FILTER'}
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-900 transition-all"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter Label</label>
            <input
              type="text"
              required
              value={label}
              onChange={e => setLabel(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              placeholder="e.g. Region or Territory"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Filter Logic Type</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as FilterType)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20 cursor-pointer"
            >
              <option value="category_select">Categorical Select Checkbox</option>
              <option value="date_range">Chronological Date Range Picker</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Target Field Keys (comma separated)</label>
            <input
              type="text"
              required
              value={targetKeysRaw}
              onChange={e => setTargetKeysRaw(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
              placeholder="e.g. region or country"
            />
            <p className="text-[9px] text-slate-400">
              Matches keys in your component record items.
            </p>
          </div>

          {type === 'category_select' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Dropdown Selection Options (comma list)</label>
              <input
                type="text"
                value={optionsRaw}
                onChange={e => setOptionsRaw(e.target.value)}
                className="w-full px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-800 bg-white dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500/20"
                placeholder="Americas, EMEA, APAC"
              />
              <p className="text-[9px] text-slate-400">
                If blank, selectable filter values will auto-resolve from raw records.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-zinc-900">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-600 font-semibold hover:bg-slate-50 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 transition-all font-mono"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-indigo-600 text-xs text-white font-semibold hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 transition-all font-mono shadow-md"
            >
              Save Filter
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
