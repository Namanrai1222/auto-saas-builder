const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runResearchAgent(idea) {
    console.log(`[Research Agent] Deep-diving market requirements and database architectures for: ${idea.title}...`);
    
    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9., ?!'-]/g, '');
    const prompt = `Act as a Principal Product Manager. Analyze this SaaS idea: "${sanitize(idea.title)} - ${sanitize(idea.description)}".
    Output a strictly formatted JSON object containing:
    {
      "coreFeatures": ["feature1", "feature2"],
      "databaseSchema": ["table1", "table2"],
      "apiEndpoints": ["/api/v1/..."],
      "userFlow": "Step 1... Step 2..."
    }
    DO NOT output any markdown blocks or explanations. ONLY raw JSON.`;

    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'openclaw.cmd' : 'openclaw';
    const safePrompt = prompt.replace(/\r?\n|\r/g, ' ').replace(/"/g, '\\"');

    try {
        const { stdout } = await execPromise(`${cmd} agent --session-id local-saas-builder --message "${safePrompt}" --json`, { timeout: 120000 });
        
        // Isolate JSON natively ignoring wrapper text
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("LLM failed to return structured Research JSON.");
        
        // Nested JSON parses handle any OpenClaw stdout stringification idiosyncrasies 
        let rawJson = jsonMatch[0];
        try {
             // Handle if stdout outputted JSON that has a 'response' or 'message' property from the CLI wrapper
             const wrapper = JSON.parse(rawJson);
             if (wrapper.response || wrapper.text || wrapper.message) {
                 const innerMatch = (wrapper.response || wrapper.text || wrapper.message).match(/\{[\s\S]*\}/);
                 if (innerMatch) rawJson = innerMatch[0];
             }
        } catch (e) {}

        const researchData = JSON.parse(rawJson);
        console.log(`[Research Agent] Successfully drafted ${researchData.coreFeatures?.length || 0} core features and database schema.`);
        return researchData;
    } catch (error) {
        console.warn(`[Research Agent] Non-fatal AI parsing error: ${error.message.split('\n')[0]}. Firing robust semantic fallback.`);
        return {
            coreFeatures: idea.features || ["Authentication", "Dashboard", "Settings"],
            databaseSchema: ["Users", "Sessions", "Content"],
            apiEndpoints: ["/api/health", "/api/auth", "/api/data"],
            userFlow: "User signs up -> Uses dashboard -> Logs out."
        };
    }
}

module.exports = { runResearchAgent };
