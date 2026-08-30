// Check user verification status based on your existing schema fields
app.get('/api/user/status', async (req, res) => {
    try {
        const { telegramId } = req.query;
        // Search by telegramId, or fallback to email/username if telegramId isn't stored yet
        const user = await User.findOne({ 
            $or: [{ telegramId }, { email: "melaku6lawoke@gmail.com" }] 
        });
        
        if (!user) {
            return res.json({ isVerified: false, hasSubmittedId: false });
        }
        
        // Map your database 'idStatus' to what the frontend expects
        const isVerified = user.idStatus === "approved";
        const hasSubmittedId = user.idStatus === "pending" || user.idStatus === "approved";
        
        res.json({ isVerified, hasSubmittedId });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update ID submission to match your schema's idStatus field
app.post('/api/user/verify-id', async (req, res) => {
    try {
        const { telegramId, fullName, idType, idNumber } = req.body;
        
        await User.findOneAndUpdate(
            { email: "melaku6lawoke@gmail.com" },
            { 
                fullName, 
                idType, 
                idNumber, 
                idStatus: "pending" 
            },
            { new: true }
        );
        
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: 'Submission failed' });
    }
});
