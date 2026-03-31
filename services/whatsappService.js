const axios = require('axios');

async function sendWhatsAppMessage(message) {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    const toNumber = process.env.WHATSAPP_TO_NUMBER;

    if (!token || !phoneId || !toNumber) {
        console.warn("[WhatsApp Service] Missing WhatsApp credentials in environment variables. Skipping notification.");
        return false;
    }

    try {
        const url = `https://graph.facebook.com/v18.0/${phoneId}/messages`;
        await axios.post(url, {
            messaging_product: "whatsapp",
            to: toNumber,
            type: "text",
            text: { body: message }
        }, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });
        return true;
    } catch (error) {
        console.error("[WhatsApp Service] Failed to send message:", error.response?.data || error.message);
        return false;
    }
}

module.exports = { sendWhatsAppMessage };
