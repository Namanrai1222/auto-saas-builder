const axios = require('axios');

async function createRepository(repoName) {
    const token = process.env.GITHUB_TOKEN;
    if (!token) throw new Error("GITHUB_TOKEN missing");
    
    // Create repo using GitHub API
    // Implementation left for future phases (MVP uses local git init)
    console.log(`[GitHub Service] Would create repo: ${repoName}`);
    return `https://github.com/auto-generated/${repoName}`;
}

module.exports = { createRepository };
