import { ColumnProfile } from '../types';

export function profileColumn(rows: any[], columnName: string): ColumnProfile {
  let nullCount = 0;
  const values: any[] = [];
  
  for (const row of rows) {
    if (!row) continue;
    const val = row[columnName];
    if (val === undefined || val === null || String(val).trim() === '') {
      nullCount++;
    } else {
      values.push(val);
    }
  }

  const totalCount = rows.length || 1;
  const uniqueVals = Array.from(new Set(values));
  const uniqueCount = uniqueVals.length;

  // Type inference
  const geoTerms = ['country', 'region', 'state', 'city', 'territory', 'nation', 'location', 'geo', 'province', 'district', 'continent'];
  const nameLower = columnName.toLowerCase();
  const isGeoName = geoTerms.some(term => nameLower.includes(term));
  
  // Try to parse values
  let numericCount = 0;
  let dateCount = 0;
  const parsedNumbers: number[] = [];
  const parsedDates: Date[] = [];

  for (const v of values) {
    const strVal = String(v).trim();
    
    // Check numeric
    const strippedNum = strVal.replace(/[\$,₹,%]/g, '');
    const num = Number(strippedNum);
    if (!isNaN(num) && strippedNum !== "") {
      numericCount++;
      parsedNumbers.push(num);
    }

    // Check date
    const timestamp = Date.parse(strVal);
    // Basic date heuristics: must have long enough string, not purely numeric, parses to a date
    if (!isNaN(timestamp) && strVal.length >= 6 && isNaN(Number(strVal))) {
      dateCount++;
      parsedDates.push(new Date(timestamp));
    }
  }

  let type: 'numeric' | 'categorical' | 'date' | 'geographic' = 'categorical';
  if (isGeoName && uniqueCount <= 250) {
    type = 'geographic';
  } else if (numericCount > values.length * 0.7) {
    type = 'numeric';
  } else if (dateCount > values.length * 0.7) {
    type = 'date';
  }

  const profile: ColumnProfile = {
    name: columnName,
    type,
    nullCount,
    uniqueValues: uniqueCount
  };

  if (type === 'numeric' && parsedNumbers.length > 0) {
    const min = Math.min(...parsedNumbers);
    const max = Math.max(...parsedNumbers);
    const sum = parsedNumbers.reduce((a, b) => a + b, 0);
    const mean = sum / parsedNumbers.length;
    
    const squareDiffs = parsedNumbers.map(n => Math.pow(n - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / (squareDiffs.length || 1);
    const stdDev = Math.sqrt(avgSquareDiff);

    profile.min = min;
    profile.max = max;
    profile.mean = Number(mean.toFixed(2));
    profile.stdDev = Number(stdDev.toFixed(2));
  } else if (type === 'date' && parsedDates.length > 0) {
    const sorted = parsedDates.sort((a, b) => a.getTime() - b.getTime());
    profile.min = sorted[0].toISOString().split('T')[0];
    profile.max = sorted[sorted.length - 1].toISOString().split('T')[0];
  }

  // Get top unique values and frequencies
  if (type === 'categorical' || type === 'geographic' || type === 'date') {
    const freqMap: Record<string, number> = {};
    for (const v of values) {
      const s = String(v);
      freqMap[s] = (freqMap[s] || 0) + 1;
    }
    const sortedFreqs = Object.entries(freqMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    profile.topValues = sortedFreqs.map(([val, count]) => `${val} (${((count / totalCount) * 100).toFixed(1)}%)`);
  }

  return profile;
}

export function profileDataset(rows: any[], fileName: string) {
  if (!rows || rows.length === 0) {
    return { fileName, rows: [], columns: [], rowCount: 0 };
  }
  const keys = Object.keys(rows[0] || {});
  const columns = keys.map(k => profileColumn(rows, k));
  return {
    fileName,
    rows,
    columns,
    rowCount: rows.length
  };
}
