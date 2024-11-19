// screens/RecurringDebtsScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import api from '../services/api';
import { useNavigation } from '@react-navigation/native';

export default function RecurringDebtsScreen() {
    const [recurringDebts, setRecurringDebts] = useState([]);
    const navigation = useNavigation();

    useEffect(() => {
        fetchRecurringDebts();
    }, []);

    const fetchRecurringDebts = async () => {
        try {
            const response = await api.get('/debts/recurring');
            const recurringDebtsData = response.data;

            // Sort recurring debts by nextPaymentDate
            recurringDebtsData.sort((a, b) => {
                const dateA = new Date(a.nextPaymentDate);
                const dateB = new Date(b.nextPaymentDate);
                return dateA - dateB;
            });

            setRecurringDebts(recurringDebtsData);
        } catch (error) {
            console.error('Error fetching recurring debts:', error);
        }
    };

    const renderRecurringDebtItem = ({ item }) => {
        const nextPaymentDate = new Date(item.nextPaymentDate).toLocaleDateString();
        return (
            <TouchableOpacity onPress={() => navigation.navigate('DebtForm', { mode: 'edit', debt: item })}>
                <View style={styles.debtItem}>
                    <View style={styles.debtInfo}>
                        <Text style={styles.debtText}>
                            {item.debtor} owes {item.creditor}
                        </Text>
                        <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
                    </View>
                    {item.description ? (
                        <Text style={styles.debtDescription}>{item.description}</Text>
                    ) : null}
                    <Text style={styles.settledText}>
                        Next Payment Date: {nextPaymentDate}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <FlatList
                data={recurringDebts}
                keyExtractor={(item) => item.id}
                renderItem={renderRecurringDebtItem}
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