export interface AnomalyPoint {
  index: number;
  xAxisValue: string;
  yAxisKey: string;
  actualValue: number;
  expectedValue: number;
  deviationPercentage: number;
  zScore: number;
}

export interface TrendResult {
  slope: number;
  direction: 'strongly_up' | 'slightly_up' | 'flat' | 'slightly_down' | 'strongly_down';
  description: string;
}

// 1. Detect anomalous points in a series array
export function detectAnomalies(
  seriesData: Record<string, any>[],
  xAxisKey: string,
  yAxisKey: string
): AnomalyPoint[] {
  if (!seriesData || seriesData.length < 5) return [];

  const values = seriesData
    .map((d, index) => ({
      index,
      xAxisValue: String(d[xAxisKey] || ''),
      val: Number(d[yAxisKey])
    }))
    .filter(item => !isNaN(item.val));

  if (values.length < 5) return [];

  const rawNumbers = values.map(v => v.val);
  const sum = rawNumbers.reduce((a, b) => a + b, 0);
  const mean = sum / rawNumbers.length;
  const sqDiffs = rawNumbers.map(v => Math.pow(v - mean, 2));
  const stdDev = Math.sqrt(sqDiffs.reduce((a, b) => a + b, 0) / sqDiffs.length) || 1;

  const anomalies: AnomalyPoint[] = [];

  values.forEach(item => {
    const zScore = (item.val - mean) / stdDev;
    // Standard Z-Score threshold for outliers is +/- 2.0
    if (Math.abs(zScore) > 2.0) {
      anomalies.push({
        index: item.index,
        xAxisValue: item.xAxisValue,
        yAxisKey,
        actualValue: item.val,
        expectedValue: mean,
        deviationPercentage: mean !== 0 ? Number((((item.val - mean) / mean) * 100).toFixed(1)) : 0,
        zScore: Number(zScore.toFixed(2))
      });
    }
  });

  return anomalies;
}

// 2. Classify time-series performance via linear regression
export function calculateTimeSeriesTrend(
  seriesData: Record<string, any>[],
  xAxisKey: string,
  yAxisKey: string
): TrendResult {
  if (!seriesData || seriesData.length < 3) {
    return { slope: 0, direction: 'flat', description: 'Flat or insufficient periods' };
  }

  const values = seriesData
    .map(d => Number(d[yAxisKey]))
    .filter(val => !isNaN(val));

  if (values.length < 3) {
    return { slope: 0, direction: 'flat', description: 'Flat or insufficient periods' };
  }

  // Calculate simple linear regression slope
  // y = mx + c
  const n = values.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += values[i];
    sumXY += i * values[i];
    sumXX += i * i;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;

  // Let's compute average value to check relative slope magnitude
  const averageValue = sumY / n;
  const relativeSlope = averageValue !== 0 ? slope / Math.abs(averageValue) : slope;

  let direction: 'strongly_up' | 'slightly_up' | 'flat' | 'slightly_down' | 'strongly_down' = 'flat';
  let description = "Steady performance";

  if (relativeSlope > 0.05) {
    direction = 'strongly_up';
    description = "Showing high growth";
  } else if (relativeSlope > 0.01) {
    direction = 'slightly_up';
    description = "Slight upward trajectory";
  } else if (relativeSlope < -0.05) {
    direction = 'strongly_down';
    description = "In significant decline";
  } else if (relativeSlope < -0.01) {
    direction = 'slightly_down';
    description = "Slight downward curve";
  }

  return {
    slope,
    direction,
    description
  };
}
