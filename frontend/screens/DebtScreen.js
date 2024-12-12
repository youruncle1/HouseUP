// screens/DebtScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    ScrollView,
    Platform,
    Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import api from '../services/api';
import colors from '../styles/MainStyles';

export default function DebtScreen() {
    const navigation = useNavigation();
    const { currentHousehold } = useAppContext();
    const [householdMembers, setHouseholdMembers] = useState([]);
    const [debts, setDebts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [recurringTransactions, setRecurringTransactions] = useState([]);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemIsRecurring, setSelectedItemIsRecurring] = useState(false);
    const [canEdit, setCanEdit] = useState(true);
    const [cannotEditReason, setCannotEditReason] = useState('');

    useFocusEffect(
        React.useCallback(() => {
            if (currentHousehold?.id) {
                fetchData();
            }
        }, [currentHousehold])
    );

    const fetchData = async () => {
        try {
            // Fetch users
            const usersRes = await api.get(`/users?householdId=${currentHousehold.id}`);
            const members = usersRes.data;
            setHouseholdMembers(members);

            // Fetch debts and aggregate
            const debtsRes = await api.get(`/debts?householdId=${currentHousehold.id}`);
            const rawDebts = debtsRes.data;

            const aggregated = {};
            rawDebts.forEach(d => {
                const key = `${d.debtor}->${d.creditor}`;
                if (!aggregated[key]) {
                    aggregated[key] = 0;
                }
                aggregated[key] += d.amount;
            });

            const aggregatedDebts = Object.keys(aggregated).map(key => {
                const [debtor, creditor] = key.split('->');
                return { debtor, creditor, amount: aggregated[key] };
            });
            setDebts(aggregatedDebts);

            // Fetch transactions
            const transRes = await api.get(`/transactions?householdId=${currentHousehold.id}`);
            let allTransactions = transRes.data;
            allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // Filter out recurring transactions
            const normalTransactions = allTransactions.filter(t => !t.isRecurring);

            // Set normalTransactions
            setTransactions(normalTransactions);

            // Fetch recurring transactions
            const recurringRes = await api.get(`/transactions/recurring?householdId=${currentHousehold.id}`);
            const allRecurring = recurringRes.data;
            const filteredRecurring = allRecurring
                .filter(rt => rt.nextPaymentDate && new Date(rt.nextPaymentDate).getTime())
                .map(rt => {
                    return {
                        ...rt,
                        nextPaymentDateObj: new Date(rt.nextPaymentDate)
                    };
                });

            filteredRecurring.sort((a, b) => a.nextPaymentDateObj - b.nextPaymentDateObj);
            setRecurringTransactions(filteredRecurring);
        } catch (error) {
            console.error('Error fetching data:', error);
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
        setCanEdit(true);
        setCannotEditReason('');
    };

    const handleEdit = () => {
        if (!canEdit) {
            Alert.alert('Cannot Edit', cannotEditReason || 'This transaction cannot be edited.');
            return;
        }
        navigation.navigate('DebtForm', { mode: 'edit', transaction: selectedItem });
        closeModal();
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete',
            'Are you sure you want to delete this?',
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

    const fetchCanEdit = async (transactionId) => {
        try {
            const res = await api.get(`/transactions/${transactionId}/can-edit`);
            if (res.data.canEdit) {
                setCanEdit(true);
                setCannotEditReason('');
            } else {
                setCanEdit(false);
                setCannotEditReason(res.data.reason || 'This transaction cannot be edited.');
            }
        } catch (error) {
            console.error('Error checking can-edit:', error);
            setCanEdit(false);
            setCannotEditReason('Unable to determine if editable.');
        }
    };

    const onTransactionPress = async (item) => {
        setSelectedItem(item);
        setSelectedItemIsRecurring(false);

        if (item.isSettlement) {
            // Settlement transaction cannot be edited
            setCanEdit(false);
            setCannotEditReason('This is a settlement transaction and cannot be edited.');
        } else {
            // Normal transaction - check can-edit
            await fetchCanEdit(item.id);
        }

        setShowModal(true);
    };

    const onRecurringPress = (item) => {
        // Recurring placeholders always editable
        setSelectedItem(item);
        setSelectedItemIsRecurring(true);
        setCanEdit(true); // always editable
        setCannotEditReason('');
        setShowModal(true);
    };

    const renderModalContent = () => {
        if (!selectedItem) return null;
        const creditorName = getUserName(selectedItem.creditor);
        const amountStr = `$${Number(selectedItem.amount).toFixed(2)}`;
        const participantsNames = selectedItem.participants.map(pid => getUserName(pid)).join(', ');

        return (
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>
                    {selectedItemIsRecurring ? 'Recurring Payment Details' : 'Transaction Details'}
                </Text>

                <Text style={styles.modalLabel}>Creditor: {creditorName}</Text>
                <Text style={styles.modalLabel}>Amount: {amountStr}</Text>
                <Text style={styles.modalLabel}>Participants: {participantsNames}</Text>
                {selectedItem.description ? (
                    <Text style={styles.modalLabel}>Description: {selectedItem.description}</Text>
                ) : null}

                {selectedItemIsRecurring && selectedItem.recurrenceInterval && (
                    <Text style={styles.modalLabel}>Interval: {selectedItem.recurrenceInterval}</Text>
                )}
                {selectedItemIsRecurring && selectedItem.nextPaymentDate && (
                    <Text style={styles.modalLabel}>
                        Next Payment: {new Date(selectedItem.nextPaymentDate).toLocaleDateString()}
                    </Text>
                )}

                {!selectedItemIsRecurring && selectedItem.timestamp && (
                    <Text style={styles.modalLabel}>
                        Date: {new Date(selectedItem.timestamp).toLocaleDateString()}
                    </Text>
                )}

                <View style={styles.modalButtonsContainer}>
                    {/* Show Edit only if not settlement and not recurring (for recurring, always edit) */}
                    {(!selectedItem.isSettlement || selectedItemIsRecurring) && (
                        <TouchableOpacity style={styles.modalButton} onPress={handleEdit}>
                            <Text style={[styles.modalButtonText, !canEdit && { color: 'grey' }]}>Edit</Text>
                        </TouchableOpacity>
                    )}
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

    const settleDebt = (debtItem) => {
        Alert.alert(
            'Settle Debt',
            `Are you sure you want to settle all debts where ${getUserName(debtItem.debtor)} owes ${getUserName(debtItem.creditor)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            // Now call the /debts/settle endpoint
                            await api.post('/debts/settle', {
                                debtor: debtItem.debtor,
                                creditor: debtItem.creditor,
                                householdId: currentHousehold.id
                            });
                            fetchData();
                        } catch (error) {
                            console.error('Error settling debt:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    // For normal transactions in DebtScreen (Recent Transactions)
    const renderTransactionItem = ({ item }) => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const isSettlement = item.isSettlement === true;

        return (
            <TouchableOpacity onPress={() => onTransactionPress(item)}>
                <View style={styles.debtItem}>
                    <View style={styles.debtInfo}>
                        {isSettlement ? (
                            <Text style={styles.debtText}>
                                Settlement: {getUserName(item.creditor)} settled ${Number(item.amount).toFixed(2)}
                            </Text>
                        ) : (
                            <Text style={styles.debtText}>
                                {getUserName(item.creditor)} paid ${Number(item.amount).toFixed(2)}
                            </Text>
                        )}
                    </View>
                    {item.description ? (
                        <Text style={styles.debtDescription}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.settledText}>On {date}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.householdName}>{currentHousehold?.name || 'No Household Selected'}</Text>
                    <Text style={styles.itemCounter}>Debts Overview</Text>
                </View>
            </View>

            <ScrollView style={styles.scrollContainer}>
                {/* Debts Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Debts</Text>
                    {debts.length === 0 ? (
                        <Text style={styles.noDataText}>No outstanding debts.</Text>
                    ) : (
                        <FlatList
                            data={debts}
                            keyExtractor={(item) => `${item.debtor}->${item.creditor}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => settleDebt(item)}>
                                    <View style={styles.debtItem}>
                                        <View style={styles.debtInfo}>
                                            <Text style={styles.debtText}>
                                                {getUserName(item.debtor)} owes {getUserName(item.creditor)}
                                            </Text>
                                            <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                            scrollEnabled={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        />
                    )}
                </View>

                {/* Upcoming Recurring Payments Section */}
                {recurringTransactions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Upcoming Recurring Payments</Text>
                        <TouchableOpacity onPress={() => onRecurringPress(recurringTransactions[0])}>
                            <View style={styles.debtItem}>
                                <View style={styles.debtInfo}>
                                    <Text style={styles.debtText}>
                                        {getUserName(recurringTransactions[0].creditor)} scheduled a {Number(recurringTransactions[0].amount).toFixed(2)} payment
                                    </Text>
                                </View>
                                {recurringTransactions[0].description ? (
                                    <Text style={styles.debtDescription}>{recurringTransactions[0].description}</Text>
                                ) : null}
                                <Text style={styles.settledText}>
                                    Next Payment: {new Date(recurringTransactions[0].nextPaymentDate).toLocaleDateString()}
                                </Text>
                            </View>
                        </TouchableOpacity>
                        {recurringTransactions.length > 1 && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('DebtScheduled')}
                                style={styles.showMoreButton}
                            >
                                <Text style={styles.showMoreText}>Show More</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                {/* Recent Transactions Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    {transactions.length === 0 ? (
                        <Text style={styles.noDataText}>No transactions found.</Text>
                    ) : (
                        <>
                            <FlatList
                                data={transactions.slice(0, 2)}
                                keyExtractor={(item) => item.id}
                                renderItem={renderTransactionItem}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingBottom: 10 }}
                            />
                            {transactions.length > 2 && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('Transactions')}
                                    style={styles.showMoreButton}
                                >
                                    <Text style={styles.showMoreText}>Show More</Text>
                                </TouchableOpacity>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Floating Add Button */}
            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('DebtForm', { mode: 'add' })}
            >
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>

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
        </KeyboardAvoidingView>
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
        flexDirection: 'row',
    },
    menuButton: {
        marginLeft: 10,
        marginRight: 10,
    },
    headerContent: {
        flex: 1,
    },
    householdName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
    },
    itemCounter: {
        color: '#fff',
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
        color: colors.primary,
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
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
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
        color: colors.primary,
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
