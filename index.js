const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Safe Mongoose User model fallback matching your database schema
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    username: String,
    fullName: String,
    email: String,
    phone: String,
    binanceUid: String,
    password: String,
    withdrawPassword: String,
    balance: { type: Number, default: 0 },
    idImageName: String,
    idStatus: { type: String, default: "none" },
    rejectionReason: String,
    createdAt: { type: Date, default: Date.now }
}));

// Verification Status Route
app.get('/api/user/status', async (req, res) => {
    try {
        const { telegramId } = req.query;
        const user = await User.findOne({ 
            $or: [{ telegramId }, { email: "melaku6lawoke@gmail.com" }] 
        });
        
        if (!user) {
            return res.json({ isVerified: false, hasSubmittedId: false });
        }
        
        const isVerified = user.idStatus === "approved";
        const hasSubmittedId = user.idStatus === "pending" || user.idStatus === "approved";
        
        res.json({ isVerified, hasSubmittedId });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ID Submission Route
app.post('/api/user/verify-id', async (req, res) => {
    try {
        const { fullName, idType, idNumber } = req.body;
        
        await User.findOneAndUpdate(
            { email: "melaku6lawoke@gmail.com" },
            { 
                fullName, 
                idType, 
                idNumber, 
                idStatus: "pending" 
            },
            { new: true, upsert: true }
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Submission failed' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
