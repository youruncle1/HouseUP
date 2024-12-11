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

export default function ShoppingListScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const [users, setUsers] = useState({});
    const isFocused = useIsFocused();
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [priceInput, setPriceInput] = useState('');
    const [currentItem, setCurrentItem] = useState(null);
    const { currentHousehold, currentUser, showUserImages, hideCheckedItems } = useAppContext();

    // Fetch items when the screen is focused or the household changes
    useEffect(() => {
        if (isFocused || currentHousehold) {
            fetchItems();
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
        if (a.purchased === b.purchased) return 0; // No sorting if both are same
        return a.purchased ? 1 : -1; // Move purchased items to the end
    });

    // Mark/Unmark item as purchased in shopping list (and create a debt)
    const togglePurchaseItem = async (id, currentState, item) => {
        if ((item?.createdBy !== currentUser.id) && !currentState && (item?.debtOption === 'single' || item?.debtOption === 'group')) {
            // Save the current item and show the modal
            setCurrentItem(item);
            setIsModalVisible(true);
        } else {
            try {
                // Directly toggle the purchased state if not debt-related
                await api.put(`/shopping-list/${id}`, { purchased: !currentState });
                fetchItems(); // Refresh the list
            } catch (error) {
                console.error('Error toggling purchased state:', error);
            }
        }
    };

    const handleSingleDebtSubmit = async () => {
        if (priceInput && !isNaN(priceInput)) {
            const parsedPrice = parseFloat(priceInput);

            try {
                // Step 1: Create a transaction
                const transactionResponse = await api.post('/shopping-list/transactions', {
                    householdId: currentHousehold.id,
                    creditor: currentUser.id, // Current user is the purchaser
                    participants: [currentItem.createdBy], // The user who added the item
                    amount: parsedPrice,
                    description: `Debt for purchasing ${currentItem.name}`,
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

                // Step 3: Mark the item as purchased
                await api.put(`/shopping-list/${currentItem.id}`, { purchased: true });

                // Reset state and refresh items
                setIsModalVisible(false);
                setPriceInput('');
                setCurrentItem(null);
                fetchItems();
            } catch (error) {
                console.error('Error creating debt or transaction:', error);
            }
        }
    };

    const handleGroupDebtSubmit = async () => {
        // Implement group debt submission logic here
        console.log('Group debt logic is not yet implemented.');
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
                            fetchItems();
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
                style={[
                    styles.checkbox,
                    { backgroundColor: item.purchased ? colors.primary : 'transparent' }
                ]}
                onPress={() => togglePurchaseItem(item.id, item.purchased, item)}
            >
                {item.purchased && <Ionicons name="checkmark" size={18} color="white" />}
            </TouchableOpacity>

            {/* Item */}
            <Text style={[styles.itemName, item.purchased && styles.purchasedItemText]}>
                {item.name}
            </Text>

            {/* Quantity */}
            <Text style={styles.itemQuantity}>{item.quantity}</Text>

            {/* User profile pic */}
            {showUserImages && (
                <Image
                    source={{
                        uri: users[item.createdBy] || 'https://www.pngfind.com/pngs/m/488-4887957_facebook-teerasej-profile-ball-circle-circular-profile-picture.png',
                    }}
                    style={styles.profileImage}
                />
            )}

            {/* Delete */}
            <View style={styles.deleteButton}>
                <TouchableOpacity onPress={() => deleteItem(item.id)}>
                    <Ionicons name="close-circle" size={24} color="red" />
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.householdName}>{currentHousehold?.name || 'No Household Selected'}</Text>
                    <Text style={styles.itemCounter}>{items.filter((item) => item.purchased).length}/{items.length} items are bought</Text>
                </View>
            </View>

            {/* Shopping List Title + Settings Button */}
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Shopping list:</Text>
                <TouchableOpacity style={styles.listSettings} onPress={() => navigation.navigate('ShoppingListSettings')}>
                    <Ionicons name="settings-outline" size={24} style={styles.settingsIcon} />
                </TouchableOpacity>
            </View>

            {/* Shopping List */}
            <View style={styles.listContainer}>
                <FlatList
                    data={sortedItems}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<View style={{ height: 280 }} />}
                />
            </View>

            {/* Add Button */}
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddItem')}>
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>

            {/* Modal for entering the price */}
            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsModalVisible(false)} // Close modal on back button press
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
