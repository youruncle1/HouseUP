// screens/TransactionsScreen.js

import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

export default function TransactionsScreen() {
    const [transactions, setTransactions] = useState([]);
    const navigation = useNavigation();

    useFocusEffect(
        useCallback(() => {
            fetchTransactions();
        }, [])
    );

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/debts');
            const allDebts = response.data;

            // Exclude recurring debt templates
            const filteredDebts = allDebts.filter((debt) => !debt.isRecurring);

            // Sort transactions by timestamp
            const sortedTransactions = filteredDebts
                .filter((debt) => debt.timestamp)
                .sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    return timeB - timeA;
                });

            setTransactions(sortedTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        }
    };

    const renderTransactionItem = ({ item }) => {
        let dateString = 'Unknown Date';

        if (item.timestamp) {
            const date = new Date(item.timestamp);
            dateString = date.toLocaleDateString();
        }

        return (
            <TouchableOpacity onPress={() => navigation.navigate('DebtForm', { mode: 'edit', debt: item })}>
                <View style={styles.debtItem}>
                    <View style={styles.debtInfo}>
                        <Text style={styles.debtText}>
                            {item.debtor} {item.isSettled ? 'paid' : 'owes'} {item.creditor}
                        </Text>
                        <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
                    </View>
                    {item.description ? (
                        <Text style={styles.debtDescription}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.settledText}>On {dateString}</Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={transactions}
                keyExtractor={(item) => item.id}
                renderItem={renderTransactionItem}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    debtItem: {
        backgroundColor: '#fff',
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
    settledText: {
        marginTop: 10,
        fontSize: 16,
        color: '#4caf50',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});