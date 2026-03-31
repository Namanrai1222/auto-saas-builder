const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runValidatorAgent(projectPath) {
    console.log(`[Validator Agent] Initiating strict build compilation at ${projectPath}...`);
    
    try {
        console.log(`[Validator Agent] Installing dependencies (ignoring malicious postinstall scripts)...`);
        await execPromise('npm install --ignore-scripts', { cwd: projectPath, timeout: 120000 });
        
        console.log(`[Validator Agent] Compiling production build...`);
        // We capture stderr directly so it can feed the Fix Agent on failure
        await execPromise('npm run build', { cwd: projectPath, timeout: 300000 });

        console.log(`[Validator Agent] Success! Project compiles flawlessly.`);
        return { status: "success" };

    } catch (error) {
        console.error(`[Validator Agent] BUILD FAILED! Extracting logs for self-healing logic.`);
        const logs = error.stdout ? error.stdout.toString() : "";
        const errLogs = error.stderr ? error.stderr.toString() : error.message;
        
        return { 
            status: "failed", 
            errors: [errLogs, logs] 
        };
    }
}

module.exports = { runValidatorAgent };
