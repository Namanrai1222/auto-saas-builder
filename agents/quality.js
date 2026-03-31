const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runQualityAgent(projectPath) {
    console.log(`[Quality Gate] Profiling codebase aesthetics, structural integrity, and completeness...`);
    let score = 100;
    let issues = [];

    // 1. Basic architectural layout
    const hasSrc = fs.existsSync(path.join(projectPath, 'src')) || fs.existsSync(path.join(projectPath, 'app'));
    const hasComponents = fs.existsSync(path.join(projectPath, 'components')) || fs.existsSync(path.join(projectPath, 'src/components'));

    if (!hasSrc && !hasComponents) {
        score -= 30;
        issues.push("- Severe: Lacking standard React/Next.js folder structure (missing src/app/components).");
    }

    // 2. Placeholder & Trivial Output Detection
    let todoCount = 0;
    let fileCount = 0;
    
    function scanForPlaceholders(dir) {
        if (!fs.existsSync(dir)) return;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (['node_modules', '.git', '.next'].includes(file)) continue;
            const fullPath = path.join(dir, file);
            if (fs.statSync(fullPath).isDirectory()) {
                scanForPlaceholders(fullPath);
            } else {
                fileCount++;
                const ext = path.extname(file);
                if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
                    const content = fs.readFileSync(fullPath, 'utf8');
                    const matches = content.match(/(TODO|FIXME|placeholder|lorem ipsum)/gi);
                    if (matches) todoCount += matches.length;
                }
            }
        }
    }
    
    scanForPlaceholders(projectPath);

    if (fileCount < 5) {
        score -= 40;
        issues.push("- Severe: Trivial code generation. Project contains fewer than 5 files.");
    }

    if (todoCount > 0) {
        const penalty = Math.min(todoCount * 5, 30); // Max penalty of 30 for TODOs
        score -= penalty;
        issues.push(`- Quality Penalty: Found ${todoCount} unresolved TODOs/Placeholders inside the generated application.`);
    }

    // 3. Automated Configuration Validation (Proxy for Linting)
    try {
        const pkgPath = path.join(projectPath, 'package.json');
        if (fs.existsSync(pkgPath)) {
            const packageJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
            if (!packageJson.scripts || (!packageJson.scripts.lint && !packageJson.scripts.build)) {
                score -= 15;
                issues.push("- Warning: Critical configuration scripts (lint/build) missing from package.json.");
            }
            if (Object.keys(packageJson.dependencies || {}).length < 2) {
                score -= 10;
                issues.push("- Warning: Suspiciously low dependency footprint for a full-stack SaaS.");
            }
        }
    } catch (err) {
        score -= 20;
        issues.push(`- Severe: Corrupted or missing package.json detected during QA.`);
    }

    // Floor score cleanly
    score = Math.max(0, score);
    
    console.log(`[Quality Gate] Automated audit complete. Score: ${score}/100.`);
    return { score, issues };
}

module.exports = { runQualityAgent };
