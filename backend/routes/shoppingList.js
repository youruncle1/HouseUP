const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Get all shopping list items for a specific household
router.get('/', async (req, res) => {
    const householdId = req.query.householdId; // Get householdId from query parameters

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

// Get all favorite shopping items for a specific household
router.get('/:householdID/favouriteShopItems', async (req, res) => {
    const { householdID } = req.params;

    try {
        const favoritesRef = db.collection('households')
            .doc(householdID)
            .collection('favouriteShopItems');
        const snapshot = await favoritesRef.get();
        const favorites = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        res.status(200).json(favorites);
    } catch (error) {
        console.error('Error fetching favorite shopping items:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Add new shop items to shopping list for a specific household
router.post('/', async (req, res) => {
    const { items, householdId, userId } = req.body; // Include userId in the request body

    if (!householdId || !items || !Array.isArray(items) || !userId) {
        return res.status(400).json({ error: 'householdId, an array of items, and userId are required' });
    }

    try {
        const batch = db.batch(); // Firestore batch operation
        items.forEach(item => {
            const itemRef = db.collection('shoppingList').doc();
            batch.set(itemRef, {
                name: item.name,
                quantity: item.quantity || 1, // Default quantity is 1
                purchased: false,
                householdId, // Associate the item with the household
                createdBy: userId, // Set the userId as createdBy
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
        });

        await batch.commit(); // Execute the batch operation
        console.log(`${items.length} items added to householdId: ${householdId} by user: ${userId}`);
        res.status(201).json({ message: `${items.length} items added successfully` });
    } catch (error) {
        console.error('Error adding items to shopping list:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Add a new favorite shopping list item for a specific household
router.post('/:householdID/favouriteShopItems', async (req, res) => {
    const { householdID } = req.params;
    const { name } = req.body;

    if (!name || name.trim() === "") {
        return res.status(400).json({ error: 'Item name is required' });
    }

    try {
        const newItem = { name: name.trim() };
        const docRef = await db
            .collection('households')
            .doc(householdID)
            .collection('favouriteShopItems')
            .add(newItem);

        console.log(`Added new favorite item with ID: ${docRef.id} for householdID: ${householdID}`);
        res.status(201).json({ id: docRef.id, ...newItem });
    } catch (error) {
        console.error('Error adding favorite item:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Mark an item as purchased
router.put('/:id/purchase', async (req, res) => {

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

// Delete a favorite shopping list item for a specific household
router.delete('/:householdID/favouriteShopItems/:favoriteID', async (req, res) => {
    const { householdID, favoriteID } = req.params;

    try {
        const favoriteRef = db
            .collection('households')
            .doc(householdID)
            .collection('favouriteShopItems')
            .doc(favoriteID);

        // Check if the item exists
        const doc = await favoriteRef.get();
        if (!doc.exists) {
            return res.status(404).json({ error: 'Favorite item not found' });
        }

        // Delete the item
        await favoriteRef.delete();
        console.log(`Deleted favorite item with ID: ${favoriteID} for householdID: ${householdID}`);
        res.status(200).json({ message: 'Favorite item deleted successfully' });
    } catch (error) {
        console.error('Error deleting favorite item:', error.message);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get user data
router.get('/users/:userId', async (req, res) => {
    const { userId } = req.params;

    try {
        const userDoc = await db.collection('users').doc(userId).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userData = userDoc.data();
        res.status(200).json({
            id: userId, // Include the document ID as the user ID
            ...userData,
        });
    } catch (error) {
        console.error('Error fetching user info:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



module.exports = router;
