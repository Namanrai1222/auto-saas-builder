require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { runIdeaAgent } = require('../agents/idea');
const { runResearchAgent } = require('../agents/research');
const { runUiAgent } = require('../agents/ui');
const { runDevAgent } = require('../agents/dev');
const { runSecurityAgent } = require('../agents/security');
const { runValidatorAgent } = require('../agents/validator');
const { runFixAgent } = require('../agents/fix');
const { runGithubAgent } = require('../agents/github');
const { runNotifyAgent } = require('../agents/notify');
const { runQualityAgent } = require('../agents/quality');

// V3 Execution & Anti-Spam Bounds
const MAX_FIX_RETRIES = 3;
const DAILY_REPO_LIMIT = 2; // Prevent aggressive uncontrolled scaling

// Set up persistent logging layer natively available on Cloud runners globally across sequential cycles
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });

function enforceRateLimit() {
    const today = new Date().toISOString().split('T')[0];
    const limitsFile = path.join(logsDir, 'rate-limit.json');
    let limits = {};
    if (fs.existsSync(limitsFile)) limits = JSON.parse(fs.readFileSync(limitsFile, 'utf8'));

    if (limits.date !== today) {
        limits = { date: today, count: 0 };
    }

    if (limits.count >= DAILY_REPO_LIMIT) {
        console.warn(`[Anti-Spam Engine] Daily repository limit (${DAILY_REPO_LIMIT}) gracefully reached. Hibernating pipeline.`);
        process.exit(0); // Exit code 0 so github actions does not fail red
    }

    limits.count += 1;
    fs.writeFileSync(limitsFile, JSON.stringify(limits));
}

async function executePipeline() {
    console.log("=== AUTONOMOUS MULTI-AGENT SaaS BUILDER v3 (HARDENED RELIABILITY) ===");
    
    // MANDATORY REMOTE KILL SWITCH
    if (process.env.SYSTEM_ENABLED === "false") {
        console.log("[KILL SWITCH] System explicitly disabled via environment configuration. Shutting down securely.");
        process.exit(0);
    }

    // Apply anti-spam thresholds
    enforceRateLimit();

    // Isolated Event Logging telemetry for observability
    const runLog = {
        timestamp: new Date().toISOString(),
        idea: null,
        buildAttempts: 0,
        qualityScore: 0,
        confidenceScore: 0,
        status: "RUNNING",
        error: null
    };

    try {
        console.log("\n--- [1] IDEA PHASE & FILTERING ---");
        const idea = await runIdeaAgent();
        runLog.idea = idea.title;

        if (idea.title.toLowerCase().includes("todo") || Object.keys(idea).length < 2) {
            throw new Error("Idea Quality Filter Rejected: Detected generic or low-value target generation.");
        }
        console.log(`Targeting: ${idea.title}`);

        console.log("\n--- [2] RESEARCH (PRODUCT MANAGER) PHASE ---");
        const research = await runResearchAgent(idea);

        console.log("\n--- [3] UI/UX (DESIGN SYSTEMS) PHASE ---");
        const ui = await runUiAgent(idea, research);

        console.log("\n--- [4] DEV GENERATION PHASE ---");
        const projectPath = await runDevAgent(idea, research, ui);

        console.log("\n--- [5] PRE-BUILD SECURITY GATE ---");
        await runSecurityAgent(projectPath);

        console.log("\n--- [6] ITERATIVE BUILD & SELF-HEALING PHASE ---");
        let isBuildValid = false;
        let attempts = 0;

        while (attempts < MAX_FIX_RETRIES && !isBuildValid) {
            attempts++;
            runLog.buildAttempts = attempts;
            console.log(`\n[Orchestrator] Build Attempt ${attempts}/${MAX_FIX_RETRIES}`);
            
            const validationResult = await runValidatorAgent(projectPath);
            
            if (validationResult.status === "success") {
                isBuildValid = true;
                break;
            } else {
                console.log(`[Orchestrator] Build crashed. Handing compilation trace over to Fix Agent...`);
                await runFixAgent(projectPath, validationResult.errors);
            }
        }

        if (!isBuildValid) {
            throw new Error(`Orchestrator FATAL: Failed to produce a compiling build safely after ${MAX_FIX_RETRIES} attempts.`);
        }

        console.log("\n--- [7] QUALITY & CONFIDENCE GATES ---");
        await runSecurityAgent(projectPath);
        
        const qualityResult = await runQualityAgent(projectPath);
        runLog.qualityScore = qualityResult.score;

        const errorPenalty = (attempts - 1) * 12;
        let confidence = qualityResult.score - errorPenalty;
        confidence = Math.max(0, confidence);
        runLog.confidenceScore = confidence;

        console.log(`[Orchestrator] Final Confidence Formulation Score: ${confidence}/100.`);

        if (confidence < 75) {
            throw new Error(`Confidence Threshold Failure (Score: ${confidence} < 75). Rejecting deployment to protect GitHub Repository brand identity.\nQA Issues Flagged: ${qualityResult.issues.join(' | ')}`);
        }

        console.log("\n--- [8] GITHUB DEPLOYMENT PHASE ---");
        const repoUrl = await runGithubAgent(projectPath);

        console.log("\n--- [9] NOTIFICATION PHASE ---");
        await runNotifyAgent({
            success: true,
            message: `Your Production SaaS is LIVE! 🚀\nApp: ${idea.title}\nConfidence Score: ${confidence}%\nRepo: ${repoUrl}`
        });

        runLog.status = "SUCCESS";
        console.log("\n=== V3 PIPELINE COMPLETED RELIABLY ===");

    } catch (error) {
        runLog.status = "FAILED";
        runLog.error = error.message;
        console.error(`\n[!] PRODUCTION SYSTEM HALT: ${error.message}`);
        
        // Notify of partial or hard failure safely
        await runNotifyAgent({
            success: false,
            message: `System Failure Caught by Safety Constraints.\nReason: ${error.message.split('\n')[0]}`
        });
        process.exit(1); 
    } finally {
        // Output deep telemetry to JSON regardless of execution fate
        fs.writeFileSync(path.join(logsDir, `run-${Date.now()}.json`), JSON.stringify(runLog, null, 2));
    }
}

module.exports = { executePipeline };
