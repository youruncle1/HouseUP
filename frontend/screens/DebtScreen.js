// screens/DebtScreen.js

import React, { useState } from 'react';
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
import { useAppContext } from '../AppContext'; // <<-- Import useAppContext
import api from '../services/api';
import styles from '../styles/DebtStyles';
import colors from '../styles/MainStyles';

export default function DebtScreen() {
    const navigation = useNavigation();
    const { currentHousehold } = useAppContext(); // <<-- Access currentHousehold
    const [debts, setDebts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [recurringDebts, setRecurringDebts] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            fetchDebts();
        }, [currentHousehold]) // refetch when household changes
    );

    const getTimestampValue = (timestamp) => {
        if (timestamp) {
            if (typeof timestamp === 'string') {
                const time = new Date(timestamp).getTime();
                if (!isNaN(time)) {
                    return time;
                }
            }
        }
        return null;
    };

    const fetchDebts = async () => {
        if (!currentHousehold?.id) return; // Ensure household is selected

        try {
            // Include householdId in query
            const response = await api.get(`/debts?householdId=${currentHousehold.id}`);
            const allDebts = response.data.filter((d) => d.householdId === currentHousehold.id);

            // Exclude recurring templates (just as before)
            const filteredDebts = allDebts.filter((debt) => !debt.isRecurring);

            // Summarize debts
            const debtSummary = {};
            filteredDebts.forEach((debt) => {
                if (!debt.isSettled) {
                    const key = `${debt.debtor}->${debt.creditor}`;
                    if (debtSummary[key]) {
                        debtSummary[key] += debt.amount;
                    } else {
                        debtSummary[key] = debt.amount;
                    }
                }
            });

            const debtList = Object.keys(debtSummary).map((key) => {
                const [debtor, creditor] = key.split('->');
                return {
                    debtor,
                    creditor,
                    amount: debtSummary[key],
                };
            });

            // Sort transactions
            const sortedTransactions = filteredDebts
                .filter((debt) => getTimestampValue(debt.timestamp))
                .sort((a, b) => {
                    const timeA = getTimestampValue(a.timestamp);
                    const timeB = getTimestampValue(b.timestamp);
                    return timeB - timeA;
                });

            // Fetch recurring debts (filtered by household)
            const recurringResponse = await api.get(`/debts/recurring?householdId=${currentHousehold.id}`);
            const recurringDebtsData = recurringResponse.data.filter((d) => d.householdId === currentHousehold.id);

            recurringDebtsData.sort((a, b) => {
                const dateA = new Date(a.nextPaymentDate);
                const dateB = new Date(b.nextPaymentDate);
                return dateA - dateB;
            });

            setDebts(debtList);
            setTransactions(sortedTransactions);
            setRecurringDebts(recurringDebtsData);
        } catch (error) {
            console.error('Error fetching debts:', error);
        }
    };

    const settleDebt = (item) => {
        Alert.alert(
            'Settle Debt',
            `Are you sure you want to settle all debts from ${item.debtor} to ${item.creditor}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            await api.post('/debts/settle', {
                                debtor: item.debtor,
                                creditor: item.creditor,
                            });
                            fetchDebts();
                        } catch (error) {
                            console.error('Error settling debt:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const renderDebtSummaryItem = ({ item }) => (
        <TouchableOpacity onPress={() => settleDebt(item)}>
            <View style={styles.debtItem}>
                <View style={styles.debtInfo}>
                    <Text style={styles.debtText}>
                        {item.debtor} owes {item.creditor}
                    </Text>
                    <Text style={styles.amountText}>${item.amount.toFixed(2)}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

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

    const renderTransactionItem = ({ item }) => {
        let dateString = 'Unknown Date';
        const timestampValue = getTimestampValue(item.timestamp);

        if (timestampValue) {
            const date = new Date(timestampValue);
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
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            {/* Header copied from ShoppingListScreen style */}
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
                            keyExtractor={(item, index) => index.toString()}
                            renderItem={renderDebtSummaryItem}
                            scrollEnabled={false}
                            contentContainerStyle={{ paddingBottom: 10 }}
                        />
                    )}
                </View>

                {/* Recent Payments Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Payments</Text>
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

                {/* Upcoming Recurring Payments Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Upcoming Recurring Payments</Text>
                    {recurringDebts.length === 0 ? (
                        <Text style={styles.noDataText}>No upcoming recurring payments.</Text>
                    ) : (
                        <>
                            <FlatList
                                data={recurringDebts.slice(0, 1)}
                                keyExtractor={(item) => item.id}
                                renderItem={renderRecurringDebtItem}
                                scrollEnabled={false}
                                contentContainerStyle={{ paddingBottom: 10 }}
                            />
                            {recurringDebts.length > 1 && (
                                <TouchableOpacity
                                    onPress={() => navigation.navigate('RecurringDebts')}
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
