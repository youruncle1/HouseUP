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
import api from '../services/api';

export default function DebtScreen() {
    const navigation = useNavigation();
    const [debts, setDebts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [showAllTransactions, setShowAllTransactions] = useState(false);
    const [recurringDebts, setRecurringDebts] = useState([]);

    useFocusEffect(
        React.useCallback(() => {
            fetchDebts();
        }, [])
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
        try {
            const response = await api.get('/debts');
            const allDebts = response.data;

            // Exclude recurring debt templates
            const filteredDebts = allDebts.filter((debt) => !debt.isRecurring);

            // Proceed with existing processing using filteredDebts

            // Group debts by debtor and creditor
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

            // Convert debtSummary to an array for rendering
            const debtList = Object.keys(debtSummary).map((key) => {
                const [debtor, creditor] = key.split('->');
                return {
                    debtor,
                    creditor,
                    amount: debtSummary[key],
                };
            });

            // Sort all transactions (settled and unsettled) by timestamp (newest first)
            const sortedTransactions = filteredDebts
                .filter((debt) => getTimestampValue(debt.timestamp))
                .sort((a, b) => {
                    const timeA = getTimestampValue(a.timestamp);
                    const timeB = getTimestampValue(b.timestamp);
                    return timeB - timeA;
                });

            // Fetch recurring debts
            const recurringResponse = await api.get('/debts/recurring');
            const recurringDebtsData = recurringResponse.data;

            // Sort recurring debts by nextPaymentDate
            recurringDebtsData.sort((a, b) => {
                const dateA = new Date(a.nextPaymentDate);
                const dateB = new Date(b.nextPaymentDate);
                return dateA - dateB;
            });

            // Set the processed data to state variables
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
            <View style={styles.header}>
                <Text style={styles.title}>Debt Settlement</Text>
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
                                data={recurringDebts.slice(0, 1)} // Show the closest upcoming payment
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    header: {
        paddingTop: 20,
        paddingBottom: 10,
        backgroundColor: '#741ded',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
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
        borderTopColor: '#ddd',
        borderTopWidth: 1,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#6200ee',
        textAlign: 'center',
    },
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 10,
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#6200ee',
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
