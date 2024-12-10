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
    const week = Math.ceil((numberOfDays + oneJan.getUTCDay()+1)/7);
    return `${year}-W${week}`;
}

// Utility to get the previous week identifier if needed
function getPreviousWeekIdentifier() {
    const now = new Date();
    // Get current week first
    const currentWeek = getCurrentWeekIdentifier();
    // Parse current year-week
    const [yearStr, weekStr] = currentWeek.split('-W');
    let year = parseInt(yearStr, 10);
    let week = parseInt(weekStr, 10) - 1;

    // If week goes below 1, move to previous year (week 52 or 53)
    if (week < 1) {
        year -= 1;
        // A simplistic approach: we assume 52 weeks in the last year
        // (You could calculate it precisely if needed)
        week = 52;
    }

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
// NEW/CHANGED: Also store originalAssignedTo and assignedTime
router.post('/', async (req, res) => {
    console.log('Received POST request for /chores with data:', req.body);
    try {
        const assignedTo = req.body.assignedTo || null;
        const choreData = {
            name: req.body.name,
            assignedTo: assignedTo,
            originalAssignedTo: assignedTo, // NEW
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
// NEW/CHANGED: Also store completedTime
router.put('/:id/complete', async (req, res) => {
    const choreId = req.params.id;
    const { completedBy } = req.body; // expect { completedBy: userId }
    try {
        const choreRef = db.collection('chores').doc(choreId);
        await choreRef.update({ 
            completed: true, 
            completedBy, 
            completedTime: admin.firestore.FieldValue.serverTimestamp() // NEW
        });
        res.status(200).json({ message: 'Chore marked as completed' });
    } catch (error) {
        console.error('Error updating chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// PUT /chores/:id/assign - Reassign a chore to another user
// Expects { newUser }
// Keep originalAssignedTo intact. This ensures we can track original vs final completer.
router.put('/:id/assign', async (req, res) => {
    console.log(`Received PUT request for /chores/${req.params.id}/assign`);
    try {
        const { newUser } = req.body;
        const choreRef = db.collection('chores').doc(req.params.id);
        // Just update assignedTo. Do not change originalAssignedTo.
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

// GET /chores/templates - Get all template chores
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

// POST /chores/templates - Add a new template chore
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

// POST /chores/generate_weekly?householdId=...
// NEW/CHANGED: also add originalAssignedTo when generating chores
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
        const batch = db.batch();
        defaultChores.forEach(chore => {
            const randomUser = users[Math.floor(Math.random() * users.length)];
            const newChoreRef = db.collection('chores').doc();
            batch.set(newChoreRef, {
                name: chore.name,
                assignedTo: randomUser.id,
                originalAssignedTo: randomUser.id, // NEW
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

// NEW: DELETE /chores/cleanup_weekly - an endpoint to delete completed chores from previous week
// Call this at the end of each week or schedule it via cron.
router.delete('/cleanup_weekly', async (req, res) => {
    try {
        const previousWeek = getPreviousWeekIdentifier();
        const choresRef = db.collection('chores');
        const completedChoresSnap = await choresRef
            .where('weekIdentifier', '==', previousWeek)
            .where('completed', '==', true)
            .get();

        const batch = db.batch();
        completedChoresSnap.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        res.status(200).json({ message: `Cleaned up completed chores for ${previousWeek}` });
    } catch (error) {
        console.error('Error cleaning up chores:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// NEW: GET /chores/stats?householdId=...&weekIdentifier=...
// Returns stats: how many chores completed by each user, how many taken over, average completion time
router.get('/stats', async (req, res) => {
    const { householdId, weekIdentifier = getCurrentWeekIdentifier() } = req.query;
    if (!householdId) {
        return res.status(400).json({ error: 'householdId is required' });
    }
    try {
        let choresRef = db.collection('chores')
            .where('householdId', '==', householdId)
            .where('weekIdentifier', '==', weekIdentifier);
        
        const snapshot = await choresRef.get();
        const chores = [];
        snapshot.forEach(doc => chores.push({ id: doc.id, ...doc.data() }));

        const userStats = {}; // { userId: { completedCount: number, takenOverCount: number, totalCompletionTime: number, countWithTime: number } }
        
        chores.forEach(ch => {
            if (ch.completed) {
                const completer = ch.completedBy;
                const original = ch.originalAssignedTo;
                const assignedTime = ch.timestamp?.toDate ? ch.timestamp.toDate().getTime() : null;
                const completedTime = ch.completedTime?.toDate ? ch.completedTime.toDate().getTime() : null;
                const diffTime = (assignedTime && completedTime) ? (completedTime - assignedTime) : null;

                if (completer) {
                    if (!userStats[completer]) {
                        userStats[completer] = { completedCount: 0, takenOverCount: 0, totalCompletionTime: 0, countWithTime: 0 };
                    }
                    userStats[completer].completedCount += 1;

                    // If completer != originalAssignedTo, it's a takeover
                    if (original && original !== completer) {
                        userStats[completer].takenOverCount += 1;
                    }

                    if (diffTime !== null) {
                        userStats[completer].totalCompletionTime += diffTime;
                        userStats[completer].countWithTime += 1;
                    }
                }
            }
        });

        // Calculate averages
        const results = [];
        for (const userId in userStats) {
            const data = userStats[userId];
            const avgTime = data.countWithTime > 0 ? data.totalCompletionTime / data.countWithTime : null;
            results.push({
                userId,
                completedCount: data.completedCount,
                takenOverCount: data.takenOverCount,
                averageCompletionTimeMS: avgTime
            });
        }

        res.status(200).json(results);

    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
