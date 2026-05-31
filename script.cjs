const fs = require('fs');

let content = fs.readFileSync('src/ChatView.tsx', 'utf-8');
content = content.replace(/new Date\(\)\.toLocaleTimeString\(\[\]\, \{ hour\: \'2\-digit\'\, minute\: \'2\-digit\' \}\)/g, 'getFormatTime()');
fs.writeFileSync('src/ChatView.tsx', content);
console.log('Replaced all.');
