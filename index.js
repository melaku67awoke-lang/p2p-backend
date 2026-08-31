const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/once-p2p', {
  useNewUrlParser: true,
  useUnifiedTopology: true
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

// Root Route to prevent "Cannot GET /" errors
app.get('/', (req, res) => {
  res.json({ status: 'online', message: 'Once P2P Backend API is running.' });
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

// Route: Get current user state & determine frontend view
app.get('/api/user/state', enforceVerificationLock, async (req, res) => {
  const { idStatus } = req.currentUser;
  
  let currentView = 'marketplace';
  if (idStatus === 'submitted' || idStatus === 'pending') {
    currentView = 'review_pending';
  } else if (!idStatus || idStatus === 'unsubmitted' || idStatus === 'rejected') {
    currentView = 'registration';
  }

  res.json({
    idStatus,
    currentView,
    message: currentView === 'review_pending' 
      ? 'Your ID documents are under admin review. Please wait until approved.' 
      : 'Access granted according to status.'
  });
});

// Route: Submit ID Documents (Locks user into review state)
app.post('/api/user/submit-id', enforceVerificationLock, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    const user = req.currentUser;

    user.idDocuments.push({ imageUrl });
    user.idStatus = 'submitted'; // Lock status to review
    await user.save();

    res.json({
      success: true,
      idStatus: user.idStatus,
      currentView: 'review_pending',
      message: 'ID submitted successfully. You are now locked to the review screen.'
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

// Route: Marketplace (Protected: Blocks access if status is not approved)
app.get('/api/marketplace', enforceVerificationLock, (req, res) => {
  const { idStatus } = req.currentUser;

  if (idStatus === 'submitted' || idStatus === 'pending') {
    return res.status(403).json({
      error: 'Access denied',
      currentView: 'review_pending',
      message: 'Your documents are pending review. Marketplace is locked.'
    });
  }

  if (idStatus !== 'approved') {
    return res.status(403).json({
      error: 'Access denied',
      currentView: 'registration',
      message: 'Please complete registration and submit your ID.'
    });
  }

  res.json({ success: true, data: 'Welcome to the Marketplace items list.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
