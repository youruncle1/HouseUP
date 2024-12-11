// frontend/screens/TransactionsScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../AppContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import colors from '../styles/MainStyles';

export default function TransactionsScreen({ navigation }) {
    const { currentHousehold } = useAppContext();
    const [transactions, setTransactions] = useState([]);
    const [householdMembers, setHouseholdMembers] = useState([]);
    const [loading, setLoading] = useState(false);

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

            // Fetch all transactions
            const transRes = await api.get(`/transactions?householdId=${currentHousehold.id}`);
            const allTransactions = transRes.data;
            allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setTransactions(allTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    const getUserName = (userId) => {
        const member = householdMembers.find(m => m.id === userId);
        return member ? member.name : userId;
    };

    const deleteTransaction = async (transaction) => {
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
                            await api.delete(`/transactions/${transaction.id}`);
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

    const editTransaction = async (transaction) => {
        try {
            const res = await api.get(`/transactions/${transaction.id}/can-edit`);
            if (res.data.canEdit) {
                navigation.navigate('DebtForm', { mode: 'edit', transaction: transaction });
            } else {
                Alert.alert('Cannot Edit', res.data.reason || 'This transaction cannot be edited.');
            }
        } catch (error) {
            console.error('Error checking can-edit:', error);
            Alert.alert('Error', 'Unable to check if transaction can be edited.');
        }
    };

    const renderTransactionItem = ({ item }) => {
        const date = new Date(item.timestamp).toLocaleDateString();
        const isSettlement = item.isSettlement === true;

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
                        <TouchableOpacity onPress={() => deleteTransaction(item)} style={{ marginLeft: 10 }}>
                            <Ionicons name="trash-outline" size={24} color="red" />
                        </TouchableOpacity>
                        {!isSettlement && (
                            <TouchableOpacity onPress={() => editTransaction(item)}>
                                <Ionicons name="create-outline" size={24} color="blue" style={{ marginLeft: 10 }} />
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
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>All Transactions</Text>
            </View>
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.primary} />
            ) : transactions.length === 0 ? (
                <Text style={styles.noDataText}>No transactions found.</Text>
            ) : (
                <FlatList
                    data={transactions}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTransactionItem}
                    contentContainerStyle={{ paddingBottom: 10 }}
                />
            )}
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
});
