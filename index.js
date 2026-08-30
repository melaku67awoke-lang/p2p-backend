const express = require('express');
const mongoose = require('mongoose');
const app = express();

app.use(express.json());

// Connect to MongoDB Atlas using Mongoose
mongoose.connect(process.env.MONGO_URI || 'YOUR_MONGODB_CONNECTION_STRING', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB Connected'))
  .catch(err => console.error('Database connection error:', err));

// Define User Schema & Model
const userSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    fullName: String,
    phone: String,
    binanceUid: String,
    idImageUrl: String,
    kycStatus: { type: String, default: 'none' }, // 'none', 'pending', 'approved', 'rejected'
    updatedAt: { type: Date, default: Date.now },
    reviewedAt: Date
});

const User = mongoose.model('User', userSchema);

// 1. Get User Status & Route Initializer
app.get('/api/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findOne({ userId });
        
        if (!user) {
            return res.json({ success: true, kycStatus: 'none' });
        }
        
        res.json({ success: true, kycStatus: user.kycStatus || 'none' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 2. Submit ID Verification
app.post('/api/verify-id', async (req, res) => {
    try {
        const { userId, fullName, phone, binanceUid, idImageUrl } = req.body;
        
        await User.findOneAndUpdate(
            { userId },
            { 
                fullName, 
                phone, 
                binanceUid, 
                idImageUrl, 
                kycStatus: 'pending',
                updatedAt: new Date()
            },
            { upsert: true, new: true }
        );
        
        res.json({ success: true, message: 'Verification submitted successfully', kycStatus: 'pending' });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 3. Admin Review Action (Accept or Reject)
app.post('/api/admin/review-kyc', async (req, res) => {
    try {
        const { userId, action } = req.body; // action: 'approved' or 'rejected'
        
        if (!['approved', 'rejected'].includes(action)) {
            return res.status(400).json({ success: false, error: 'Invalid action parameter' });
        }
        
        const updatedUser = await User.findOneAndUpdate(
            { userId },
            { 
                kycStatus: action,
                reviewedAt: new Date()
            },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
        
        res.json({ success: true, status: action });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
