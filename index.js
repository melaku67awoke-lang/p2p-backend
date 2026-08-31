const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

// Replace with your actual MongoDB connection string
const MONGO_URI = process.env.MONGO_URI || 'YOUR_MONGODB_CONNECTION_STRING';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    verificationStatus: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
});

const User = mongoose.model('User', userSchema);

// API to check verification status and route accordingly
app.get('/api/user/status', async (req, res) => {
    try {
        const userId = req.query.userId || req.headers['x-user-id'];
        if (!userId) {
            return res.status(400).json({ error: 'Missing user ID' });
        }

        let user = await User.findOne({ telegramId: userId });
        
        // If user doesn't exist yet, create them as pending so review page shows
        if (!user) {
            user = await User.create({ telegramId: userId, verificationStatus: 'pending' });
        }

        res.json({ verificationStatus: user.verificationStatus });
    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve frontend files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
