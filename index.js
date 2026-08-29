const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cors());
app.use(express.static(__dirname)); // <-- THIS LINE FIXES THE "CANNOT GET /" ERROR

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
const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://melaku67awokelang:yourpassword@cluster0.xxxx.mongodb.net/oncep2p?retryWrites=true&w=majority';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

// User Schema with Withdrawal Password
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  binanceUid: { type: String, default: '' },
  password: { type: String, required: true },
  withdrawPassword: { type: String, default: '' },
  balance: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  idImageName: { type: String, default: '' },
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

    res.status(201).json({ message: 'Registration successful! Proceed to upload ID.', username: newUser.username });
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
    await user.save();

    res.json({ message: 'ID document uploaded successfully! Awaiting admin review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Set Withdrawal Password (Verified Users Only)
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

// 4. Wallet Deposit
app.post('/api/wallet/deposit', async (req, res) => {
  try {
    const { username, amount } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.balance += Number(amount);
    await user.save();

    res.json({ message: 'Deposit successful!', newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Create P2P Escrow Trade
app.post('/api/trades/create', async (req, res) => {
  try {
    const { username, amount, price } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.balance < Number(amount)) {
      return res.status(400).json({ error: 'Insufficient wallet balance to escrow this trade.' });
    }

    user.balance -= Number(amount);
    await user.save();

    const newTrade = new Trade({ seller: username, amount, price });
    await newTrade.save();

    res.json({ message: 'Trade created and funds locked in escrow successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Get Open Marketplace Trades
app.get('/api/trades/open', async (req, res) => {
  try {
    const trades = await Trade.find({ status: 'open' }).sort({ createdAt: -1 });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Get User Profile & Balance
app.get('/api/marketplace', async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ error: 'Username required' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ username: user.username, balance: user.balance, isVerified: user.isVerified });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
