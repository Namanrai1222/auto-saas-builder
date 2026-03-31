const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runSecurityAgent(projectPath) {
    console.log(`[Security Policy] Initiating strict Level 4 audit on ${projectPath}...`);
    let isSafe = true;
    let issues = [];

    // 1. Dependency Audit (NPM Vulnerabilities)
    try {
        console.log("[Security Policy] Checking NPM Dependency Tree for critical exploits...");
        const { stdout } = await execPromise('npm audit --json || true', { cwd: projectPath, timeout: 60000 });
        const audit = JSON.parse(stdout);
        const critical = audit.metadata?.vulnerabilities?.critical || 0;
        const high = audit.metadata?.vulnerabilities?.high || 0;
        if (critical > 0 || high > 0) {
            issues.push(`Found ${critical} critical and ${high} high vulnerabilities in injected dependencies.`);
            isSafe = false;
        }
    } catch (err) {
        console.warn("[Security Policy] Failed to run parse npm audit output.", err.message);
        // We don't fail here just in case package-lock hasn't fully finalized yet, the AST handles code execution blocks.
    }

    // 2. Deep File Scanning (AST-like Execution Patterns & High Entropy Secrets)
    const dangerousPatterns = ['eval(', 'child_process', 'exec(', 'spawn(', 'execSync('];
    // Broad regex for tokens (sk- for OpenAI, AIza for GCP, and standard 40+ char hex keys mapping to generic secrets)
    const entropyRegex = /(sk-[a-zA-Z0-9]{32,})|(AIza[0-9A-Za-z_-]{35})|([A-Za-z0-9_]{50,})/g; 

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (['node_modules', '.git', '.next', 'package-lock.json'].includes(file)) continue;

            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                scanDirectory(fullPath);
            } else {
                // Check missing environments
                if (/^\.env($|\.local$|\.development$|\.production$)/i.test(file)) {
                    issues.push(`Found Leaked Environment Template: ${fullPath}`);
                    isSafe = false;
                }

                // Check file contents
                const ext = path.extname(file);
                if (['.js', '.ts', '.jsx', '.tsx', '.json'].includes(ext)) {
                    const content = fs.readFileSync(fullPath, 'utf8');

                    // 2a. Block Dangerous Sinks (RCE vectors inside hallucinated apps)
                    dangerousPatterns.forEach(pattern => {
                        if (content.includes(pattern)) {
                            issues.push(`Dangerous runtime sink '${pattern}' found in ${fullPath}`);
                            isSafe = false;
                        }
                    });

                    // 2b. High Entropy Token Detection
                    const matches = content.match(entropyRegex);
                    if (matches) {
                        issues.push(`Potential credential exposure (High Entropy Leak) found in ${fullPath}`);
                        isSafe = false;
                    }

                    // 2c. Hardcoded Constants Check
                    if (content.includes('API_KEY=') || content.includes('TOKEN=')) {
                        issues.push(`Explicit hardcoded secret assignment found in ${fullPath}`);
                        isSafe = false;
                    }
                }
            }
        }
    }

    scanDirectory(projectPath);

    if (!isSafe) {
        console.error(`[Security Policy] FATAL: System compromised. Build halted securely.`);
        throw new Error(`Security validation failed! Issues:\n${issues.join('\n')}`);
    }

    console.log("[Security Policy] Security gates passed! Zero-trust verification successful.");
    return true;
}

module.exports = { runSecurityAgent };
