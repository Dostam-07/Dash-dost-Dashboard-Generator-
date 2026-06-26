import { MasterDashboardPayload, DashboardFilter, DashboardComponent } from '../types';

/**
 * Validates a parsed JSON object against the MasterDashboardPayload schema.
 * Returns the validated payload or throws an error.
 */
export function validateDashboardPayload(data: any): MasterDashboardPayload {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON: Must be an object representing a dashboard.');
  }

  if (typeof data.dashboardId !== 'string' || !data.dashboardId.trim()) {
    throw new Error('Validation Error: Missing metadata field "dashboardId" (string).');
  }

  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw new Error('Validation Error: Missing metadata field "title" (string).');
  }

  if (data.subtitle !== undefined && typeof data.subtitle !== 'string') {
    throw new Error('Validation Error: Field "subtitle" must be a string.');
  }

  // Validate filters array
  if (!Array.isArray(data.filters)) {
    throw new Error('Validation Error: "filters" field must be an array.');
  }

  for (let i = 0; i < data.filters.length; i++) {
    const f = data.filters[i];
    if (!f || typeof f !== 'object') {
      throw new Error(`Validation Error: Filter at index ${i} is not a valid object.`);
    }
    if (typeof f.id !== 'string' || !f.id) {
      throw new Error(`Validation Error: Filter at index ${i} requires a non-empty string "id".`);
    }
    if (f.type !== 'date_range' && f.type !== 'category_select') {
      throw new Error(`Validation Error: Filter at index ${i} has invalid type "${f.type}". Must be "date_range" or "category_select".`);
    }
    if (typeof f.label !== 'string' || !f.label.trim()) {
      throw new Error(`Validation Error: Filter "colId: ${f.id}" requires a valid string "label".`);
    }
    if (!Array.isArray(f.targetKeys) || f.targetKeys.some((k: any) => typeof k !== 'string')) {
      throw new Error(`Validation Error: Filter "colId: ${f.id}" requires "targetKeys" to be an array of strings.`);
    }
    if (f.options !== undefined && (!Array.isArray(f.options) || f.options.some((o: any) => typeof o !== 'string'))) {
      throw new Error(`Validation Error: Filter "colId: ${f.id}" options must be an array of strings.`);
    }
  }

  // Validate components array
  if (!Array.isArray(data.components)) {
    throw new Error('Validation Error: "components" field must be an array.');
  }

  const validChartTypes = [
    'kpi_card',
    'bar_chart',
    'line_chart',
    'area_chart',
    'pie_chart',
    'scatter_chart',
    'map_chart',
    'geo_map'
  ];

  for (let i = 0; i < data.components.length; i++) {
    const c = data.components[i];
    if (!c || typeof c !== 'object') {
      throw new Error(`Validation Error: Component at index ${i} is not a valid object.`);
    }
    if (typeof c.id !== 'string' || !c.id) {
      throw new Error(`Validation Error: Component at index ${i} requires a non-empty string "id".`);
    }
    if (!validChartTypes.includes(c.type)) {
      throw new Error(`Validation Error: Component "colId: ${c.id}" has invalid type "${c.type}".`);
    }
    if (typeof c.title !== 'string' || !c.title.trim()) {
      throw new Error(`Validation Error: Component "colId: ${c.id}" requires a valid string "title".`);
    }
    if (c.description !== undefined && typeof c.description !== 'string') {
      throw new Error(`Validation Error: Component "colId: ${c.id}" description must be a string.`);
    }

    // Validate layout config
    if (!c.layout || typeof c.layout !== 'object') {
      throw new Error(`Validation Error: Component "colId: ${c.id}" is missing a valid "layout" object.`);
    }
    if (typeof c.layout.sm !== 'number' || typeof c.layout.md !== 'number' || typeof c.layout.lg !== 'number') {
      throw new Error(`Validation Error: Component "colId: ${c.id}" layout columns "sm", "md", and "lg" must be numbers.`);
    }

    // Validate config
    if (!c.config || typeof c.config !== 'object') {
      throw new Error(`Validation Error: Component "colId: ${c.id}" requires a valid "config" object.`);
    }

    // Validate seriesData
    if (c.seriesData !== undefined && !Array.isArray(c.seriesData)) {
      throw new Error(`Validation Error: Component "colId: ${c.id}" seriesData must be an array.`);
    }
  }

  return data as MasterDashboardPayload;
}
