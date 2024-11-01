import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    Modal,
    Button,
    StyleSheet,
    Image,
} from 'react-native';
import api from '../services/api';
import { Ionicons } from '@expo/vector-icons';

//global styling
const colors = {
    primary: '#741ded',
    secondary: '#6200ee',
    background: '#f7f7f7',
    text: '#333',
    error: '#b00020',
};

export default function ShoppingListScreen() {
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [editName, setEditName] = useState('');

    useEffect(() => {
        fetchItems();
    }, []);

    const fetchItems = async () => {
        try {
            const response = await api.get('/shopping-list');
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching shopping list items:', error);
        }
    };

    const addItem = async () => {
        if (newItemName.trim() === '') return;
        const quantityValue = parseInt(newItemQuantity) || 1;

        try {
            await api.post('/shopping-list', {
                name: newItemName,
                quantity: quantityValue,
            });
            setNewItemName('');
            setNewItemQuantity('');
            fetchItems();
        } catch (error) {
            console.error('Error adding shopping list item:', error);
        }
    };

    const purchaseItem = (id) => {
        Alert.alert(
            'Purchase Item',
            'Mark this item as purchased?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            await api.put(`/shopping-list/${id}/purchase`);
                            fetchItems();
                        } catch (error) {
                            console.error('Error purchasing item:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setEditName(item.name);
        setIsModalVisible(true);
    };

    const saveEdit = async () => {
        if (!editingItem) return;

        try {
            await api.put(`/shopping-list/${editingItem.id}`, {
                name: editName || editingItem.name,
                quantity: editingItem.quantity,
            });
            setIsModalVisible(false);
            setEditingItem(null);
            setEditName('');
            fetchItems();
        } catch (error) {
            console.error('Error updating item:', error);
        }
    };

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

    const renderItem = ({ item }) => (
        <View style={styles.itemContainer}>
            {/* Checkbox */}
            <TouchableOpacity
                style={[
                    styles.checkbox,
                    { backgroundColor: item.purchased ? colors.primary : 'transparent' }
                ]}
                onPress={() => purchaseItem(item.id)}
            >
                {item.purchased && <Ionicons name="checkmark" size={18} color="white" />}
            </TouchableOpacity>

            {/* Item */}
            <Text style={[styles.itemName, item.purchased && styles.purchasedItemText]}>
                {item.name}
            </Text>

            {/* Quantity */}
            <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>

            {/* User profile pic */}
            <Image
                source={{ uri: item.userImage || 'https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png' }}
                style={styles.profileImage}
            />

            {/* Delete */}
            <TouchableOpacity onPress={() => deleteItem(item.id)}>
                <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <Text style={styles.householdName}>Household123</Text>
                <Text style={styles.itemCounter}>2/6 items are bought</Text>
            </View>

            {/* Shopping List Title with Settings Button */}
            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Shopping list:</Text>
                <TouchableOpacity style={styles.listSettings} onPress={() => console.log('Settings button pressed')}>
                    <Ionicons name="settings-outline" size={24} style={styles.settingsIcon} />
                </TouchableOpacity>
            </View>

            {/* Shopping List */}
            <View style={styles.listContainer}>
                <FlatList
                    data={items}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                />
            </View>

            {/* Add Item Button */}
            <TouchableOpacity style={styles.addButton} onPress={() => setIsModalVisible(true)}>
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>

            {/* Edit Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Add/Edit Item</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Item name"
                            value={newItemName}
                            onChangeText={setNewItemName}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Quantity (default 1)"
                            value={newItemQuantity}
                            onChangeText={setNewItemQuantity}
                            keyboardType="numeric"
                        />
                        <Button title="Save" onPress={addItem} />
                        <Button
                            title="Cancel"
                            onPress={() => setIsModalVisible(false)}
                            color="#999"
                        />
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    header: {
        backgroundColor: colors.primary,
        padding: 15,
        alignItems: 'center',
    },
    householdName: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    itemCounter: {
        fontSize: 16,
        marginTop: 5,
    },
    listHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    listTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        paddingTop: 20,
    },
    listSettings: {
        padding: 10,
    },
    settingsIcon: {
        color: 'black',
    },
    listContainer: {
        paddingHorizontal: 15,
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        padding: 10,
        borderRadius: 8,
        marginVertical: 5,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    itemName: {
        fontSize: 16,
        flex: 1,
    },
    purchasedItemText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    itemQuantity: {
        fontSize: 16,
        marginLeft: 10,
    },
    profileImage: {
        width: 30,
        height: 30,
        borderRadius: 15,
        marginHorizontal: 10,
    },
    addButton: {
        backgroundColor: colors.primary,
        borderRadius: 30,
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 10,
        fontSize: 16,
    },
});
