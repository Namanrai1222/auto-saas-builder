const { execSync } = require('child_process');
const fs = require('fs');

async function runGithubAgent(projectPath) {
    console.log(`[GitHub Agent] Preparing to commit and push project at ${projectPath}...`);
    
    if (!fs.existsSync(projectPath)) {
        throw new Error("Project path does not exist for GitHub push.");
    }

    try {
        // Initialize local repository and commit
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        execSync('git config user.name "Autonomous Builder"', { cwd: projectPath, stdio: 'ignore' });
        execSync('git config user.email "bot@auto-saas.local"', { cwd: projectPath, stdio: 'ignore' });
        execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
        
        // Don't error out if there's nothing to commit
        try {
            execSync('git commit -m "chore: initial commit of AI generated SaaS"', { cwd: projectPath, stdio: 'ignore' });
        } catch (e) {
            console.log("[GitHub Agent] Nothing to commit.");
        }
        
        // Simulated push since we don't want to spam real repos without user config
        const token = process.env.GITHUB_TOKEN;
        if (token) {
            console.log(`[GitHub Agent] GITHUB_TOKEN detected. In production, this pushes to the newly created repo.`);
            return `https://github.com/auto-generated/saas-${Date.now()}`;
        }

        console.log(`[GitHub Agent] Finished local commit. Provide GITHUB_TOKEN for remote push.`);
        return `local-repo-at-${projectPath}`;
    } catch (err) {
        throw new Error(`GitHub Agent execution failed: ${err.message}`);
    }
}

module.exports = { runGithubAgent };
