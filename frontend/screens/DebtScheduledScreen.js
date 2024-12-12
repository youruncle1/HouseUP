// frontend/screens/DebtScheduledScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    Modal
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../AppContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import colors from '../styles/MainStyles';

export default function DebtScheduledScreen({ navigation }) {
    const { currentHousehold } = useAppContext();
    const [recurringTransactions, setRecurringTransactions] = useState([]);
    const [householdMembers, setHouseholdMembers] = useState([]);
    const [loading, setLoading] = useState(false);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemIsRecurring, setSelectedItemIsRecurring] = useState(false); // Always true here, but we keep for consistency.

    useFocusEffect(
        React.useCallback(() => {
            if (currentHousehold?.id) {
                fetchData();
            }
        }, [currentHousehold])
    );

    const fetchData = async () => {
        try {
            setLoading(true);
            // Fetch users for name mapping
            const usersRes = await api.get(`/users?householdId=${currentHousehold.id}`);
            const members = usersRes.data;
            setHouseholdMembers(members);

            // Fetch all recurring transactions
            const recurringRes = await api.get(`/transactions/recurring?householdId=${currentHousehold.id}`);
            const allRecurring = recurringRes.data;
            // Filter only those that have a nextPaymentDate
            const filteredRecurring = allRecurring
                .filter(rt => rt.nextPaymentDate && new Date(rt.nextPaymentDate).getTime())
                .map(rt => {
                    return {
                        ...rt,
                        nextPaymentDateObj: new Date(rt.nextPaymentDate)
                    };
                });

            // Sort by nextPaymentDate ascending
            filteredRecurring.sort((a, b) => a.nextPaymentDateObj - b.nextPaymentDateObj);
            setRecurringTransactions(filteredRecurring);
        } catch (error) {
            console.error('Error fetching recurring transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => {
        const member = householdMembers.find(m => m.id === userId);
        return member ? member.name : userId;
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setSelectedItemIsRecurring(false);
    };

    const handleEdit = () => {
        // Recurring placeholders are always editable
        navigation.navigate('DebtForm', { mode: 'edit', transaction: selectedItem });
        closeModal();
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete',
            'Are you sure you want to delete this recurring schedule?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/transactions/${selectedItem.id}`);
                            closeModal();
                            fetchData();
                        } catch (error) {
                            console.error('Error deleting transaction:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const renderModalContent = () => {
        if (!selectedItem) return null;
        const creditorName = getUserName(selectedItem.creditor);
        const amountStr = `$${Number(selectedItem.amount).toFixed(2)}`;
        const participantsNames = selectedItem.participants.map(pid => getUserName(pid)).join(', ');

        return (
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Recurring Payment Details</Text>

                <Text style={styles.modalLabel}>Creditor: {creditorName}</Text>
                <Text style={styles.modalLabel}>Amount: {amountStr}</Text>
                <Text style={styles.modalLabel}>Participants: {participantsNames}</Text>
                {selectedItem.description ? (
                    <Text style={styles.modalLabel}>Description: {selectedItem.description}</Text>
                ) : null}

                {selectedItem.recurrenceInterval && (
                    <Text style={styles.modalLabel}>Interval: {selectedItem.recurrenceInterval}</Text>
                )}
                {selectedItem.nextPaymentDate && (
                    <Text style={styles.modalLabel}>
                        Next Payment: {new Date(selectedItem.nextPaymentDate).toLocaleDateString()}
                    </Text>
                )}

                <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity style={styles.modalButton} onPress={handleEdit}>
                        <Text style={styles.modalButtonText}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalButton} onPress={handleDelete}>
                        <Text style={[styles.modalButtonText, { color: 'red' }]}>Delete</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                        <Text style={styles.modalButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderRecurringItem = ({ item }) => {
        const date = new Date(item.nextPaymentDate).toLocaleDateString();

        // Wrap entire item in TouchableOpacity to show modal
        return (
            <TouchableOpacity onPress={() => {
                setSelectedItem(item);
                setSelectedItemIsRecurring(true);
                setShowModal(true);
            }}>
                <View style={styles.debtItem}>
                    <View style={styles.debtInfo}>
                        <Text style={styles.debtText}>
                            {getUserName(item.creditor)} scheduled a ${Number(item.amount).toFixed(2)} payment
                        </Text>
                    </View>
                    {item.description ? (
                        <Text style={styles.debtDescription}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.settledText}>Next Payment: {date}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>All Scheduled Payments</Text>
            </View>
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.primary} />
            ) : recurringTransactions.length === 0 ? (
                <Text style={styles.noDataText}>No upcoming recurring payments found.</Text>
            ) : (
                <FlatList
                    data={recurringTransactions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecurringItem}
                    contentContainerStyle={{ paddingBottom: 10 }}
                />
            )}

            <Modal
                transparent={true}
                visible={showModal}
                animationType="fade"
                onRequestClose={closeModal}
            >
                <View style={styles.modalBackground}>
                    <View style={styles.modalContainer}>
                        {renderModalContent()}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: colors.primary,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
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
        flexShrink: 1,
    },
    debtDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    settledText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4caf50',
        fontWeight: 'bold',
        textAlign: 'center',
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalContent: {},
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: colors.primary,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 16,
        marginVertical: 5,
        color: '#333',
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        marginTop: 20,
    },
    modalButton: {
        padding: 10,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
});
