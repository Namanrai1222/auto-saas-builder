const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

async function runFixAgent(projectPath, validationErrors) {
    console.log(`[Fix Agent] Deploying self-healing patch to broken codebase at ${projectPath}...`);

    // Clean up extreme log verbosity or injections
    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9., ?!':\/\-\{\}\[\]\n\\]/g, '').slice(0, 1500); 
    const cleanErrors = sanitize(validationErrors.join(' | \n'));
    
    const prompt = `The Next.js project inside ${projectPath} failed to build via npm run build. Here are the fatal compiler errors:\n${cleanErrors}\n\nDiagnose these errors and patch the codebase inside the workspace to resolve them. ONLY output fixes to that exact directory. Ensure package.json dependencies match your code.`;
    
    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'openclaw.cmd' : 'openclaw';
    
    try {
        console.log("[Fix Agent] Sourcing OpenClaw to intelligently patch files...");
        await execFilePromise(cmd, ['agent', '--session-id', 'local-saas-builder', '--message', prompt], { shell: isWin, timeout: 300000 });
        console.log("[Fix Agent] Patch cycle complete. Returning over to Validator.");
        return true;
    } catch (error) {
        throw new Error(`[Fix Agent] Self-healing logic critically failed: ${error.message.split('\n')[0]}`);
    }
}

module.exports = { runFixAgent };
