// backend/routes/debts.js

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET /debts?householdId=...
// Returns all one-on-one debts for the given household
router.get('/', async (req, res) => {
    console.log('Received GET request for /debts');
    const householdId = req.query.householdId;
    if (!householdId) {
        return res.status(400).json({ error: 'householdId is required' });
    }

    try {
        let debtsRef = db.collection('debts').where('householdId', '==', householdId);
        const snapshot = await debtsRef.get();
        const debts = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.timestamp && data.timestamp.toDate) {
                data.timestamp = data.timestamp.toDate().toISOString();
            }
            debts.push({ id: doc.id, ...data });
        });

        console.log(`Sending ${debts.length} debts for householdId ${householdId}`);
        res.status(200).json(debts);
    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /debts/settle
// Body: { debtor, creditor, householdId }
// This will remove all debts from debtor->creditor, sum them up, and create a settlement transaction.
router.post('/settle', async (req, res) => {
    console.log('Received POST request for /debts/settle with data:', req.body);
    const { debtor, creditor, householdId } = req.body;

    if (!debtor || !creditor || !householdId) {
        return res.status(400).json({ error: 'Debtor, creditor, and householdId are required' });
    }

    try {
        // Find all debts from debtor to creditor in this household
        const debtsRef = db.collection('debts')
            .where('debtor', '==', debtor)
            .where('creditor', '==', creditor)
            .where('householdId', '==', householdId);

        const debtsSnapshot = await debtsRef.get();
        if (debtsSnapshot.empty) {
            return res.status(404).json({ error: 'No debts found between these users in this household' });
        }

        let totalAmount = 0;
        const batch = db.batch();
        debtsSnapshot.forEach((doc) => {
            const data = doc.data();
            totalAmount += data.amount;
            batch.delete(doc.ref); // remove the debt
        });

        // Create a new settlement transaction
        const transactionRef = db.collection('transactions').doc();
        const transactionData = {
            // The debtor now acts as "creditor" in this record, because they are paying the old creditor.
            creditor: debtor,
            participants: [creditor],
            amount: totalAmount,
            description: "Debt Settled",
            householdId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            isSettlement: true
        };
        batch.set(transactionRef, transactionData);

        await batch.commit();

        console.log(`Debts settled. Created settlement transaction with ID: ${transactionRef.id}`);
        res.status(200).json({ message: 'Debts settled successfully', settlementTransactionId: transactionRef.id });
    } catch (error) {
        console.error('Error settling debts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /debts/settle-one
// Body: { debtId } - settle a single debt by marking isSettled = true
// or deleting the doc if fully paid.
router.post('/settle-one', async (req, res) => {
    console.log(`Received POST request for /debts/settle-one with data:`, req.body);
    const { debtId } = req.body;

    if (!debtId) {
        return res.status(400).json({ error: 'debtId is required' });
    }

    try {
        const debtRef = db.collection('debts').doc(debtId);
        const debtDoc = await debtRef.get();
        if (!debtDoc.exists) {
            return res.status(404).json({ error: 'Debt not found' });
        }

        // Mark it as settled
        await debtRef.update({ isSettled: true });
        console.log(`Debt with ID ${debtId} settled`);
        res.status(200).json({ message: 'Debt settled successfully' });
    } catch (error) {
        console.error('Error settling debt:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /debts/:id
// Deletes a single debt document.
router.delete('/:id', async (req, res) => {
    console.log(`Received DELETE request for /debts/${req.params.id}`);
    try {
        const debtRef = db.collection('debts').doc(req.params.id);
        await debtRef.delete();
        console.log(`Debt with ID ${req.params.id} deleted`);
        res.status(200).json({ message: 'Debt deleted successfully' });
    } catch (error) {
        console.error('Error deleting debt:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
