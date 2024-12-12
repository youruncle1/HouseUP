// backend/index.js

const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const bodyParser = require('body-parser');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});
console.log('Firebase initialized.');

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
const transactionsRoutes = require('./routes/transactions');
const { processDueRecurringTransactions } = require('./routes/transactions'); // scheduler
const shoppingListRoutes = require('./routes/shoppingList');
const householdsRoutes = require('./routes/households');
const usersRoutes = require('./routes/users');

// routes
app.use('/debts', debtsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/chores', choresRoutes);
app.use('/shopping-list', shoppingListRoutes);
app.use('/households', householdsRoutes);
app.use('/users', usersRoutes);

// recurring transactions auto-updating (00:00)
cron.schedule('0 0 * * *', () => {
    console.log('Running processDueRecurringTransactions() at midnight...');
    processDueRecurringTransactions()
        .then(() => console.log('Recurring transactions processed'))
        .catch(err => console.error('Error processing recurring transactions:', err));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
