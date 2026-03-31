require('dotenv').config();
const { runIdeaAgent } = require('../agents/idea');
const { runDevAgent } = require('../agents/dev');
const { runSecurityAgent } = require('../agents/security');
const { runValidatorAgent } = require('../agents/validator');
const { runFixAgent } = require('../agents/fix');
const { runGithubAgent } = require('../agents/github');
const { runNotifyAgent } = require('../agents/notify');

const MAX_FIX_RETRIES = 3;

async function executePipeline() {
    console.log("=== AUTONOMOUS MULTI-AGENT SaaS BUILDER v2 (PRODUCTION) ===");
    
    try {
        console.log("\n--- [1] IDEA PHASE ---");
        const idea = await runIdeaAgent();
        console.log(`Targeting: ${idea.title}`);

        console.log("\n--- [2] DEV GENERATION PHASE ---");
        // Strictly generates code without mock fallbacks
        const projectPath = await runDevAgent(idea);

        console.log("\n--- [3] PRE-BUILD SECURITY GATE ---");
        await runSecurityAgent(projectPath);

        console.log("\n--- [4] ITERATIVE BUILD & SELF-HEALING PHASE ---");
        let isBuildValid = false;
        let attempts = 0;

        while (attempts < MAX_FIX_RETRIES && !isBuildValid) {
            attempts++;
            console.log(`\n[Orchestrator] Build Attempt ${attempts}/${MAX_FIX_RETRIES}`);
            
            const validationResult = await runValidatorAgent(projectPath);
            
            if (validationResult.status === "success") {
                isBuildValid = true;
                break;
            } else {
                console.log(`[Orchestrator] Build crashed. Handing execution trace over to Fix Agent...`);
                await runFixAgent(projectPath, validationResult.errors);
            }
        }

        if (!isBuildValid) {
            throw new Error(`Orchestrator FATAL: Failed to produce a compiling build after ${MAX_FIX_RETRIES} attempts.`);
        }

        console.log("\n--- [5] POST-COMPILATION SECURITY GATES ---");
        // Re-run security to ensure Fix agent didn't inject malicious modules
        console.log(`[Orchestrator] Running Final Security Audit post-compilation...`);
        await runSecurityAgent(projectPath);

        console.log("\n--- [6] GITHUB DEPLOYMENT PHASE ---");
        const repoUrl = await runGithubAgent(projectPath);

        console.log("\n--- [7] NOTIFICATION PHASE ---");
        await runNotifyAgent({
            success: true,
            message: `Your Prod-Ready SaaS is LIVE! 🚀\nApp: ${idea.title}\nRepo: ${repoUrl}`
        });

        console.log("\n=== V2 PIPELINE COMPLETED SUCCESSFULLY ===");

    } catch (error) {
        console.error(`\n[!] PIPELINE FATAL ERROR: ${error.message}`);
        await runNotifyAgent({
            success: false,
            message: `Pipeline halted during autonomous execution.\nError: ${error.message.split('\n')[0]}`
        });
        process.exit(1); // Properly exit with error for GitHub Actions runner status
    }
}

module.exports = { executePipeline };
