// Example Express backend endpoint in index.js
app.get('/api/user/status', async (req, res) => {
  try {
    const telegramId = req.headers['telegram-id'];
    const user = await User.findOne({ telegramId });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Ensure kycStatus and isRegistered are explicitly sent back
    return res.json({
      success: true,
      isRegistered: user.isRegistered,
      kycStatus: user.kycStatus // 'pending', 'approved', 'rejected', etc.
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
