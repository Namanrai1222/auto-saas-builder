const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function runGithubAgent(projectPath) {
    console.log(`[GitHub Agent] Preparing to commit and push project at ${projectPath}...`);
    
    if (!fs.existsSync(projectPath)) {
        throw new Error("Project path does not exist for GitHub push.");
    }

    try {
        const repoName = path.basename(projectPath);

        // Initialize local repository and commit
        execSync('git init', { cwd: projectPath, stdio: 'ignore' });
        execSync('git config user.name "Autonomous Builder"', { cwd: projectPath, stdio: 'ignore' });
        execSync('git config user.email "bot@auto-saas.local"', { cwd: projectPath, stdio: 'ignore' });
        execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
        
        try {
            execSync('git commit -m "chore: initial commit of AI generated SaaS"', { cwd: projectPath, stdio: 'ignore' });
            execSync('git branch -M main', { cwd: projectPath, stdio: 'ignore' });
        } catch (e) {
            console.log("[GitHub Agent] Nothing to commit.");
        }
        
        // Push to real repository if token exists
        const token = process.env.GITHUB_TOKEN;
        if (token) {
            console.log(`[GitHub Agent] Creating public repo using gh CLI...`);
            // Creates the repo and pushes the local source. Note: gh uses GH_TOKEN optionally instead of GITHUB_TOKEN
            execSync(`gh repo create ${repoName} --public --source=. --remote=origin --push`, { 
                cwd: projectPath, 
                stdio: 'inherit',
                env: { ...process.env, GH_TOKEN: token }
            });

            // The owner is the user authenticated via the token
            return `https://github.com/${repoName}-created`; 
        }

        console.log(`[GitHub Agent] Finished local commit. Provide GITHUB_TOKEN for remote push.`);
        return `local-repo-at-${projectPath}`;
    } catch (err) {
        throw new Error(`GitHub Agent execution failed: ${err.message}`);
    }
}

module.exports = { runGithubAgent };
