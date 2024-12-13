/**
 * @file ShoppingListScreen_Settings.js
 * @brief ShoppingList's settings screen where user can edit his household's favorite items and choose if he wants to see profile pics and checked items in the list.
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
import styles from "../styles/ShoppingListStyles";
import api from "../services/api";
import { useAppContext } from "../AppContext";

// Main component for the Shopping List settings screen
export default function ShoppingListScreen_Settings() {
    const [favorites, setFavorites] = useState([]);      // State for managing household favorite items
    const [newFavorite, setNewFavorite] = useState("");  // State for handling new favorite item input
    const [isEditMode, setIsEditMode] = useState(false); // State for toggling edit mode for favorites
    // Context variables for managing global settings and household data
    const { currentHousehold, showUserImages, setShowUserImages, hideCheckedItems, setHideCheckedItems } = useAppContext();

    // Fetch favorite items when the component mounts
    useEffect(() => {
        fetchFavorites();
    }, []);

    // Fetch the favorite items of the current household
    const fetchFavorites = async () => {
        const endpoint = `/shopping-list/${currentHousehold.id}/favouriteShopItems`;

        try {
            const response = await api.get(endpoint);
            setFavorites(response.data);
        } catch (error) {
            console.error("Error fetching favorites:", error.message);
        }
    };

    // Delete an item from the household's favorite list
    const deleteFavorite = async (id) => {
        try {
            await api.delete(`/shopping-list/${currentHousehold.id}/favouriteShopItems/${id}`);
            setFavorites((prevFavorites) => prevFavorites.filter((item) => item.id !== id));
        } catch (error) {
            console.error("Error deleting favorite:", error.message);
        }
    };

    // Add a new item to the household's favorite list
    const addFavorite = async () => {
        if (newFavorite.trim() === "") return;

        try {
            const response = await api.post(`/shopping-list/${currentHousehold.id}/favouriteShopItems`, {
                name: newFavorite.trim(),
            });
            setFavorites((prevFavorites) => [...prevFavorites, response.data]);
            setNewFavorite(""); // Clear the input after adding
        } catch (error) {
            console.error("Error adding favorite:", error.message);
        }
    };

    // Toggle edit mode for managing favorites
    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    // Render a favorite item in the list
    const renderFavorite = ({ item }) => (
        <View style={styles.additemContainer}>
            {/* Item name */}
            <Text style={styles.settingItemName}>{item.name}</Text>
            {/* Delete button */}
            {isEditMode && (
                <TouchableOpacity onPress={() => deleteFavorite(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="red" style={styles.trashIcon} />
                </TouchableOpacity>
            )}
        </View>
    );


    return (
        <View style={styles.container}>
            <FlatList
                data={[]} // FlatList requires data, but there is no need it is just to make whole screen scrollable
                renderItem={() => null}
                keyExtractor={() => "dummy"}
                ListHeaderComponent={
                    <>
                        {/* Header */}
                        <View style={styles.settingListHeader}>
                            <Text style={styles.settingListTitle}>Favorite:</Text>
                            <TouchableOpacity style={styles.favoriteSettingsButton} onPress={toggleEditMode}>
                                <Ionicons name={isEditMode ? "close-outline" : "create-outline"} size={20} style={styles.favoriteSettingIcon}/>
                            </TouchableOpacity>
                        </View>

                        {/* Favorites items */}
                        <View style={styles.favoritesContainer}>
                            <FlatList
                                data={favorites}
                                keyExtractor={(item, index) => `favorite-${index}`}
                                renderItem={renderFavorite}
                                scrollEnabled={false} // Prevent scrolling inside the favorites list
                            />
                        </View>

                        {/* Input section for adding new favorite item */}
                        {isEditMode && (
                            <View style={styles.addFavoriteContainer}>
                                <TextInput
                                    style={styles.favoriteInput}
                                    placeholder="Type in new favorite item ..."
                                    placeholderTextColor={"rgba(75,72,78,0.62)"}
                                    value={newFavorite}
                                    onChangeText={setNewFavorite}
                                />
                                {/* Add to favorites button */}
                                {newFavorite.trim() !== "" && (
                                    <TouchableOpacity style={styles.addFavoriteButton} onPress={addFavorite}>
                                        <Ionicons name="checkmark-circle" size={35} color="#741ded" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Toggle option for showing users */}
                        <View style={[styles.switchContainer, { marginTop: 40 }]}>
                            <Text style={styles.switchLabel}>Show users</Text>
                            <Switch
                                value={showUserImages}
                                onValueChange={setShowUserImages}
                                trackColor={{ false: "#ddd", true: "#741ded" }}
                                thumbColor={showUserImages  ? "#fff" : "#fff"}
                            />
                        </View>
                        {/* Toggle option for hiding checked items */}
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Hide checked items</Text>
                            <Switch
                                value={hideCheckedItems}
                                onValueChange={setHideCheckedItems}
                                trackColor={{ false: '#ddd', true: '#741ded' }}
                                thumbColor={hideCheckedItems ? '#fff' : '#fff'}
                            />
                        </View>
                    </>
                }
                ListFooterComponent={
                    <>
                        {/* Just empty space */}
                        <View style={{ height: 180 }} />
                    </>
                }
            />
        </View>
    );
}
