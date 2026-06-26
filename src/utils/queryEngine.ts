import { calculateCompletionRate, calculateAverageSessionDuration } from './metricEngine';

export interface StructuredQuery {
  operation: 'groupBy_aggregate' | 'simple_filter' | 'summary_stats' | 'overall_metric' | 'outliers';
  groupByColumn?: string;
  metric?: string;
  aggregation?: 'sum' | 'avg' | 'mean' | 'min' | 'max' | 'count';
  filterColumn?: string;
  filterValue?: string;
  sortBy?: 'asc' | 'desc';
  limit?: number;
}

export interface QueryResult {
  answer: string;
  data: any[];
  computationDetails: string;
  vibeChartType?: 'bar' | 'kpi' | 'table';
  kpiHighlight?: { value: string; label: string };
}

export function executeQueryOnDataset(
  query: StructuredQuery,
  rows: any[],
  columns: any[]
): QueryResult {
  if (!rows || rows.length === 0) {
    return {
      answer: "No data is currently loaded to answer this question.",
      data: [],
      computationDetails: "Empty dataset rows."
    };
  }

  const {
    operation,
    groupByColumn,
    metric,
    aggregation = 'sum',
    filterColumn,
    filterValue,
    sortBy = 'desc',
    limit
  } = query;

  // Apply basic filtering if specified
  let workingRows = [...rows];
  let filterExplanation = "";
  if (filterColumn && filterValue !== undefined && filterValue !== null) {
    workingRows = rows.filter(r => {
      const cellVal = String(r[filterColumn]).trim().toLowerCase();
      const matchVal = String(filterValue).trim().toLowerCase();
      return cellVal.includes(matchVal);
    });
    filterExplanation = ` WHERE ${filterColumn} matches "${filterValue}" (${workingRows.length} rows matched)`;
  }


// 1. Overall Metric Aggregation
  if (operation === 'overall_metric' && metric) {
    if (metric.toLowerCase().includes('completion rate')) {
      const result = calculateCompletionRate(workingRows);
      return {
        answer: `Based on the active records, the ${result.label} is ${result.value.toFixed(1)}%.`,
        data: [{ 'Completion Rate': result.value }],
        computationDetails: result.debug.formula,
        vibeChartType: 'kpi',
        kpiHighlight: { value: `${result.value.toFixed(1)}%`, label: result.label }
      };
    }
    
    if (metric.toLowerCase().includes('average session duration')) {
      const result = calculateAverageSessionDuration(workingRows);
      return {
        answer: `Based on the active records, the ${result.label} is ${result.value.toFixed(0)} seconds.`,
        data: [{ 'Average Session Duration': result.value }],
        computationDetails: result.debug.formula,
        vibeChartType: 'kpi',
        kpiHighlight: { value: `${result.value.toFixed(0)}`, label: result.label }
      };
    }

    const values = workingRows
      .map(r => Number(String(r[metric]).replace(/[\$,₹,%]/g, '')))
      .filter(v => !isNaN(v));

    if (values.length === 0) {
      return {
        answer: `Could not find any valid numeric data in the column "${metric}" to calculate the overall values.`,
        data: [],
        computationDetails: `AGGREGATE(${metric}) over 0 numeric rows.`
      };
    }

    let resultValue = 0;
    if (aggregation === 'sum') {
      resultValue = values.reduce((a, b) => a + b, 0);
    } else if (aggregation === 'avg' || aggregation === 'mean') {
      resultValue = values.reduce((a, b) => a + b, 0) / values.length;
    } else if (aggregation === 'min') {
      resultValue = Math.min(...values);
    } else if (aggregation === 'max') {
      resultValue = Math.max(...values);
    } else if (aggregation === 'count') {
      resultValue = workingRows.length;
    }

    const formattedRes = resultValue.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const answer = `Based on the active records, the overall **${aggregation}** of **${metric}**${filterExplanation} is **${formattedRes}**.`;

    return {
      answer,
      data: [{ [metric]: resultValue }],
      computationDetails: `${aggregation.toUpperCase()}(${metric})${filterExplanation}\nOutput: ${resultValue}`,
      vibeChartType: 'kpi',
      kpiHighlight: { value: formattedRes, label: `${aggregation.toUpperCase()} of ${metric}` }
    };
  }


  // 2. GroupBy Aggregate Calculation
  if (operation === 'groupBy_aggregate' && groupByColumn && metric) {
    const groups: Record<string, number[]> = {};

    for (const r of workingRows) {
      const gVal = String(r[groupByColumn] || 'Other').trim();
      const stringVal = String(r[metric] || '0').replace(/[\$,₹,%]/g, '');
      const metricVal = Number(stringVal);

      if (!groups[gVal]) {
        groups[gVal] = [];
      }
      if (!isNaN(metricVal)) {
        groups[gVal].push(metricVal);
      }
    }

    let groupedData = Object.entries(groups).map(([group, arr]) => {
      let value = 0;
      if (aggregation === 'sum') {
        value = arr.reduce((a, b) => a + b, 0);
      } else if (aggregation === 'avg' || aggregation === 'mean') {
        value = arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
      } else if (aggregation === 'count') {
        value = arr.length;
      } else if (aggregation === 'min') {
        value = arr.length > 0 ? Math.min(...arr) : 0;
      } else if (aggregation === 'max') {
        value = arr.length > 0 ? Math.max(...arr) : 0;
      }

      return {
        [groupByColumn]: group,
        [metric]: Number(value.toFixed(2)),
        'recordCount': arr.length
      };
    });

    // Sort
    groupedData = groupedData.sort((a, b) => {
      const valA = Number(a[metric] || 0);
      const valB = Number(b[metric] || 0);
      return sortBy === 'desc' ? valB - valA : valA - valB;
    });

    // Limit
    if (limit && limit > 0) {
      groupedData = groupedData.slice(0, limit);
    }

    const topResult = groupedData[0];
    let answer = `Here is the aggregated breakdown of **${metric}** by **${groupByColumn}**${filterExplanation}.`;
    if (topResult) {
      answer = `Analyzing the dataset: **${topResult[groupByColumn]}** ranks highest with a total **${metric}** of **${topResult[metric].toLocaleString()}** (computed from ${topResult.recordCount} rows).`;
    }

    return {
      answer,
      data: groupedData,
      computationDetails: `SELECT ${groupByColumn}, ${aggregation.toUpperCase()}(${metric}) FROM dataset${filterExplanation} GROUP BY ${groupByColumn} ORDER BY ${metric} ${sortBy.toUpperCase()}`,
      vibeChartType: 'bar'
    };
  }

  // 3. Outliers / Anomalies
  if (operation === 'outliers' && metric) {
    const values = workingRows
      .map((r, i) => ({ val: Number(String(r[metric]).replace(/[\$,₹,%]/g, '')), index: i, row: r }))
      .filter(item => !isNaN(item.val));

    if (values.length < 5) {
      return {
        answer: "Not enough numerical data points are available to run a stable Z-score outlier classification. Standard deviation requires 5+ records.",
        data: [],
        computationDetails: "Anomaly detection aborted - insufficient rows."
      };
    }

    const rawNumbers = values.map(v => v.val);
    const sum = rawNumbers.reduce((a, b) => a + b, 0);
    const mean = sum / rawNumbers.length;
    const sqDiffs = rawNumbers.map(v => Math.pow(v - mean, 2));
    const stdDev = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / sqDiffs.length) || 1;

    // Detect rows where Z-score is absolute > 2.2
    const outliers = values
      .map(item => {
        const score = (item.val - mean) / stdDev;
        return {
          rowNumber: item.index + 1,
          value: item.val,
          zScore: Number(score.toFixed(2)),
          rowData: item.row
        };
      })
      .filter(o => Math.abs(o.zScore) > 2.2)
      .slice(0, 10);

    let answer = `Identified **${outliers.length} anomalous outliers** in column **"${metric}"** using a Z-score statistical threshold (absolute score > 2.2).`;
    if (outliers.length === 0) {
      answer = `Clean scan: **No statistical anomalies** detected in **"${metric}"**! All row records lie within standard boundaries (+/- 2.2 standard deviations).`;
    }

    return {
      answer,
      data: outliers,
      computationDetails: `Z_SCORE = (val - Mean) / StdDev\nMean: ${mean.toFixed(2)}, StdDev: ${stdDev.toFixed(2)}\nTarget: Abs(Z_SCORE) > 2.2`,
      vibeChartType: 'table'
    };
  }

  // Fallback - return first 10 columns/rows simple summary
  return {
    answer: "I parsed your query but did not detect the target operation. Here is a simple sample preview of the current active dataset context.",
    data: workingRows.slice(0, 10),
    computationDetails: "SELECT * FROM dataset LIMIT 10",
    vibeChartType: 'table'
  };
}
