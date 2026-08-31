const express = require('express');
const mongoose = require('mongoose');
const path = require('path');

const app = express();
app.use(express.json());

// Serve static frontend files from 'public' folder
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/once-p2p', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

// User Schema with ID Verification Status
const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true },
  name: String,
  idStatus: { 
    type: String, 
    enum: ['unsubmitted', 'submitted', 'pending', 'approved', 'rejected'], 
    default: 'unsubmitted' 
  },
  idDocuments: [{ imageUrl: String, uploadedAt: { type: Date, default: Date.now } }]
});

const User = mongoose.model('User', userSchema);

// Root Route fallback
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware to Check Verification and Routing Status
const enforceVerificationLock = async (req, res, next) => {
  try {
    const telegramId = req.headers['telegramid'] || req.body.telegramId || req.query.telegramId;
    if (!telegramId) {
      return res.status(401).json({ error: 'Unauthorized: Missing telegramId' });
    }

    let user = await User.findOne({ telegramId });
    if (!user) {
      user = await User.create({ telegramId, idStatus: 'unsubmitted' });
    }

    req.currentUser = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Server validation error' });
  }
};

// Route: Get current user state & determine persistent view
app.get('/api/user/state', enforceVerificationLock, async (req, res) => {
  const { idStatus } = req.currentUser;
  
  let currentView = 'landing'; // default if unsubmitted or rejected
  
  if (idStatus === 'submitted' || idStatus === 'pending') {
    currentView = 'review_pending'; // Always display review page when reopened if pending/submitted
  } else if (idStatus === 'approved') {
    currentView = 'marketplace'; // Only approved users get marketplace
  } else if (idStatus === 'rejected') {
    currentView = 'landing'; // Rejected users go back to landing page
  }

  res.json({
    idStatus,
    currentView,
    message: `Current state locked to: ${currentView}`
  });
});

// Route: Submit ID Documents (Permanently locks user to review screen on reopen)
app.post('/api/user/submit-id', enforceVerificationLock, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const user = req.currentUser;

    if (imageUrl) {
      user.idDocuments.push({ imageUrl });
    }
    user.idStatus = 'submitted'; // Locks user into review state
    await user.save();

    res.json({
      success: true,
      idStatus: user.idStatus,
      currentView: 'review_pending',
      message: 'ID submitted successfully. Locked to review page.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit ID documents' });
  }
});

// Route: Admin action to approve or reject user ID
app.post('/api/admin/review-user', async (req, res) => {
  try {
    const { telegramId, action } = req.body; // action: 'approve' or 'reject'
    const newStatus = action === 'approve' ? 'approved' : 'rejected';

    const user = await User.findOneAndUpdate(
      { telegramId },
      { idStatus: newStatus },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      telegramId: user.telegramId,
      idStatus: user.idStatus,
      message: `User status updated to ${user.idStatus}`
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user review status' });
  }
});

// Route: Marketplace (Strictly blocks unapproved users)
app.get('/api/marketplace', enforceVerificationLock, (req, res) => {
  const { idStatus } = req.currentUser;

  if (idStatus !== 'approved') {
    let targetView = (idStatus === 'submitted' || idStatus === 'pending') ? 'review_pending' : 'landing';
    return res.status(403).json({
      error: 'Access denied',
      currentView: targetView,
      message: 'Marketplace is locked until admin approval.'
    });
  }

  res.json({ success: true, data: 'Welcome to the Marketplace.' });
});

// Fallback to index.html for frontend apps
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
