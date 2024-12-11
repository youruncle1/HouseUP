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
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import api from '../services/api';
import colors from '../styles/MainStyles';

export default function DebtScreen() {
    const navigation = useNavigation();
    const { currentHousehold } = useAppContext();
    const [debts, setDebts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [householdMembers, setHouseholdMembers] = useState([]);

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

            // Fetch debts
            const debtsRes = await api.get(`/debts?householdId=${currentHousehold.id}`);
            const rawDebts = debtsRes.data;

            // Aggregate debts by (debtor->creditor)
            const aggregated = {};
            rawDebts.forEach(d => {
                const key = `${d.debtor}->${d.creditor}`;
                if (!aggregated[key]) {
                    aggregated[key] = 0;
                }
                aggregated[key] += d.amount;
            });

            // Convert aggregated object into an array
            const aggregatedDebts = Object.keys(aggregated).map(key => {
                const [debtor, creditor] = key.split('->');
                return { debtor, creditor, amount: aggregated[key] };
            });

            setDebts(aggregatedDebts);

            // Fetch transactions
            const transRes = await api.get(`/transactions?householdId=${currentHousehold.id}`);
            const allTransactions = transRes.data;
            allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setTransactions(allTransactions);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
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
                            // Now call the new /debts/settle endpoint
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

    const getUserName = (userId) => {
        const member = householdMembers.find(m => m.id === userId);
        return member ? member.name : userId;
    };

    const renderDebtItem = ({ item }) => (
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
    );

    const renderTransactionItem = ({ item }) => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const isSettlement = item.isSettlement === true;

        const deleteTransaction = () => {
            Alert.alert(
                'Delete Transaction',
                'Are you sure you want to delete this transaction?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                            try {
                                await api.delete(`/transactions/${item.id}`);
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

        return (
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
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <TouchableOpacity onPress={deleteTransaction} style={{ marginLeft: 10 }}>
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </TouchableOpacity>
                        {!isSettlement && (
                            <TouchableOpacity onPress={async () => {
                                try {
                                    const res = await api.get(`/transactions/${item.id}/can-edit`);
                                    if (res.data.canEdit) {
                                        navigation.navigate('DebtForm', { mode: 'edit', transaction: item });
                                    } else {
                                        Alert.alert('Cannot Edit', res.data.reason || 'This transaction cannot be edited.');
                                    }
                                } catch (error) {
                                    console.error('Error checking can-edit:', error);
                                    Alert.alert('Error', 'Unable to check if transaction can be edited.');
                                }
                            }}>
                                <Ionicons name="create-outline" size={24} color="blue" />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
                {item.description ? (
                    <Text style={styles.debtDescription}>{item.description}</Text>
                ) : null}
                <Text style={styles.settledText}>On {date}</Text>
            </View>
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
                            renderItem={renderDebtItem}
                            scrollEnabled={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        />
                    )}
                </View>

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
});
