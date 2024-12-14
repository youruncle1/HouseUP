/**
 * @file index.js
 * @brief Entry point for the backend server. Sets up the Express application, middleware, routes, and scheduled tasks. Includes Firebase integration for database operations.
 * @author Roman Poliačik <xpolia05@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */
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

//Middleware
app.use(cors());
app.use(bodyParser.json());

// Import routes
const debtsRoutes = require('./routes/debts');
const choresRoutes = require('./routes/chores');
const transactionsRoutes = require('./routes/transactions');
const { processDueRecurringTransactions } = require('./routes/transactions'); // scheduler
const shoppingListRoutes = require('./routes/shoppingList');
const householdsRoutes = require('./routes/households');
const usersRoutes = require('./routes/users');

const { generateDueChoresForAllHouseholds } = choresRoutes;

// Use routes
app.use('/debts', debtsRoutes);
app.use('/transactions', transactionsRoutes);
app.use('/chores', choresRoutes.router);
app.use('/shopping-list', shoppingListRoutes);
app.use('/households', householdsRoutes);
app.use('/users', usersRoutes);

// Cron job for recurring transactions
cron.schedule('0 0 * * *', async () => {
    console.log('Running daily cron jobs at midnight...');

    try {
        // Process recurring transactions at midnight
        await processDueRecurringTransactions();
        console.log('Recurring transactions processed.');
    } catch (err) {
        console.error('Error processing recurring transactions:', err);
    }

    try {
        // Generate due chores for all households at midnight
        await generateDueChoresForAllHouseholds();
        console.log('Due chores generation completed.');
    } catch (err) {
        console.error('Error generating due chores at midnight:', err);
    }
});

app.get('/', (req, res) => {
    res.send('Backend server is running');
});

app.listen(PORT, () => {
    console.log(`Backend server is running on http://localhost:${PORT}`);
});
