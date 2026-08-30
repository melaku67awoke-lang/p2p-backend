// Verification Status Route
app.get('/api/user/status', async (req, res) => {
    try {
        const { telegramId } = req.query;
        // Use your actual Mongoose User model here
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
