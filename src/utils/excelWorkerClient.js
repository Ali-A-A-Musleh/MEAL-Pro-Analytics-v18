const parseOnMainThread = async (arrayBuffer) => {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(arrayBuffer);
  
  const sheetNames = [];
  const sheetsData = {};

  workbook.eachSheet((worksheet) => {
    sheetNames.push(worksheet.name);
    const rows = [];
    let headers = [];
    
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) {
        row.eachCell((cell, colNumber) => {
          let val = cell.value;
          if (val && typeof val === 'object' && val.richText) {
            val = val.richText.map(rt => rt.text).join('');
          }
          headers[colNumber] = val ? String(val).trim() : `Column_${colNumber}`;
        });
      } else {
        const rowData = {};
        let hasData = false;
        row.eachCell((cell, colNumber) => {
          const header = headers[colNumber];
          if (header) {
            let val = cell.value;
            if (val !== null && val !== undefined) {
              if (typeof val === 'object') {
                if (val.richText) val = val.richText.map(rt => rt.text).join('');
                else if (val instanceof Date) val = val.toISOString();
                else if (val.text) val = val.text;
                else if (val.result !== undefined) val = val.result;
                else val = String(val);
              }
              rowData[header] = val;
              hasData = true;
            } else {
              rowData[header] = '';
            }
          }
        });
        headers.forEach((h) => {
          if (h && rowData[h] === undefined) {
            rowData[h] = '';
          }
        });
        if (hasData) {
          rows.push(rowData);
        }
      }
    });
    sheetsData[worksheet.name] = rows;
  });

  return { sheetNames, sheetsData };
};

const exportExcelOnMainThread = async (rows, sheetName) => {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName || 'Sheet1');
  
  if (rows && rows.length > 0) {
    const columns = Object.keys(rows[0]).map(key => ({ header: key, key: key }));
    worksheet.columns = columns;
    rows.forEach(row => {
      worksheet.addRow(row);
    });
  }
  
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

const exportCsvOnMainThread = async (rows, sheetName) => {
  const ExcelJSModule = await import('exceljs');
  const ExcelJS = ExcelJSModule.default || ExcelJSModule;
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName || 'Sheet1');
  
  if (rows && rows.length > 0) {
    const columns = Object.keys(rows[0]).map(key => ({ header: key, key: key }));
    worksheet.columns = columns;
    rows.forEach(row => {
      worksheet.addRow(row);
    });
  }
  
  const buffer = await workbook.csv.writeBuffer();
  return new Blob([buffer], { type: 'text/csv;charset=utf-8;' });
};

const runWithWorkerFallback = async (action, payload, fallbackFn) => {
  return new Promise((resolve, reject) => {
    let worker = null;
    let fallbackCalled = false;

    const triggerFallback = async (originalErr) => {
      if (fallbackCalled) return;
      fallbackCalled = true;
      if (worker) {
        try { worker.terminate(); } catch (e) {
          // ignore
        }
      }
      try {
        const result = await fallbackFn();
        resolve(result);
      } catch (fallbackErr) {
        reject(new Error(`Worker execution failed (${originalErr?.message || originalErr}), and main-thread fallback failed: ${fallbackErr?.message || fallbackErr}`));
      }
    };

    try {
      worker = new Worker(new URL('../workers/excelWorker.js', import.meta.url), { type: 'module' });
      
      worker.onmessage = (ev) => {
        const data = ev.data;
        if (data && data.success && data.action === action) {
          if (action === 'parse') {
            resolve({ sheetNames: data.sheetNames, sheetsData: data.sheetsData });
          } else if (action === 'export_excel') {
            const blob = new Blob([data.buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            resolve(blob);
          } else if (action === 'export_csv') {
            const blob = new Blob([data.buffer], { type: 'text/csv;charset=utf-8;' });
            resolve(blob);
          }
        } else {
          triggerFallback(new Error(data?.error || 'Worker execution failed'));
        }
        if (worker) {
          worker.terminate();
        }
      };

      worker.onerror = (err) => {
        triggerFallback(err);
      };

      if (action === 'parse') {
        const { arrayBuffer } = payload;
        worker.postMessage({ action, payload: { arrayBuffer } }, [arrayBuffer]);
      } else {
        worker.postMessage({ action, payload });
      }

    } catch (err) {
      triggerFallback(err);
    }
  });
};

export const parseExcelFile = async (file) => {
  if (!file) throw new Error('No file provided');

  const arrayBuffer = await (file.arrayBuffer ? file.arrayBuffer() : new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result);
    reader.onerror = () => rej(new Error('File read failed'));
    reader.readAsArrayBuffer(file);
  }));

  return runWithWorkerFallback('parse', { arrayBuffer }, () => parseOnMainThread(arrayBuffer));
};

export const exportExcelData = (rows, sheetName = 'Sheet1') => {
  return runWithWorkerFallback('export_excel', { rows, sheetName }, () => exportExcelOnMainThread(rows, sheetName));
};

export const exportCsvData = (rows, sheetName = 'Sheet1') => {
  return runWithWorkerFallback('export_csv', { rows, sheetName }, () => exportCsvOnMainThread(rows, sheetName));
};
