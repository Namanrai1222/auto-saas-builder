const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

async function runNotifyAgent(notificationData) {
    console.log(`[Notify Agent] Sending WhatsApp notification via OpenClaw CLI...`);
    const toNumber = process.env.WHATSAPP_TO_NUMBER;

    if (!toNumber) {
        console.warn("[Notify Agent] WHATSAPP_TO_NUMBER missing in .env. Skipping notification.");
        return true;
    }

    // Sanitize characters robustly to prevent arbitrary command injection (RCE)
    const sanitize = (str) => (str || '').replace(/[^a-zA-Z0-9., ?!':/-]/g, '');
    const safeMessage = sanitize(notificationData.message);
    const command = `openclaw message send --channel whatsapp --target ${toNumber} --message "${safeMessage}"`;

    try {
        await execPromise(command, { timeout: 30000 });
        console.log("[Notify Agent] Notification sent via OpenClaw WhatsApp skill.");
    } catch (error) {
        console.warn("[Notify Agent] Notification mocked or skipped. OpenClaw CLI error:", error.message.split('\n')[0]);
    }

    return true; // We don't fail the pipeline on notification error
}

module.exports = { runNotifyAgent };
