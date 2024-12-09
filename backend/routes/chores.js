// backend/routes/chores.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Utility function to get current week identifier
 * Example: "2024-W50"
 */
function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const oneJan = new Date(year,0,1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil(( numberOfDays + oneJan.getUTCDay()+1)/7);
    return `${year}-W${week}`;
}

// GET /chores?householdId=&assignedTo=&weekIdentifier=
router.get('/', async (req, res) => {
    console.log('Received GET request for /chores');
    try {
        let choresRef = db.collection('chores');
        const { householdId, assignedTo, weekIdentifier } = req.query;

        if (householdId) {
            choresRef = choresRef.where('householdId', '==', householdId);
        }
        if (assignedTo) {
            choresRef = choresRef.where('assignedTo', '==', assignedTo);
        }
        if (weekIdentifier) {
            choresRef = choresRef.where('weekIdentifier', '==', weekIdentifier);
        }

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

// POST /chores - Add a new chore
// Expects { name, assignedTo, householdId, weekIdentifier }
router.post('/', async (req, res) => {
    console.log('Received POST request for /chores with data:', req.body);
    try {
        const choreData = {
            name: req.body.name,
            assignedTo: req.body.assignedTo || null,
            completed: false,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            householdId: req.body.householdId || null,
            weekIdentifier: req.body.weekIdentifier || getCurrentWeekIdentifier(),
        };
        const docRef = await db.collection('chores').add(choreData);
        console.log(`Added new chore with ID: ${docRef.id}`);
        res.status(201).json({ id: docRef.id, ...choreData });
    } catch (error) {
        console.error('Error adding chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /chores/:id/complete
router.put('/:id/complete', async (req, res) => {
    const choreId = req.params.id;
    const { completedBy } = req.body; // expect { completedBy: emailOfUser }

    try {
        const choreRef = db.collection('chores').doc(choreId);
        await choreRef.update({ completed: true, completedBy });
        res.status(200).json({ message: 'Chore marked as completed' });
    } catch (error) {
        console.error('Error updating chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /chores/:id/assign - Reassign a chore to another user
// Expects { newUser }
router.put('/:id/assign', async (req, res) => {
    console.log(`Received PUT request for /chores/${req.params.id}/assign`);
    try {
        const { newUser } = req.body;
        const choreRef = db.collection('chores').doc(req.params.id);
        await choreRef.update({ assignedTo: newUser });
        console.log(`Chore with ID ${req.params.id} reassigned to ${newUser}`);
        res.status(200).json({ message: 'Chore reassigned' });
    } catch (error) {
        console.error('Error reassigning chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// DELETE /chores/:id - Delete a chore
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

// GET /template_chores - Get all template chores
router.get('/templates', async (req, res) => {
    try {
        const templateRef = db.collection('template_chores');
        const snapshot = await templateRef.get();
        const templates = [];
        snapshot.forEach(doc => templates.push({ id: doc.id, ...doc.data() }));
        res.status(200).json(templates);
    } catch (error) {
        console.error('Error fetching template chores:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// POST /template_chores - Add a new template chore
// Expects { name, defaultAssignedTo, householdId }
router.post('/templates', async (req, res) => {
    try {
        const data = {
            name: req.body.name,
            defaultAssignedTo: req.body.defaultAssignedTo || null,
            householdId: req.body.householdId || null
        };
        const docRef = await db.collection('template_chores').add(data);
        res.status(201).json({ id: docRef.id, ...data });
    } catch (error) {
        console.error('Error adding template chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// A utility endpoint to generate this week's chores from template chores
// POST /chores/generate_weekly?householdId=... 
// POST /chores/generate_weekly?householdId=...

router.post('/generate_weekly', async (req, res) => {
    const { householdId } = req.query;
    if (!householdId) {
        return res.status(400).json({ error: 'householdId query param required' });
    }

    try {
        const currentWeek = getCurrentWeekIdentifier();

        // Fetch default chores from the household
        const defaultChoresSnap = await db.collection('households')
            .doc(householdId)
            .collection('defaultChores')
            .get();

        const defaultChores = [];
        defaultChoresSnap.forEach(doc => defaultChores.push({ id: doc.id, ...doc.data() }));

        if (defaultChores.length === 0) {
            return res.status(200).json({ message: 'No default chores found for this household.' });
        }

        // Fetch household users
        const usersSnap = await db.collection('users')
            .where('householdId', '==', householdId)
            .get();
        
        const users = [];
        usersSnap.forEach(doc => {
            users.push({ id: doc.id, ...doc.data() }); 
        });

        if (users.length === 0) {
            return res.status(200).json({ message: 'No users found for this household.' });
        }

        // Randomly assign chores to users
        // For example, just random distribution:
        const batch = db.batch();
        defaultChores.forEach(chore => {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const newChoreRef = db.collection('chores').doc();
            batch.set(newChoreRef, {
                name: chore.name,
                assignedTo: randomUser.id,
                completed: false,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                householdId: householdId,
                weekIdentifier: currentWeek
            });
        });

        await batch.commit();
        res.status(200).json({ message: 'Weekly chores generated and assigned randomly.' });
    } catch (error) {
        console.error('Error generating weekly chores:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.post('/households/:householdId/defaultChores', async (req, res) => {
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