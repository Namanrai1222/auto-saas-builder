require('dotenv').config(); // Load local .env during testing
const { runOrchestrator } = require('../orchestrator/index.js');

console.log(`[CRON] Workflow triggered at ${new Date().toISOString()}`);

runOrchestrator()
    .then(() => {
        console.log("[CRON] Run completed successfully.");
        process.exit(0);
    })
    .catch((err) => {
        console.error("[CRON] Run failed fatally.");
        process.exit(1);
    });
