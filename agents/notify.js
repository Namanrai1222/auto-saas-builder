const { sendWhatsAppMessage } = require('../services/whatsappService');

async function runNotifyAgent(notificationData) {
    console.log(`[Notify Agent] Sending WhatsApp notification: ${notificationData.message}`);
    const success = await sendWhatsAppMessage(notificationData.message);
    if (!success) {
        console.log("[Notify Agent] Notification mocked or skipped (check API token).");
    }
    return true; // We don't fail the pipeline on notification error
}

module.exports = { runNotifyAgent };
