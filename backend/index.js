// backend/index.js

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get('/', (req, res) => {
    res.send('Backend server is running');
});

// Import routes
const debtsRoutes = require('./routes/debts');
const choresRoutes = require('./routes/chores');
const shoppingListRoutes = require('./routes/shoppingList');
const householdsRoutes = require('./routes/households');

// Importing the new users route file
const usersRoutes = require('./routes/users');

// Use routes
app.use('/debts', debtsRoutes);
app.use('/chores', choresRoutes);
app.use('/shopping-list', shoppingListRoutes);
app.use('/households', householdsRoutes);

// Using the users route
app.use('/users', usersRoutes);

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
