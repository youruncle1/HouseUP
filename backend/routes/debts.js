// backend/routes/debts.js

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const moment = require('moment');

// Get all debts
router.get('/', async (req, res) => {
    console.log('Received GET request for /debts');
    try {
        const debtsRef = db.collection('debts');
        const snapshot = await debtsRef.get();
        const debts = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore Timestamp to ISO string
            if (data.timestamp && data.timestamp.toDate) {
                data.timestamp = data.timestamp.toDate().toISOString();
            }
            debts.push({ id: doc.id, ...data });
        });

        // Process due recurring debts
        await processDueRecurringDebts();

        console.log(`Sending ${debts.length} debts`);
        res.status(200).json(debts);
    } catch (error) {
        console.error('Error fetching debts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

async function processDueRecurringDebts() {
    const recurringDebtsRef = db.collection('debts').where('isRecurring', '==', true);
    const snapshot = await recurringDebtsRef.get();

    const batch = db.batch();
    const now = moment().startOf('day');

    snapshot.forEach((doc) => {
        const data = doc.data();
        const nextPaymentDate = data.nextPaymentDate ? data.nextPaymentDate.toDate() : null;

        if (nextPaymentDate && moment(nextPaymentDate).isSameOrBefore(now)) {
            // Create a new debt instance
            const newDebtData = {
                creditor: data.creditor,
                debtor: data.debtor,
                amount: data.amount,
                description: data.description,
                isSettled: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                isRecurringInstance: true,
                parentRecurringDebtId: doc.id,
            };
            const newDebtRef = db.collection('debts').doc();
            batch.set(newDebtRef, newDebtData);

            // Update nextPaymentDate based on recurrenceInterval
            let newNextPaymentDate;
            switch (data.recurrenceInterval) {
                case 'weekly':
                    newNextPaymentDate = moment(nextPaymentDate).add(1, 'weeks');
                    break;
                case 'biweekly':
                    newNextPaymentDate = moment(nextPaymentDate).add(2, 'weeks');
                    break;
                case 'monthly':
                    newNextPaymentDate = moment(nextPaymentDate).add(1, 'months');
                    break;
                case 'semiannually':
                    newNextPaymentDate = moment(nextPaymentDate).add(6, 'months');
                    break;
                default:
                    // 'once' or unknown interval
                    newNextPaymentDate = null;
                    break;
            }

            // Update the recurring debt's nextPaymentDate
            const recurringDebtRef = db.collection('debts').doc(doc.id);
            batch.update(recurringDebtRef, {
                nextPaymentDate: newNextPaymentDate ? admin.firestore.Timestamp.fromDate(newNextPaymentDate.toDate()) : null,
            });
        }
    });

    // Commit the batch
    await batch.commit();
}

// Get recurring debts
router.get('/recurring', async (req, res) => {
    console.log('Received GET request for /debts/recurring');
    try {
        const debtsRef = db.collection('debts');
        const snapshot = await debtsRef.where('isRecurring', '==', true).get();
        const recurringDebts = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // Convert Firestore Timestamps to ISO strings
            if (data.startDate && data.startDate.toDate) {
                data.startDate = data.startDate.toDate().toISOString();
            }
            if (data.nextPaymentDate && data.nextPaymentDate.toDate) {
                data.nextPaymentDate = data.nextPaymentDate.toDate().toISOString();
            }
            recurringDebts.push({ id: doc.id, ...data });
        });
        res.status(200).json(recurringDebts);
    } catch (error) {
        console.error('Error fetching recurring debts:', error);
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
            isRecurring: req.body.isRecurring || false,
            recurrenceInterval: req.body.isRecurring ? req.body.recurrenceInterval : null,
            startDate: req.body.isRecurring ? admin.firestore.Timestamp.fromDate(new Date(req.body.startDate)) : null,
            nextPaymentDate: req.body.isRecurring ? admin.firestore.Timestamp.fromDate(new Date(req.body.startDate)) : null, // For simplicity, set nextPaymentDate as startDate
        };
        const docRef = await db.collection('debts').add(debtData);
        console.log(`Added new debt with ID: ${docRef.id}`);
        res.status(201).json({ id: docRef.id, ...debtData });
    } catch (error) {
        console.error('Error adding debt:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update a debt
router.put('/:id', async (req, res) => {
    console.log(`Received PUT request for /debts/${req.params.id}`);
    try {
        const debtRef = db.collection('debts').doc(req.params.id);
        const debtData = {
            creditor: req.body.creditor,
            debtor: req.body.debtor,
            amount: req.body.amount,
            description: req.body.description || '',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
        await debtRef.update(debtData);
        console.log(`Debt with ID ${req.params.id} updated`);
        res.status(200).json({ message: 'Debt updated successfully' });
    } catch (error) {
        console.error('Error updating debt:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Settle a debt
router.post('/settle', async (req, res) => {
    console.log(`Received POST request for /debts/settle`);
    try {
        const { debtor, creditor } = req.body;

        if (!debtor || !creditor) {
            return res.status(400).json({ error: 'Debtor and creditor are required' });
        }

        // Find all unsettled debts between debtor and creditor
        const debtsRef = db.collection('debts')
            .where('debtor', '==', debtor)
            .where('creditor', '==', creditor)
            .where('isSettled', '==', false);
        const debtsSnapshot = await debtsRef.get();

        if (debtsSnapshot.empty) {
            return res.status(404).json({ error: 'No debts found between these users' });
        }

        let totalAmount = 0;
        const batch = db.batch();
        debtsSnapshot.forEach((doc) => {
            const debtData = doc.data();
            totalAmount += debtData.amount;
            // Mark the debt as settled
            batch.update(doc.ref, { isSettled: true });
        });

        // Create a new transaction that nullifies the debt
        const settlementDebtData = {
            creditor: debtor,
            debtor: creditor,
            amount: totalAmount,
            description: 'Debt Settled',
            isSettled: true,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
        const newDebtRef = db.collection('debts').doc();
        batch.set(newDebtRef, settlementDebtData);

        // Commit the batch
        await batch.commit();

        res.status(200).json({ message: 'Debts settled successfully' });
    } catch (error) {
        console.error('Error settling debt:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a debt
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
