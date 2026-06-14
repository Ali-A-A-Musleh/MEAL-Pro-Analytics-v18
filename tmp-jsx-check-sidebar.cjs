const fs = require('fs');
const path = 'D:/app/MEAL Pro Analytics v26/src/App.jsx';
const text = fs.readFileSync(path, 'utf8');
const start = text.indexOf('<aside className={`sidebar-mobile');
const end = text.indexOf('</aside>', start);
if (start === -1 || end === -1) {
  console.log('Could not find aside boundaries.');
  process.exit(1);
}
const snippet = text.slice(start, end + '</aside>'.length);
const tagRegex = /<\/?([A-Za-z_][A-Za-z0-9_]*)\b[^>]*>/g;
const stack = [];
let m;
const lineNumbers = [];
let line = 1;
for (let i = 0; i < snippet.length; i++) {
  lineNumbers[i] = line;
  if (snippet[i] === '\n') line++;
}
while ((m = tagRegex.exec(snippet)) !== null) {
  const raw = m[0];
  const name = m[1];
  const selfClosing = /\/>$/.test(raw);
  const isClose = raw.startsWith('</');
  if (['div', 'aside', 'Suspense', 'motion', 'AnimatePresence', 'section'].includes(name)) {
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
stack.forEach(item => console.log('unclosed', item.name, 'opened at', item.line, item.raw.slice(0,80)));
