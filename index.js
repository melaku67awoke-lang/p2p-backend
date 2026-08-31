const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// User Schema with strict verification statuses
const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    verificationStatus: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
});

const User = mongoose.model('User', userSchema);

// Endpoint to retrieve active user verification state
app.get('/api/user/status', async (req, res) => {
    try {
        const userId = req.query.userId || req.headers['x-user-id'];
        if (!userId) {
            return res.status(400).json({ error: 'Missing user ID parameter' });
        }

        const user = await User.findOne({ telegramId: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ verificationStatus: user.verificationStatus });
    } catch (err) {
        console.error('Server status check error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Root route to load your mini app frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
