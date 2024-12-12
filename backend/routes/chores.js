// backend/routes/chores.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const oneJan = new Date(year,0,1);
    const numberOfDays = Math.floor((now - oneJan)/(24*60*60*1000));
    const week = Math.ceil((numberOfDays + oneJan.getUTCDay()+1)/7);
    return `${year}-W${week}`;
}

// Helper function: updateUserStats
async function updateUserStats(householdId, userId, isTakeover, weekIdentifier) {
    const today = new Date();
    const yyyy = today.getUTCFullYear();
    const mm = String(today.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(today.getUTCDate()).padStart(2, '0');
    const dayKey = `${yyyy}-${mm}-${dd}`; 

    const statsRef = db.collection('households')
        .doc(householdId)
        .collection('usersStats')
        .doc(userId);

    await db.runTransaction(async (t) => {
        const doc = await t.get(statsRef);
        let data = doc.exists ? doc.data() : {};

        // Initialize fields if missing
        if (!data.completedCount) data.completedCount = 0;
        if (!data.takenOverCount) data.takenOverCount = 0;
        if (!data.weeklyCompletionHistory) data.weeklyCompletionHistory = {};
        if (!data.dailyCompletionHistory) data.dailyCompletionHistory = {};

        data.completedCount += 1;
        if (isTakeover) {
            data.takenOverCount += 1;
        }

        // Update weekly history
        if (!data.weeklyCompletionHistory[weekIdentifier]) {
            data.weeklyCompletionHistory[weekIdentifier] = 0;
        }
        data.weeklyCompletionHistory[weekIdentifier] += 1;

        // Update daily history
        if (!data.dailyCompletionHistory[dayKey]) {
            data.dailyCompletionHistory[dayKey] = 0;
        }
        data.dailyCompletionHistory[dayKey] += 1;

        t.set(statsRef, data, { merge: true });
    });
}

// GET /chores ...
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

// POST /chores ...
router.post('/', async (req, res) => {
    console.log('Received POST request for /chores with data:', req.body);
    try {
        const assignedTo = req.body.assignedTo || null;
        const choreData = {
            name: req.body.name,
            assignedTo: assignedTo,
            originalAssignedTo: assignedTo,
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
    const { completedBy } = req.body;
    try {
        const choreRef = db.collection('chores').doc(choreId);
        const choreDoc = await choreRef.get();
        if (!choreDoc.exists) {
            return res.status(404).json({ error: 'Chore not found' });
        }
        const choreData = choreDoc.data();

        await choreRef.update({ 
            completed: true, 
            completedBy, 
            completedTime: admin.firestore.FieldValue.serverTimestamp()
        });

        // Update user stats
        // Determine if takeover
        const isTakeover = choreData.originalAssignedTo && choreData.originalAssignedTo !== completedBy;
        const householdId = choreData.householdId;
        const weekIdentifier = choreData.weekIdentifier || getCurrentWeekIdentifier();

        await updateUserStats(householdId, completedBy, isTakeover, weekIdentifier);

        res.status(200).json({ message: 'Chore marked as completed' });
    } catch (error) {
        console.error('Error updating chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /chores/:id/assign ...
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

// DELETE /chores/:id ...
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

// GET /chores/userStats?householdId=...&userId=...
// Fetch the stats doc and return it for charts
router.get('/userStats', async (req, res) => {
    const { householdId, userId } = req.query;
    if (!householdId || !userId) {
        return res.status(400).json({ error: 'householdId and userId are required' });
    }

    try {
        const statsRef = db.collection('households')
            .doc(householdId)
            .collection('usersStats')
            .doc(userId);

        const doc = await statsRef.get();
        if (!doc.exists) {
            return res.status(200).json({
                completedCount: 0,
                takenOverCount: 0,
                weeklyCompletionHistory: {},
                dailyCompletionHistory: {}
            });
        } else {
            return res.status(200).json(doc.data());
        }
    } catch (error) {
        console.error('Error fetching user stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = {
    router
};
