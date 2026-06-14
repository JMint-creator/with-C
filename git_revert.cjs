const { execSync } = require('child_process');
try {
    const output = execSync('git checkout src/MomentsView.tsx', { encoding: 'utf8' });
    console.log("Git checkout output:", output);
} catch (err) {
    console.error("Git checkout failed:", err.message);
}
