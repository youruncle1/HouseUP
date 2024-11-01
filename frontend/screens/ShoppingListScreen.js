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
} from 'react-native';
import api from '../services/api';

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
            <View style={styles.itemInfo}>
                <Text
                    style={[
                        styles.itemName,
                        item.purchased && styles.purchasedItemText,
                    ]}
                >
                    {item.name}
                </Text>
                <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
            </View>
            <View style={styles.itemActions}>
                {!item.purchased && (
                    <TouchableOpacity
                        style={styles.purchaseButton}
                        onPress={() => purchaseItem(item.id)}
                    >
                        <Text style={styles.buttonText}>Purchased</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => openEditModal(item)}
                >
                    <Text style={styles.buttonText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteItem(item.id)}
                >
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Shopping List</Text>
            </View>
            <FlatList
                data={items}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                style={styles.list}
            />
            <View style={styles.form}>
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
                <TouchableOpacity style={styles.addButton} onPress={addItem}>
                    <Text style={styles.addButtonText}>Add Item</Text>
                </TouchableOpacity>
            </View>

            {/* Edit Modal */}
            <Modal
                visible={isModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Item</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Item name"
                            value={editName}
                            onChangeText={setEditName}
                        />
                        <Button title="Save" onPress={saveEdit} />
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
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: '#6200ee',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    list: {
        flex: 1,
    },
    itemContainer: {
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 8,
        elevation: 1,
    },
    itemInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    itemName: {
        fontSize: 18,
        color: '#333',
    },
    purchasedItemText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    itemQuantity: {
        fontSize: 16,
        color: '#666',
    },
    itemActions: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'flex-end',
    },
    purchaseButton: {
        backgroundColor: '#03dac5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginRight: 10,
    },
    editButton: {
        backgroundColor: '#007bff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginRight: 10,
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    form: {
        padding: 15,
        backgroundColor: '#fff',
        borderTopColor: '#ddd',
        borderTopWidth: 1,
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
    addButton: {
        backgroundColor: '#6200ee',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
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
});
