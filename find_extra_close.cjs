const fs = require('fs');
const code = fs.readFileSync('src/MomentsView.tsx', 'utf8');

let braceCount = 0;
const lines = code.split('\n');

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let cleanLine = line.replace(/\/\/.*$/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
    cleanLine = cleanLine.replace(/'[^']*'/g, '').replace(/"[^"]*"/g, '').replace(/`[^`]*`/g, '');

    for (let char of cleanLine) {
        if (char === '{') braceCount++;
        if (char === '}') braceCount--;
    }
    
    // The main function MomentsView starts at some line, let's observe its level
    if (line.includes('export function MomentsView')) {
        console.log(`MomentsView begins at line ${i+1}. Current brace level = ${braceCount}`);
    }
    if (i >= 340 && i <= 420) {
        console.log(`Line ${i + 1}: brace=${braceCount} | ${line.trim()}`);
    }
}
