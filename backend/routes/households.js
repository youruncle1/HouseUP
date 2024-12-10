const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');

const db = admin.firestore();

// Define the route here
router.post('/:householdId/defaultChores', async (req, res) => {
    const { householdId } = req.params;
    const { name } = req.body;
    if (!name) {
        return res.status(400).json({ error: 'Name is required' });
    }

    try {
        const docRef = await db.collection('households')
            .doc(householdId)
            .collection('defaultChores')
            .add({ name: name.trim() });
        
        res.status(201).json({ id: docRef.id, name: name.trim() });
    } catch (error) {
        console.error('Error adding default chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
