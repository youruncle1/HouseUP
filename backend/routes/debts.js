/**
 * @file debts.js
 * @brief backend route; lists all debts in a household, settles debts between members, removes debts.
 * @author Roman Poliačik <xpolia05@stud.fit.vutbr.cz>
 * @date 13.12.2024
 */
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// returns all one-on-one debts for the given household
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

// settle all debts from one user to another within a household
// remove all debts from debtor->creditor, get sum, create a settlement transaction.
// { debtor, creditor, householdId }
router.post('/settle', async (req, res) => {
    console.log('Received POST request for /debts/settle with data:', req.body);
    const { debtor, creditor, householdId } = req.body;

    if (!debtor || !creditor || !householdId) {
        return res.status(400).json({ error: 'Debtor, creditor, and householdId are required' });
    }

    try {
        // find all debts where debtor owes creditor
        const debtsRef = db.collection('debts')
            .where('debtor', '==', debtor)
            .where('creditor', '==', creditor)
            .where('householdId', '==', householdId);

        const debtsSnapshot = await debtsRef.get();
        if (debtsSnapshot.empty) {
            return res.status(404).json({ error: 'No debts found between these users in this household' });
        }

        // sum up and remove debts
        let totalAmount = 0;
        const batch = db.batch();
        debtsSnapshot.forEach((doc) => {
            const data = doc.data();
            totalAmount += data.amount;
            batch.delete(doc.ref); // remove the debt
        });

        // create a settlement (isSettlement) transaction
        const transactionRef = db.collection('transactions').doc();
        const transactionData = {
            creditor: debtor,  // debtor now pays off the old creditor
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

// delete a single debt document
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
