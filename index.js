const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(__dirname));

const MONGO_URI = 'mongodb+srv://melaku67awoke_db_user:207652Hab@cluster0.jphkwdb.mongodb.net/oncep2p?appName=Cluster0';

mongoose.connect(MONGO_URI)
    .then(() => console.log('Connected to MongoDB successfully'))
    .catch(err => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
    telegramId: { type: String, required: true, unique: true },
    verificationStatus: { 
        type: String, 
        enum: ['unsubmitted', 'pending', 'approved', 'rejected'], 
        default: 'unsubmitted' 
    }
});

const User = mongoose.model('User', userSchema);

// Get user status
app.get('/api/user/status', async (req, res) => {
    try {
        const userId = req.query.userId;
        if (!userId || userId === 'undefined' || userId === 'null') {
            return res.status(400).json({ error: 'Invalid user ID' });
        }

        let user = await User.findOne({ telegramId: userId });
        if (!user) {
            user = await User.create({ telegramId: userId, verificationStatus: 'unsubmitted' });
        }

        res.json({ verificationStatus: user.verificationStatus });
    } catch (err) {
        console.error('Status check error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit ID (Changes status to pending)
app.post('/api/user/submit-id', async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'Missing user ID' });

        const updatedUser = await User.findOneAndUpdate(
            { telegramId: userId },
            { verificationStatus: 'pending' },
            { upsert: true, new: true }
        );

        res.json({ success: true, verificationStatus: updatedUser.verificationStatus });
    } catch (err) {
        console.error('Submit error:', err);
        res.status(500).json({ error: 'Failed to submit ID' });
    }
});

// Admin: Get all users
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find({});
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Admin: Update user status
app.post('/api/admin/update-status', async (req, res) => {
    try {
        const { userId, status } = req.body;
        if (!userId || !['approved', 'rejected', 'pending', 'unsubmitted'].includes(status)) {
            return res.status(400).json({ error: 'Invalid parameters' });
        }

        await User.findOneAndUpdate(
            { telegramId: userId },
            { verificationStatus: status },
            { upsert: true }
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update status' });
    }
});

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
