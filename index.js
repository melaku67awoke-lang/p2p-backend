const express = require('express');
const path = require('path');

const app = express();

// Automatically serve all files (index.html, admin.html, CSS, JS) from the root folder
app.use(express.static(path.join(__dirname)));

// Main route serves your Telegram Mini App (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Dedicated route for your admin panel
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running live on port ${PORT}`);
});
