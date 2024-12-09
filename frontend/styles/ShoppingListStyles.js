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
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 10,
        fontSize: 16,
    },
});

export default styles;