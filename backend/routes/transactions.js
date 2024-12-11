// backend/routes/transactions.js

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET /transactions?householdId=...
// Returns all transactions for the given household
router.get('/', async (req, res) => {
    console.log('Received GET request for /transactions');
    const householdId = req.query.householdId;
    if (!householdId) {
        return res.status(400).json({ error: 'householdId is required' });
    }

    try {
        let transactionsRef = db.collection('transactions').where('householdId', '==', householdId);
        const snapshot = await transactionsRef.get();
        const transactions = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.timestamp && data.timestamp.toDate) {
                data.timestamp = data.timestamp.toDate().toISOString();
            }
            transactions.push({ id: doc.id, ...data });
        });

        // Sort by timestamp descending on server side if needed
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        console.log(`Sending ${transactions.length} transactions for householdId ${householdId}`);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /transactions
// Body: { creditor, participants, amount, description, householdId }
// Creates a transaction doc and corresponding debts docs.
router.post('/', async (req, res) => {
    console.log('Received POST request for /transactions with data:', req.body);
    const { creditor, participants, amount, description, householdId } = req.body;

    if (!creditor || !participants || !Array.isArray(participants) || participants.length === 0 || !householdId) {
        return res.status(400).json({ error: 'Missing required fields: creditor, participants, householdId' });
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    // Calculate individual share
    const share = amountValue / participants.length;

    // Create transaction
    const transactionData = {
        creditor,
        participants,
        amount: amountValue,
        description: description || '',
        householdId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        // Additional fields like isRecurring, startDate, etc. can be omitted if not needed
    };

    const batch = db.batch();
    const transactionRef = db.collection('transactions').doc();
    batch.set(transactionRef, transactionData);

    // Create debts docs for each non-creditor participant
    participants.forEach(p => {
        if (p !== creditor) {
            const debtRef = db.collection('debts').doc();
            const debtData = {
                creditor,
                debtor: p,
                amount: share,
                householdId,
                relatedTransactionId: transactionRef.id,
                isSettled: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            batch.set(debtRef, debtData);
        }
    });

    try {
        await batch.commit();
        console.log(`Transaction created with ID: ${transactionRef.id} and debts created for participants.`);
        res.status(201).json({ id: transactionRef.id, ...transactionData });
    } catch (error) {
        console.error('Error adding transaction and debts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// UPDATE transaction
router.put('/:id', async (req, res) => {
    console.log(`Received PUT request for /transactions/${req.params.id} with data:`, req.body);
    const transactionId = req.params.id;
    const { creditor, participants, amount, description, householdId } = req.body;

    if (!creditor || !participants || !Array.isArray(participants) || participants.length === 0 || !householdId) {
        return res.status(400).json({ error: 'Missing required fields: creditor, participants, householdId' });
    }

    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
        const transactionRef = db.collection('transactions').doc(transactionId);
        const transDoc = await transactionRef.get();
        if (!transDoc.exists) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transactionData = transDoc.data();
        // Still disallow editing if it's a settlement transaction
        if (transactionData.isSettlement === true) {
            return res.status(400).json({ error: 'Cannot edit a settlement transaction' });
        }

        // Since we already called can-edit on the frontend before navigating,
        // we trust that partial settlements have not occurred. No checks needed.

        const share = amountValue / participants.length;
        const batch = db.batch();

        const updatedTransactionData = {
            creditor,
            participants,
            amount: amountValue,
            description: description || '',
            householdId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            isSettlement: false
        };
        batch.update(transactionRef, updatedTransactionData);

        // Delete old debts
        const debtsRef = db.collection('debts').where('relatedTransactionId', '==', transactionId);
        const debtsSnapshot = await debtsRef.get();
        debtsSnapshot.forEach(d => batch.delete(d.ref));

        // Create new debts
        participants.forEach(p => {
            if (p !== creditor) {
                const debtRef = db.collection('debts').doc();
                const debtData = {
                    creditor,
                    debtor: p,
                    amount: share,
                    householdId,
                    relatedTransactionId: transactionId,
                    isSettled: false,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                };
                batch.set(debtRef, debtData);
            }
        });

        await batch.commit();
        console.log(`Transaction ${transactionId} updated successfully.`);
        res.status(200).json({ id: transactionId, ...updatedTransactionData });
    } catch (error) {
        console.error('Error editing transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


router.get('/:id/can-edit', async (req, res) => {
    const transactionId = req.params.id;

    try {
        const transactionRef = db.collection('transactions').doc(transactionId);
        const transDoc = await transactionRef.get();
        if (!transDoc.exists) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transactionData = transDoc.data();

        // If this is a settlement transaction, no editing allowed.
        if (transactionData.isSettlement === true) {
            return res.status(200).json({ canEdit: false, reason: 'This is a settlement transaction and cannot be edited.' });
        }

        const { participants, creditor } = transactionData;
        if (!participants || !Array.isArray(participants) || !creditor) {
            return res.status(200).json({ canEdit: false, reason: 'Transaction data incomplete, cannot edit.' });
        }

        // Count how many participants are non-creditors
        const nonCreditorCount = participants.filter(p => p !== creditor).length;

        // Fetch current debts for this transaction
        const debtsRef = db.collection('debts').where('relatedTransactionId', '==', transactionId);
        const debtsSnapshot = await debtsRef.get();
        const currentDebtsCount = debtsSnapshot.size;

        // If fewer debts than non-creditors, some debts got settled => partial settlement => no editing
        if (currentDebtsCount < nonCreditorCount) {
            return res.status(200).json({ canEdit: false, reason: 'Some debts have been partially or fully settled, cannot edit this transaction.' });
        }

        // If we reach here, editing is allowed
        return res.status(200).json({ canEdit: true });
    } catch (error) {
        console.error('Error checking can-edit:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /transactions/:id
// Deleting a transaction means also deleting related debts
router.delete('/:id', async (req, res) => {
    console.log(`Received DELETE request for /transactions/${req.params.id}`);
    const transactionId = req.params.id;

    try {
        const transactionRef = db.collection('transactions').doc(transactionId);
        const transDoc = await transactionRef.get();
        if (!transDoc.exists) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // Find all debts related to this transaction
        const debtsRef = db.collection('debts').where('relatedTransactionId', '==', transactionId);
        const debtsSnapshot = await debtsRef.get();

        const batch = db.batch();
        // Delete the transaction
        batch.delete(transactionRef);
        // Delete all related debts
        debtsSnapshot.forEach(d => batch.delete(d.ref));

        await batch.commit();
        console.log(`Transaction ${transactionId} and related debts deleted.`);
        res.status(200).json({ message: 'Transaction and related debts deleted successfully' });
    } catch (error) {
        console.error('Error deleting transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
