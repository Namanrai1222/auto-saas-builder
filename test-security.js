const { runSecurityAgent } = require('./agents/security.js');
const fs = require('fs');
const path = require('path');

async function testSecurity() {
    console.log("Setting up dummy project...");
    const dummyPath = path.join(__dirname, 'dummy-project');
    if (!fs.existsSync(dummyPath)) fs.mkdirSync(dummyPath);
    
    // Create a file with a secret
    fs.writeFileSync(path.join(dummyPath, 'config.js'), 'const API_KEY = "sk-12345678901234567890";\n');
    
    console.log("Running security agent...");
    const result = await runSecurityAgent(dummyPath);
    
    if (!result.safe && result.issues.length > 0) {
        console.log("SUCCESS: Security agent caught the secret!");
    } else {
        console.error("FAIL: Security agent did NOT catch the secret!");
        process.exit(1);
    }
    
    // Clean up
    fs.unlinkSync(path.join(dummyPath, 'config.js'));
    fs.rmdirSync(dummyPath);
}

testSecurity();
