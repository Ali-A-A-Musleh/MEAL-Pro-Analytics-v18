const fs = require('fs');
const path = 'D:/app/MEAL Pro Analytics v26/src/App.jsx';
const text = fs.readFileSync(path, 'utf8');
const tagRegex = /<\/?([A-Za-z_][A-Za-z0-9_]*)\b[^>]*>/g;
const stack = [];
let m;
const lineNumbers = [];
let line = 1;
for (let i = 0; i < text.length; i++) {
  lineNumbers[i] = line;
  if (text[i] === '\n') line++;
}
while ((m = tagRegex.exec(text)) !== null) {
  const raw = m[0];
  const name = m[1];
  const selfClosing = /\/>$/.test(raw);
  const isClose = raw.startsWith('</');
  if (['div', 'aside', 'Suspense'].includes(name)) {
    if (isClose) {
      if (stack.length === 0) {
        console.log('unexpected closing', name, 'at', lineNumbers[m.index]);
      } else {
        const top = stack[stack.length - 1];
        if (top.name === name) {
          stack.pop();
        } else {
          console.log('mismatch closing', name, 'expected', top.name, 'at', lineNumbers[m.index]);
          stack.pop();
        }
      }
    } else if (!selfClosing) {
      stack.push({ name, line: lineNumbers[m.index], raw });
    }
  }
}
console.log('stack remains', stack.length);
stack.forEach(item => console.log('unclosed', item.name, 'opened at', item.line, JSON.stringify(item.raw.slice(0,40))));
