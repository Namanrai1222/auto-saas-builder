const { execFile } = require('child_process');
const util = require('util');
const execFilePromise = util.promisify(execFile);

async function runUiAgent(idea, research) {
    console.log(`[UI/UX Agent] Architecting component hierarchy and Tailwind design system...`);
    
    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9., ?!'-]/g, '');
    const safeFeatures = (research.coreFeatures || []).map(f => sanitize(f)).join(', ');

    const prompt = `Act as a Lead UI/UX Engineer. Design the frontend for: ${sanitize(idea.title)}.
    Based on the features: ${safeFeatures}.
    Output a strictly formatted JSON object containing:
    {
      "colorPalette": { "primary": "Hex or Tailwind Color", "secondary": "Hex or Tailwind Color", "background": "Hex or Tailwind Color" },
      "pages": ["/ (Landing)", "/dashboard", "/login"],
      "components": ["Navbar", "Footer", "FeatureCard", "DataChart"],
      "tailwindDirectives": ["glassmorphism", "dark-mode-first", "gradients"]
    }
    DO NOT output markdown. ONLY raw JSON.`;

    const isWin = process.platform === 'win32';
    const cmd = isWin ? 'openclaw.cmd' : 'openclaw';

    try {
        const { stdout } = await execFilePromise(cmd, ['agent', '--session-id', 'local-saas-builder', '--message', prompt, '--json'], { shell: isWin, timeout: 120000 });
        
        const jsonMatch = stdout.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("LLM failed to return structured Design System JSON.");
        
        let rawJson = jsonMatch[0];
        try {
             const wrapper = JSON.parse(rawJson);
             if (wrapper.response || wrapper.text || wrapper.message) {
                 const innerMatch = (wrapper.response || wrapper.text || wrapper.message).match(/\{[\s\S]*\}/);
                 if (innerMatch) rawJson = innerMatch[0];
             }
        } catch (e) {}

        const uiData = JSON.parse(rawJson);
        console.log(`[UI/UX Agent] Successfully mapped ${uiData.pages?.length || 0} pages and component tree.`);
        return uiData;
    } catch (error) {
        console.warn(`[UI/UX Agent] Non-fatal AI parsing error: ${error.message.split('\n')[0]}. Firing robust aesthetic fallback.`);
        return {
            colorPalette: { primary: "blue-600", secondary: "purple-500", background: "slate-900" },
            pages: ["/", "/dashboard", "/login"],
            components: ["Layout", "Button", "Card", "Header"],
            tailwindDirectives: ["modern-minimalist", "responsive", "dark-mode"]
        };
    }
}

module.exports = { runUiAgent };
