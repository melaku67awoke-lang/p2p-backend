const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

const upload = multer({ storage: multer.memoryStorage() });

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true }, // Nickname
  fullName: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  binanceUid: { type: String, default: '' },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  idImageName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

const tradeSchema = new mongoose.Schema({
  seller: { type: String, required: true },
  buyer: { type: String, default: '' },
  amount: { type: Number, required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

const Trade = mongoose.model('Trade', tradeSchema);

// Registration Endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, fullName, email, phone, binanceUid, password } = req.body;
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Nickname/Username is already taken' });
    }
    const newUser = new User({ username, fullName, email, phone, binanceUid, password, balance: 0, isVerified: false });
    await newUser.save();
    res.status(201).json({ message: 'Account created successfully. Please proceed to document upload.', username: newUser.username });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit ID Endpoint
app.post('/api/submit-id', upload.single('idImage'), async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!req.file) return res.status(400).json({ error: 'Please upload an ID image file' });

    user.idImageName = req.file.originalname;
    user.isVerified = false;
    await user.save();
    res.json({ message: 'ID uploaded successfully! Pending admin review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Route to Approve User ID
app.post('/api/admin/approve-user', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isVerified = true;
    await user.save();
    res.json({ message: `User ${username} verified successfully!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet Deposit Endpoint
app.post('/api/wallet/deposit', async (req, res) => {
  try {
    const { username, amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'Invalid amount' });

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!user.isVerified) return res.status(403).json({ error: 'Account not verified.' });

    user.balance += Number(amount);
    await user.save();
    res.json({ message: 'Deposit successful!', newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create P2P Sell Offer
app.post('/api/trades/create', async (req, res) => {
  try {
    const { username, amount, price } = req.body;
    const user = await User.findOne({ username });

    if (!user || !user.isVerified) {
      return res.status(403).json({ error: 'Verified account required to create trades' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance to escrow this amount' });
    }

    user.balance -= Number(amount);
    await user.save();

    const newTrade = new Trade({ seller: username, amount, price, status: 'open' });
    await newTrade.save();

    res.status(201).json({ message: 'Trade offer created and funds locked in escrow!', tradeId: newTrade._id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// View Open Trades Marketplace
app.get('/api/trades/open', async (req, res) => {
  try {
    const trades = await Trade.find({ status: 'open' });
    res.json(trades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete Trade
app.post('/api/trades/complete', async (req, res) => {
  try {
    const { tradeId, buyerUsername } = req.body;
    const trade = await Trade.findById(tradeId);

    if (!trade || trade.status !== 'open') {
      return res.status(404).json({ error: 'Trade not available or already completed' });
    }

    const buyer = await User.findOne({ username: buyerUsername });
    if (!buyer || !buyer.isVerified) {
      return res.status(403).json({ error: 'Valid verified buyer required' });
    }

    trade.buyer = buyerUsername;
    trade.status = 'completed';
    await trade.save();

    buyer.balance += Number(trade.amount);
    await buyer.save();

    res.json({ message: 'Trade completed successfully!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
