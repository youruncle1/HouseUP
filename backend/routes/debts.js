// backend/routes/debts.js

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Get all debts
router.get('/', async (req, res) => {
    console.log('Received GET request for /debts');
    try {
        const debtsRef = db.collection('debts');
        const snapshot = await debtsRef.get();
        const debts = [];
        snapshot.forEach((doc) => {
            debts.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Sending ${debts.length} debts`);
        res.status(200).json(debts);
    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a new debt
router.post('/', async (req, res) => {
    console.log('Received POST request for /debts with data:', req.body);
    try {
        const debtData = {
            creditor: req.body.creditor,
            debtor: req.body.debtor,
            amount: req.body.amount,
            description: req.body.description || '',
            isSettled: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('debts').add(debtData);
        console.log(`Added new debt with ID: ${docRef.id}`);
        res.status(201).json({ id: docRef.id, ...debtData });
    } catch (error) {
        console.error('Error adding debt:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Settle a debt
router.put('/:id/settle', async (req, res) => {
    console.log(`Received PUT request for /debts/${req.params.id}/settle`);
    try {
        const debtRef = db.collection('debts').doc(req.params.id);
        await debtRef.update({ isSettled: true });
        console.log(`Debt with ID ${req.params.id} settled`);
        res.status(200).json({ message: 'Debt settled successfully' });
    } catch (error) {
        console.error('Error settling debt:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
