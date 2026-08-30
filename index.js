const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname));

// Configure Multer for ID document uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });
app.use('/uploads', express.static('uploads'));

// MongoDB Atlas Connection
const MONGO_URI = process.env.MONGO_URI || '';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema with Verification Status
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

const User = mongoose.model('User', userSchema);

// Trade Schema for Escrow / P2P Marketplace
const tradeSchema = new mongoose.Schema({
  seller: { type: String, required: true },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

const Trade = mongoose.model('Trade', tradeSchema);

// --- API ROUTES ---

// 1. Register User
app.post('/api/register', async (req, res) => {
  try {
    const { username, fullName, email, phone, binanceUid, password } = req.body;
    
    if (!username || !fullName || !email || !phone || !password) {
      return res.status(400).json({ error: 'Please fill in all required fields.' });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken.' });
    }

    const newUser = new User({ username, fullName, email, phone, binanceUid, password });
    await newUser.save();

    res.status(201).json({ message: 'Registration successful!', username: newUser.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Submit ID Image for Verification
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

// 3. Admin Review Route (Approve or Reject)
app.post('/api/admin/review-id', async (req, res) => {
  try {
    const { username, action, reason } = req.body;
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

// 4. Set Withdrawal Password
app.post('/api/wallet/set-withdraw-password', async (req, res) => {
  try {
    const { username, withdrawPassword } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    user.withdrawPassword = withdrawPassword;
    await user.save();
    
    res.json({ message: 'Withdrawal password set successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Get User Status & Verification State
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

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
