const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Safe Mongoose User model fallback
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    telegramId: { type: String, unique: true, required: true },
    fullName: String,
    idType: String,
    idNumber: String,
    isVerified: { type: Boolean, default: false },
    hasSubmittedId: { type: Boolean, default: false }
}));

// Verification Status Route
app.get('/api/user/status', async (req, res) => {
    try {
        const { telegramId } = req.query;
        const user = await User.findOne({ telegramId });
        
        if (!user) {
            return res.json({ isVerified: false, hasSubmittedId: false });
        }
        
        res.json({ 
            isVerified: user.isVerified || false, 
            hasSubmittedId: user.hasSubmittedId || false 
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// ID Submission Route
app.post('/api/user/verify-id', async (req, res) => {
    try {
        const { telegramId, fullName, idType, idNumber } = req.body;
        
        await User.findOneAndUpdate(
            { telegramId },
            { fullName, idType, idNumber, hasSubmittedId: true, isVerified: false },
            { upsert: true, new: true }
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
