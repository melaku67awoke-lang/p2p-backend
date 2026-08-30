const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const app = express();

// Connect to MongoDB using environment variable or direct string
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/p2p-app')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Define Verification Schema
const userSchema = new mongoose.Schema({
    frontId: String,
    backId: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const UserVerification = mongoose.model('UserVerification', userSchema);

// Ensure 'uploads' folder exists automatically
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage for uploaded documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve the frontend HTML file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle ID upload and save to MongoDB
app.post('/api/verify-id', upload.fields([
    { name: 'frontId', maxCount: 1 }, 
    { name: 'backId', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files || !req.files['frontId'] || !req.files['backId']) {
            return res.status(400).json({ error: 'Both front and back ID files are required.' });
        }

        // Save submission details to MongoDB database
        const newVerification = new UserVerification({
            frontId: req.files['frontId'][0].path,
            backId: req.files['backId'][0].path,
            status: 'pending'
        });

        await newVerification.save();

        return res.status(200).json({ message: 'IDs uploaded and review pending.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error during upload.' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
