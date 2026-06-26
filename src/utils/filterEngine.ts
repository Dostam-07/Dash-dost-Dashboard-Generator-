import { MasterDashboardPayload, DashboardComponent, DashboardFilter } from '../types';

export interface ActiveFilterState {
  dateRange?: { start: string; end: string };
  selectedCategories: Record<string, string[]>; // filterId -> array of selected values
}

/**
 * Searches either raw dataset rows or seriesData of all dashboard components
 * for the minimum and maximum date strings matching any target keys of date filters.
 */
export function getDashboardDateRangeLimits(
  payload: MasterDashboardPayload,
  filter: DashboardFilter,
  rawRows?: Record<string, any>[]
): { min: string; max: string } | null {
  const dates: string[] = [];

  if (rawRows && rawRows.length > 0) {
    for (const row of rawRows) {
      for (const key of filter.targetKeys) {
        const val = row[key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          const valStr = String(val).trim();
          if (valStr.match(/^\d{4}-\d{2}-\d{2}/)) {
            dates.push(valStr.split('T')[0]);
          } else {
            // Check if it's a valid timestamp or standard parseable string
            const parsed = Date.parse(valStr);
            if (!isNaN(parsed)) {
              dates.push(new Date(parsed).toISOString().split('T')[0]);
            }
          }
        }
      }
    }
  } else {
    for (const component of payload.components) {
      for (const row of component.seriesData || []) {
        for (const key of filter.targetKeys) {
          if (row[key] !== undefined && row[key] !== null) {
            const valStr = String(row[key]).trim();
            if (valStr.match(/^\d{4}-\d{2}-\d{2}/)) {
              dates.push(valStr.split('T')[0]);
            }
          }
        }
      }
    }
  }

  if (dates.length === 0) return null;

  dates.sort();
  return {
    min: dates[0],
    max: dates[dates.length - 1],
  };
}

/**
 * Extracts unique category option values either from the raw rows or the dynamic components
 */
export function getDashboardCategoryOptions(
  payload: MasterDashboardPayload,
  filter: DashboardFilter,
  rawRows?: Record<string, any>[]
): string[] {
  const optionsSet = new Set<string>();

  // If options are already preset in the filter node, load them
  if (filter.options && Array.isArray(filter.options)) {
    filter.options.forEach(opt => optionsSet.add(opt));
  }

  if (rawRows && rawRows.length > 0) {
    for (const row of rawRows) {
      for (const key of filter.targetKeys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          optionsSet.add(String(row[key]).trim());
        }
      }
    }
  } else {
    // Fallback to dynamic component seriesData
    for (const component of payload.components) {
      for (const row of component.seriesData || []) {
        for (const key of filter.targetKeys) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
            optionsSet.add(String(row[key]).trim());
          }
        }
      }
    }
  }

  return Array.from(optionsSet).sort();
}

/**
 * Evaluates whether a generic dataset row matches the currently active filter conditions.
 */
export function isRowPassingFilters(
  row: Record<string, any>,
  filters: DashboardFilter[],
  state: ActiveFilterState
): boolean {
  for (const filter of filters) {
    const isDate = filter.type === 'date_range';
    
    // Evaluate Date Range filters
    if (isDate && state.dateRange) {
      const { start, end } = state.dateRange;
      
      // Look for target date keys in this row
      let rowHasTarget = false;
      let passesDate = false;

      for (const key of filter.targetKeys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
          rowHasTarget = true;
          const rowVal = String(row[key]);
          if (rowVal >= start && rowVal <= end) {
            passesDate = true;
            break;
          }
        }
      }
      
      // If the row contains a target key for dates but fails the range, bubble false
      if (rowHasTarget && !passesDate) {
        return false;
      }
    }

    // Evaluate Category selection filters
    if (filter.type === 'category_select') {
      const selectedOpts = state.selectedCategories[filter.id];
      // Only filter if some options are selected (otherwise treat as all/any)
      if (selectedOpts && selectedOpts.length > 0) {
        let rowHasTarget = false;
        let passesCategory = false;

        for (const key of filter.targetKeys) {
          if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
            rowHasTarget = true;
            const rowVal = String(row[key]);
            if (selectedOpts.includes(rowVal)) {
              passesCategory = true;
              break;
            }
          }
        }

        // If the row has category info but does not match any selected categories, filter it out
        if (rowHasTarget && !passesCategory) {
          return false;
        }
      }
    }
  }

  return true;
}

/**
 * Filter a specific component's seriesData using the current global filter states
 */
export function filterComponentData(
  component: DashboardComponent,
  filters: DashboardFilter[],
  state: ActiveFilterState
): Record<string, any>[] {
  const data = component.seriesData || [];
  if (filters.length === 0) return data;
  
  return data.filter(row => isRowPassingFilters(row, filters, state));
}
