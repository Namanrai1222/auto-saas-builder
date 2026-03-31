const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const util = require('util');
const execPromise = util.promisify(exec);

async function runDevAgent(idea) {
    console.log("[Dev Agent] Generating Next.js project using OpenClaw...");
    // Output directory for the new SaaS project
    const projectPath = path.join(__dirname, '../../builds', `saas-${Date.now()}`);
    
    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
    }

    // Command to instruct openclaw to write the code. We provide a dummy session-id for the CLI.
    const prompt = `Create a Next.js SaaS project. Topic: ${idea.title}. Description: ${idea.description}. Features: ${idea.features.join(', ')}. Write the project code strictly to the directory: ${projectPath}. CRITICAL CONSTRAINT: DO NOT include any hardcoded secrets, API_KEYs, or tokens in the codebase.`;
    const command = `openclaw agent --session-id local-saas-builder --message "${prompt}"`;

    try {
        console.log("[Dev Agent] Executing OpenClaw CLI...");
        // Execution timeout set to 5 minutes to accommodate generation time
        const { stdout, stderr } = await execPromise(command, { timeout: 300000 });
        console.log("[Dev Agent] OpenClaw executed successfully.");
    } catch (error) {
        console.warn("[Dev Agent] OpenClaw execution failed (expected if unauthenticated). Error:", error.message.split('\n')[0]);
    }

    // Fallback for MVP if OpenClaw doesn't create the package.json properly during headless tests
    if (!fs.existsSync(path.join(projectPath, 'package.json'))) {
         console.log("[Dev Agent] Warning: package.json missing. Injecting MVP stub files for the pipeline.");
         fs.writeFileSync(path.join(projectPath, 'package.json'), JSON.stringify({ name: "mvp-saas", version: "1.0.0" }, null, 2));
         fs.writeFileSync(path.join(projectPath, 'index.js'), "console.log('MVP Init');");
    }

    return projectPath;
}

module.exports = { runDevAgent };
