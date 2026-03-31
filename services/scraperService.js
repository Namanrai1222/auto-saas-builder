const https = require('https');
const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

// Helper for native zero-dependency HTTP parsing natively in Node
function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Auto-SaaS-Scraper/1.0' } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function fetchTrendingSaaS() {
    console.log("\n[Scraper] Fetching live cultural tech discussions from the HackerNews API...");
    
    try {
        // 1. Fetch Top 500 trending story IDs
        const topStories = await fetchJson('https://hacker-news.firebaseio.com/v0/topstories.json');
        
        // 2. Pick a random story from the Top 15 to ensure a wildly different SaaS app gets generated every 2 hours!
        const randomIndex = Math.floor(Math.random() * 15);
        const targetId = topStories[randomIndex];
        
        // 3. Fetch the exact post data
        const story = await fetchJson(`https://hacker-news.firebaseio.com/v0/item/${targetId}.json`);
        console.log(`[Scraper] Intercepted Trending HackerNews Post: "${story.title}"`);
        
        console.log("[Scraper] Sourcing OpenClaw AI to transmute this news trend into a viable B2B SaaS startup concept...");
        
        // Sanitize string perfectly before piping into CLI
        const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9., ?!'-]/g, '');
        const safeTopic = sanitize(story.title);

        const prompt = `Act as a Y-Combinator Tech Founder. Turn this trending HackerNews tech headline into a highly profitable B2B SaaS application idea: "${safeTopic}". 
        Output ONLY a strictly formatted JSON object containing:
        {
          "title": "Short catchy SaaS App Name",
          "description": "1 sentence elevator pitch explaining the product.",
          "features": ["Core feature 1", "Core feature 2", "Core feature 3"]
        }
        Do not output markdown block ticks. Output raw JSON only.`;

        const isWin = process.platform === 'win32';
        const cmd = isWin ? 'openclaw.cmd' : 'openclaw';

        const { stdout } = await execFilePromise(cmd, ['agent', '--session-id', 'local-saas-builder', '--message', prompt, '--json'], { shell: isWin, timeout: 60000 });
        
        // Aggressive dual-layer JSON parsing
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("LLM failed to format Idea Schema.");
        
        let rawJson = jsonMatch[0];
        try {
             // Peel off openclaw native JSON envelope if present
             const wrapper = JSON.parse(rawJson);
             if (wrapper.response || wrapper.text || wrapper.message) {
                 const innerText = wrapper.response || wrapper.text || wrapper.message;
                 const innerMatch = innerText.match(/\{[\s\S]*\}/);
                 if (innerMatch) rawJson = innerMatch[0];
             }
        } catch (e) {}

        const ideaData = JSON.parse(rawJson);
        console.log(`[Scraper] Idea Pipeline Synthesized 🧠: ${ideaData.title}`);
        return ideaData;

    } catch (error) {
        console.warn(`[Scraper] Live API Drop or Parsing Error (${error.message.split('\n')[0]}). Firing fail-safe offline Generative AI seed.`);
        // Fallback constraint to prevent pipeline crashing on network error
        return {
            title: "GenAI Markdown API",
            description: "An automated documentation generator that reads your git repositories and builds interactive MDX UI portals securely.",
            features: ["Auto AST code parsing", "MDX Component Generation", "Live browser sandboxes"]
        };
    }
}

module.exports = { fetchTrendingSaaS };
