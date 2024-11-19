// screens/DebtFormScreen.js

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';

export default function DebtFormScreen({ navigation, route }) {
    const { mode, debt } = route.params;
    const [creditor, setCreditor] = useState(debt ? debt.creditor : '');
    const [debtor, setDebtor] = useState(debt ? debt.debtor : '');
    const [amount, setAmount] = useState(debt ? debt.amount.toString() : '');
    const [description, setDescription] = useState(debt ? debt.description : '');
    const [isRecurring, setIsRecurring] = useState(debt ? debt.isRecurring : false);
    const [startDate, setStartDate] = useState(debt && debt.startDate ? new Date(debt.startDate) : new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState(debt ? debt.recurrenceInterval : 'once');

    useEffect(() => {
        navigation.setOptions({
            title: mode === 'add' ? 'Add Debt' : 'Edit Debt',
        });
    }, [navigation, mode]);

    const handleSubmit = async () => {
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
            const debtData = {
                creditor,
                debtor,
                amount: amountValue,
                description,
                isRecurring,
                recurrenceInterval: isRecurring ? recurrenceInterval : null,
                startDate: isRecurring ? startDate.toISOString() : null,
                nextPaymentDate: isRecurring ? startDate.toISOString() : null,
            };

            if (mode === 'add') {
                await api.post('/debts', debtData);
            } else if (mode === 'edit') {
                await api.put(`/debts/${debt.id}`, debtData);
            }
            navigation.goBack();
        } catch (error) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'editing'} debt:`, error);
        }
    };

    const handleDelete = async () => {
        Alert.alert(
            'Delete Debt',
            'Are you sure you want to delete this debt?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/debts/${debt.id}`);
                            navigation.goBack();
                        } catch (error) {
                            console.error('Error deleting debt:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <View style={styles.form}>
                <Text style={styles.formTitle}>{mode === 'add' ? 'Add New Debt' : 'Edit Debt'}</Text>
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
                {/* Scheduled Payment Checkbox */}
                <View style={styles.checkboxContainer}>
                    <Text style={styles.label}>Scheduled payment?</Text>
                    <TouchableOpacity
                        style={{
                            width: 24,
                            height: 24,
                            borderWidth: 2,
                            borderColor: isRecurring ? '#6200ee' : '#ddd',
                            backgroundColor: isRecurring ? '#6200ee' : 'transparent',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                        onPress={() => setIsRecurring(!isRecurring)}
                    >
                        {isRecurring && <Ionicons name="checkmark" size={18} color="white" />}
                    </TouchableOpacity>
                    {/*<CheckBox*/}
                    {/*    value={isRecurring}*/}
                    {/*    onValueChange={(newValue) => setIsRecurring(newValue)}*/}
                    {/*/>*/}
                </View>

                {/* Additional Fields for Recurring Payments */}
                {isRecurring && (
                    <>
                        {/* Start Date Picker */}
                        <TouchableOpacity onPress={() => setShowStartDatePicker(true)}>
                            <View style={styles.datePickerContainer}>
                                <Text style={styles.label}>Start Date:</Text>
                                <Text>{startDate.toLocaleDateString()}</Text>
                            </View>
                        </TouchableOpacity>
                        {showStartDatePicker && (
                            <DateTimePicker
                                value={startDate}
                                mode="date"
                                display="default"
                                onChange={(event, selectedDate) => {
                                    setShowStartDatePicker(false);
                                    if (selectedDate) {
                                        setStartDate(selectedDate);
                                    }
                                }}
                            />
                        )}

                        {/* Recurrence Interval Picker */}
                        <View style={styles.pickerContainer}>
                            <Text style={styles.label}>Recurrence Interval:</Text>
                            <Picker
                                selectedValue={recurrenceInterval}
                                onValueChange={(itemValue) => setRecurrenceInterval(itemValue)}
                            >
                                <Picker.Item label="Only Once" value="once" />
                                <Picker.Item label="Weekly" value="weekly" />
                                <Picker.Item label="Every Two Weeks" value="biweekly" />
                                <Picker.Item label="Monthly" value="monthly" />
                                <Picker.Item label="Half a Year" value="semiannually" />
                            </Picker>
                        </View>
                    </>
                )}
                <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                    <Text style={styles.addButtonText}>{mode === 'add' ? 'Add Debt' : 'Save Changes'}</Text>
                </TouchableOpacity>
                {mode === 'edit' && (
                    <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
                        <Text style={styles.deleteButtonText}>Delete Debt</Text>
                    </TouchableOpacity>
                )}
            </View>

        </KeyboardAvoidingView>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
        justifyContent: 'center',
    },
    form: {
        padding: 15,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 8,
        elevation: 2,
    },
    formTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#6200ee',
        textAlign: 'center',
    },
    input: {
        borderColor: '#ddd',
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        marginBottom: 15,
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
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    label: {
        fontSize: 16,
        marginRight: 10,
    },
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    pickerContainer: {
        marginBottom: 15,
    },
    deleteButton: {
        backgroundColor: '#d32f2f',
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 10,
    },
    deleteButtonText: {
        color: '#fff',
        fontSize: 18,
    },
});
