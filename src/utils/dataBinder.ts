import { DashboardComponent, MasterDashboardPayload } from '../types';
import { calculateCompletionRate, calculateAverageSessionDuration, calculateGPSSuccessRate, calculateDropdownSuccessRate, validateMetric } from './metricEngine';

// ... (rest of the file remains, I will just apply the edit to bindDatasetToComponents)
export function formatValue(val: number, option?: { title?: string; key?: string }): string {
  const titleLower = (option?.title || '').toLowerCase();
  const keyLower = (option?.key || '').toLowerCase();
  
  const isPercent = titleLower.includes('%') || titleLower.includes('percent') || titleLower.includes('rate') || titleLower.includes('margin') || keyLower.includes('percent') || keyLower.includes('rate') || keyLower.includes('margin');
  
  // A count should not have currency formatting
  const isCountTitle = (titleLower.includes('count') || titleLower.includes('number of') || titleLower.includes('transactions') || titleLower.includes('items') || titleLower.includes('records') || titleLower.includes('represented') || titleLower.includes('cities') || titleLower.includes('countries') || titleLower.includes('users') || titleLower.includes('unique') || titleLower.includes('different') || titleLower.includes('distinct')) && 
    !(titleLower.includes('average') || titleLower.includes('avg') || titleLower.includes('mean') || titleLower.includes('value'));

  const isCurrency = !isCountTitle && (titleLower.includes('$') || titleLower.includes('revenue') || titleLower.includes('sales') || titleLower.includes('amount') || titleLower.includes('cost') || keyLower.includes('revenue') || keyLower.includes('sales') || keyLower.includes('cost'));
  const isIndian = titleLower.includes('₹') || titleLower.includes('inr') || titleLower.includes('lakh') || keyLower.includes('inr') || keyLower.includes('rupee');

  if (titleLower.includes('duration') || titleLower.includes('time') || keyLower.includes('duration') || keyLower.includes('time')) {
    if (titleLower.includes('ms') || keyLower.includes('ms')) {
      return `${val.toFixed(0)} ms`;
    }
    return `${val.toFixed(0)} sec`;
  }

  if (isPercent) {
    // If it's a rate, standard output is e.g. "45.2%"
    const multiple = val < 1 && val > 0 ? val * 100 : val;
    return `${multiple.toFixed(1)}%`;
  }

  // Format large numbers cleanly
  let formatted = "";
  if (Math.abs(val) >= 1_000_000) {
    formatted = `${(val / 1_000_000).toFixed(1)}M`;
  } else if (Math.abs(val) >= 1_000) {
    formatted = val.toLocaleString(undefined, { maximumFractionDigits: 0 });
  } else {
    formatted = Number(val.toFixed(2)).toString();
  }

  if (isIndian) {
    return `₹${formatted}`;
  } else if (isCurrency) {
    return `$${formatted}`;
  }

  return formatted;
}

// Resiliently finds the actual column key in a row for a given targetKey
export function findActualKey(row: Record<string, any>, targetKey: string): string | null {
  if (!row || !targetKey) return null;
  
  const keys = Object.keys(row);
  if (keys.includes(targetKey)) return targetKey;

  const targetLower = targetKey.toLowerCase();
  const targetClean = targetLower.replace(/[^a-z0-9]/g, '');

  // 1. Exact case-insensitive match
  let matched = keys.find(k => k.toLowerCase() === targetLower);
  if (matched) return matched;

  // 2. Separator-insensitive match (remove spaces, underscores, hyphens)
  matched = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === targetClean);
  if (matched) return matched;

  // 3. Substring match (e.g. "district" in "District ID")
  matched = keys.find(k => {
    const kl = k.toLowerCase().replace(/[^a-z0-9]/g, '');
    return kl.includes(targetClean) || targetClean.includes(kl);
  });
  if (matched) return matched;

  return null;
}

