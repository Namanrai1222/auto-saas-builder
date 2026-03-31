const { execFile } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

const execFilePromise = util.promisify(execFile);

async function runDevAgent(idea) {
    console.log("[Dev Agent] Generating Next.js project using OpenClaw...");
    const projectPath = path.join(__dirname, '../../builds', `saas-${Date.now()}`);
    
    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
    }

    // Strict sanitization to completely prevent RCE
    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9., ?!'-]/g, '');
    const safeTitle = sanitize(idea.title);
    const safeDesc = sanitize(idea.description);
    const safeFeatures = (idea.features || []).map(f => sanitize(f)).join(', ');

    const prompt = `Create a complete, installable Next.js App Router project for a SaaS. Topic: ${safeTitle}. Description: ${safeDesc}. Features: ${safeFeatures}. Write the production-ready code tightly to the directory: ${projectPath}. CRITICAL CONSTRAINT: DO NOT include any hardcoded secrets, API_KEYs, or security tokens in the codebase. Ensure package.json defines all necessary dependencies.`;

    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'openclaw.cmd' : 'openclaw';

    try {
        console.log("[Dev Agent] Executing OpenClaw CLI...");
        await execFilePromise(cmd, ['agent', '--session-id', 'local-saas-builder', '--message', prompt], { shell: isWin, timeout: 300000 });
        console.log("[Dev Agent] OpenClaw completed code generation.");
    } catch (error) {
        throw new Error(`[Dev Agent] OpenClaw fatal crash during generation: ${error.message.split('\n')[0]}`);
    }

    // Production Constraint: NO FALLBACK MOCKS. System must fail if openclaw hallucinated wrongly.
    if (!fs.existsSync(path.join(projectPath, 'package.json'))) {
         throw new Error("[Dev Agent] FATAL: OpenClaw failed to generate a valid project structure (missing package.json).");
    }

    return projectPath;
}

module.exports = { runDevAgent };
