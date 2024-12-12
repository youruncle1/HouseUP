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
    ScrollView
} from 'react-native';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import RNPickerSelect from 'react-native-picker-select';
import { useAppContext } from '../AppContext';
import colors from "../styles/MainStyles";

export default function DebtFormScreen({ navigation, route }) {
    const { mode } = route.params;
    const { currentHousehold, currentUser } = useAppContext();

    const [householdMembers, setHouseholdMembers] = useState([]);
    const [creditor, setCreditor] = useState(currentUser.id);
    const [selectedParticipants, setSelectedParticipants] = useState([currentUser.id]); // Always include creditor
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // State vars for recurring
    const [isRecurring, setIsRecurring] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [showStartDatePicker, setShowStartDatePicker] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState('once');
    const [editingTransaction, setEditingTransaction] = useState(null);

    useEffect(() => {
        navigation.setOptions({
            title: mode === 'add' ? 'Add Transaction' : 'Edit Transaction',
        });
    }, [navigation, mode]);

    useEffect(() => {
        fetchHouseholdMembers();
    }, [currentHousehold]);

    useEffect(() => {
        if (mode === 'edit') {
            const { transaction } = route.params;
            setEditingTransaction(transaction);
            setCreditor(transaction.creditor);
            setSelectedParticipants(transaction.participants);
            setAmount(transaction.amount.toString());
            setDescription(transaction.description || '');

            // Set isRecurring based on the transaction
            if (transaction.isRecurring) {
                setIsRecurring(true);
                setRecurrenceInterval(transaction.recurrenceInterval);
                setStartDate(new Date(transaction.startDate));
            } else {
                setIsRecurring(false);
            }
        }
    }, [mode, route.params]);

    const fetchHouseholdMembers = async () => {
        if (!currentHousehold || !currentHousehold.id) return;
        try {
            const response = await api.get(`/users?householdId=${currentHousehold.id}`);
            const members = response.data;
            setHouseholdMembers(members);

            if (mode === 'add') {
                // selects all members by default
                const allMemberIds = members.map(m => m.id);
                setSelectedParticipants(allMemberIds);
            }
            // If editing, participants are already set from the transaction
        } catch (error) {
            console.error('Error fetching household members:', error);
        }
    };

    const toggleParticipant = (userId) => {
        setSelectedParticipants((prev) => {
            if (prev.includes(userId)) {
                return prev.filter(id => id !== userId);
            } else {
                return [...prev, userId];
            }
        });
    };

    const memberItems = householdMembers.map(m => ({ label: m.name, value: m.id }));

    const numberOfParticipants = selectedParticipants.length;
    const totalAmount = parseFloat(amount) || 0;
    const perPersonShare = numberOfParticipants > 0 ? totalAmount / numberOfParticipants : 0;

    const getUserName = (id) => {
        const m = householdMembers.find(u => u.id === id);
        return m ? m.name : id;
    };

    const handleSubmit = async () => {
        if (selectedParticipants.length === 0) {
            alert('Please select at least one participant.');
            return;
        }

        if (selectedParticipants.length === 1 && selectedParticipants[0] === creditor) {
            alert('You cannot create a transaction where only the creditor is selected. At least one other participant must be selected.');
            return;
        }

        const amountValue = parseFloat(amount);
        if (isNaN(amountValue) || amountValue <= 0) {
            alert('Please enter a valid amount greater than zero.');
            return;
        }

        try {
            const transactionData = {
                creditor,
                participants: selectedParticipants,
                amount: amountValue,
                description,
                householdId: currentHousehold.id,
            };

            if (isRecurring) {
                transactionData.isRecurring = true;
                transactionData.recurrenceInterval = recurrenceInterval;
                transactionData.startDate = startDate.toISOString();
            } else {
                transactionData.isRecurring = false;
                transactionData.recurrenceInterval = null;
                transactionData.startDate = null;
            }

            if (mode === 'add') {
                await api.post('/transactions', transactionData);
            } else if (mode === 'edit') {
                const { transaction } = route.params;
                await api.put(`/transactions/${transaction.id}`, transactionData);
            }
            navigation.goBack();
        } catch (error) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'editing'} transaction:`, error);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>
                    <Text style={styles.label}>Creditor (who paid):</Text>
                    <RNPickerSelect
                        items={memberItems}
                        onValueChange={(value) => {
                            setCreditor(value);
                        }}
                        value={creditor}
                        placeholder={{ label: 'Select Creditor', value: null }}
                        style={pickerSelectStyles}
                        useNativeAndroidPickerStyle={false}
                    />

                    <Text style={styles.label}>Total Amount:</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Amount"
                        value={amount}
                        onChangeText={setAmount}
                        keyboardType="numeric"
                    />

                    <Text style={styles.label}>Select Participants :</Text>
                    {householdMembers.map(member => {
                        const isChecked = selectedParticipants.includes(member.id);
                        return (
                            <View style={styles.participantRow} key={member.id}>
                                <TouchableOpacity onPress={() => toggleParticipant(member.id)}>
                                    <View style={[styles.checkbox, isChecked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                        {isChecked && <Ionicons name="checkmark" size={18} color="white" />}
                                    </View>
                                </TouchableOpacity>
                                <Text style={styles.memberName}>{member.name}</Text>
                                {isChecked && numberOfParticipants > 0 && (
                                    <Text style={styles.shareAmount}>
                                        Share: {perPersonShare.toFixed(2)}
                                    </Text>
                                )}
                            </View>
                        );
                    })}

                    <Text style={styles.label}>Description (Optional):</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Description"
                        value={description}
                        onChangeText={setDescription}
                    />

                    {mode === 'add' && (
                        <View>
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
                                        marginLeft: 10,
                                    }}
                                    onPress={() => setIsRecurring(!isRecurring)}
                                >
                                    {isRecurring && <Ionicons name="checkmark" size={18} color="white" />}
                                </TouchableOpacity>
                            </View>
                            {isRecurring && (
                                <>
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
                        </View>
                    )}

                    {mode === 'edit' && editingTransaction && editingTransaction.isRecurring && (
                        <>
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
                        <Text style={styles.addButtonText}>{mode === 'add' ? 'Add Transaction' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        paddingVertical: 20,
    },
    form: {
        padding: 15,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 8,
        elevation: 2,
    },
    label: {
        fontSize: 16,
        marginBottom: 5,
        marginTop: 10,
        color: '#333',
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
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
        borderRadius: 3,
    },
    memberName: {
        fontSize: 16,
        flex: 1,
        color: '#333',
    },
    shareAmount: {
        fontSize: 14,
        color: '#666',
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    datePickerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    pickerContainer: {
        marginBottom: 15,
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20 // Normal positive margin now
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        color: colors.primary,
        marginBottom: 15,
    },
    inputAndroid: {
        fontSize: 16,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        color: '#333',
        marginBottom: 15,
    },
});
