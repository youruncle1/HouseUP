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
    const [enableUsers, setenableUsers] = useState(false);
    const [hideItems, sethideItems] = useState(false);
    const { currentHousehold } = useAppContext();

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


    // Render favourite shopping list items
    const renderFavorite = ({ item, index }) => (
        <View style={styles.additemContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
        </View>
    );


    return (
        <View style={styles.container}>
            <FlatList
                data={[]} // FlatList requires data, but there is no need it is just to make whole screen scrollable
                keyExtractor={() => "dummy"}
                ListHeaderComponent={
                    <>
                        {/* Favorites Items */}
                        <View style={styles.favoritesContainer}>
                            <Text style={styles.sectionHeader}>Favorites</Text>
                            {/* Favorite Settings */}
                            <TouchableOpacity
                                style={styles.favoriteSettingsButton}
                                onPress={() => navigation.navigate("FavoriteSettings")}
                            >
                                <Ionicons name="create-outline" size={20} color="#fff" style={styles.favoriteSettingIcon} />
                            </TouchableOpacity>
                            <FlatList
                                data={favorites}
                                keyExtractor={(item, index) => `favorite-${index}`}
                                renderItem={renderFavorite}
                                scrollEnabled={false} // Disable scroll for nested FlatList
                            />
                        </View>
                        {/* Other Settings */}
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Show users</Text>
                            <Switch
                                value={enableUsers}
                                onValueChange={setenableUsers}
                                trackColor={{ false: "#ddd", true: "#741ded" }}
                                thumbColor={enableUsers ? "#fff" : "#fff"}
                            />
                        </View>
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Hide checked items</Text>
                            <Switch
                                value={hideItems}
                                onValueChange={sethideItems}
                                trackColor={{ false: "#ddd", true: "#741ded" }}
                                thumbColor={hideItems ? "#fff" : "#fff"}
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
