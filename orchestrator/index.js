const fs = require('fs');
const path = require('path');

// Agents placeholders (will be implemented next)
const { runIdeaAgent } = require('../agents/idea.js');
const { runDevAgent } = require('../agents/dev.js');
const { runSecurityAgent } = require('../agents/security.js');
const { runValidatorAgent } = require('../agents/validator.js');
const { runGithubAgent } = require('../agents/github.js');
const { runNotifyAgent } = require('../agents/notify.js');

async function runOrchestrator() {
    console.log("Starting Autonomous SaaS Builder Pipeline...");
    try {
        // 1. Idea Agent
        console.log("--- [1] IDEA PHASE ---");
        const idea = await runIdeaAgent();
        if (!idea) {
            console.log("No valid idea found or generated. Skipping run.");
            return;
        }
        console.log(`Generated Idea: ${idea.title}`);

        // 2. Dev Agent
        console.log("\n--- [2] DEV PHASE ---");
        const projectPath = await runDevAgent(idea);
        console.log(`Project generated at: ${projectPath}`);

        // 3. Security Agent (CRITICAL)
        console.log("\n--- [3] SECURITY PHASE ---");
        const securityCheck = await runSecurityAgent(projectPath);
        if (!securityCheck.safe) {
            throw new Error(`Security validation failed! Issues: ${JSON.stringify(securityCheck.issues)}`);
        }
        console.log(`Security validation passed. No secrets exposed.`);

        // 4. Validator Agent
        console.log("\n--- [4] VALIDATION PHASE ---");
        const isValid = await runValidatorAgent(projectPath);
        if (!isValid) {
            throw new Error("Project build or validation failed.");
        }
        console.log(`Project validation passed.`);

        // 5. GitHub Agent
        console.log("\n--- [5] GITHUB PHASE ---");
        const repoUrl = await runGithubAgent(projectPath);
        console.log(`Project pushed to GitHub: ${repoUrl}`);

        // 6. Notify Agent
        console.log("\n--- [6] NOTIFY PHASE ---");
        await runNotifyAgent({
            success: true,
            message: `Successfully generated and pushed SaaS: ${idea.title}\nRepository: ${repoUrl}`
        });

        console.log("\nPipeline finished successfully!");
    } catch (error) {
        console.error("\n[!] PIPELINE ERROR:", error.message);
        try {
            await runNotifyAgent({
                success: false,
                message: `Pipeline failed during execution.\nError: ${error.message}`
            });
        } catch (notifyErr) {
            console.error("Failed to send failure notification:", notifyErr.message);
        }
        throw error; // Let the scheduler handle the exit code
    }
}

module.exports = {
    runOrchestrator
};
