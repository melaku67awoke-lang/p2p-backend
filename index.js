const express = require('express');
const mongoose = require('mongoose');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas successfully!'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Define User Schema & Model with Verification Status
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  balance: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false }, // ID review status
  idDocumentUrl: { type: String, default: '' },   // Submitted ID reference
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
      message: 'User registered successfully! Please submit your ID for review.', 
      username: newUser.username,
      isVerified: false 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit ID for Review Endpoint
app.post('/api/submit-id', async (req, res) => {
  try {
    const { username, idDocumentUrl } = req.body;
    const user = await User.findOne({ username });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.idDocumentUrl = idDocumentUrl;
    // Note: isVerified remains false until manual or automated review approval
    await user.save();

    res.json({ message: 'ID submitted successfully. Under review.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Marketplace / Services Endpoint (Blocked if not verified)
app.get('/api/marketplace', async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (!user.isVerified) {
      return res.status(403).json({ 
        error: 'Access denied. Your ID review is still pending.', 
        isVerified: false 
      });
    }

    res.json({ message: 'Welcome to the P2P Marketplace and Wallet services!', balance: user.balance });
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
