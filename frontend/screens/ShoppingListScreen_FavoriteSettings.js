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

export default function ShoppingListScreen_FavoriteSettings({ navigation }) {
    const [favorites, setFavorites] = useState([]);
    const [switchOne, setSwitchOne] = useState(false);
    const [switchTwo, setSwitchTwo] = useState(false);
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
                            <FlatList
                                data={favorites}
                                keyExtractor={(item, index) => `favorite-${index}`}
                                renderItem={renderFavorite}
                                scrollEnabled={false} // Disable scroll for nested FlatList
                            />
                            {/* Favorite Settings */}
                            <TouchableOpacity
                                style={styles.navigateButton}
                                onPress={() => navigation.navigate("FavoriteSettings")}
                            >
                                <Ionicons name="create-outline" size={20} color="#fff" style={styles.iconStyle} />
                                <Text style={styles.navigateButtonText}>Manage Favorites</Text>
                            </TouchableOpacity>
                        </View>
                        {/* Other Settings */}
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Enable Notifications</Text>
                            <Switch
                                value={enableNotifications}
                                onValueChange={setEnableNotifications}
                                trackColor={{ false: "#ddd", true: "#741ded" }}
                                thumbColor={enableNotifications ? "#fff" : "#fff"}
                            />
                        </View>
                        <View style={styles.switchContainer}>
                            <Text style={styles.switchLabel}>Enable Sync</Text>
                            <Switch
                                value={enableSync}
                                onValueChange={setEnableSync}
                                trackColor={{ false: "#ddd", true: "#741ded" }}
                                thumbColor={enableSync ? "#fff" : "#fff"}
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
