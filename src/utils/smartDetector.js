import { z } from 'zod';

/**
 * Smartly detects the data type of a column based on its values.
 * Identifies 'select_multiple' if values contain typical delimiters (like commas, ; or pipes) and split items repeat, 
 * or if values are string arrays / multiple words that show recurring item patterns.
 * 
 * @param {Array} columnData - Array of raw cell values in the column
 * @returns {'select_multiple' | 'number' | 'text'}
 */
export function detectColumnType(columnData) {
  if (!columnData || columnData.length === 0) return 'text';

  // Filter out null/undefined/empty string values
  const validValues = columnData.filter(v => v !== undefined && v !== null && v !== '');
  if (validValues.length === 0) return 'text';

  // Check if it is a numeric column
  const numericCount = validValues.filter(v => !isNaN(Number(v)) && v !== '').length;
  if (numericCount / validValues.length > 0.8) {
    return 'number';
  }

  // Common delimiters to check
  const delimiters = [',', ';', '|'];
  const stringValues = validValues.map(v => String(v).trim());

  // Check if any standard delimiter split values are highly repetitive AND present in >80% of cells
  for (const delim of delimiters) {
    const linesWithDelim = stringValues.filter(v => v.includes(delim));
    if (linesWithDelim.length / stringValues.length > 0.8) {
      // Over 80% have this delimiter. Let's see if individual parts recur
      const allParts = [];
      stringValues.forEach(v => {
        v.split(delim).forEach(part => {
          const trimmed = part.trim();
          if (trimmed) allParts.push(trimmed);
        });
      });
      const uniqueParts = new Set(allParts);
      if (uniqueParts.size > 1 && allParts.length > uniqueParts.size * 1.1) {
        return 'select_multiple';
      }
    }
  }

  return 'text';
}

/**
 * Returns delimiters used or attempts to find the best split system
 * @param {string} val 
 * @returns {string}
 */
export function detectDelimiter(val) {
  if (val.includes(',')) return ',';
  if (val.includes(';')) return ';';
  if (val.includes('|')) return '|';
  return ' ';
}

/**
 * Extract unique choices from a multiple choice column
 * @param {Array} rows 
 * @param {string} colName 
 * @returns {Array<string>} list of unique choices
 */
export function getUniqueChoices(rows, colName) {
  if (!rows || rows.length === 0 || !colName) return [];
  
  // Try to find if this colName represents a Kobo-style slash prefix
  const firstRow = rows[0];
  const rowKeys = Object.keys(firstRow || {});
  const prefix = `${colName}/`;
  const childCols = rowKeys.filter(k => k.startsWith(prefix));
  
  if (childCols.length > 0) {
    const choices = childCols.map(c => c.slice(prefix.length).trim());
    return choices.sort();
  }

  const choices = new Set();
  rows.forEach(row => {
    const val = row[colName];
    if (val === undefined || val === null || val === '') return;
    const str = String(val).trim();
    const delim = detectDelimiter(str);
    str.split(delim).forEach(p => {
      const cleaned = p.trim();
      if (cleaned) choices.add(cleaned);
    });
  });
  return [...choices].sort();
}

/**
 * Autonomously flattens select_multiple column values into 1/0 binary columns 
 * Merge them back with the original rows.
 * 
 * @param {Array<Object>} rows 
 * @param {Object} columnTypes - Map of colName -> type
 * @returns {{ flattenedRows: Array<Object>, uniqueChoicesMap: Object }}
 */
export function flattenMultipleChoice(rows, columnTypes) {
  if (!rows || rows.length === 0) return { flattenedRows: [], uniqueChoicesMap: {} };

  const selectMultipleCols = Object.keys(columnTypes).filter(col => columnTypes[col] === 'select_multiple');
  const uniqueChoicesMap = {};

  // Gather unique options for each multiple column
  selectMultipleCols.forEach(col => {
    uniqueChoicesMap[col] = getUniqueChoices(rows, col);
  });

  // Perform flattening for each row
  const flattenedRows = rows.map(row => {
    const newRow = { ...row };
    selectMultipleCols.forEach(col => {
      const choices = uniqueChoicesMap[col] || [];
      const prefix = `${col}/`;
      const rowKeys = Object.keys(row);
      const childCols = rowKeys.filter(k => k.startsWith(prefix));
      
      if (childCols.length > 0) {
        // Read directly from Kobo-style separate columns with values 0 or 1
        choices.forEach(choice => {
          const binaryColName = `${col}__${choice}`;
          const sourceColName = `${col}/${choice}`;
          const val = row[sourceColName];
          // Kobo puts 1 if chosen, 0 if not (or "1", true, etc.)
          const isSelected = val == 1 || val === '1' || val === true || String(val).toLowerCase() === 'true' || String(val).trim() === choice;
          newRow[binaryColName] = isSelected ? 1 : 0;
        });
      } else {
        // Standard delimited text
        const val = row[col];
        const currentValues = new Set();
        
        if (val !== undefined && val !== null && val !== '') {
          const str = String(val).trim();
          const delim = detectDelimiter(str);
          str.split(delim).forEach(p => {
            const cleaned = p.trim();
            if (cleaned) currentValues.add(cleaned);
          });
        }

        // Populate Binary columns
        choices.forEach(choice => {
          const binaryColName = `${col}__${choice}`;
          newRow[binaryColName] = currentValues.has(choice) ? 1 : 0;
        });
      }
    });
    return newRow;
  });

  return { flattenedRows, uniqueChoicesMap };
}

/**
 * High quality validation of the flattened multiple choice dataset schema using Zod.
 * Ensures all binary columns contain only 0 or 1, and original structures remain intact.
 * 
 * @param {Array<Object>} data 
 * @param {Array<string>} selectMultipleCols 
 * @param {Object} uniqueChoicesMap 
 * @returns {{ success: boolean, error?: any }}
 */
export function validateFlattenedData(data, selectMultipleCols, uniqueChoicesMap) {
  if (!data || data.length === 0) return { success: true };

  const shape = {};
  selectMultipleCols.forEach(col => {
    const choices = uniqueChoicesMap[col] || [];
    choices.forEach(choice => {
      const binaryFieldName = `${col}__${choice}`;
      // In flattened binary output, value must be strictly 0 or 1
      shape[binaryFieldName] = z.union([z.literal(0), z.literal(1)]);
    });
  });

  // Dynamic schema matching the binary columns and letting other fields pass through
  const rowSchema = z.object(shape).passthrough();
  const arrSchema = z.array(rowSchema);

  const parsed = arrSchema.safeParse(data);
  return {
    success: parsed.success,
    error: parsed.error
  };
}
