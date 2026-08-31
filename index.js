const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory mock database for users, ads, and orders (or connect to your MongoDB Atlas here)
let users = [
    { id: 1, name: "Melaku Awoke", verified: true, balance: 1250.00 }
];

let ads = [
    { id: 1, type: 'sell', price: 189.50, amount: 500, merchant: 'CryptoKing', verified: true },
    { id: 2, type: 'buy', price: 188.00, amount: 350, merchant: 'EthioTrader', verified: true }
];

// Instant automatic verification middleware / endpoint
app.post('/api/register', (req, res) => {
    const { name } = req.body;
    const newUser = {
        id: users.length + 1,
        name: name || "New User",
        verified: true, // Instantly verified, zero waiting time!
        balance: 0.00
    };
    users.push(newUser);
    res.json({ success: true, message: "Account created and instantly verified!", user: newUser });
});

// Get marketplace data
app.get('/api/ads', (req, res) => {
    res.json(ads);
});

// Create ad endpoint
app.post('/api/ads', (req, res) => {
    const { type, price, amount, merchant } = req.body;
    const newAd = {
        id: Date.now(),
        type: type || 'sell',
        price: parseFloat(price) || 189.00,
        amount: parseFloat(amount) || 50.00,
        merchant: merchant || 'Melaku Awoke',
        verified: true
    };
    ads.push(newAd);
    res.json({ success: true, ad: newAd });
});

// Basic health check route
app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
