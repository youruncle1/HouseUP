// backend/index.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data store (for prototyping)
let chores = [];
let idCounter = 1;

// Routes
app.get('/chores', (req, res) => {
    res.json(chores);
});

app.post('/chores', (req, res) => {
    const chore = { id: idCounter++, name: req.body.name };
    chores.push(chore);
    res.status(201).json(chore);
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
