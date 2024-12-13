/**
 * @file ShoppingListScreen.js
 * @brief Main shopping list screen where users see currently added items in shopping list of particular household
 * @author Denis Milistenfer <xmilis00@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    Image,
    Modal,
    TextInput,
} from 'react-native';
import api from '../services/api';
import styles from '../styles/ShoppingListStyles';
import colors from '../styles/MainStyles';

import { useIsFocused } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

// Main component for the Shopping List Screen
export default function ShoppingListScreen({ navigation }) {
    const [items, setItems] = useState([]); // State to hold the list of shopping items
    const [users, setUsers] = useState({}); // State to hold user data, mapped by user IDs for quick access
    const isFocused = useIsFocused();       // Hook to check if the screen is currently focused
    const [isModalVisible, setIsModalVisible] = useState(false); // State to manage the visibility of the modal for entering price
    const [priceInput, setPriceInput] = useState('');            // State to store the user's input for the item price in the modal
    const [currentItem, setCurrentItem] = useState(null);        // State to hold the currently selected item (used for modal)
    const { currentHousehold, currentUser, showUserImages, hideCheckedItems } = useAppContext(); // Context values to manage current household user and UI preferences

    // Fetch items when the screen is focused or the household changes
    useEffect(() => {
        if (isFocused || currentHousehold) {
            fetchItems()
                .then(() => {})
                .catch((error) => {
                    console.error("Error fetching items:", error);
                });
        }
    }, [isFocused, currentHousehold]);



    // Fetch shopping list items
    const fetchItems = async () => {
        if (!currentHousehold?.id) return;

        try {
            const response = await api.get(`/shopping-list?householdId=${currentHousehold.id}`);
            const fetchedItems = response.data;

            // Fetch user data for all unique user IDs
            const userIds = [...new Set(fetchedItems.map(item => item.createdBy))];
            const userResponses = await Promise.all(
                userIds.map(userId => api.get(`/shopping-list/users/${userId}`))
            );

            // Map user data to a dictionary for quick access
            const userMap = {};
            userResponses.forEach((userResponse) => {
                userMap[userResponse.data.id] = userResponse.data.profileImage;
            });

            setUsers(userMap); // Store user data
            setItems(fetchedItems); // Store items
        } catch (error) {
            console.error('Error fetching shopping list items or user data:', error);
        }
    };

    // Exclude purchased items if set in settings
    const filteredItems = hideCheckedItems
        ? items.filter((item) => !item.purchased)
        : items;

    // Sort items so that checked items appear last
    const sortedItems = filteredItems.sort((a, b) => {
        if (a.purchased === b.purchased) return 0;
        return a.purchased ? 1 : -1;
    });

    // Mark/Unmark item as purchased in shopping list
    const togglePurchaseItem = async (id, currentState, item) => {
        if (!currentState && ((item?.createdBy !== currentUser.id && item?.debtOption === 'single') || item?.debtOption === 'group')) {
            // Set the current item and show modal for entering price
            setCurrentItem(item);
            setIsModalVisible(true);
        } else if (currentState && item?.transactionId) {
            // Handle unmarking the item (removing the transaction and related debts)
            try {
                // Delete the associated transaction and related debts
                await api.delete(`/transactions/${item.transactionId}`);
                console.log(`Transaction ${item.transactionId} and related debts removed.`);

                // Unmark the item as purchased
                await api.put(`/shopping-list/${id}`, { purchased: false, transactionId: "" });
                console.log(`Item ${id} unmarked as purchased.`);

                // Refresh the shopping list
                await fetchItems();
            } catch (error) {
                console.error('Error unmarking purchased item or deleting transaction:', error);
            }
        } else {
            try {
                // Directly unmark item if no transaction/debt is involved
                await api.put(`/shopping-list/${id}`, { purchased: !currentState });
                await fetchItems(); // Refresh the list
            } catch (error) {
                console.error('Error toggling purchased state:', error);
            }
        }
    };

    // Create 1-1 debt for a purchased item
    const handleSingleDebtSubmit = async () => {
        if (priceInput && !isNaN(Number(priceInput))) {
            const parsedPrice = parseFloat(priceInput);

            try {
                // Step 1: Create a transaction
                const transactionResponse = await api.post('/shopping-list/transactions', {
                    householdId: currentHousehold.id,
                    creditor: currentUser.id,
                    participants: [currentItem.createdBy],
                    amount: parsedPrice,
                    description: `Purchasing ${currentItem.name}`,
                });

                const transactionId = transactionResponse.data.id;

                // Step 2: Create a debt linked to the transaction
                await api.post('/shopping-list/debts', {
                    amount: parsedPrice,
                    creditor: currentUser.id,
                    debtor: currentItem.createdBy,
                    householdId: currentHousehold.id,
                    relatedTransactionId: transactionId,
                    isSettled: false,
                });

                console.log('Debt and transaction created successfully!');

                // Step 3: Mark the item as purchased and associate it with the transaction
                await api.put(`/shopping-list/${currentItem.id}`, {
                    purchased: true,
                    transactionId: transactionId,
                });

                // Reset state and refresh items
                setIsModalVisible(false);
                setPriceInput('');
                setCurrentItem(null);
                await fetchItems();
            } catch (error) {
                console.error('Error creating debt or transaction:', error);
            }
        }
    };
// Create 1-N debt for a purchased item
    const handleGroupDebtSubmit = async () => {
        if (priceInput && !isNaN(Number(priceInput))) {
            const parsedPrice = parseFloat(priceInput);

            try {
                // Step 1: Fetch all users from the household
                const usersResponse = await api.get(`/users?householdId=${currentHousehold.id}`);
                const householdUsers = usersResponse.data;

                // Calculate individual contribution
                const individualDebtAmount = parsedPrice / householdUsers.length;

                // Include all members as contributors
                const contributors = householdUsers.map(user => user.id);

                // Step 2: Create a transaction
                const transactionResponse = await api.post('/shopping-list/transactions', {
                    householdId: currentHousehold.id,
                    creditor: currentUser.id,
                    participants: contributors,
                    amount: parsedPrice,
                    description: `Purchasing ${currentItem.name}`,
                });

                const transactionId = transactionResponse.data.id;

                // Step 3: Create debts for all contributors except the purchaser
                for (const contributor of contributors) {
                    if (contributor !== currentUser.id) {
                        await api.post('/shopping-list/debts', {
                            amount: individualDebtAmount,
                            creditor: currentUser.id,
                            debtor: contributor,
                            householdId: currentHousehold.id,
                            relatedTransactionId: transactionId,
                            isSettled: false,
                        });
                    }
                }

                console.log('Group debts and transaction created successfully!');

                // Step 4: Mark the item as purchased and associate the transaction
                await api.put(`/shopping-list/${currentItem.id}`, {
                    purchased: true,
                    transactionId: transactionId,
                });

                // Reset state and refresh items
                setIsModalVisible(false);
                setPriceInput('');
                setCurrentItem(null);
                await fetchItems();
            } catch (error) {
                console.error('Error creating group debts or transaction:', error);
            }
        }
    };



    // Delete item from shopping list
    const deleteItem = (id) => {
        Alert.alert(
            'Delete Item',
            'Are you sure you want to delete this item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/shopping-list/${id}`);
                            await fetchItems();
                        } catch (error) {
                            console.error('Error deleting item:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    // Render shopping list item
    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            {/* Checkbox */}
            <TouchableOpacity
                style={styles.buttonHitbox}
                onPress={() => togglePurchaseItem(item.id, item.purchased, item)}
            >
                <View
                    style={[
                        styles.checkbox,
                        { backgroundColor: item.purchased ? colors.primary : 'transparent' }
                    ]}
                >
                    {item.purchased && <Ionicons name="checkmark" size={18} color="white" />}
                </View>
            </TouchableOpacity>

            {/* Item */}
            <Text style={[styles.itemName, item.purchased && styles.purchasedItemText]}>
                {item.name}
            </Text>

            {/* Quantity */}
            <Text style={styles.itemQuantity}>{item.quantity}</Text>

            {/* User profile pic */}
            {Boolean(showUserImages) && (
                <Image
                    source={{
                        uri: users[item.createdBy],
                    }}
                    style={styles.profileImage}
                />
            )}

            {/* Delete button*/}
            <View style={styles.deleteButton}>
                <TouchableOpacity onPress={() => deleteItem(item.id)}>
                    <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header section */}
            <View style={styles.header}>
                {/* Menu button */}
                <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
                {/* Household and stats */}
                <View style={styles.headerContent}>
                    <Text style={styles.householdName}>{currentHousehold?.name || 'No Household Selected'}</Text>
                    <Text style={styles.itemCounter}>{items.filter((item) => item.purchased).length}/{items.length} items are bought</Text>
                </View>
                {/* User profile image */}
                <Image
                    source={{
                        uri: currentUser?.profileImage,
                    }}
                    style={styles.profileImage}
                />
            </View>

            {/* Shopping list title + settings Button */}
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Shopping list:</Text>
                <TouchableOpacity style={styles.listSettings} onPress={() => navigation.navigate('ShoppingListSettings')}>
                    <Ionicons name="settings-outline" size={24} style={styles.settingsIcon} />
                </TouchableOpacity>
            </View>

            {/* Shopping list items */}
            <View style={styles.listContainer}>
                <FlatList
                    data={sortedItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: 280 }} />}
                />
            </View>

            {/* Add button */}
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddItem')}>
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>

            {/* Modal for entering price */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>This item was marked to be added in Debts!</Text>
                        <TextInput
                            style={styles.modalInput}
                            keyboardType="numeric"
                            placeholder="Enter the price..."
                            placeholderTextColor="#999"
                            value={priceInput}
                            onChangeText={setPriceInput}
                        />
                        <View style={styles.modalButtons}>
                            <View style={styles.modalCancelButton}>
                                <TouchableOpacity
                                    onPress={() => {
                                        setIsModalVisible(false);
                                        setPriceInput('');
                                        setCurrentItem(null);
                                    }}
                                >
                                    <Text style={styles.modalCancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.modalSubmitButton}>
                                <TouchableOpacity
                                    onPress={async () => {
                                        if (currentItem?.debtOption === 'single') {
                                            await handleSingleDebtSubmit();
                                        } else if (currentItem?.debtOption === 'group') {
                                            await handleGroupDebtSubmit();
                                        }
                                    }}
                                >
                                    <Text style={styles.modalSubmitButtonText} >Submit</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Just empty space */}
            <View style={{ height: 180 }} />

        </View>
    );
}
