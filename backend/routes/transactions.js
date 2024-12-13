/**
 * @file transactions.js
 * @brief backend route; creation, fetching, updating, deletion,scheduling of transactions and their related debts.
 * @author Roman Poliačik <xpolia05@stud.fit.vutbr.cz>
 * @date 13.12.2024
 */
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const moment = require('moment');

// get all transactions for a given household
router.get('/', async (req, res) => {
    // get household id from query
    const householdId = req.query.householdId;
    if (!householdId) {
        return res.status(400).json({ error: 'householdId is required' });
    }

    try {
        // get matching transactions
        let transactionsRef = db.collection('transactions').where('householdId', '==', householdId);
        const snapshot = await transactionsRef.get();
        const transactions = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            // convert timestamp
            if (data.timestamp && data.timestamp.toDate) {
                data.timestamp = data.timestamp.toDate().toISOString();
            }
            transactions.push({ id: doc.id, ...data });
        });

        // sort newest first
        transactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        console.log(`Sending ${transactions.length} transactions for householdId ${householdId}`);
        res.status(200).json(transactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// create a new transaction (normal or recurring)
// { creditor, participants, amount, description, householdId, isRecurring, startDate, recurrenceInterval }
router.post('/', async (req, res) => {
    console.log('Received POST request for /transactions with data:', req.body);
    const { creditor, participants, amount, description, householdId, isRecurring, recurrenceInterval, startDate } = req.body;

    // basic validations
    if (!creditor || !participants || !Array.isArray(participants) || participants.length === 0 || !householdId) {
        return res.status(400).json({ error: 'Missing required fields: creditor, participants, householdId' });
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    // set up transaction data
    const transactionData = {
        creditor,
        participants,
        amount: amountValue,
        description: description || '',
        householdId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isSettlement: false
    };

    let isRecurringFlag = false;
    let parsedStartDate = null;

    if (isRecurring) {
        if (!startDate) {
            return res.status(400).json({ error: 'startDate is required for recurring transactions' });
        }

        parsedStartDate = new Date(startDate);
        if (isNaN(parsedStartDate.getTime())) {
            return res.status(400).json({ error: 'Invalid startDate format' });
        }

        // Set recurring fields
        isRecurringFlag = true;
        transactionData.isRecurring = true;
        transactionData.recurrenceInterval = recurrenceInterval;
        transactionData.startDate = admin.firestore.Timestamp.fromDate(parsedStartDate);
        transactionData.nextPaymentDate = admin.firestore.Timestamp.fromDate(parsedStartDate);
    } else {
        transactionData.isRecurring = false;
        transactionData.recurrenceInterval = null;
        transactionData.startDate = null;
        transactionData.nextPaymentDate = null;
    }

    const transactionRef = db.collection('transactions').doc();
    try {
        const batch = db.batch();

        // if normal transaction, create debts now
        if (!isRecurringFlag) {
            const share = amountValue / participants.length;
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
        }

        // save the transaction
        batch.set(transactionRef, transactionData);
        await batch.commit();
        console.log(`Transaction created with ID: ${transactionRef.id}`);

        // if recurring and startDate <= today, spawn/create instance
        if (isRecurringFlag) {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today's day
            const startOfDayTime = today.getTime();
            const startDateTime = new Date(parsedStartDate.getFullYear(), parsedStartDate.getMonth(), parsedStartDate.getDate()).getTime();

            if (startDateTime <= startOfDayTime) {
                // create normal instance now
                await spawnRecurringInstance({
                    creditor,
                    participants,
                    amount: amountValue,
                    description,
                    householdId
                });

                // updates nextPaymentDate
                if (recurrenceInterval === 'once') {
                    // once only => remove template
                    await transactionRef.delete();
                } else {
                    // move nextPaymentDate forward
                    const updatedDate = getNextPaymentDate(recurrenceInterval, parsedStartDate);
                    await transactionRef.update({
                        nextPaymentDate: admin.firestore.Timestamp.fromDate(updatedDate)
                    });
                }
            }
        }
        res.status(201).json({ id: transactionRef.id, ...transactionData });
    } catch (error) {
        console.error('Error adding transaction and debts:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// helper to spawn normal instance from recurring template
async function spawnRecurringInstance({ creditor, participants, amount, description, householdId }) {
    // create normal transaction and debts
    const newTransRef = db.collection('transactions').doc();
    const newTransData = {
        creditor,
        participants,
        amount,
        description: description || '',
        householdId,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        isSettlement: false,
        isRecurring: false, // Normal instance
        recurrenceInterval: null,
        startDate: null,
        nextPaymentDate: null,
    };

    const batch = db.batch();
    batch.set(newTransRef, newTransData);

    const share = amount / participants.length;
    participants.forEach(p => {
        if (p !== creditor) {
            const debtRef = db.collection('debts').doc();
            const debtData = {
                creditor,
                debtor: p,
                amount: share,
                householdId,
                relatedTransactionId: newTransRef.id,
                isSettled: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            };
            batch.set(debtRef, debtData);
        }
    });

    await batch.commit();
    console.log(`Spawned immediate instance transaction ${newTransRef.id} from recurring template.`);
}

// helper to get nextPaymentDate
function getNextPaymentDate(interval, currentDate) {
    const m = moment(currentDate);
    switch (interval) {
        case 'weekly':
            return m.add(1, 'weeks').toDate();
        case 'biweekly':
            return m.add(2, 'weeks').toDate();
        case 'monthly':
            return m.add(1, 'months').toDate();
        case 'semiannually':
            return m.add(6, 'months').toDate();
        default:
            // once
            return null;
    }
}

// update an existing transaction
router.put('/:id', async (req, res) => {
    console.log(`Received PUT request for /transactions/${req.params.id} with data:`, req.body);
    const transactionId = req.params.id;
    const { creditor, participants, amount, description, householdId, isRecurring, recurrenceInterval, startDate } = req.body;

    // basic validation
    if (!creditor || !participants || !Array.isArray(participants) || participants.length === 0 || !householdId) {
        return res.status(400).json({ error: 'Missing required fields: creditor, participants, householdId' });
    }
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
    }

    try {
        // get existing transaction
        const transactionRef = db.collection('transactions').doc(transactionId);
        const transDoc = await transactionRef.get();
        if (!transDoc.exists) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const existingData = transDoc.data();
        // cannot edit settlement (check)
        if (existingData.isSettlement === true) {
            return res.status(400).json({ error: 'Cannot edit a settlement transaction' });
        }

        // prepare updated data
        const updatedTransactionData = {
            creditor,
            participants,
            amount: amountValue,
            description: description || '',
            householdId,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            isSettlement: false
        };

        const batch = db.batch();

        if (isRecurring) {
            // if recurring, update data and don't change debts
            updatedTransactionData.isRecurring = true;
            updatedTransactionData.recurrenceInterval = recurrenceInterval || null;
            updatedTransactionData.startDate = startDate ? admin.firestore.Timestamp.fromDate(new Date(startDate)) : null;
            updatedTransactionData.nextPaymentDate = updatedTransactionData.startDate || null;

            batch.update(transactionRef, updatedTransactionData);

        } else {
            // normal transaction => delete old debts and create new
            updatedTransactionData.isRecurring = false;
            updatedTransactionData.recurrenceInterval = null;
            updatedTransactionData.startDate = null;
            updatedTransactionData.nextPaymentDate = null;

            // delete old debts
            const debtsRef = db.collection('debts').where('relatedTransactionId', '==', transactionId);
            const debtsSnapshot = await debtsRef.get();
            debtsSnapshot.forEach(d => batch.delete(d.ref));

            // create new debts based on participants
            const share = amountValue / participants.length;
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

            // update the transaction
            batch.update(transactionRef, updatedTransactionData);
        }

        await batch.commit();
        console.log(`Transaction ${transactionId} updated successfully.`);
        res.status(200).json({ id: transactionId, ...updatedTransactionData });
    } catch (error) {
        console.error('Error editing transaction:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// can-edit returns true if editing is allowed(false if full or partial settlements happened).
router.get('/:id/can-edit', async (req, res) => {
    const transactionId = req.params.id;

    try {
        const transactionRef = db.collection('transactions').doc(transactionId);
        const transDoc = await transactionRef.get();
        if (!transDoc.exists) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        const transactionData = transDoc.data();

        // settlement transaction => no editing allowed.
        if (transactionData.isSettlement === true) {
            return res.status(200).json({ canEdit: false, reason: 'This is a settlement transaction and cannot be edited.' });
        }

        const { participants, creditor } = transactionData;
        if (!participants || !Array.isArray(participants) || !creditor) {
            return res.status(200).json({ canEdit: false, reason: 'Transaction data incomplete, cannot edit.' });
        }

        // count non-creditor participants => match debts in database to this amount
        const nonCreditorCount = participants.filter(p => p !== creditor).length;

        // fetch current debts for this transaction
        const debtsRef = db.collection('debts').where('relatedTransactionId', '==', transactionId);
        const debtsSnapshot = await debtsRef.get();
        const currentDebtsCount = debtsSnapshot.size;

        // if less debts than non-creditors, some debts got settled => partial/full settlement => no editing
        if (currentDebtsCount < nonCreditorCount) {
            return res.status(200).json({ canEdit: false, reason: 'Some debts from this Transaction have been settled, cannot edit.' });
        }

        // editing is allowed
        return res.status(200).json({ canEdit: true });
    } catch (error) {
        console.error('Error checking can-edit:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// get all recurring/scheduled transactions for a household
router.get('/recurring', async (req, res) => {
    console.log('Received GET request for /transactions/recurring');
    const householdId = req.query.householdId;

    try {
        let transRef = db.collection('transactions').where('isRecurring', '==', true);
        if (householdId) {
            transRef = transRef.where('householdId', '==', householdId);
        }

        const snapshot = await transRef.get();
        const recurringTransactions = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.startDate && data.startDate.toDate) {
                data.startDate = data.startDate.toDate().toISOString();
            }
            if (data.nextPaymentDate && data.nextPaymentDate.toDate) {
                data.nextPaymentDate = data.nextPaymentDate.toDate().toISOString();
            }
            recurringTransactions.push({ id: doc.id, ...data });
        });
        res.status(200).json(recurringTransactions);
    } catch (error) {
        console.error('Error fetching recurring transactions:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// process due recurring transactions: USED BY CRON (AUTOCHECK ON MIDNIGHT)
async function processDueRecurringTransactions() {
    const now = moment().startOf('day');
    const transRef = db.collection('transactions').where('isRecurring', '==', true);
    const snapshot = await transRef.get();
    const batch = db.batch();

    // for each recurring transaction, check if nextPaymentDate <= moment(current), create transaction if yes
    for (const doc of snapshot.docs) {
        const data = doc.data();
        const nextPaymentDate = data.nextPaymentDate ? data.nextPaymentDate.toDate() : null;

        if (nextPaymentDate && moment(nextPaymentDate).isSameOrBefore(now)) {
            // normal transaction
            const newTransactionRef = db.collection('transactions').doc();
            const newTransactionData = {
                creditor: data.creditor,
                participants: data.participants,
                amount: data.amount,
                description: data.description || '',
                householdId: data.householdId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                isSettlement: false,
                isRecurring: false // false to filter normal from recurring
            };
            batch.set(newTransactionRef, newTransactionData);

            // create debts for the new transaction
            const share = data.amount / data.participants.length;
            data.participants.forEach(p => {
                if (p !== data.creditor) {
                    const debtRef = db.collection('debts').doc();
                    const debtData = {
                        creditor: data.creditor,
                        debtor: p,
                        amount: share,
                        householdId: data.householdId,
                        relatedTransactionId: newTransactionRef.id,
                        isSettled: false,
                        timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    };
                    batch.set(debtRef, debtData);
                }
            });

            // determine nextPaymentDate
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
                case 'once':
                default:
                    // once
                    newNextPaymentDate = null;
                    break;
            }

            const originalTransRef = db.collection('transactions').doc(doc.id);

            if (newNextPaymentDate) {
                // update template for next time
                batch.update(originalTransRef, {
                    nextPaymentDate: admin.firestore.Timestamp.fromDate(newNextPaymentDate.toDate())
                });
            } else {
                // if 'once', delete recurring transaction
                batch.delete(originalTransRef);
            }
        }
    }

    await batch.commit();
}


// delete transaction and related debts
router.delete('/:id', async (req, res) => {
    console.log(`Received DELETE request for /transactions/${req.params.id}`);
    const transactionId = req.params.id;

    try {
        const transactionRef = db.collection('transactions').doc(transactionId);
        const transDoc = await transactionRef.get();
        if (!transDoc.exists) {
            return res.status(404).json({ error: 'Transaction not found' });
        }

        // find all debts linked to this transaction
        const debtsRef = db.collection('debts').where('relatedTransactionId', '==', transactionId);
        const debtsSnapshot = await debtsRef.get();

        const batch = db.batch();
        // delete transaction
        batch.delete(transactionRef);
        // delete all related debts
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
module.exports.processDueRecurringTransactions = processDueRecurringTransactions;