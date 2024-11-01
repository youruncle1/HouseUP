// screens/DebtScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import api from '../services/api';

export default function DebtScreen() {
    const [debts, setDebts] = useState([]);
    const [creditor, setCreditor] = useState('');
    const [debtor, setDebtor] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        fetchDebts();
    }, []);

    const fetchDebts = async () => {
        try {
            const response = await api.get('/debts');
            setDebts(response.data);
        } catch (error) {
            console.error('Error fetching debts:', error);
        }
    };

    const addDebt = async () => {
        if (
            creditor.trim() === '' ||
            debtor.trim() === '' ||
            amount.trim() === ''
        ) {
            alert('Please fill in all required fields.');
            return;
        }

        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            alert('Please enter a valid amount greater than zero.');
            return;
        }

        try {
            await api.post('/debts', {
                creditor,
                debtor,
                amount: amountValue,
                description,
            });
            setCreditor('');
            setDebtor('');
            setAmount('');
            setDescription('');
            fetchDebts();
        } catch (error) {
            console.error('Error adding debt:', error);
        }
    };

    const settleDebt = (id) => {
        Alert.alert(
            'Settle Debt',
            'Are you sure you want to settle this debt?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            await api.put(`/debts/${id}/settle`);
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

    const renderDebtItem = ({ item }) => (
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
            {!item.isSettled ? (
                <TouchableOpacity
                    style={styles.settleButton}
                    onPress={() => settleDebt(item.id)}
                >
                    <Text style={styles.settleButtonText}>Settle Debt</Text>
                </TouchableOpacity>
            ) : (
                <Text style={styles.settledText}>Settled</Text>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.header}>
                <Text style={styles.title}>Debt Settlement</Text>
            </View>
            <FlatList
                data={debts}
                keyExtractor={(item) => item.id}
                renderItem={renderDebtItem}
                style={styles.debtList}
                contentContainerStyle={{ paddingBottom: 20 }}
            />
            <View style={styles.form}>
                <Text style={styles.formTitle}>Add New Debt</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Creditor"
                    value={creditor}
                    onChangeText={setCreditor}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Debtor"
                    value={debtor}
                    onChangeText={setDebtor}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Amount"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Description (Optional)"
                    value={description}
                    onChangeText={setDescription}
                />
                <TouchableOpacity style={styles.addButton} onPress={addDebt}>
                    <Text style={styles.addButtonText}>Add Debt</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    header: {
        paddingTop: 50,
        paddingBottom: 10,
        backgroundColor: '#6200ee',
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
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
    },
});
