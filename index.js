const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/once-p2p', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB connected successfully'))
  .catch(err => console.log('DB connection error:', err));

// User Model definition
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    kycStatus: { type: String, default: 'pending' },
    fullName: String,
    documentType: String
}));

// Root Route to prevent Cannot GET / error
app.get('/', (req, res) => {
    res.json({ status: 'Once P2P API is running successfully' });
});

// KYC Status Route
app.get('/api/user/status/:telegramId', async (req, res) => {
    try {
        const user = await User.findOne({ telegramId: req.params.telegramId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ kycStatus: user.kycStatus });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// KYC Submission Route
app.post('/api/user/kyc', async (req, res) => {
    try {
        const { telegramId, fullName, documentType } = req.body;
        const user = await User.findOneAndUpdate(
            { telegramId },
            { fullName, documentType, kycStatus: 'pending' },
            { upsert: true, new: true }
        );
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Review/Approval Route
app.post('/api/admin/approve', async (req, res) => {
    try {
        const { telegramId, status } = req.body; // status can be 'approved' or 'rejected'
        const user = await User.findOneAndUpdate(
            { telegramId },
            { kycStatus: status },
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ success: true, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
