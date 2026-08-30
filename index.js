// Update User Schema to track verification status string ('pending', 'approved', 'rejected')
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  binanceUid: { type: String, default: '' },
  password: { type: String, required: true },
  withdrawPassword: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  idImageName: { type: String, default: '' },
  idStatus: { type: String, default: 'none' }, // 'none', 'pending', 'approved', 'rejected'
  rejectionReason: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

// Update ID submission route
app.post('/api/submit-id', upload.single('idImage'), async (req, res) => {
  try {
    const { username } = req.body;
    if (!req.file) return res.status(400).json({ error: 'ID image file is required.' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.idImageName = req.file.filename;
    user.idStatus = 'pending';
    user.rejectionReason = '';
    await user.save();

    res.json({ message: 'ID submitted successfully! Awaiting admin review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Review Route: action can be 'approve' or 'reject'
app.post('/api/admin/review-id', async (req, res) => {
  try {
    const { username, action, reason } = req.body; // action: 'approve' or 'reject'
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (action === 'approve') {
      user.idStatus = 'approved';
      user.rejectionReason = '';
    } else if (action === 'reject') {
      user.idStatus = 'rejected';
      user.rejectionReason = reason || 'ID document was unclear or invalid.';
    }
    
    await user.save();
    res.json({ message: `User ID successfully ${action}d!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update status check route for frontend
app.get('/api/marketplace', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ 
      username: user.username, 
      balance: user.balance, 
      idStatus: user.idStatus,
      rejectionReason: user.rejectionReason 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
