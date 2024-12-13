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

// handles full and partial settlements between users
router.post('/settle', async (req, res) => {
    console.log('Received POST request for /debts/settle with data:', req.body);
    const { debtor, creditor, householdId, amount } = req.body;

    if (!debtor || !creditor || !householdId) {
        return res.status(400).json({ error: 'Missing debtor, creditor, or householdId' });
    }

    try {
        // find all debts where "debtor" owes "creditor"
        const debtsRef = db.collection('debts')
            .where('debtor', '==', debtor)
            .where('creditor', '==', creditor)
            .where('householdId', '==', householdId);

        const debtsSnapshot = await debtsRef.get();
        if (debtsSnapshot.empty) {
            return res.status(404).json({ error: 'No debts found' });
        }

        // sum all found debts
        let totalAmount = 0;
        debtsSnapshot.forEach((doc) => {
            const data = doc.data();
            totalAmount += data.amount;
        });

        const batch = db.batch();

        // delete all existing debts for debtor->creditor
        debtsSnapshot.forEach((doc) => batch.delete(doc.ref));

        // determine how much to settle:
        // if "amount" is not provided, its a full settlement
        // if "amount" is provided, its a partial settlemenlt
        const settlementAmount = amount == null ? totalAmount : parseFloat(amount);

        // validate amount
        if (isNaN(settlementAmount) || settlementAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        if (settlementAmount >= totalAmount) {
            // partial-full OR full settlement
            const transactionRef = db.collection('transactions').doc();
            const transactionData = {
                creditor: debtor, // debtor is now creditor
                participants: [creditor],
                amount: totalAmount,
                description: "Debt Settled",
                householdId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                isSettlement: true
            };
            batch.set(transactionRef, transactionData);
            await batch.commit();
            console.log(`Settlement transaction: ${transactionRef.id}`);
            return res.status(200).json({ message: 'Full settlement', settlementTransactionId: transactionRef.id });
        } else {
            // partial settlement (settlementamount < totalamount)
            const settlementTransRef = db.collection('transactions').doc();
            const settlementTransData = {
                creditor: debtor,
                participants: [creditor],
                amount: settlementAmount,
                description: "Partial Debt Settlement",
                householdId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                isSettlement: true
            };
            batch.set(settlementTransRef, settlementTransData);

            // leftover after partial payment
            const leftover = totalAmount - settlementAmount;

            // create one new debt for the remaining amount owed
            const newDebtRef = db.collection('debts').doc();
            const newDebtData = {
                creditor,
                debtor,
                amount: leftover,
                householdId,
                relatedTransactionId: null, //leftover no linked transaction
                isSettled: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            batch.set(newDebtRef, newDebtData);
            await batch.commit();
            console.log(`Partial settlement done. Settlement: ${settlementTransRef.id}, leftover debt: ${newDebtRef.id}`);
            return res.status(200).json({
                message: 'Partial settlement successful',
                settlementTransactionId: settlementTransRef.id,
                leftoverDebtId: newDebtRef.id
            });
        }

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
