const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'public/uploads/'),
    filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// MongoDB Schema with Status Tracking
const verificationSchema = new mongoose.Schema({
    username: { type: String, required: true },
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    binanceId: { type: String, required: true },
    frontIdPath: { type: String },
    backIdPath: { type: String },
    status: { type: String, default: 'pending' }, // 'pending', 'approved', 'rejected'
    createdAt: { type: Date, default: Date.now }
});

const Verification = mongoose.model('Verification', verificationSchema);

// Serve the main frontend page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle ID Submission & Save Data
app.post('/api/verify-id', upload.fields([{ name: 'frontId', maxCount: 1 }, { name: 'backId', maxCount: 1 }]), async (req, res) => {
    try {
        const { username, fullName, email, phone, binanceId } = req.body;
        
        const frontIdPath = req.files['frontId'] ? req.files['frontId'][0].path : '';
        const backIdPath = req.files['backId'] ? req.files['backId'][0].path : '';

        await Verification.findOneAndUpdate(
            { email },
            {
                username,
                fullName,
                email,
                phone,
                binanceId,
                frontIdPath,
                backIdPath,
                status: 'pending'
            },
            { upsert: true, new: true }
        );

        res.status(200).json({ success: true, message: 'Submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error during submission' });
    }
});

// Check Status Endpoint (For App Startup)
app.get('/api/user-status', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) return res.status(400).json({ error: 'Email required' });

        const userRecord = await Verification.findOne({ email });
        if (!userRecord) {
            return res.json({ status: 'unregistered' });
        }

        res.json({ status: userRecord.status });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

// Admin Approval Route (Call this to approve a user)
app.post('/api/admin/approve', async (req, res) => {
    try {
        const { email } = req.body;
        const updatedUser = await Verification.findOneAndUpdate(
            { email },
            { status: 'approved' },
            { new: true }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ success: true, message: 'User approved successfully!' });
    } catch (err) {
        res.status(500).json({ error: 'Approval failed' });
    }
});

// Connect to MongoDB and start server
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/once-p2p')
    .then(() => {
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => console.error('Database connection error:', err));
