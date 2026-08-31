const express = require('express');
const TelegramBot = require('node-telegram-bot-api');

// Replace with your actual Telegram Bot Token from BotFather
const token = process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE';

// Create a bot that uses 'polling' to fetch new updates
const bot = new TelegramBot(token, { polling: true });

const app = express();
app.use(express.json());

let users = [];

// Listen for any kind of message
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const name = msg.from.first_name || "Trader";
    
    // Auto-verify user instantly on start/message
    let existingUser = users.find(u => u.chatId === chatId);
    if (!existingUser) {
        users.push({ chatId, name, verified: true, balance: 0.00 });
    }

    bot.sendMessage(chatId, `Welcome to Once P2P, ${name}! Your account is **instantly verified**. Tap the button below to open the marketplace.`, {
        parse_mode: "Markdown",
        reply_markup: {
            inline_keyboard: [
                [{ text: "🚀 Open P2P Marketplace", web_app: { url: "https://your-frontend-url.onrender.com" } }]
            ]
        }
    });
});

app.get('/health', (req, res) => {
    res.status(200).send('Bot is running and active!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server and Telegram Bot running on port ${PORT}`);
});
