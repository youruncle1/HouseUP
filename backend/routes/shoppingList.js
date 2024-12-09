const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Get all shopping list items for a specific household
router.get('/', async (req, res) => {
    const householdId = req.query.householdId; // Get householdId from query parameters
    console.log(`Received GET request for /shopping-list with householdId: ${householdId}`);

    if (!householdId) {
        return res.status(400).json({ error: 'householdId is required' });
    }

    try {
        const shoppingListRef = db.collection('shoppingList').where('householdId', '==', householdId);
        const snapshot = await shoppingListRef.get();
        const items = [];
        snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() });
        });
        console.log(`Sending ${items.length} shopping list items for householdId: ${householdId}`);
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching shopping list items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add a new shopping list item for a specific household
router.post('/', async (req, res) => {
    const { name, quantity, householdId } = req.body;
    console.log('Received POST request for /shopping-list with data:', req.body);

    if (!householdId) {
        return res.status(400).json({ error: 'householdId is required' });
    }

    try {
        const itemData = {
            name,
            quantity: quantity || 1, // Default quantity is 1
            purchased: false,
            householdId, // Associate the item with the household
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
        };
        const docRef = await db.collection('shoppingList').add(itemData);
        console.log(`Added new item with ID: ${docRef.id} for householdId: ${householdId}`);
        res.status(201).json({ id: docRef.id, ...itemData });
    } catch (error) {
        console.error('Error adding shopping list item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Mark an item as purchased
router.put('/:id/purchase', async (req, res) => {
    console.log(`Received PUT request for /shopping-list/${req.params.id}/purchase`);
    try {
        const itemRef = db.collection('shoppingList').doc(req.params.id);
        await itemRef.update({ purchased: true });
        console.log(`Item with ID ${req.params.id} marked as purchased`);
        res.status(200).json({ message: 'Item marked as purchased' });
    } catch (error) {
        console.error('Error updating shopping list item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Update an item
router.put('/:id', async (req, res) => {
    console.log(`Received PUT request for /shopping-list/${req.params.id} with data:`, req.body);
    try {
        const itemRef = db.collection('shoppingList').doc(req.params.id);
        await itemRef.update({
            name: req.body.name,
            quantity: req.body.quantity,
        });
        console.log(`Item with ID ${req.params.id} updated`);
        res.status(200).json({ message: 'Item updated successfully' });
    } catch (error) {
        console.error('Error updating shopping list item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Delete an item
router.delete('/:id', async (req, res) => {
    console.log(`Received DELETE request for /shopping-list/${req.params.id}`);
    try {
        const itemRef = db.collection('shoppingList').doc(req.params.id);
        await itemRef.delete();
        console.log(`Item with ID ${req.params.id} deleted`);
        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting shopping list item:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
