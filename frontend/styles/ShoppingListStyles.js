/**
 * @file ShoppingListStyles.js
 * @brief Defines all styles used in ShoppingList screen.
 * @author Denis Milistenfer <xmilis00@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */
import {StyleSheet} from "react-native";

import colors from '../styles/MainStyles';

const styles = StyleSheet.create({
    // Shopping list main
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    header: {
        backgroundColor: colors.primary,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
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
        padding: 10,
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
        fontSize: 22,
        fontWeight: 'bold',
        color:colors.secondary,
        flex: 1,
        paddingTop: 20,
    },
    listSettings: {
        padding: 10,
        marginTop: 0,
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
        borderRadius: 8,
        marginVertical: 5,
        justifyContent: 'space-between',
    },
    buttonHitbox: {
        paddingVertical: 8,
        //paddingHorizontal: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },

    checkbox: {
        width: 24, // Current visible checkbox size
        height: 24,
        borderRadius: 5,
        borderWidth: 2,
        borderColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginLeft: 10,
    },

    itemName: {
        fontSize: 16,
        flex: 1,
        paddingVertical: 15,
        paddingHorizontal: 8,
    },
    purchasedItemText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    itemQuantity: {
        fontSize: 16,
        textAlign: 'center',
        width: 40,
        marginRight: 10,
    },
    profileImage: {
        backgroundColor: '#7292e4',
        width: 40,
        height: 40,
        borderRadius: 20,
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
        flexDirection: 'column',
        alignItems: 'stretch',
        borderRadius: 8,
        marginVertical: 10,
    },

    additemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e0e0e0',
        borderRadius: 12,
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
        marginLeft: 10,
    },
    deleteButton: {
        marginLeft: 10,
        marginRight: 10,
    },

    // Favorites
    favoritesContainer: {
        flexShrink: 1,
    },
    sectionHeader: {
        fontSize: 22,
        fontWeight: "bold",
        marginTop: 20,
        marginHorizontal: 15,
        color: colors.secondary,
    },

    //Switch styling
    switchContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 13,
        backgroundColor: "#e0e0e0",
        borderRadius: 10,
        marginHorizontal: 15,
        marginTop: 15,
    },
    switchLabel: {
        fontSize: 16,
        fontWeight: "500",
        color: "#333",
    },
    line:{
        paddingHorizontal:15,
        paddingVertical:0.5,
        backgroundColor: "#b1b1b1",
        borderRadius: 50,
        marginBottom: 10,
    },
    debtOptionsContainer: {
        backgroundColor: "#e0e0e0",
        justifyContent: 'center',
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        marginHorizontal: 15,
        padding: 10,
        marginTop: -13,
    },
    debtContainer: {
        backgroundColor: "#ededed",
        flexDirection: 'row',
        justifyContent: 'center',
        borderRadius: 15,
        padding: 5,
        paddingHorizontal: 5,
        marginHorizontal: 65,
    },
    debtOption: {
        padding: 10,
        borderRadius: 10,
        //marginHorizontal: 5,
        width: 100,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    debtOptionSelected: {
        backgroundColor: 'white',
    },


    // Add button
    addNewItemButton: {
        backgroundColor: colors.primary,
        borderRadius: 25,
        paddingVertical: 20,
        paddingHorizontal: 100,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
    },
    addNewButtonText: {
        color: '#fff',
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
        fontSize: 22,
        fontWeight: 'bold',
        color: colors.primary,
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
        padding: 15,
    },
    trashIcon: {
        marginRight: 10,
    },
    addFavoriteContainer: {
        position: "relative",
        marginVertical: 10,
        marginHorizontal: 18,
        borderRadius: 15,
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 10,
        height: 45,
        justifyContent: "center",
    },
    favoriteInput: {
        fontSize: 16,
        marginLeft: 10,
        paddingVertical: 10,
        paddingRight: 50,
        flex: 1,
    },
    addFavoriteButton: {
        position: "absolute",
        right: 10,
        top: "33%",
        transform: [{ translateY: -12 }],
        borderRadius: 20,
        height: 40,
        width: 40,
        justifyContent: "center",
        alignItems: "center",
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '80%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
        marginTop: 15,
    },
    modalInput: {
        width: '90%',
        borderBottomWidth: 1,
        borderBottomColor: '#ddd',
        marginBottom: 20,
        fontSize: 16,
        padding: 5,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '90%',
    },
    modalSubmitButton: {
        backgroundColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal:30,
        paddingVertical:15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalSubmitButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    modalCancelButton: {
        backgroundColor: 'white',
        borderWidth: 2,
        borderColor: colors.primary,
        borderRadius: 10,
        paddingHorizontal:30,
        paddingVertical:15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalCancelButtonText: {
        color: colors.primary,
        fontWeight: 'bold',
        textAlign: 'center',
    },

});

export default styles;