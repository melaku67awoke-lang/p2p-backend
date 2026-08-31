const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://your-render-app-url.onrender.com';

// Native HTTP server to satisfy Render's web service requirement
const server = http.createServer((req, res) => {
    // Basic webhook receiver endpoint for Telegram
    if (req.method === 'POST' && req.url === '/webhook') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const update = JSON.parse(body);
                if (update.message && update.message.chat) {
                    const chatId = update.message.chat.id;
                    const name = update.message.from.first_name || "Trader";
                    sendTelegramMessage(chatId, name);
                }
            } catch (e) {
                console.error('Error parsing update:', e);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
    } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'online', message: 'Once P2P Bot Backend Active' }));
    }
});

// Send message via native HTTPS request to Telegram API
function sendTelegramMessage(chatId, name) {
    const data = JSON.stringify({
        chat_id: chatId,
        text: `Welcome to Once P2P, ${name}! Your account is **instantly verified**. Tap the button below to open the marketplace.`,
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Open P2P Marketplace", web_app: { url: WEB_APP_URL } }]
            ]
        }
    });

    const options = {
        hostname: 'api.telegram.org',
        port: 443,
        path: `/bot${TOKEN}/sendMessage`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = https.request(options, res => {
        // Response handled silently
    });
    req.on('error', error => {
        console.error('Telegram API Error:', error);
    });
    req.write(data);
    req.end();
}

server.listen(PORT, () => {
    console.log(`Native server running on port ${PORT}`);
});
