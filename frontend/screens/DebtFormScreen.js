/**
 * @file DebtFormScreen.js
 * @brief Screen for creating or editing transactions/scheduled payments. Integrates shared shopping list items.
 * @author Roman Poliačik <xpolia05@stud.fit.vutbr.cz>
 * @date 13.12.2024
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Modal,
    FlatList
} from 'react-native';
import api from '../services/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useAppContext } from '../AppContext';
import colors from "../styles/MainStyles";

export default function DebtFormScreen({ navigation, route }) {
    const { mode } = route.params;
    const { currentHousehold, currentUser } = useAppContext();

    // basic transaction states
    const [householdMembers, setHouseholdMembers] = useState([]);
    const [creditor, setCreditor] = useState(currentUser.id);
    const [selectedParticipants, setSelectedParticipants] = useState([currentUser.id]);
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');

    // scheduled/recurring transaction states + scheduler modal
    const [isRecurring, setIsRecurring] = useState(false);
    const [startDate, setStartDate] = useState(new Date());
    const [showDateModal, setShowDateModal] = useState(false);
    const [showIntervalModal, setShowIntervalModal] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState('once');
    const [editingTransaction, setEditingTransaction] = useState(null);

    // creditor pick modal
    const [showCreditorModal, setShowCreditorModal] = useState(false);

    // shopping items pick modal
    const [showShoppingModal, setShowShoppingModal] = useState(false);
    const [groupItems, setGroupItems] = useState([]);
    const [selectedGroupItems, setSelectedGroupItems] = useState([]);

    // recurring intervals options
    const intervalOptions = [
        { label: 'Only Once', value: 'once' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Every Two Weeks', value: 'biweekly' },
        { label: 'Monthly', value: 'monthly' },
        { label: 'Half a Year', value: 'semiannually' }
    ];

    // sets screen title based on mode
    useEffect(() => {
        navigation.setOptions({
            title: mode === 'add' ? 'Add Transaction' : 'Edit Transaction',
        });
    }, [navigation, mode]);

    useEffect(() => {
        fetchHouseholdMembers();
    }, [currentHousehold]);

    // for editing, prefills form from trans data
    useEffect(() => {
        if (mode === 'edit') {
            const { transaction } = route.params;
            setEditingTransaction(transaction);
            setCreditor(transaction.creditor);
            setSelectedParticipants(transaction.participants);
            setAmount(transaction.amount.toString());
            setDescription(transaction.description || '');

            if (transaction.isRecurring) {
                setIsRecurring(true);
                setRecurrenceInterval(transaction.recurrenceInterval);
                setStartDate(new Date(transaction.startDate));
            } else {
                setIsRecurring(false);
            }
        }
    }, [mode, route.params]);

    // disables recurring/scheduled settings if paying for shopping items
    useEffect(() => {
        if (selectedGroupItems.length > 0 && isRecurring) {
            setIsRecurring(false);
        }
    }, [selectedGroupItems, isRecurring]);

    // fetch household members from api
    const fetchHouseholdMembers = async () => {
        if (!currentHousehold?.id) return;
        try {
            const response = await api.get(`/users?householdId=${currentHousehold.id}`);
            const members = response.data;
            setHouseholdMembers(members);

            if (mode === 'add') {
                const allMemberIds = members.map(m => m.id);
                setSelectedParticipants(allMemberIds);
            }
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

    // calculate per person share for display (based on amount)
    const numberOfParticipants = selectedParticipants.length;
    const totalAmount = parseFloat(amount) || 0;
    const perPersonShare = numberOfParticipants > 0 ? totalAmount / numberOfParticipants : 0;

    // handle submitting form to create/edit transaction
    const handleSubmit = async () => {
        // no participants check
        if (selectedParticipants.length === 0) {
            alert('Please select at least one participant.');
            return;
        }

        // only creditor is participant
        if (selectedParticipants.length === 1 && selectedParticipants[0] === creditor) {
            alert('At least one participant other than the creditor is required.');
            return;
        }

        // invalid amount
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

            let response;
            // if adding; post, if editing; put
            if (mode === 'add') {
                response = await api.post('/transactions', transactionData);
            } else if (mode === 'edit') {
                const { transaction } = route.params;
                response = await api.put(`/transactions/${transaction.id}`, transactionData);
            }

            // if any shop items were selected, update purchased & link transactionId on shoppingItem
            if (selectedGroupItems.length > 0 && response && response.data && response.data.id) {
                const transactionId = response.data.id;
                for (const itemId of selectedGroupItems) {
                    await api.put(`/shopping-list/${itemId}`, {
                        purchased: true,
                        transactionId: transactionId
                    });
                }
            }

            navigation.goBack();
        } catch (error) {
            console.error(`Error ${mode === 'add' ? 'adding' : 'editing'} transaction:`, error);
        }
    };

    // user data (id, name, pic)
    const getUserById = (userId) => householdMembers.find(m => m.id === userId);
    const getUserName = (userId) => getUserById(userId)?.name || userId;
    const getUserImage = (userId) => getUserById(userId)?.profileImage || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';

    // open modal to choose creditor
    const openCreditorModal = () => {
        setShowCreditorModal(true);
    };

    // set chosen creditor
    const selectCreditor = (userId) => {
        setCreditor(userId);
        setShowCreditorModal(false);
    };

    // render all householdMembers in creditor
    const renderCreditorItem = ({ item }) => (
        <TouchableOpacity style={styles.creditorChoiceItem} onPress={() => selectCreditor(item.id)}>
            <Image source={{ uri: item.profileImage || 'https://via.placeholder.com/60' }} style={styles.creditorChoiceImage}/>
            <Text style={styles.creditorChoiceName}>{item.name}</Text>
        </TouchableOpacity>
    );

    // modal to select shared shopping items (items w/ debtOption: "group")
    const openShoppingModal = async () => {
        setShowShoppingModal(true);
        try {
            const res = await api.get(`/shopping-list?householdId=${currentHousehold.id}`);
            const items = res.data;
            const groupEligible = items.filter(item => item.debtOption === 'group' && item.purchased === false);
            setGroupItems(groupEligible);
        } catch (err) {
            console.error('Error fetching shopping items:', err);
        }
    };

    // toggle items in shared item selection
    const toggleShoppingItem = (id) => {
        setSelectedGroupItems(prev => {
            if (prev.includes(id)) {
                return prev.filter(itemId => itemId !== id);
            } else {
                return [...prev, id];
            }
        });
    };

    // render shopping item in modal
    const renderShoppingItem = ({ item }) => {
        const isChecked = selectedGroupItems.includes(item.id);
        return (
            <TouchableOpacity style={styles.shoppingItemRow} onPress={() => toggleShoppingItem(item.id)}>
                <View style={styles.shoppingItemText}>
                    <Text style={styles.shoppingItemName}>{item.name}</Text>
                    <Text style={styles.shoppingItemQuantity}>Qty: {item.quantity}</Text>
                </View>
                <View style={[styles.checkbox, isChecked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                    {isChecked && <Ionicons name="checkmark" size={18} color="white" />}
                </View>
            </TouchableOpacity>
        );
    };

    // save selected items + add names to desc(purpose field)
    const saveShoppingSelection = () => {
        const selectedNames = groupItems
            .filter(item => selectedGroupItems.includes(item.id))
            .map(item => item.name);

        if (selectedNames.length > 0) {
            const namesString = selectedNames.join(', ');
            setDescription(namesString);
        }

        setShowShoppingModal(false);
    };


    // scheduled/recurring modal handlers; date/interval
    const openDateModal = () => setShowDateModal(true);
    const closeDateModal = () => setShowDateModal(false);
    const openIntervalModal = () => setShowIntervalModal(true);
    const closeIntervalModal = () => setShowIntervalModal(false);
    const selectInterval = (interval) => {
        setRecurrenceInterval(interval);
        setShowIntervalModal(false);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>

                    {/* Purpose */}
                    <Text style={styles.label}>Purpose</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="What is this transaction for?"
                        value={description}
                        onChangeText={setDescription}
                    />

                    {/* Top Row - Creditor, Shopping Items Button, Amount */}
                    <View style={styles.topRow}>
                        <View style={styles.leftColumn}>
                            <Text style={[styles.label, { textAlign: 'center', marginTop: 0}]}>Who's paying?</Text>
                            <TouchableOpacity style={styles.creditorButton} onPress={openCreditorModal}>
                                <Image source={{ uri: getUserImage(creditor) }} style={styles.creditorButtonImage}/>
                                <Text style={styles.creditorButtonName}>{getUserName(creditor)}</Text>
                                <Ionicons name="settings-outline" size={12} color="#888" style={styles.creditorSettingsIcon} />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.rightColumn}>
                            {mode === 'add' && (
                                <TouchableOpacity style={styles.shoppingButton} onPress={openShoppingModal}>
                                    <Ionicons name="cart-outline" size={24} color={colors.primary} style={{ marginRight: 10 }} />
                                    <Text style={styles.shoppingButtonText}>Shared Shopping Items</Text>
                                </TouchableOpacity>
                            )}
                            <Text style={styles.label}>Amount</Text>
                            <View style={styles.amountInputContainer}>
                                <TextInput
                                    style={styles.amountInputWithKc}
                                    placeholder="0.00"
                                    value={amount}
                                    onChangeText={setAmount}
                                    keyboardType="numeric"
                                />
                                <Text style={styles.amountKc}>Kč</Text>
                            </View>
                        </View>
                    </View>

                    {/* Participants */}
                    <Text style={styles.label}>Select Participants:</Text>
                    {householdMembers.map(member => {
                        const isChecked = selectedParticipants.includes(member.id);
                        return (
                            <TouchableOpacity key={member.id} style={styles.participantRow} onPress={() => toggleParticipant(member.id)}>
                                <Image
                                    source={{ uri: getUserImage(member.id) }}
                                    style={styles.participantImage}
                                />
                                <View style={styles.participantTextContainer}>
                                    <Text style={styles.participantName}>{member.name}</Text>
                                    {isChecked ? (
                                        <Text style={styles.participantShare}>Kč {perPersonShare.toFixed(2)}</Text>
                                    ) : (
                                        <Text style={styles.participantSharePlaceholder}>Not selected</Text>
                                    )}
                                </View>
                                <View style={[styles.checkbox, isChecked && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                                    {isChecked && <Ionicons name="checkmark" size={18} color="white" />}
                                </View>
                            </TouchableOpacity>
                        );
                    })}

                    {/* Recurring Section */}
                    {selectedGroupItems.length === 0 && (mode === 'add' || (mode === 'edit' && editingTransaction && editingTransaction.isRecurring)) && (
                        <View style={styles.recurringContainer}>
                            <View style={styles.recurringRow}>
                                <Text style={[styles.label, { marginTop: 0 }]}>Scheduled payment?</Text>
                                <TouchableOpacity
                                    style={[
                                        styles.recurringCheckbox,
                                        isRecurring && { backgroundColor: colors.primary, borderColor: colors.primary }
                                    ]}
                                    onPress={() => {
                                        if (selectedGroupItems.length === 0) {
                                            setIsRecurring(!isRecurring);
                                        }
                                    }}
                                >
                                    {isRecurring && <Ionicons name="checkmark" size={18} color="white" />}
                                </TouchableOpacity>
                            </View>

                            {isRecurring && (
                                <>
                                    <TouchableOpacity onPress={openDateModal} style={styles.selectRow}>
                                        <View style={styles.selectRowLeft}>
                                            <Ionicons name="calendar-outline" size={24} color={colors.primary} style={{ marginRight: 10 }} />
                                            <Text style={styles.selectRowText}>Start Date: {startDate.toLocaleDateString()}</Text>
                                        </View>
                                        <Ionicons name="chevron-down-outline" size={24} color="#555" />
                                    </TouchableOpacity>

                                    <TouchableOpacity onPress={openIntervalModal} style={[styles.selectRow, { marginTop: 15 }]}>
                                        <View style={styles.selectRowLeft}>
                                            <Ionicons name="repeat-outline" size={24} color={colors.primary} style={{ marginRight: 10 }} />
                                            <Text style={styles.selectRowText}>
                                                Recurrence Interval: {intervalOptions.find(opt => opt.value === recurrenceInterval)?.label}
                                            </Text>
                                        </View>
                                        <Ionicons name="chevron-down-outline" size={24} color="#555" />
                                    </TouchableOpacity>
                                </>
                            )}
                        </View>
                    )}

                    {/* Add/save button */}
                    <TouchableOpacity style={styles.addButton} onPress={handleSubmit}>
                        <Text style={styles.addButtonText}>{mode === 'add' ? 'Add Transaction' : 'Save Changes'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Creditor Modal */}
            <Modal
                visible={showCreditorModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowCreditorModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={() => setShowCreditorModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                    >
                        <Text style={styles.modalTitle}>Select Creditor</Text>
                        <FlatList
                            data={householdMembers}
                            keyExtractor={item => item.id}
                            numColumns={3}
                            contentContainerStyle={styles.creditorChoiceList}
                            renderItem={renderCreditorItem}
                        />
                        <TouchableOpacity style={styles.modalCloseButton} onPress={() => setShowCreditorModal(false)}>
                            <Text style={styles.modalCloseButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Date Modal */}
            <Modal
                transparent={true}
                visible={showDateModal}
                animationType="fade"
                onRequestClose={closeDateModal}
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={closeDateModal}
                >
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                    >
                        <Text style={styles.modalTitle}>Select Start Date</Text>
                        <DateTimePicker
                            value={startDate}
                            mode="date"
                            display="default"
                            onChange={(event, selectedDate) => {
                                if (selectedDate) {
                                    setStartDate(selectedDate);
                                }
                            }}
                        />
                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity style={styles.modalButton} onPress={closeDateModal}>
                                <Ionicons name="close-circle-outline" size={20} color={colors.primary} style={{ marginRight: 5 }} />
                                <Text style={styles.modalButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Interval Modal */}
            <Modal
                transparent={true}
                visible={showIntervalModal}
                animationType="fade"
                onRequestClose={closeIntervalModal}
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={closeIntervalModal}
                >
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                    >
                        <Text style={styles.modalTitle}>Select Interval</Text>
                        {intervalOptions.map(option => (
                            <TouchableOpacity
                                key={option.value}
                                style={styles.intervalOption}
                                onPress={() => selectInterval(option.value)}
                            >
                                <Text style={styles.intervalOptionText}>{option.label}</Text>
                                {recurrenceInterval === option.value && (
                                    <Ionicons name="checkmark" size={20} color={colors.primary} />
                                )}
                            </TouchableOpacity>
                        ))}
                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity style={styles.modalButton} onPress={closeIntervalModal}>
                                <Ionicons name="close-circle-outline" size={20} color={colors.primary} style={{ marginRight: 5 }} />
                                <Text style={styles.modalButtonText}>Close</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Shopping Modal */}
            <Modal
                visible={showShoppingModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowShoppingModal(false)}
            >
                <View style={styles.modalBackground}>
                    <TouchableOpacity
                        style={[styles.modalContainer, {maxHeight:'70%'}]}
                        activeOpacity={1}
                    >
                        <Text style={styles.modalTitle}>Select Shared Shopping Items</Text>
                        {groupItems.length === 0 ? (
                            <Text style={{textAlign:'center', marginVertical:10}}>No shared shopping items found.</Text>
                        ) : (
                            <FlatList
                                data={groupItems}
                                keyExtractor={item => item.id}
                                renderItem={renderShoppingItem}
                                style={{width:'100%',marginVertical:10}}
                            />
                        )}
                        <TouchableOpacity style={styles.modalCloseButton} onPress={saveShoppingSelection}>
                            <Text style={styles.modalCloseButtonText}>Save</Text>
                        </TouchableOpacity>
                    </TouchableOpacity>
                </View>
            </Modal>
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
        padding: 10,
        backgroundColor: '#fff',
        marginHorizontal: 20,
        borderRadius: 8,
        elevation: 3,
    },
    label: {
        fontSize: 18,
        marginBottom: 5,
        marginTop: 5,
        color: colors.primary,
        fontWeight: 'bold',
    },
    input: {
        borderColor: colors.primary,
        borderWidth: 1,
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 5,
        fontSize: 24,
        color: colors.text,
        marginBottom: 15,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingBottom: 10,
        paddingTop: 10,
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: '#ddd',
        marginBottom: 10,
    },
    leftColumn: {
        alignItems: 'center',
        flex: 1,
        marginRight: 10,
        //borderRightWidth: 1,
        //borderColor: '#ddd',
    },
    creditorButton: {
        marginTop: 0,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        width: 100,
        backgroundColor: '#f9f9f9',
    },
    creditorSettingsIcon: {
        position: 'absolute',
        top: 5,
        right: 5,
    },
    creditorButtonImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#7292e4",
    },
    creditorButtonName: {
        fontSize: 14,
        marginTop: 5,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
    },
    rightColumn: {
        flex: 2,
    },
    shoppingButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f2f2f2',
        padding: 10,
        borderRadius: 5,
    },
    shoppingButtonText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: 'bold',
    },
    amountInputContainer: {
        position: 'relative',
    },
    amountInputWithKc: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        fontSize: 24,
        color: '#333',
        paddingHorizontal: 15,
        paddingVertical: 13,
        paddingRight: 40,
    },
    amountKc: {
        position: 'absolute',
        right: 15,
        top: '55%',
        transform: [{ translateY: -10 }],
        fontSize: 16,
        color: '#333',
    },
    participantRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        marginLeft: 10,
        paddingVertical: 10,
    },
    participantImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        marginRight: 10,
        backgroundColor: "#7292e4",
    },
    participantTextContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    participantName: {
        fontSize: 18,
        color: '#333',
        fontWeight: '600',
    },
    participantShare: {
        fontSize: 14,
        color: colors.primary,
        marginTop: 2,
    },
    participantSharePlaceholder: {
        fontSize: 14,
        color: '#999',
        marginTop: 2,
        fontStyle: 'italic',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 3,
        marginLeft: 10,
        marginRight: 10,
    },
    recurringContainer: {
        marginTop: 5,
    },
    recurringRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        marginTop: 10,
    },
    recurringCheckbox: {
        width: 24,
        height: 24,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
        borderRadius: 3,
    },
    selectRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: 12,
        borderRadius: 5,
        justifyContent: 'space-between',
        marginTop: 0,
    },
    selectRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    selectRowText: {
        fontSize: 16,
        color: '#333',
    },
    addButton: {
        backgroundColor: colors.primary,
        paddingVertical: 15,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderTopLeftRadius: 10,
        borderTopRightRadius: 10,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
        color: colors.primary,
    },
    creditorChoiceList: {
        paddingBottom: 20,
    },
    creditorChoiceItem: {
        width: 80,
        alignItems: 'center',
        margin: 10,
    },
    creditorChoiceImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "#7292e4",
    },
    creditorChoiceName: {
        fontSize: 14,
        marginTop: 5,
        textAlign: 'center',
    },
    modalCloseButton: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
        backgroundColor: colors.primary,
        borderRadius: 5,
    },
    modalCloseButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    modalButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
    },
    intervalOption: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
        width: '100%',
    },
    intervalOptionText: {
        fontSize: 16,
        color: '#333',
    },
    shoppingItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
        justifyContent: 'space-between',
    },
    shoppingItemText: {
        flex: 1,
        justifyContent: 'center',
    },
    shoppingItemName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    shoppingItemQuantity: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
});
