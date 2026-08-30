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

// Serve the frontend HTML file at the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

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
