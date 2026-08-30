// Example middleware or route handler checking KYC status
app.get('/api/user/status', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        
        // Force status to approved for testing or update DB record
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
