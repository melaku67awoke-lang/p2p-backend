const http = require('http');
const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual Telegram Bot Token or environment variable
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';
const webAppUrl = process.env.WEB_APP_URL || 'https://your-render-app-url.onrender.com';

// Setup polling for the Telegram bot
const bot = new TelegramBot(token, { polling: true });

// Listen for messages/start command
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || "Trader";

    bot.sendMessage(chatId, `Welcome to Once P2P, ${name}! Your account is **instantly verified**. Tap the button below to open the marketplace.`, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Open P2P Marketplace", web_app: { url: webAppUrl } }]
            ]
        }
    });
});

// HTTP server for Render health checks
const PORT = process.env.PORT || 3000;
const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', bot: 'active', autoVerification: 'enabled' }));
});

server.listen(PORT, () => {
    console.log(`Server and Telegram Bot running on port ${PORT}`);
});
