const { execFile } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

const execFilePromise = util.promisify(execFile);

async function runDevAgent(idea, research, ui) {
    console.log("[Dev Agent] Sourcing combined Research & UI Contexts to compile Next.js codebase...");
    const projectPath = path.join(__dirname, '../../builds', `saas-${Date.now()}`);
    
    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
    }

    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9., ?!'-]/g, '');
    
    const safeTitle = sanitize(idea.title);
    const safeDesc = sanitize(idea.description);
    const safeFeatures = (research.coreFeatures || []).map(sanitize).join(', ');
    const safeDb = (research.databaseSchema || []).map(sanitize).join(', ');
    const safeFlow = sanitize(research.userFlow);
    
    const safePages = (ui.pages || []).map(sanitize).join(', ');
    const safeComponents = (ui.components || []).map(sanitize).join(', ');
    const safeStyles = (ui.tailwindDirectives || []).map(sanitize).join(', ');
    const primaryColor = sanitize(ui.colorPalette?.primary || 'blue-600');

    const prompt = `Create a complete, functionally installable Next.js App Router SaaS project. 
Topic: ${safeTitle}. Description: ${safeDesc}. 
Core Features Required: ${safeFeatures}. 
Database Schema Context: ${safeDb}. 
User Flow: ${safeFlow}.
Pages Required: ${safePages}.
Constituent Components: ${safeComponents}.
Design System & Aesthetics: ${safeStyles} leaning heavily on Primary Color ${primaryColor}.

Write the production-ready code tightly to the directory: ${projectPath}. 
CRITICAL CONSTRAINT: DO NOT include any hardcoded secrets, API_KEYs, or security tokens. Ensure package.json natively defines all dependencies including TailwindCSS!`;

    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'openclaw.cmd' : 'openclaw';

    try {
        console.log("[Dev Agent] Heavy-lifting Dev generation initiated...");
        await execFilePromise(cmd, ['agent', '--session-id', 'local-saas-builder', '--message', prompt], { shell: isWin, timeout: 300000 });
        console.log("[Dev Agent] Code generation finalized.");
    } catch (error) {
        throw new Error(`[Dev Agent] OpenClaw fatal crash: ${error.message.split('\n')[0]}`);
    }

    if (!fs.existsSync(path.join(projectPath, 'package.json'))) {
         throw new Error("[Dev Agent] FATAL: OpenClaw failed to generate a valid installable structure (missing package.json).");
    }

    return projectPath;
}

module.exports = { runDevAgent };
