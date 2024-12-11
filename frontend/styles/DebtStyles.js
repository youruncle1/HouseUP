import { StyleSheet } from 'react-native';
import colors from '../styles/MainStyles';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
        justifyContent: 'center', // From the first styles
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    menuButton: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    debtList: {
        flex: 1,
    },
    debtItem: {
        backgroundColor: '#e0e0e0',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 8,
        elevation: 1,
    },
    debtInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    debtText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    amountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#6200ee',
    },
    debtDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    settleButton: {
        marginTop: 10,
        backgroundColor: '#03dac5',
        paddingVertical: 8,
        borderRadius: 5,
        alignItems: 'center',
    },
    settleButtonText: {
        color: '#fff',
        fontSize: 16,
    },
    settledText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4caf50',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    form: {
        padding: 15,
        backgroundColor: '#fff',
        marginHorizontal: 20, // From the first styles
        borderRadius: 8,
        elevation: 2,
    },
    formTitle: {
        fontSize: 24, // From the first styles
        fontWeight: 'bold',
        marginBottom: 20, // From the first styles
        color: '#6200ee',
        textAlign: 'center',
    },
    input: {
        borderColor: colors.background,
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 15, // From the first styles
        fontSize: 16,
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
    addButtonText: {
        color: '#fff',
        fontSize: 18,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginRight: 10,
    },
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    pickerContainer: {
        marginBottom: 15,
    },
    deleteButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    deleteButtonText: {
        color: colors.text,
        fontSize: 18,
    },
    scrollContainer: {
        flex: 1,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 15,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#6200ee',
        marginBottom: 10,
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    showMoreButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    showMoreText: {
        color: '#6200ee',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default styles;
