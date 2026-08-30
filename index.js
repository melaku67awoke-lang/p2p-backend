const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/once-p2p', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log('DB connection error:', err));

// User Model definition (or require your external model file here)
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({
    kycStatus: { type: String, default: 'pending' }
}));

// KYC Status Route - placed AFTER app is initialized
app.get('/api/user/status', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Force status to approved for testing or check DB record
        if (user.kycStatus === 'approved') {
            return res.json({ 
                verified: true, 
                redirectTo: '/dashboard' 
            });
        }
        
        return res.json({ 
            verified: false, 
            redirectTo: '/verification-pending' 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
