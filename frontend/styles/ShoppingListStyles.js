import {StyleSheet} from "react-native";

import colors from '../styles/MainStyles';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    header: {
        backgroundColor: colors.primary,
        padding: 15,
        flexDirection: 'row', // Align elements horizontally
        alignItems: 'center',
        justifyContent: 'space-between', // Space menu button and center content properly
    },
    headerContent: {
        position: 'absolute', // Position it relative to the header
        left: 0, // Reset alignment
        right: 0, // Take the full width of the header
        alignItems: 'center', // Center the content horizontally
    },
    householdName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    itemCounter: {
        fontSize: 16,
        color: 'white',
        marginTop: 5,
    },
    menuButton: {
        padding: 10, // Ensure touchable area for the button
        alignItems: 'center',
        justifyContent: 'center',
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
        justifyContent: 'space-between',
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
        textAlign: 'center',
        width: 50,
        marginRight: 10,
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

    // AddItemScreen Styles
    scrollContainer: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 250,
    },
    addlistContainer: {
        flexDirection: 'column', // Set to 'column' to allow items to stack vertically
        alignItems: 'stretch',  // Stretch items to take full width
        borderRadius: 8,        // Retain rounded corners
        marginVertical: 10,     // Add vertical margin to separate this section
    },

    additemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        padding: 10,
        paddingVertical: 13,
        borderRadius: 15,
        marginVertical: 5,
        marginHorizontal:18,
        justifyContent: 'space-between',
    },

    input: {
        borderColor: colors.primary,
        backgroundColor: '#ededed',
        borderWidth: 2.5,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 25,
        marginBottom: 10,
        marginTop: 30,
        marginHorizontal: 10,
        fontSize: 16,
    },
    plusButton: {
        width: 24,
        height: 24,
        borderRadius: 9,
        borderWidth: 2,
        backgroundColor: "#741ded",
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    deleteButton: {
        marginLeft: 10,
    },

    // Favorites
    favoritesContainer: {
        flexShrink: 1, // Ensures it only takes up as much space as needed
    },
    sectionHeader: {
        fontSize: 18,
        fontWeight: "bold",
        marginTop: 20,
        marginHorizontal: 15,
        color: colors.text,
    },

    //Switch styling
    switchContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: "#e0e0e0",
        borderRadius: 8,
        marginHorizontal: 15,
        marginTop: 15,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
    },

    // Add button
    addNewItemButton: {
        backgroundColor: colors.primary,
        borderRadius: 25, // Rounded corners for a rectangle shape
        paddingVertical: 20, // Vertical padding for height
        paddingHorizontal: 100, // Horizontal padding for width
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
    },
    addNewButtonText: {
        color: '#fff', // White text color
        fontSize: 18,
        fontWeight: 'bold',
    },

    // Settings
    settingListHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
    },
    settingListTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        flex: 1,
        marginTop:30,
    },
    favoriteSettingsButton: {
        padding: 10,
        marginRight:5,
        marginTop: 25,
    },
    favoriteSettingIcon: {
        color: 'black',
    },
    settingItemName: {
        fontSize: 16,
        flex: 1,
        marginLeft: 10,
    },
    trashIcon: {
        marginRight: 10,
    },
    addFavoriteContainer: {
        position: "relative", // Enables absolute positioning for the button
        marginVertical: 10,
        marginHorizontal: 18,
        borderRadius: 15,
        backgroundColor: '#e0e0e0', // Matches the input background
        paddingHorizontal: 10,
        height: 45, // Adjust to fit the input and button
        justifyContent: "center",
    },
    favoriteInput: {
        fontSize: 16,
        marginLeft: 10,
        paddingVertical: 10,
        paddingRight: 50, // Leave space for the button inside the input field
        flex: 1,
    },
    addFavoriteButton: {
        position: "absolute", // Places the button inside the input field
        right: 10, // Adjust to align to the right edge of the container
        top: "33%", // Vertically centers the button
        transform: [{ translateY: -12 }], // Adjust to center properly
        borderRadius: 20,
        height: 40,
        width: 40,
        justifyContent: "center",
        alignItems: "center",
    },

});

export default styles;