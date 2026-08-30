const express = require('express');
const multer = require('multer');
const path = require('path');
const app = express();

// Configure storage for uploaded documents
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serves frontend if stored in a public folder

// Handle ID upload route for front and back images
app.post('/api/verify-id', upload.fields([
    { name: 'frontId', maxCount: 1 }, 
    { name: 'backId', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files || !req.files['frontId'] || !req.files['backId']) {
            return res.status(400).json({ error: 'Both front and back ID files are required.' });
        }

        const frontImagePath = req.files['frontId'][0].path;
        const backImagePath = req.files['backId'][0].path;

        // TODO: Save file paths to MongoDB user document and update status to 'pending'

        return res.status(200).json({ message: 'IDs uploaded and review pending.' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal server error during upload.' });
    }
});

// Use Render's dynamic port assignment so the app stays running successfully
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
