const express = require('express');
const app = express();
app.use(express.json());

// In-memory or database mock connection (Replace with your actual MongoDB client/db setup)
// Example: const db = client.db('once_p2p');

// 1. Get User Status & Route Initializer
app.get('/api/user/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await db.collection('users').findOne({ userId: userId });
        
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
        
        await db.collection('users').updateOne(
            { userId: userId },
            { 
                $set: { 
                    fullName, 
                    phone, 
                    binanceUid, 
                    idImageUrl, 
                    kycStatus: 'pending',
                    updatedAt: new Date()
                } 
            },
            { upsert: true }
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
        
        await db.collection('users').updateOne(
            { userId: userId },
            { 
                $set: { 
                    kycStatus: action,
                    reviewedAt: new Date()
                } 
            }
        );
        
        res.json({ success: true, status: action });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
