// frontend/screens/DebtScheduledScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Image,
    SectionList
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
    const [selectedItemIsRecurring, setSelectedItemIsRecurring] = useState(false);

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

            // Filter and sort them by nextPaymentDate ascending
            const filteredRecurring = allRecurring
                .filter(rt => rt.nextPaymentDate && new Date(rt.nextPaymentDate).getTime())
                .map(rt => ({
                    ...rt,
                    nextPaymentDateObj: new Date(rt.nextPaymentDate)
                }))
                .sort((a, b) => a.nextPaymentDateObj - b.nextPaymentDateObj);

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
        const amountStr = `Kč ${Number(selectedItem.amount).toFixed(2)}`;
        const participantsNames = selectedItem.participants.map(pid => getUserName(pid)).join(', ');

        return (
            <View style={styles.modalContent}>
                {/* Header with icon and title */}
                <View style={styles.modalHeader}>
                    <Ionicons name="repeat-outline" size={28} color={colors.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.modalTitle}>Recurring Payment Details</Text>
                </View>

                {/* Divider */}
                <View style={styles.modalDivider} />

                {/* Info Rows */}
                <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Creditor:</Text>
                    <Text style={styles.modalInfoValue}>{creditorName}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Amount:</Text>
                    <Text style={styles.modalInfoValue}>{amountStr}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Participants:</Text>
                    <Text style={styles.modalInfoValue}>{participantsNames}</Text>
                </View>

                {selectedItem.description ? (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Description:</Text>
                        <Text style={styles.modalInfoValue}>{selectedItem.description}</Text>
                    </View>
                ) : null}

                {selectedItem.recurrenceInterval && (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Interval:</Text>
                        <Text style={styles.modalInfoValue}>{selectedItem.recurrenceInterval}</Text>
                    </View>
                )}
                {selectedItem.nextPaymentDate && (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Next Payment:</Text>
                        <Text style={styles.modalInfoValue}>
                            {new Date(selectedItem.nextPaymentDate).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                {/* Divider */}
                <View style={[styles.modalDivider, { marginTop: 20 }]} />

                {/* Buttons */}
                <View style={styles.modalButtonsContainer}>
                    <TouchableOpacity style={styles.modalButton} onPress={handleEdit}>
                        <Ionicons name="create-outline" size={20} color={colors.primary} style={{ marginRight: 5 }} />
                        <Text style={styles.modalButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalButton} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={20} color="red" style={{ marginRight: 5 }} />
                        <Text style={[styles.modalButtonText, { color: 'red' }]}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                        <Ionicons name="close-circle-outline" size={20} color={colors.primary} style={{ marginRight: 5 }} />
                        <Text style={styles.modalButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Convert numeric month to name
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // Group recurring transactions by year-month
    const sections = [];
    const groups = {};
    for (let rt of recurringTransactions) {
        const d = rt.nextPaymentDateObj;
        const year = d.getFullYear();
        const month = d.getMonth(); // 0-based
        const yearMonth = `${year}-${month}`;
        if (!groups[yearMonth]) {
            groups[yearMonth] = [];
        }
        groups[yearMonth].push(rt);
    }

    // Sort year-month keys descending by date
    const sortedYearMonths = Object.keys(groups).sort((a,b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        // For ascending order:
        // Compare years ascending first
        if (yearA !== yearB) return yearA - yearB;
        // If same year, compare months ascending
        return monthA - monthB;
    });

    for (let ym of sortedYearMonths) {
        const [y, m] = ym.split('-').map(Number);
        const title = `${monthNames[m]} ${y}`;
        sections.push({ title, data: groups[ym] });
    }

    const renderRecurringItem = ({ item }) => {
        // Similar styling to DebtScreen recurring item
        const dateStr = item.nextPaymentDateObj.toLocaleDateString();
        const description = item.description || "Not described";
        const amount = `Kč ${Number(item.amount).toFixed(2)}`;

        return (
            <TouchableOpacity onPress={() => {
                setSelectedItem(item);
                setSelectedItemIsRecurring(true);
                setShowModal(true);
            }}>
                <View style={styles.recurringItemRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.recurrenceDate}>
                            {dateStr}
                        </Text>
                        <Text style={styles.recurrenceDescription}>
                            "{description}"
                        </Text>
                    </View>
                    <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                        <Text style={styles.recurrenceAmount}>
                            {amount}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    const renderSectionHeader = ({ section: { title } }) => (
        <Text style={styles.monthHeader}>{title}</Text>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>All Scheduled Payments</Text>
            </View>
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.primary} />
            ) : sections.length === 0 ? (
                <Text style={styles.noDataText}>No upcoming recurring payments found.</Text>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderRecurringItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}

            <Modal
                transparent={true}
                visible={showModal}
                animationType="fade"
                useNativeDriver={true}
                onRequestClose={closeModal} // Android back button handling
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={closeModal} // Closes modal when tapping outside
                >
                    <View style={styles.modalContainer} onStartShouldSetResponder={() => true}>
                        {renderModalContent()}
                    </View>
                </TouchableOpacity>
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
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    monthHeader: {
        backgroundColor: 'rgba(240,240,240,0.9)',
        paddingVertical: 5,
        paddingHorizontal: 15,
        fontSize: 18,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: colors.primary,
        color: colors.primary,
    },
    recurringItemRow: {
        backgroundColor: '#e0e0e0',
        padding: 10,
        marginHorizontal: 15,
        marginTop: 10,
        marginBottom: 10,
        borderRadius: 8,
        elevation: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recurrenceDate: {
        fontSize: 24,
        color: colors.text,
        fontWeight: 'bold'
    },
    recurrenceDescription: {
        fontSize: 16,
        color: colors.text,
        marginTop: 3
    },
    recurrenceAmount: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
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
    modalContent: {
        // additional styling if needed
    },
    modalLabel: {
        fontSize: 16,
        marginVertical: 5,
        color: '#333',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: colors.primary,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 10,
    },
    modalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    modalInfoLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1, // so both label and value have room
    },
    modalInfoValue: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        textAlign: 'right', // align values to the right
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
});
