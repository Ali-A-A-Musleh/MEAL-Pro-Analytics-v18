const fs = require('fs');
const path = 'D:/app/MEAL Pro Analytics v26/src/App.jsx';
const text = fs.readFileSync(path, 'utf8');
const lines = text.split(/\r?\n/);
const start = 1980;
const end = 2160;
for (let i = start - 1; i < end; i++) {
  const line = lines[i] || '';
  console.log(String(i + 1).padStart(4), line);
}
