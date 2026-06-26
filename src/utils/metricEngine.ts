
export interface MetricResult {
  value: number;
  label: string;
  formula: string;
  debug: Record<string, any>;
  isValid: boolean;
  error?: string;
}

export function validateMetric(value: number, label: string, debug: Record<string, any>): MetricResult {
  const isPercentage = label.toLowerCase().includes('rate') || label.toLowerCase().includes('success') || label.toLowerCase().includes('percent');
  
  let isValid = !isNaN(value) && isFinite(value);
  let errorMsg = '';

  if (!isValid) {
    errorMsg = 'Value is NaN or infinite';
  } else if (isPercentage && (value < 0 || value > 100)) {
    isValid = false;
    errorMsg = `Percentage ${value.toFixed(1)}% is out of bounds [0, 100]`;
  } else if (value < 0) {
    isValid = false;
    errorMsg = `Negative value ${value} is not allowed`;
  }

  if (!isValid) {
    console.warn(`[Metric Validation Warning] ${label} failed validation: ${errorMsg}. Formula: ${debug.formula || 'unknown'}. Debug data:`, debug);
  }

  return {
    value,
    label,
    formula: debug.formula || 'unknown',
    debug,
    isValid,
    error: isValid ? undefined : errorMsg
  };
}

export function calculateCompletionRate(rows: any[]): MetricResult {
  const total = rows.length;
  if (total === 0) return validateMetric(0, 'Completion Rate', { formula: '(completed / total) * 100', completed: 0, total: 0 });
  
  const completed = rows.filter(r => {
    const val = r['Completion Status'] || r['completion_status'] || r['CompletionStatus'];
    return val && String(val).toLowerCase().trim() === 'completed';
  }).length;
  
  const rate = (completed / total) * 100;
  return validateMetric(rate, 'Completion Rate', { formula: '(completed / total) * 100', completed, total });
}

export function calculateAverageSessionDuration(rows: any[]): MetricResult {
  const durationKey = 'Total Time (sec)';
  const validRows = rows.filter(r => {
    const val = r[durationKey];
    return val !== undefined && val !== null && val !== '' && !isNaN(Number(val));
  });
  
  const total = validRows.length;
  if (total === 0) return validateMetric(0, 'Average Session Duration', { formula: 'sum(Total Time) / count(Total Time)', sum: 0, count: 0 });
  
  const sum = validRows.reduce((acc, r) => acc + Number(r[durationKey]), 0);
  const avg = sum / total;
  
  return validateMetric(avg, 'Average Session Duration', { formula: 'sum(Total Time) / count(Total Time)', sum, count: total });
}

export function calculateGPSSuccessRate(rows: any[]): MetricResult {
  const key = 'GPS Success';
  const validRows = rows.filter(r => {
    const val = r[key];
    return val !== undefined && val !== null && String(val).trim() !== '';
  });
  
  const total = validRows.length;
  if (total === 0) return validateMetric(0, 'GPS Success Rate', { formula: '(gps_yes / total_gps) * 100', yes: 0, total: 0 });
  
  const yes = validRows.filter(r => String(r[key]).toLowerCase().trim() === 'yes').length;
  const rate = (yes / total) * 100;
  
  return validateMetric(rate, 'GPS Success Rate', { formula: '(gps_yes / total_gps) * 100', yes, total });
}

export function calculateDropdownSuccessRate(rows: any[]): MetricResult {
  const key = 'Dropdown Success';
  const validRows = rows.filter(r => {
    const val = r[key];
    return val !== undefined && val !== null && String(val).trim() !== '';
  });
  
  const total = validRows.length;
  if (total === 0) return validateMetric(0, 'Dropdown Success Rate', { formula: '(dropdown_yes / total_dropdown) * 100', yes: 0, total: 0 });
  
  const yes = validRows.filter(r => String(r[key]).toLowerCase().trim() === 'yes').length;
  const rate = (yes / total) * 100;
  
  return validateMetric(rate, 'Dropdown Success Rate', { formula: '(dropdown_yes / total_dropdown) * 100', yes, total });
}
