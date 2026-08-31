const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;
const TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEB_APP_URL = process.env.WEB_APP_URL || '';

const server = http.createServer((req, res) => {
    // Handle Telegram Webhook messages
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
            } catch (e) {}
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok' }));
        });
        return;
    }

    // Serve the P2P Mini-App UI directly so it loads instead of raw text
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Once P2P</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4">
    <div class="max-w-md mx-auto space-y-4">
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
            <div>
                <h1 class="font-bold text-lg text-emerald-400">Once P2P Marketplace</h1>
                <p class="text-xs text-slate-400">Status: <span class="text-emerald-400 font-semibold">Instantly Verified ✓</span></p>
            </div>
            <div class="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full font-bold">Active</div>
        </div>
        <div class="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center space-y-3">
            <p class="text-xs text-slate-300">Your account bypasses all manual admin queues and is verified automatically.</p>
            <button onclick="alert('Ready for P2P trading!')" class="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all">Start Trading</button>
        </div>
    </div>
</body>
</html>`);
});

function sendTelegramMessage(chatId, name) {
    if (!TOKEN || !WEB_APP_URL) return;
    const data = JSON.stringify({
        chat_id: chatId,
        text: `Welcome to Once P2P, ${name}! Your account is **instantly verified** with zero delays.`,
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
        headers: { 'Content-Type': 'application/json', 'Content-Length': data.length }
    };

    const req = https.request(options);
    req.on('error', () => {});
    req.write(data);
    req.end();
}

server.listen(PORT, () => {
    console.log(`Once P2P server running on port ${PORT}`);
});
