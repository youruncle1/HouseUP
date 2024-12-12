/**
 * @file ShoppingListScreen_AddItem.js
 * @brief ShoppingList's adding screen where user can type in item he wants to add to the list or choose from household's favorite list.
 * @author Denis Milistenfer <xmilis00@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */
import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Switch,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { UserGroupIcon } from "react-native-heroicons/outline";
import styles from "../styles/ShoppingListStyles";
import api from "../services/api";
import { useAppContext } from "../AppContext";

export default function ShoppingListScreen_AddItem({ navigation }) {
    const [inputText, setInputText] = useState("");
    const [items, setItems] = useState([]);
    const [tempItem, setTempItem] = useState(null);
    const [favorites, setFavorites] = useState([]);
    const [addToDebts, setAddToDebts] = useState(false); // Controls main switch
    const [debtOption, setDebtOption] = useState(''); // 'single' or 'group'
    const { currentHousehold, currentUser } = useAppContext();

    // Fetch favorites when component loads
    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        const endpoint = `/shopping-list/${currentHousehold.id}/favouriteShopItems`;

        try {
            const response = await api.get(endpoint);
            const favoritesWithQuantity = response.data.map(item => ({
                ...item,
                quantity: 0,
            }));
            setFavorites(favoritesWithQuantity);
        } catch (error) {
            console.error('Error fetching favorites:', error.message);
        }
    };



    // Handle input changes and dynamically render a temporary item
    const handleInputChange = (text) => {
        setInputText(text);

        if (text.trim() === "") {
            setTempItem(null); // Remove the temporary item if input is empty
        } else {
            setTempItem({ name: text.trim(), quantity: 0 }); // Dynamically update temporary item
        }
    };

    // Finalize the temporary item and add it to the list
    const finalizeItem = () => {
        if (tempItem) {
            setItems((prevItems) => [{ ...tempItem, quantity: 1 }, ...prevItems]); // Add to the beginning
            setTempItem(null); // Reset the temporary item
            setInputText(""); // Clear the input field
        }
    };

    // Increment quantity of an item
    const incrementQuantity = (index, listType) => {
        if (listType === "favorites") {
            const updatedFavorites = [...favorites];
            updatedFavorites[index].quantity += 1;
            setFavorites(updatedFavorites);
        } else {
            const updatedItems = [...items];
            updatedItems[index].quantity += 1;
            setItems(updatedItems);
        }
    };

    // Decrement quantity of an item
    const decrementQuantity = (index, listType) => {
        if (listType === "favorites") {
            const updatedFavorites = [...favorites];
            if (updatedFavorites[index].quantity > 0) {
                updatedFavorites[index].quantity -= 1;
            }
            setFavorites(updatedFavorites);
        } else {
            const updatedItems = [...items];
            if (updatedItems[index].quantity > 1) {
                updatedItems[index].quantity -= 1;
            } else {
                // Remove item if quantity reaches 0
                updatedItems.splice(index, 1);
            }
            setItems(updatedItems);
        }
    };


    // Render each finalized item
    const renderItem = ({ item, index }) => (
        <View style={styles.additemContainer}>
            <TouchableOpacity
                style={styles.plusButton}
                onPress={() => incrementQuantity(index)}
            >
                <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQuantity}>{item.quantity}</Text>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => decrementQuantity(index)}
            >
                <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
        </View>
    );

    // Render favourite shopping list items
    const renderFavorite = ({ item, index }) => (
        <View style={styles.additemContainer}>
            <TouchableOpacity
                style={styles.plusButton}
                onPress={() => incrementQuantity(index, "favorites")}
            >
                <Ionicons name="add" size={16} color="white" />
            </TouchableOpacity>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQuantity}>{item.quantity}</Text>
            <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => decrementQuantity(index, "favorites")}
            >
                <Ionicons name="close-circle" size={24} color="red" />
            </TouchableOpacity>
        </View>
    );

    const addToShoppingList = async () => {
        const combinedList = [
            ...items, // All typed-in items
            ...favorites.filter(item => item.quantity > 0), // Favorites with quantity > 0
        ];

        if (combinedList.length === 0) {
            console.log('No items to add to the shopping list.');
            return;
        }

        try {
            await api.post('/shopping-list', {
                items: combinedList,
                householdId: currentHousehold.id,
                userId: currentUser.id, // Current user's ID
                debtOption, // Attach the selected debt option
            });
            console.log('Shopping list updated successfully!');
            navigation.goBack();
        } catch (error) {
            console.error('Error adding items to shopping list:', error.message);
        }
    };



    return (
        <View style={styles.container}>
            <FlatList
                data={[]} // FlatList requires data, but there is no need it is just to make whole screen scrollable
                keyExtractor={() => "dummy"}
                ListHeaderComponent={
                    <>
                        {/* Input Section */}
                        <TextInput
                            style={styles.input}
                            placeholder="Type in item ..."
                            placeholderTextColor={"rgba(90,47,140,0.62)"}
                            value={inputText}
                            onChangeText={handleInputChange} // Updates the temporary item
                        />

                        {/* Temporary Item */}
                        {tempItem && (
                            <View style={styles.additemContainer}>
                                <TouchableOpacity style={styles.plusButton} onPress={finalizeItem}>
                                    <Ionicons name="add" size={16} color="white" />
                                </TouchableOpacity>
                                <Text style={styles.itemName}>{tempItem.name}</Text>
                                <Text style={styles.itemQuantity}>{tempItem.quantity}</Text>
                                <TouchableOpacity style={styles.deleteButton} onPress={() => setTempItem(null)}>
                                    <Ionicons name="close-circle" size={24} color="red" />
                                </TouchableOpacity>
                            </View>
                        )}
                    </>
                }
                ListFooterComponent={
                    <>
                        {/* Finalized Items */}
                        <View style={styles.addlistContainer}>
                            <FlatList
                                data={items}
                                keyExtractor={(item, index) => `item-${index}`}
                                renderItem={renderItem}
                                scrollEnabled={false} // Disable scroll for nested FlatList
                            />
                        </View>

                        {/* Favorites Items */}
                        <View style={styles.favoritesContainer}>
                            <Text style={styles.sectionHeader}>Favorites</Text>
                            <FlatList
                                data={favorites}
                                keyExtractor={(item, index) => `favorite-${index}`}
                                renderItem={renderFavorite}
                                scrollEnabled={false} // Disable scroll for nested FlatList
                            />
                        </View>

                        {/* Add to Debts Switch */}
                        <View style={[styles.switchContainer, { marginTop: 20 }]}>
                            <Text style={styles.switchLabel}>Add to debts</Text>
                            <Switch
                                value={addToDebts}
                                onValueChange={(value) => {
                                    setAddToDebts(value);
                                    if (!value) setDebtOption(''); // Reset debt option when toggled off
                                }}
                                trackColor={{ false: "#ddd", true: "#741ded" }}
                                thumbColor={addToDebts ? "#fff" : "#fff"}
                            />
                        </View>

                        {/* Additional Options for Debt */}
                        {addToDebts && (
                            <View style={styles.debtOptionsContainer}>
                                <View style={styles.line}></View>
                                <View style={styles.debtContainer}>
                                    {/* Single Person Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.debtOption,
                                            debtOption === 'single' && styles.debtOptionSelected,
                                        ]}
                                        onPress={() => setDebtOption('single')}
                                    >
                                        <Ionicons name="person-outline" size={24} color="#000" />
                                    </TouchableOpacity>

                                    {/* Group Option */}
                                    <TouchableOpacity
                                        style={[
                                            styles.debtOption,
                                            debtOption === 'group' && styles.debtOptionSelected,
                                        ]}
                                        onPress={() => setDebtOption('group')}
                                    >
                                        <UserGroupIcon size={30} color="#000" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {/* Just empty space */}
                        <View style={{ height: 180 }} />
                    </>
                }
            />

            {/* Add Button */}
            <TouchableOpacity style={styles.addNewItemButton} onPress={addToShoppingList}>
                <Text style={styles.addNewButtonText}>Add</Text>
            </TouchableOpacity>
        </View>
    );

}
