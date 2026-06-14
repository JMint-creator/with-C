const fs = require('fs');
const path = require('path');

function searchAll(dir, maxDepth, currentDepth = 0) {
    if (currentDepth > maxDepth) return;
    try {
        const files = fs.readdirSync(dir);
        for (let file of files) {
            const fp = path.join(dir, file);
            let s;
            try { s = fs.statSync(fp); } catch(e) { continue; }
            if (s.isDirectory()) {
                if (file === 'node_modules' || file === '.git' || file === 'proc' || file === 'sys' || file === 'dev' || file === 'lib' || file === 'bin' || file === 'usr' || file === 'var' || file === 'dist' || file === 'public') continue;
                searchAll(fp, maxDepth, currentDepth + 1);
            } else {
                if (file === 'MomentsView.tsx') {
                    console.log("Found backup file at:", fp, "Size:", s.size);
                }
            }
        }
    } catch(e) {}
}

console.log("Searching parent files recursively up to depth 5...");
searchAll('/', 5);
console.log("Search finished.");
