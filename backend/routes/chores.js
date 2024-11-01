// backend/routes/chores.js

const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Get all chores
router.get('/', async (req, res) => {
    console.log('Received GET request for /chores');
    try {
        const choresRef = db.collection('chores');
        const snapshot = await choresRef.get();
        const chores = [];
        snapshot.forEach((doc) => {
            chores.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Sending ${chores.length} chores`);
        res.status(200).json(chores);
    } catch (error) {
        console.error('Error fetching chores:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a new chore
router.post('/', async (req, res) => {
    console.log('Received POST request for /chores with data:', req.body);
    try {
        const choreData = {
            name: req.body.name,
            assignedTo: req.body.assignedTo || null,
            completed: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('chores').add(choreData);
        console.log(`Added new chore with ID: ${docRef.id}`);
        res.status(201).json({ id: docRef.id, ...choreData });
    } catch (error) {
        console.error('Error adding chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Mark a chore as completed
router.put('/:id/complete', async (req, res) => {
    console.log(`Received PUT request for /chores/${req.params.id}/complete`);
    try {
        const choreRef = db.collection('chores').doc(req.params.id);
        await choreRef.update({ completed: true });
        console.log(`Chore with ID ${req.params.id} marked as completed`);
        res.status(200).json({ message: 'Chore marked as completed' });
    } catch (error) {
        console.error('Error updating chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete a chore
router.delete('/:id', async (req, res) => {
    console.log(`Received DELETE request for /chores/${req.params.id}`);
    try {
        const choreRef = db.collection('chores').doc(req.params.id);
        await choreRef.delete();
        console.log(`Chore with ID ${req.params.id} deleted`);
        res.status(200).json({ message: 'Chore deleted successfully' });
    } catch (error) {
        console.error('Error deleting chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
