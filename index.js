const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());

// Serve static frontend files from root directory
app.use(express.static(__dirname));

// MongoDB Connection (update your connection string if needed)
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://cluster0...', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('DB Connection Error:', err));

// User Schema
const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    isRegistered: { type: Boolean, default: false },
    kycStatus: { type: String, enum: ['unregistered', 'pending', 'approved', 'rejected'], default: 'unregistered' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// 1. Check User Status Endpoint
app.get('/api/user/status', async (req, res) => {
    try {
        const telegramId = req.headers['telegram-id'] || req.query.telegramId;
        if (!telegramId) {
            return res.status(400).json({ success: false, message: 'Telegram ID missing' });
        }

        const user = await User.findOne({ telegramId });
        if (!user) {
            return res.json({ success: true, isRegistered: false, kycStatus: 'unregistered' });
        }

        return res.json({
            success: true,
            isRegistered: user.isRegistered,
            kycStatus: user.kycStatus
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 2. Submit ID / KYC Endpoint
app.post('/api/user/submit-kyc', async (req, res) => {
    try {
        const { telegramId } = req.body;
        if (!telegramId) {
            return res.status(400).json({ success: false, message: 'Telegram ID missing' });
        }

        let user = await User.findOne({ telegramId });
        if (!user) {
            user = new User({ telegramId, isRegistered: true, kycStatus: 'pending' });
        } else {
            user.isRegistered = true;
            user.kycStatus = 'pending'; // Sets to pending review instead of marketplace
        }

        await user.save();
        return res.json({ success: true, message: 'ID submitted successfully, review in progress', kycStatus: 'pending' });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
