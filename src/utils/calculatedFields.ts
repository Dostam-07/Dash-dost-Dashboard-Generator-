export interface CalculatedFieldDef {
  name: string;
  formula: string; // e.g. "(revenue - cost) / revenue" OR "sales * 0.15"
  type: 'numeric' | 'categorical';
  description: string;
}

// Safely evaluates a math formula against a data row
export function evaluateFormulaOnRow(
  row: Record<string, any>,
  formula: string,
  allColumnNames: string[]
): number | null {
  try {
    let expression = formula;

    // Sort column names from longest to shortest to prevent sub-string collision
    const sortedKeys = [...allColumnNames].sort((a, b) => b.length - a.length);

    // Replace column names with their values
    sortedKeys.forEach(colName => {
      if (expression.includes(colName)) {
        // Retrieve cell and strip commas or symbols
        const cellValue = row[colName];
        let numVal = 0;
        if (cellValue !== undefined && cellValue !== null) {
          const sv = String(cellValue).replace(/[\$,₹,%]/g, '');
          const parsed = Number(sv);
          numVal = isNaN(parsed) ? 0 : parsed;
        }
        
        // Use RegExp to replace column names as physical variables (safeguard with boundary check)
        const escaped = colName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'g');
        expression = expression.replace(regex, String(numVal));
      }
    });

    // Clean expression to contain ONLY safe mathematical characters: numbers, decimals, plus, minus, star, slash, brackets, spaces
    const safeExpr = expression.replace(/[^0-9\+\-\*\/\(\)\.e\s]/g, '');
    
    if (safeExpr.trim() === '') return 0;

    // Use a sandboxed Safe Function constructor to compile and calculate
    const calculator = new Function(`return (${safeExpr});`);
    const result = calculator();
    
    if (typeof result === 'number' && !isNaN(result) && isFinite(result)) {
      return result;
    }
    return 0;
  } catch (err) {
    console.warn("[Formula Eval Error]", err);
    return null;
  }
}

// Evaluates a calculated field definition across all rows of the dataset
export function applyCalculatedFieldToRows(
  rows: any[],
  columns: any[],
  field: CalculatedFieldDef
): any[] {
  if (!rows || rows.length === 0) return rows;
  const colNames = columns.map(c => c.name);
  
  return rows.map(row => {
    const calculated = evaluateFormulaOnRow(row, field.formula, colNames);
    return {
      ...row,
      [field.name]: calculated
    };
  });
}
