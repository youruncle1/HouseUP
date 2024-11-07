// AddItemScreen.js
import React, { useState } from 'react';
import {View, Text, TextInput, Button, StyleSheet, TouchableOpacity} from 'react-native';
import api from '../services/api';
import styles from '../styles/ShoppingListStyles';
import colors from '../styles/MainStyles';
import Ionicons from "react-native-vector-icons/Ionicons";

export default function ShoppingListScreen_AddItem({ navigation }) {
    const [itemName, setItemName] = useState('');
    const [itemQuantity, setItemQuantity] = useState('');

    const addItem = async () => {
        if (itemName.trim() === '') return;
        const quantityValue = parseInt(itemQuantity) || 1;

        try {
            await api.post('/shopping-list', {
                name: itemName,
                quantity: quantityValue,
            });
            navigation.goBack(); // Go back to the shopping list screen after adding the item
        } catch (error) {
            console.error('Error adding shopping list item:', error);
        }
    };

    return (

        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                <Text style={styles.householdName}>Household123</Text>
                <Text style={styles.itemCounter}>2/6 items are bought</Text>
            </View>

            {/* Type In Section */}
            <TextInput
                style={styles.input}
                placeholder="Type in item..."
                value={itemName}
                onChangeText={setItemName}
            />
            <TextInput
                style={styles.input}
                placeholder="Quantity (default 1)"
                value={itemQuantity}
                onChangeText={setItemQuantity}
                keyboardType="numeric"
            />

            {/* Add New Item Button */}
            <TouchableOpacity style={styles.addNewItemButton} onPress={addItem}>
                <Text style={styles.addNewButtonText}>Add</Text>
            </TouchableOpacity>
        </View>
    );
}