// Scans words to perform a high-precision stemmed keyword overlap match
export function isFuzzyKeywordMatch(title: string, colName: string): boolean {
  const tLower = title.toLowerCase();
  const cLower = colName.toLowerCase();
  
  const stem = (w: string) => {
    let s = w.toLowerCase();
    if (s.endsWith('ies')) return s.slice(0, -3) + 'y';
    if (s.endsWith('es')) return s.slice(0, -2);
    if (s.endsWith('s') && !s.endsWith('ss')) return s.slice(0, -1);
    return s;
  };

  const tStemmed = stem(tLower);
  const cStemmed = stem(cLower);
  if (tStemmed.includes(cStemmed) || cStemmed.includes(tStemmed)) return true;

  const tWords = tLower.split(/[^a-z0-9]/).filter(w => w.length > 2);
  const cWords = cLower.split(/[^a-z0-9]/).filter(w => w.length > 2);
  
  for (const tw of tWords) {
    const twStem = stem(tw);
    for (const cw of cWords) {
      const cwStem = stem(cw);
      if (twStem === cwStem || tw.includes(cw) || cw.includes(tw) || twStem.includes(cwStem) || cwStem.includes(twStem)) {
        return true;
      }
    }
  }
  return false;
}

// Binds real in-memory data rows to components dynamically
export function bindDatasetToComponents(
  components: DashboardComponent[],
  rows: any[]
): DashboardComponent[] {
  if (!rows || rows.length === 0) return components;

  return components.map(comp => {
    // 1. KPI Card binding
    if (comp.type === 'kpi_card') {
      const config = comp.config || {};
      const titleLower = comp.title.toLowerCase();

      // Core Metric Engine Override - Single Source of Truth
      let isOverridden = false;
      let overriddenValue = 0;

      if (titleLower.includes('completion rate') || config.metricSource === 'completionRate') {
        overriddenValue = calculateCompletionRate(rows).value;
        isOverridden = true;
      } else if (titleLower.includes('average session duration') || titleLower.includes('avg session duration') || titleLower.includes('average duration') || titleLower.includes('avg duration')) {
        overriddenValue = calculateAverageSessionDuration(rows).value;
        isOverridden = true;
      } else if (titleLower.includes('gps success') || titleLower.includes('gps rate')) {
        overriddenValue = calculateGPSSuccessRate(rows).value;
        isOverridden = true;
      } else if (titleLower.includes('dropdown success') || titleLower.includes('dropdown rate') || titleLower.includes('dropdown/manual') || titleLower.includes('manual success') || titleLower.includes('manual rate')) {
        overriddenValue = calculateDropdownSuccessRate(rows).value;
        isOverridden = true;
      }

      if (isOverridden) {
        let trendValue = comp.config?.kpiTrend || { direction: 'neutral', label: '+0% vs prior period' };
        try {
          const mid = Math.floor(rows.length / 2);
          const firstHalf = rows.slice(0, mid);
          const secondHalf = rows.slice(mid);
          let firstVal = 0;
          let secondVal = 0;

          if (titleLower.includes('completion rate') || config.metricSource === 'completionRate') {
            firstVal = calculateCompletionRate(firstHalf).value;
            secondVal = calculateCompletionRate(secondHalf).value;
          } else if (titleLower.includes('average session duration') || titleLower.includes('avg session duration') || titleLower.includes('average duration') || titleLower.includes('avg duration')) {
            firstVal = calculateAverageSessionDuration(firstHalf).value;
            secondVal = calculateAverageSessionDuration(secondHalf).value;
          } else if (titleLower.includes('gps success') || titleLower.includes('gps rate')) {
            firstVal = calculateGPSSuccessRate(firstHalf).value;
            secondVal = calculateGPSSuccessRate(secondHalf).value;
          } else if (titleLower.includes('dropdown success') || titleLower.includes('dropdown rate') || titleLower.includes('dropdown/manual') || titleLower.includes('manual success') || titleLower.includes('manual rate')) {
            firstVal = calculateDropdownSuccessRate(firstHalf).value;
            secondVal = calculateDropdownSuccessRate(secondHalf).value;
          }

          if (firstVal > 0) {
            const change = ((secondVal - firstVal) / firstVal) * 100;
            const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
            const prefix = change > 0 ? '+' : '';
            trendValue = {
              direction: direction as any,
              label: `${prefix}${change.toFixed(1)}% vs prior period`
            };
          }
        } catch (e) {}

        return {
          ...comp,
          config: {
            ...config,
            kpiValue: formatValue(overriddenValue, { title: comp.title }),
            kpiTrend: trendValue
          }
        };
      }

      let targetField: string | null = null;
      let aggregation: 'sum' | 'avg' | 'count' | 'min' | 'max' = 'sum';

      // Parse {{BIND:fieldName:aggType}} if present
      const kpiValString = comp.config?.kpiValue || '';
      const bindMatch = kpiValString.match(/\{\{BIND:([^:]+):?([^}]+)?\}\}/);

      const datasetKeys = Object.keys(rows[0] || {});
      
      let hasTitleOverride = false;
      if (!bindMatch) {
        if (titleLower.includes('countr') || titleLower.includes('nation')) {
          const countryCol = datasetKeys.find(k => k.toLowerCase().includes('country') || k.toLowerCase().includes('nation'));
          if (countryCol) {
            targetField = countryCol;
            aggregation = 'count';
            hasTitleOverride = true;
          }
        } else if (titleLower.includes('cit') || titleLower.includes('town')) {
          const cityCol = datasetKeys.find(k => k.toLowerCase().includes('city') || k.toLowerCase().includes('town') || k.toLowerCase().includes('municipal'));
          if (cityCol) {
            targetField = cityCol;
            aggregation = 'count';
            hasTitleOverride = true;
          }
        } else if (titleLower.includes('product') || titleLower.includes('item')) {
          if (titleLower.includes('different') || titleLower.includes('unique') || titleLower.includes('distinct') || titleLower.includes('count')) {
            const prodCol = datasetKeys.find(k => k.toLowerCase().includes('product') || k.toLowerCase().includes('item') || k.toLowerCase().includes('sku'));
            if (prodCol) {
              targetField = prodCol;
              aggregation = 'count';
              hasTitleOverride = true;
            }
          }
        } else if (titleLower.includes('average transaction') || titleLower.includes('average sales') || titleLower.includes('avg transaction') || titleLower.includes('average order') || titleLower.includes('mean transaction') || (titleLower.includes('average') && (titleLower.includes('value') || titleLower.includes('amount')))) {
          aggregation = 'avg';
          const salesCol = datasetKeys.find(k => k.toLowerCase().includes('sales') || k.toLowerCase().includes('revenue') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('value') || k.toLowerCase().includes('price') || k.toLowerCase().includes('spend'));
          if (salesCol) {
            targetField = salesCol;
            hasTitleOverride = true;
          }
        } else if (titleLower.includes('total transaction') || titleLower.includes('transactions count') || titleLower.includes('number of transactions') || titleLower.includes('order count') || titleLower.includes('total orders') || titleLower.includes('transactions')) {
          aggregation = 'count';
          const idCol = datasetKeys.find(k => k.toLowerCase().includes('order') || k.toLowerCase().includes('transaction') || k.toLowerCase().includes('invoice') || k.toLowerCase().includes('id'));
          if (idCol) {
            targetField = idCol;
            hasTitleOverride = true;
          }
        } else if (titleLower.includes('total sales') || titleLower.includes('sales value') || titleLower.includes('revenue') || titleLower.includes('sales total') || titleLower.includes('total revenue')) {
          aggregation = 'sum';
          const salesCol = datasetKeys.find(k => k.toLowerCase().includes('sales') || k.toLowerCase().includes('revenue') || k.toLowerCase().includes('amount') || k.toLowerCase().includes('value'));
          if (salesCol) {
            targetField = salesCol;
            hasTitleOverride = true;
          }
        }
      }

      if (!hasTitleOverride) {
        if (bindMatch) {
          targetField = bindMatch[1];
          aggregation = (bindMatch[2] || 'sum') as any;
        } else if (config.yAxisKeys && config.yAxisKeys.length > 0) {
          targetField = config.yAxisKeys[0];
        } else if ((config as any).yAxisKey) {
          targetField = Array.isArray((config as any).yAxisKey) ? (config as any).yAxisKey[0] : (config as any).yAxisKey;
        } else {
          // Infer from column keys of dataset
          const datasetKeys = Object.keys(rows[0] || {});
          let titleLower = comp.title.toLowerCase();
          
          // Find a column matching parts of the title
          let matchingKey = datasetKeys.find(k => {
            const kl = k.toLowerCase();
            return titleLower.includes(kl) || kl.includes(titleLower);
          });

          if (!matchingKey) {
            // Fall back to robust stemmed matching
            matchingKey = datasetKeys.find(k => isFuzzyKeywordMatch(comp.title, k));
          }

          if (matchingKey) {
            targetField = matchingKey;
          } else {
            // Fallback check: find first numeric key (excluding common IDs)
            targetField = datasetKeys.filter(k => k !== 'id' && !k.toLowerCase().includes('id')).find(k => {
              const cleanStr = String(rows[0]?.[k] || '').replace(/[\$,₹,%]/g, '').trim();
              const v = Number(cleanStr);
              return cleanStr !== "" && !isNaN(v);
            }) || null;
          }

          // Final fallback if still empty
          if (!targetField && datasetKeys.length > 0) {
            targetField = datasetKeys[0];
          }
        }
      }

      // Resolve the actual key from the raw rows
      const mappedTarget = targetField ? findActualKey(rows[0], targetField) : null;

      const isRate = titleLower.includes('%') || titleLower.includes('rate') || titleLower.includes('ratio') || titleLower.includes('percent') || titleLower.includes('success');

      // Smartly infer logical aggregation if not pre-bound
      let resolvedAggregation = aggregation;
      if (!bindMatch && !hasTitleOverride) {
        if (titleLower.includes('average') || titleLower.includes('avg') || titleLower.includes('mean')) {
          resolvedAggregation = 'avg';
        } else if (titleLower.includes('max') || titleLower.includes('highest') || titleLower.includes('maximum')) {
          resolvedAggregation = 'max';
        } else if (titleLower.includes('min') || titleLower.includes('lowest') || titleLower.includes('minimum')) {
          resolvedAggregation = 'min';
        } else if (
          titleLower.includes('count') || 
          titleLower.includes('number of') || 
          titleLower.includes('total of') || 
          titleLower.includes('transactions') || 
          titleLower.includes('items') || 
          titleLower.includes('records') ||
          titleLower.includes('represented') ||
          titleLower.includes('active cities') ||
          titleLower.includes('cities') ||
          titleLower.includes('countries') ||
          titleLower.includes('users') ||
          titleLower.includes('rate') ||
          titleLower.includes('percent')
        ) {
          resolvedAggregation = 'count';
        }
      }

      if (isRate && resolvedAggregation === 'sum') {
        resolvedAggregation = 'avg';
      }

      // If we found a target field or are counting, or mapping for rate metrics
      if (mappedTarget || resolvedAggregation === 'count' || isRate) {
        const isDistinctCount = 
          titleLower.includes('represented') || 
          titleLower.includes('unique') || 
          titleLower.includes('distinct') || 
          titleLower.includes('different') || 
          titleLower.includes('cities') ||
          titleLower.includes('countries') ||
          titleLower.includes('users') ||
          (titleLower.includes('transactions') && mappedTarget && (mappedTarget.toLowerCase().includes('id') || mappedTarget.toLowerCase().includes('number')));

        let treatAsCount = resolvedAggregation === 'count' || isDistinctCount;

        if (mappedTarget && !treatAsCount) {
          // Sample a subset to detect non-numeric/categorical columns
          let validCount = 0;
          const sampleSize = Math.min(rows.length, 50);
          for (let i = 0; i < sampleSize; i++) {
            const rawVal = rows[i]?.[mappedTarget];
            if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
              const cleanStr = String(rawVal).replace(/[\$,₹,%]/g, '');
              if (!isNaN(Number(cleanStr))) {
                validCount++;
              }
            }
          }
          // If < 40% of standard non-empty rows are numbers, fallback to counting occurrences
          if (validCount < sampleSize * 0.4) {
            treatAsCount = true;
          }
        }

        const values = rows
          .map(r => {
            if (!mappedTarget) return 1;
            const sv = String(r[mappedTarget]).replace(/[\$,₹,%]/g, '');
            const nv = Number(sv);
            return isNaN(nv) ? 0 : nv;
          });

        let result = 0;

        // Only do categorical success rate checking if it is indeed a categorical column!
        if (titleLower.includes('completion rate')) {
          result = calculateCompletionRate(rows).value;
        } else if (isRate && mappedTarget && treatAsCount) {
          // Calculate positive success ratios for categorical columns
          const positiveKeywords = ['completed', 'complete', 'success', 'successful', 'yes', 'true', 'pass', 'passed', 'active', '1', 'y', 'ok', 'done', 'delivered', 'valid', 'resolved', 'solved', 'succeeded'];
          let positives = 0;
          let validTotal = 0;
          
          rows.forEach(r => {
            const rawVal = r[mappedTarget];
            if (rawVal !== undefined && rawVal !== null && String(rawVal).trim() !== '') {
              validTotal++;
              const valStr = String(rawVal).trim().toLowerCase();
              if (positiveKeywords.some(kw => valStr === kw || valStr.startsWith(kw) || kw.startsWith(valStr) || valStr.includes(kw))) {
                positives++;
              }
            }
          });

          if (validTotal > 0) {
            result = (positives / validTotal) * 100;
          } else {
            result = 0;
          }
        } else {
          // Standard aggregates
          if (treatAsCount || resolvedAggregation === 'count') {
            if (isDistinctCount && mappedTarget) {
              const uniqueValues = new Set(
                rows
                  .map(r => r[mappedTarget])
                  .filter(v => v !== undefined && v !== null && String(v).trim() !== '')
                  .map(v => String(v).trim().toLowerCase())
              );
              result = uniqueValues.size;
            } else {
              result = rows.length;
            }
          } else if (resolvedAggregation === 'sum') {
            result = values.reduce((a, b) => a + b, 0);
          } else if (resolvedAggregation === 'avg') {
            if (titleLower.includes('average session duration')) {
              result = calculateAverageSessionDuration(rows).value;
            } else {
              const sum = values.reduce((a, b) => a + b, 0);
              result = values.length > 0 ? sum / values.length : 0;
            }
          } else if (resolvedAggregation === 'min') {
            result = values.length > 0 ? Math.min(...values) : 0;
          } else if (resolvedAggregation === 'max') {
            result = values.length > 0 ? Math.max(...values) : 0;
          }
        }

        // Compute comparison trend if possible
        let trendValue = comp.config?.kpiTrend || { direction: 'neutral', label: '+0% vs baseline' };
        const datasetKeys = Object.keys(rows[0] || {});
        const dateKey = datasetKeys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'));
        if (dateKey && rows.length >= 4) {
          try {
            // Sort rows by date (supporting excel dates too)
            const sortedRows = [...rows].sort((a, b) => {
              const parseVal = (v: any) => {
                const num = Number(v);
                if (!isNaN(num) && num > 30000 && num < 60000) {
                  return num;
                }
                return Date.parse(v) || 0;
              };
              return parseVal(a[dateKey]) - parseVal(b[dateKey]);
            });
            const mid = Math.floor(sortedRows.length / 2);
            const firstHalf = sortedRows.slice(0, mid);
            const secondHalf = sortedRows.slice(mid);

            let sumFirst = 0;
            let sumSecond = 0;

            if (isDistinctCount && mappedTarget) {
              const uniqueFirst = new Set(firstHalf.map(r => String(r[mappedTarget] || '').trim().toLowerCase()).filter(Boolean));
              const uniqueSecond = new Set(secondHalf.map(r => String(r[mappedTarget] || '').trim().toLowerCase()).filter(Boolean));
              sumFirst = uniqueFirst.size;
              sumSecond = uniqueSecond.size;
            } else if (resolvedAggregation === 'avg' && mappedTarget) {
              const firstVals = firstHalf.map(r => Number(String(r[mappedTarget]).replace(/[\$,₹,%]/g, ''))).filter(v => !isNaN(v));
              const secondVals = secondHalf.map(r => Number(String(r[mappedTarget]).replace(/[\$,₹,%]/g, ''))).filter(v => !isNaN(v));
              sumFirst = firstVals.length > 0 ? firstVals.reduce((a, b) => a + b, 0) / firstVals.length : 0;
              sumSecond = secondVals.length > 0 ? secondVals.reduce((a, b) => a + b, 0) / secondVals.length : 0;
            } else if (resolvedAggregation === 'count' || treatAsCount) {
              sumFirst = firstHalf.length;
              sumSecond = secondHalf.length;
            } else {
              const firstVals = firstHalf.map(r => mappedTarget ? Number(String(r[mappedTarget]).replace(/[\$,₹,%]/g, '')) : 1).filter(v => !isNaN(v));
              const secondVals = secondHalf.map(r => mappedTarget ? Number(String(r[mappedTarget]).replace(/[\$,₹,%]/g, '')) : 1).filter(v => !isNaN(v));
              sumFirst = firstVals.reduce((a, b) => a + b, 0);
              sumSecond = secondVals.reduce((a, b) => a + b, 0);
            }

            if (sumFirst > 0) {
              const change = ((sumSecond - sumFirst) / sumFirst) * 100;
              const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';
              const prefix = change > 0 ? '+' : '';
              trendValue = {
                direction: direction as any,
                label: `${prefix}${change.toFixed(1)}% vs prior period`
              };
            }
          } catch (e) {}
        }

        return {
          ...comp,
          config: {
            ...config,
            kpiValue: formatValue(result, { title: comp.title, key: mappedTarget || undefined }),
            kpiTrend: trendValue
          }
        };
      }
    }

    // 2. Chart bindings (bar_chart, line_chart, area_chart, pie_chart, scatter_chart, map_chart, geo_map)
    let xAxisKey = comp.config?.xAxisKey || (comp.config as any)?.xAxis;
    let yAxisKeys = [...(comp.config?.yAxisKeys || [])];

    if (yAxisKeys.length === 0 && (comp.config as any)?.yAxisKey) {
      if (Array.isArray((comp.config as any).yAxisKey)) {
        yAxisKeys = [...(comp.config as any).yAxisKey];
      } else {
        yAxisKeys = [(comp.config as any).yAxisKey];
      }
    }
    if (yAxisKeys.length === 0 && (comp.config as any)?.yAxis) {
      if (Array.isArray((comp.config as any).yAxis)) {
        yAxisKeys = [...(comp.config as any).yAxis];
      } else {
        yAxisKeys = [(comp.config as any).yAxis];
      }
    }

    const datasetKeys = Object.keys(rows[0] || {});

    // Intelligent index-column and sequential key detector
    const isLowValueIndexKey = (key: string) => {
      if (!key) return true;
      const lower = key.toLowerCase();
      if (lower === 'id' || lower === 'index' || lower === 'row' || lower === 'sno' || lower === 's.no' || lower === 'rownum' || lower === 'serial' || lower === 'row_id' || lower === '_id') return true;
      
      const values = rows.slice(0, 10).map(r => Number(String(r[key]).replace(/[\$,₹,%]/g, ''))).filter(v => !isNaN(v));
      if (values.length >= 3) {
        let isSequential = true;
        for (let i = 1; i < values.length; i++) {
          if (values[i] !== values[i - 1] + 1) {
            isSequential = false;
            break;
          }
        }
        if (isSequential && (values[0] === 0 || values[0] === 1)) {
          return true;
        }
      }
      return false;
    };

    const hasBetterKeyThanIndex = (currentX: string | undefined) => {
      if (!currentX) return true;
      return isLowValueIndexKey(currentX);
    };

    let titleXMatched: string | null = null;
    let titleYMatched: string | null = null;

    // Parse the chart title for "vs" or "Correlation" style references to extract keys
    const titleLower = comp.title.toLowerCase();
    if (titleLower.includes(' vs ') || titleLower.includes(' vs. ') || titleLower.includes(' correlation ') || titleLower.includes(' relationship ')) {
      let parts: string[] = [];
      if (titleLower.includes(' vs ')) {
        parts = comp.title.split(/ vs /i);
      } else if (titleLower.includes(' vs. ')) {
        parts = comp.title.split(/ vs\. /i);
      } else if (titleLower.includes(' correlation ')) {
        const cleanTitle = comp.title.replace(/correlation/i, '').replace(/relationship/i, '').trim();
        parts = cleanTitle.split(/ and | & /i);
      }

      if (parts.length >= 2) {
        const rawKeywordX = parts[0].trim().toLowerCase();
        const rawKeywordY = parts[1].replace(/correlation/i, '').replace(/relationship/i, '').trim().toLowerCase();

        // Search the available columns
        const colX = datasetKeys.find(k => {
          const kl = k.toLowerCase();
          return kl === rawKeywordX || kl.includes(rawKeywordX) || rawKeywordX.includes(kl);
        });
        const colY = datasetKeys.find(k => {
          const kl = k.toLowerCase();
          return kl === rawKeywordY || kl.includes(rawKeywordY) || rawKeywordY.includes(kl);
        });

        if (colX) titleXMatched = colX;
        if (colY) titleYMatched = colY;
      }
    }

    // Set xAxisKey using intelligent ranking
    if (!xAxisKey || hasBetterKeyThanIndex(xAxisKey)) {
      if (titleXMatched) {
        xAxisKey = titleXMatched;
      } else {
        // A. Date/Time columns are always the best temporal X axis
        const dateCol = datasetKeys.find(k => {
          const l = k.toLowerCase();
          return l.includes('date') || l.includes('time') || l.includes('year') || l.includes('month') || l.includes('day') || l.includes('quarter') || l.includes('period');
        });

        // B. Name/Title/Label / Category columns (e.g. Product Name, Country, Segment, Status)
        const nameKeywords = ['name', 'label', 'title', 'item', 'product', 'category', 'type', 'group', 'status', 'segment', 'customer', 'supplier', 'region', 'state', 'city', 'country'];
        const nameCol = datasetKeys.find(k => {
          const l = k.toLowerCase();
          if (l.includes('id') || l === 'id') return false;
          return nameKeywords.some(kw => l.includes(kw));
        });

        // C. Clean custom categorical string columns
        const textCol = datasetKeys.find(k => {
          if (k === dateCol || k === nameCol) return false;
          const sample = rows.slice(0, 5).map(r => r[k]);
          const nonNumericCount = sample.filter(v => typeof v === 'string' && isNaN(Number(String(v).replace(/[\$,₹,%]/g, '')))).length;
          return nonNumericCount >= sample.length * 0.6;
        });

        if (dateCol) {
          xAxisKey = dateCol;
        } else if (nameCol) {
          xAxisKey = nameCol;
        } else if (textCol) {
          xAxisKey = textCol;
        } else {
          // fallback to any non-low-value index key first
          const nonIndexCol = datasetKeys.find(k => !isLowValueIndexKey(k));
          xAxisKey = nonIndexCol || datasetKeys[0];
        }
      }
    }

    // Set yAxisKeys using intelligent matching
    if ((!yAxisKeys || yAxisKeys.length === 0 || yAxisKeys[0] === 'value') && datasetKeys.length > 0) {
      if (titleYMatched && titleYMatched !== xAxisKey) {
        yAxisKeys = [titleYMatched];
      } else {
        // Find numeric columns
        const numericCols = datasetKeys.filter(k => {
          if (k === xAxisKey) return false;
          const sampleSize = Math.min(rows.length, 10);
          let numCount = 0;
          for (let i = 0; i < sampleSize; i++) {
            const val = Number(String(rows[i]?.[k]).replace(/[\$,₹,%]/g, ''));
            if (!isNaN(val)) numCount++;
          }
          return numCount >= sampleSize * 0.6;
        });

        if (numericCols.length > 0) {
          // Find numerical column that matches component title words
          const titleWords = comp.title.toLowerCase().split(/[^a-z0-9]/).filter(w => w.length > 2 && w !== 'vs' && w !== 'correlation');
          const matchingNumCols = numericCols.filter(nc => {
            const ncLower = nc.toLowerCase();
            return titleWords.some(tw => ncLower.includes(tw));
          });

          if (matchingNumCols.length > 0) {
            yAxisKeys = [matchingNumCols[0]];
          } else {
            // Avoid selecting index/ID columns as metrics if we have alternative numeric columns
            const bestNumericCol = numericCols.find(k => !isLowValueIndexKey(k)) || numericCols[0];
            yAxisKeys = [bestNumericCol];
          }
        } else {
          const fallbackCol = datasetKeys.find(k => k !== xAxisKey);
          if (fallbackCol) {
            yAxisKeys = [fallbackCol];
          }
        }
      }
    }

    if (xAxisKey && yAxisKeys.length > 0) {
      const resolvedXKey = findActualKey(rows[0], xAxisKey) || xAxisKey;
      const resolvedYKeys = yAxisKeys.map(k => ({
        original: k,
        resolved: findActualKey(rows[0], k) || k
      }));

      // Group rows by resolvedXKey
      const groups: Record<string, { _size: number, rows: any[], values: Record<string, number[]> }> = {};

      for (const row of rows) {
        if (!row) continue;
        const xValueRaw = row[resolvedXKey];
        if (xValueRaw === undefined || xValueRaw === null || String(xValueRaw).trim() === '') continue;
        
        let xValueStr = String(xValueRaw).trim();
        const colLower = resolvedXKey.toLowerCase();
        const isDateColumn = colLower.includes('date') || colLower.includes('time') || colLower.includes('day') || colLower.includes('month') || colLower.includes('year') || colLower.includes('period');
        const titleLower = comp.title.toLowerCase();
        const isExpectedTimeline = isDateColumn || titleLower.includes('trend') || titleLower.includes('time') || titleLower.includes('timeline') || titleLower.includes('over time') || titleLower.includes('history');
        const xNum = Number(xValueRaw);

        if (!isNaN(xNum) && isExpectedTimeline && xNum > 30000 && xNum < 60000) {
          try {
            const excelEpoch = new Date(1899, 11, 30);
            const jsDate = new Date(excelEpoch.getTime() + xNum * 24 * 60 * 60 * 1000);
            const year = jsDate.getFullYear();
            const month = String(jsDate.getMonth() + 1).padStart(2, '0');
            const day = String(jsDate.getDate()).padStart(2, '0');
            xValueStr = `${year}-${month}-${day}`;
          } catch (e) {}
        } else if (Date.parse(xValueStr) && xValueStr.length > 10) {
          xValueStr = xValueStr.split('T')[0];
        }

        if (!groups[xValueStr]) {
          groups[xValueStr] = {
            _size: 0,
            rows: [],
            values: {}
          };
          yAxisKeys.forEach(k => {
            groups[xValueStr].values[k] = [];
          });
        }

        groups[xValueStr]._size += 1;
        groups[xValueStr].rows.push(row);

        resolvedYKeys.forEach(({ original, resolved }) => {
          if (row[resolved] !== undefined && row[resolved] !== null) {
            const numStr = String(row[resolved]).replace(/[\$,₹,%]/g, '');
            const num = Number(numStr);
            if (!isNaN(num)) {
              groups[xValueStr].values[original].push(num);
            }
          }
        });
      }

      // Compile group calculations
      let boundSeriesData = Object.entries(groups).map(([xVal, groupObj]) => {
        const rowObj: Record<string, any> = { [xAxisKey!]: xVal };
        const groupSize = groupObj._size;

        yAxisKeys.forEach(k => {
          const kLower = k.toLowerCase();
          const isCompletedKey = kLower === 'completed' || kLower === 'completedcount' || kLower === 'completed_sessions' || kLower === 'completed sessions';
          const isIncompleteKey = kLower === 'incomplete' || kLower === 'incompletecount' || kLower === 'incomplete_sessions' || kLower === 'incomplete sessions';

          if (isCompletedKey) {
            rowObj[k] = groupObj.rows.filter(r => {
              const val = r['Completion Status'] || r['completion_status'] || r['CompletionStatus'];
              return val && String(val).toLowerCase().trim() === 'completed';
            }).length;
          } else if (isIncompleteKey) {
            rowObj[k] = groupObj.rows.filter(r => {
              const val = r['Completion Status'] || r['completion_status'] || r['CompletionStatus'];
              return val && String(val).toLowerCase().trim() !== 'completed';
            }).length;
          } else {
            const arr = groupObj.values[k] || [];
            if (arr.length === 0) {
              // Fallback: If no numerical metrics exist, count group rows (great for category logs)
              rowObj[k] = groupSize;
            } else {
              const isRate = k.toLowerCase().includes('rate') || k.toLowerCase().includes('percent') || k.toLowerCase().includes('ratio') || k.toLowerCase().includes('margin') || k.toLowerCase().includes('avg');
              if (isRate) {
                rowObj[k] = Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2));
              } else {
                rowObj[k] = Number((arr.reduce((a, b) => a + b, 0)).toFixed(2));
              }
            }
          }
        });
        return rowObj;
      });

      // Sort chronological or alphabetical
      const isDate = boundSeriesData.some(item => {
        const v = item[xAxisKey!];
        return v && !isNaN(Date.parse(v)) && isNaN(Number(v));
      });

      if (isDate) {
        boundSeriesData = boundSeriesData.sort((a, b) => Date.parse(a[xAxisKey!]) - Date.parse(b[xAxisKey!]));
      } else {
        boundSeriesData = boundSeriesData.sort((a, b) => {
          const aX = a[xAxisKey!];
          const bX = b[xAxisKey!];
          if (!isNaN(Number(aX)) && !isNaN(Number(bX))) {
            return Number(aX) - Number(bX);
          }
          return String(aX).localeCompare(String(bX));
        });
      }

      if (boundSeriesData.length > 25) {
        boundSeriesData = boundSeriesData.slice(0, 25);
      }

      return {
        ...comp,
        config: {
          ...comp.config,
          xAxisKey,
          yAxisKeys
        },
        seriesData: boundSeriesData
      };
    }

    return comp;
  });
}

// Binds the active dataset into the full layout
export function bindPayloadDataset(payload: MasterDashboardPayload, rows: any[]): MasterDashboardPayload {
  if (!rows || rows.length === 0) return payload;
  const boundComponents = bindDatasetToComponents(payload.components, rows);
  return {
    ...payload,
    components: boundComponents
  };
}
