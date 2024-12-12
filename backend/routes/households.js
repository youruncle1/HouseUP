/**
 * @file households.js
 * @brief Backend routes for managing household-related data, including default chores operations 
 *        (add, fetch, delete) within a specific household.
 * @author Robert Zelníček <xzelni06@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// POST /households/:householdId/defaultChores - Add a new default chore
router.post('/:householdId/defaultChores', async (req, res) => {
    const { householdId } = req.params;
    const { name, frequencyDays } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    const freq = frequencyDays || 7;

    try {
        const docRef = await db.collection('households')
            .doc(householdId)
            .collection('defaultChores')
            .add({ 
                name: name.trim(),
                frequencyDays: freq,
                lastGenerated: admin.firestore.FieldValue.serverTimestamp()
            });
        
        res.status(201).json({ id: docRef.id, name: name.trim(), frequencyDays: freq });
    } catch (error) {
        console.error('Error adding default chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// GET /households/:householdId/defaultChores
router.get('/:householdId/defaultChores', async (req, res) => {
    const { householdId } = req.params;
    try {
        const defaultChoresSnap = await db.collection('households')
            .doc(householdId)
            .collection('defaultChores')
            .get();

        const defaultChores = [];
        defaultChoresSnap.forEach(doc => defaultChores.push({ id: doc.id, ...doc.data() }));

        res.status(200).json(defaultChores);
    } catch (error) {
        console.error('Error fetching default chores:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /households/:householdId/defaultChores/:id
router.delete('/:householdId/defaultChores/:id', async (req, res) => {
    const { householdId, id } = req.params;
    try {
        const choreRef = db.collection('households')
            .doc(householdId)
            .collection('defaultChores')
            .doc(id);

        await choreRef.delete();
        console.log(`Default chore with ID ${id} deleted from household ${householdId}`);
        res.status(200).json({ message: 'Default chore deleted successfully' });
    } catch (error) {
        console.error('Error deleting default chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
