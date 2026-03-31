const fs = require('fs');
const path = require('path');

async function runSecurityAgent(projectPath) {
    console.log(`[Security Agent] Scanning project at ${projectPath}...`);
    const issues = [];
    let isSafe = true;

    if (!fs.existsSync(projectPath)) {
        return { safe: false, issues: ["Project path does not exist for scanning."] };
    }

    function scanDirectory(directory) {
        const files = fs.readdirSync(directory);
        for (const file of files) {
            const fullPath = path.join(directory, file);
            if (fs.statSync(fullPath).isDirectory()) {
                if (file !== 'node_modules' && file !== '.git') {
                    scanDirectory(fullPath);
                }
            } else {
                // Rule 1: No .env files tracking real secrets should be leaked
                if (/^\.env($|\.local$|\.development$|\.production$)/i.test(file)) {
                    issues.push(`Found leaked environment file: ${fullPath}`);
                    isSafe = false;
                }
                
                // Rule 2: Scan code files for hardcoded secrets
                if (/\.(js|jsx|ts|tsx|json|md)$/i.test(file)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    // Simple heuristics for hardcoded API keys
                    if (/(API_KEY|SECRET|TOKEN)\s*[:=]\s*['"][\w-]+['"]/i.test(content) || /sk-[a-zA-Z0-9]{20,}/.test(content)) {
                        issues.push(`Found hardcoded secret or API key pattern in: ${fullPath}`);
                        isSafe = false;
                    }
                }
            }
        }
    }

    try {
        scanDirectory(projectPath);
    } catch (error) {
        issues.push(`Failed to scan files: ${error.message}`);
        isSafe = false;
    }

    if (!isSafe) {
        console.error(`[Security Agent] FAILED. Issues detected:\n`, issues.join('\n'));
    } else {
        console.log(`[Security Agent] PASSED. No secrets or .env files found.`);
    }

    return { safe: isSafe, issues };
}

module.exports = { runSecurityAgent };
