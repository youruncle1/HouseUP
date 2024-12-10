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

export default function ShoppingListScreen_Settings({ navigation }) {
    const [favorites, setFavorites] = useState([]);
    const [newFavorite, setNewFavorite] = useState("");
    const [isEditMode, setIsEditMode] = useState(false);
    const [hideItems, setHideItems] = useState(false);
    const { currentHousehold, showUserImages, setShowUserImages, hideCheckedItems, setHideCheckedItems } = useAppContext();

    // Fetch favorites when component loads
    useEffect(() => {
        fetchFavorites();
    }, []);

    const fetchFavorites = async () => {
        const endpoint = `/shopping-list/${currentHousehold.id}/favouriteShopItems`;

        try {
            const response = await api.get(endpoint);
            setFavorites(response.data);
        } catch (error) {
            console.error("Error fetching favorites:", error.message);
        }
    };

    const deleteFavorite = async (id) => {
        try {
            await api.delete(`/shopping-list/${currentHousehold.id}/favouriteShopItems/${id}`);
            setFavorites((prevFavorites) => prevFavorites.filter((item) => item.id !== id));
        } catch (error) {
            console.error("Error deleting favorite:", error.message);
        }
    };

    const addFavorite = async () => {
        if (newFavorite.trim() === "") return;

        try {
            const response = await api.post(`/shopping-list/${currentHousehold.id}/favouriteShopItems`, {
                name: newFavorite.trim(),
            });
            setFavorites((prevFavorites) => [...prevFavorites, response.data]);
            setNewFavorite(""); // Clear the input
        } catch (error) {
            console.error("Error adding favorite:", error.message);
        }
    };

    const toggleEditMode = () => {
        setIsEditMode(!isEditMode);
    };

    // Render favourite shopping list items
    const renderFavorite = ({ item }) => (
        <View style={styles.additemContainer}>
            <Text style={styles.settingItemName}>{item.name}</Text>
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

                        {/* Favorites Items */}
                        <View style={styles.favoritesContainer}>
                            <FlatList
                                data={favorites}
                                keyExtractor={(item, index) => `favorite-${index}`}
                                renderItem={renderFavorite}
                                scrollEnabled={false} // Disable scroll for nested FlatList
                            />
                        </View>

                        {/* Add New Favorite Input*/}
                        {isEditMode && (
                            <View style={styles.addFavoriteContainer}>
                                <TextInput
                                    style={styles.favoriteInput}
                                    placeholder="Type in new favorite item ..."
                                    placeholderTextColor={"rgba(75,72,78,0.62)"}
                                    value={newFavorite}
                                    onChangeText={setNewFavorite}
                                />
                                {newFavorite.trim() !== "" && (
                                    <TouchableOpacity style={styles.addFavoriteButton} onPress={addFavorite}>
                                        <Ionicons name="checkmark-circle" size={35} color="#741ded" />
                                    </TouchableOpacity>
                                )}
                            </View>
                        )}

                        {/* Other Settings */}
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Show users</Text>
                            <Switch
                                value={showUserImages}
                                onValueChange={setShowUserImages}
                                trackColor={{ false: "#ddd", true: "#741ded" }}
                                thumbColor={showUserImages  ? "#fff" : "#fff"}
                            />
                        </View>
                            <View style={styles.switchContainer}>
                                <Text style={styles.switchLabel}>Hide checked items</Text>
                                <Switch
                                    value={hideCheckedItems}
                                    onValueChange={setHideCheckedItems} // Update global state
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
