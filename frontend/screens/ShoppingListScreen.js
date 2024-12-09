import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    Image,
} from 'react-native';
import api from '../services/api';
import styles from '../styles/ShoppingListStyles';
import colors from '../styles/MainStyles';

import { useIsFocused } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function ShoppingListScreen({ navigation }) {
    const [items, setItems] = useState([]);
    const isFocused = useIsFocused();
    const { currentHousehold } = useAppContext();

    useEffect(() => {
        if (isFocused || currentHousehold) {
            fetchItems(); // Fetch items when the screen is focused or the household changes
        }
    }, [isFocused, currentHousehold]);

    const fetchItems = async () => {
        if (!currentHousehold?.id) return; // Ensure a household is selected

        try {
            const response = await api.get(`/shopping-list?householdId=${currentHousehold.id}`);
            setItems(response.data);
        } catch (error) {
            console.error('Error fetching shopping list items:', error);
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
            <Text style={styles.itemQuantity}>{item.quantity}</Text>

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

            {/* Add Button */}
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddItem')}>
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>
        </View>
    );
}
