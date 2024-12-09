import { StyleSheet } from 'react-native';
import colors from '../styles/MainStyles';

const styles = StyleSheet.create({
    drawerContainer: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f7f7f7',
        marginTop: 80,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10,
    },
    menuItem: {
        marginVertical: 2,
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 15, // Rounded rectangle
    },
    menuText: {
        fontSize: 16,
        color: '#333',
    },
    highlightedMenuItem: {
        backgroundColor: colors.primary, // Purple background for selected items
        borderRadius: 10,
    },
    highlightedMenuText: {
        color: 'white', // White text for better contrast
        fontWeight: 'bold',
    },
});

export default styles;
