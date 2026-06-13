import ExcelJS from 'exceljs';

self.onmessage = async (e) => {
  try {
    const { action, payload } = e.data;

    if (action === 'parse') {
      const { arrayBuffer } = payload;
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
            headers.forEach((h, colNumber) => {
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

      self.postMessage({ success: true, action: 'parse', sheetNames, sheetsData });
    } else if (action === 'export_excel') {
      const { rows, sheetName } = payload;
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
      self.postMessage({ success: true, action: 'export_excel', buffer }, [buffer]);
    } else if (action === 'export_csv') {
      const { rows, sheetName } = payload;
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
      self.postMessage({ success: true, action: 'export_csv', buffer }, [buffer]);
    }
  } catch (err) {
    self.postMessage({ success: false, error: String(err) });
  }
};
