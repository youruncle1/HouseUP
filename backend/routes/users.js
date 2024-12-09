// backend/routes/users.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// GET /users?householdId=<householdId>
router.get('/', async (req, res) => {
  const { householdId } = req.query;
  if (!householdId) {
    return res.status(400).json({ error: 'householdId query param required' });
  }

  try {
    const usersRef = db.collection('users').where('householdId', '==', householdId);
    const snapshot = await usersRef.get();
    const users = [];
    snapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });
    return res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
