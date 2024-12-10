// backend/routes/chores.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

/**
 * Utility function to get current week identifier
 */
function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const oneJan = new Date(year,0,1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((numberOfDays + oneJan.getUTCDay()+1)/7);
    return `${year}-W${week}`;
}

// No need for previous week identifier since we no longer delete chores.

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

router.put('/:id/complete', async (req, res) => {
    const choreId = req.params.id;
    const { completedBy } = req.body;
    try {
        const choreRef = db.collection('chores').doc(choreId);
        await choreRef.update({ 
            completed: true, 
            completedBy, 
            completedTime: admin.firestore.FieldValue.serverTimestamp()
        });
        res.status(200).json({ message: 'Chore marked as completed' });
    } catch (error) {
        console.error('Error updating chore:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

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

router.post('/generate_due', async (req, res) => {
    const { householdId } = req.query;
    if (!householdId) {
        return res.status(400).json({ error: 'householdId query param required' });
    }

    try {
        const defaultChoresSnap = await db.collection('households')
            .doc(householdId)
            .collection('defaultChores')
            .get();

        if (defaultChoresSnap.empty) {
            return res.status(200).json({ message: 'No default chores found for this household.' });
        }

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

        const now = new Date();
        const batch = db.batch();
        let choresGenerated = 0;

        defaultChoresSnap.forEach(choreDoc => {
            const choreData = choreDoc.data();
            const frequency = choreData.frequencyDays || 7;
            const lastGenerated = choreData.lastGenerated?.toDate() || new Date(0);
            const diffDays = Math.floor((now - lastGenerated) / (1000*60*60*24));

            if (diffDays >= frequency) {
                // Due to regenerate
                const randomUser = users[Math.floor(Math.random() * users.length)];
                const newChoreRef = db.collection('chores').doc();
                batch.set(newChoreRef, {
                    name: choreData.name,
                    assignedTo: randomUser.id,
                    originalAssignedTo: randomUser.id,
                    completed: false,
                    timestamp: admin.firestore.FieldValue.serverTimestamp(),
                    householdId: householdId,
                    weekIdentifier: getCurrentWeekIdentifier()
                });

                // Update lastGenerated
                const choreRef = db.collection('households')
                    .doc(householdId)
                    .collection('defaultChores')
                    .doc(choreDoc.id);
                batch.update(choreRef, { lastGenerated: admin.firestore.FieldValue.serverTimestamp() });

                choresGenerated++;
            }
        });

        await batch.commit();
        res.status(200).json({ message: `${choresGenerated} chores generated based on frequency.` });
    } catch (error) {
        console.error('Error generating due chores:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Remove or comment out the cleanup_weekly route since we no longer delete chores
// router.delete('/cleanup_weekly', ... ) // Not needed anymore

router.get('/stats', async (req, res) => {
    const { householdId } = req.query;
    if (!householdId) {
        return res.status(400).json({ error: 'householdId is required' });
    }
    try {
        let choresRef = db.collection('chores')
            .where('householdId', '==', householdId);

        const snapshot = await choresRef.get();
        const chores = [];
        snapshot.forEach(doc => chores.push({ id: doc.id, ...doc.data() }));

        const userStats = {}; 
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
