const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const upload = multer({ storage: multer.memoryStorage() });

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  idImageName: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Registration Endpoint
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const newUser = new User({ username, password, balance: 0, isVerified: false });
    await newUser.save();

    res.status(201).json({ 
      message: 'Registered successfully. Please upload your ID to access services.', 
      username: newUser.username,
      isVerified: false 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit ID Endpoint
app.post('/api/submit-id', upload.single('idImage'), async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an ID image file' });
    }

    user.idImageName = req.file.originalname;
    user.isVerified = false; 
    await user.save();

    res.json({ message: 'ID uploaded successfully! Pending review. Services remain locked.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Route to Approve User ID Review
app.post('/api/admin/approve-user', async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.isVerified = true;
    await user.save();

    res.json({ message: `User ${username} verified successfully! Marketplace access unlocked.` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Wallet Deposit Endpoint (Only for verified users)
app.post('/api/wallet/deposit', async (req, res) => {
  try {
    const { username, amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ error: 'Account not verified. Complete ID review to deposit funds.' });
    }

    user.balance += Number(amount);
    await user.save();

    res.json({ message: 'Deposit successful!', newBalance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marketplace / Services Endpoint
app.get('/api/marketplace', async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.isVerified !== true) {
      return res.status(403).json({ 
        error: 'Access denied. Your ID is still under review or not verified yet.', 
        isVerified: false 
      });
    }

    res.json({ message: 'Welcome to the P2P Marketplace!', balance: user.balance });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/', (req, res) => {
  res.send('P2P Backend is running successfully! 🚀');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
