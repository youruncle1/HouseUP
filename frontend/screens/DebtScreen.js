/**
 * @file DebtScreen.js
 * @brief main Debts screen - shows debts between members, upcoming scheduled payments, and recent transactions.
 * @author Roman Poliačik <xpolia05@stud.fit.vutbr.cz>
 * @date 13.12.2024
 */
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
    Modal,
    Image,
    TextInput
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import api from '../services/api';
import colors from '../styles/MainStyles';

export default function DebtScreen() {
    const navigation = useNavigation();
    const { currentHousehold, currentUser } = useAppContext();

    // states for household members, debts, transactions
    const [householdMembers, setHouseholdMembers] = useState([]);
    const [debts, setDebts] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [recurringTransactions, setRecurringTransactions] = useState([]);

    // modal states for transaction details
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemIsRecurring, setSelectedItemIsRecurring] = useState(false);
    const [canEdit, setCanEdit] = useState(true);
    const [cannotEditReason, setCannotEditReason] = useState('');

    // states for settlement modals
    const [showSettleOptionsModal, setShowSettleOptionsModal] = useState(false);
    const [showPartialInputModal, setShowPartialInputModal] = useState(false);
    const [partialAmount, setPartialAmount] = useState('');
    const [selectedDebt, setSelectedDebt] = useState(null);
    const [maxDebtAmount, setMaxDebtAmount] = useState(0);

    // refetch data when focused
    useFocusEffect(
        React.useCallback(() => {
            if (currentHousehold?.id) {
                fetchData();
            }
        }, [currentHousehold])
    );

    const fetchData = async () => {
        try {
            // load household members
            const usersRes = await api.get(`/users?householdId=${currentHousehold.id}`);
            const members = usersRes.data;
            setHouseholdMembers(members);

            // load all debts for this household
            const debtsRes = await api.get(`/debts?householdId=${currentHousehold.id}`);
            const rawDebts = debtsRes.data;

            // join and sum debts by debtor->creditor
            const aggregated = {};
            rawDebts.forEach(d => {
                const key = `${d.debtor}->${d.creditor}`;
                if (!aggregated[key]) aggregated[key] = 0;
                aggregated[key] += d.amount;
            });

            // convert map into an array
            const aggregatedDebts = Object.keys(aggregated).map(key => {
                const [debtor, creditor] = key.split('->');
                return { debtor, creditor, amount: aggregated[key] };
            });
            setDebts(aggregatedDebts);

            // load transactions
            const transRes = await api.get(`/transactions?householdId=${currentHousehold.id}`);
            let allTransactions = transRes.data;
            // sort by date descending(newest first)
            allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            // filter out recurring transactions
            const normalTransactions = allTransactions.filter(t => !t.isRecurring);
            setTransactions(normalTransactions);

            // load recurring transactions
            const recurringRes = await api.get(`/transactions/recurring?householdId=${currentHousehold.id}`);
            const allRecurring = recurringRes.data;
            const filteredRecurring = allRecurring
                .filter(rt => rt.nextPaymentDate && new Date(rt.nextPaymentDate).getTime())
                .map(rt => ({ ...rt, nextPaymentDateObj: new Date(rt.nextPaymentDate) }));

            filteredRecurring.sort((a, b) => a.nextPaymentDateObj - b.nextPaymentDateObj);
            setRecurringTransactions(filteredRecurring);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    // get username by id
    const getUserName = (userId) => {
        const member = householdMembers.find(m => m.id === userId);
        return member ? member.name : userId;
    };

    // get userprofilepic by id
    const getUserImage = (userId) => {
        const member = householdMembers.find(m => m.id === userId);
        return member?.profileImage || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';
    };

    // close transaction modal + reset states
    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setSelectedItemIsRecurring(false);
        setCanEdit(true);
        setCannotEditReason('');
    };

    // handle edit navigation (after can-edit)
    const handleEdit = () => {
        if (!canEdit) {
            Alert.alert('Cannot Edit', cannotEditReason || 'This transaction cannot be edited.');
            return;
        }
        navigation.navigate('DebtForm', { mode: 'edit', transaction: selectedItem });
        closeModal();
    };

    // handle transaction delete
    const handleDelete = async () => {
        Alert.alert(
            'Delete',
            'Are you sure you want to delete this?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/transactions/${selectedItem.id}`);
                            closeModal();
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

    // fetch if transaction can be edited
    const fetchCanEdit = async (transactionId) => {
        try {
            const res = await api.get(`/transactions/${transactionId}/can-edit`);
            if (res.data.canEdit) {
                setCanEdit(true);
                setCannotEditReason('');
            } else {
                setCanEdit(false);
                setCannotEditReason(res.data.reason || 'This transaction cannot be edited.');
            }
        } catch (error) {
            console.error('Error checking can-edit:', error);
            setCanEdit(false);
            setCannotEditReason('Unable to determine if editable.');
        }
    };

    // show transaction details modal
    const onTransactionPress = async (item) => {
        setSelectedItem(item);
        setSelectedItemIsRecurring(false);

        if (item.isSettlement) {
            // settlement transactions cannot be edited
            setCanEdit(false);
            setCannotEditReason('This is a settlement transaction and cannot be edited.');
        } else {
            // normal transaction, check if it can be edited
            await fetchCanEdit(item.id);
        }

        setShowModal(true);
    };

    // show recurring trans details
    const onRecurringPress = (item) => {
        setSelectedItem(item);
        setSelectedItemIsRecurring(true);
        setCanEdit(true);
        setCannotEditReason('');
        setShowModal(true);
    };

    // modal settlement
    const showSettleOptions = (debtItem) => {
        setSelectedDebt(debtItem);
        setMaxDebtAmount(debtItem.amount);
        setShowSettleOptionsModal(true);
    };

    // handle full settlement and alert user
    const handleFullSettlement = () => {
        Alert.alert(
            'Confirm Full Settlement',
            'Are you sure you want to fully settle this debt?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    style: 'destructive',
                    onPress: async () => {
                        setShowSettleOptionsModal(false);
                        try {
                            await api.post('/debts/settle', {
                                debtor: selectedDebt.debtor,
                                creditor: selectedDebt.creditor,
                                householdId: currentHousehold.id
                            });
                            setSelectedDebt(null);
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

    // partial settlement, close options modal and show input modal
    const handlePartialSettlementPress = () => {
        setShowSettleOptionsModal(false);
        setPartialAmount('');
        setTimeout(() => {
            setShowPartialInputModal(true);
        }, 500); // small delay to avoid modal conflicts
    };

    // handle partial settlement
    const handlePartialConfirm = async () => {
        // if keyboard has , instead of .
        const normalizedInput = partialAmount.replace(',', '.');
        const partial = parseFloat(normalizedInput);
        if (isNaN(partial) || partial <= 0 || partial > maxDebtAmount) {
            Alert.alert('Invalid Amount', 'Please enter a valid partial amount.');
            return;
        }
        setShowPartialInputModal(false);

        try {
            // partial settlement with amount
            await api.post('/debts/settle', {
                debtor: selectedDebt.debtor,
                creditor: selectedDebt.creditor,
                householdId: currentHousehold.id,
                amount: partial
            });
            setSelectedDebt(null);
            fetchData();
        } catch (error) {
            console.error('Error doing partial settlement:', error);
        }
    };

    // close partial modal
    const handlePartialCancel = () => {
        setShowPartialInputModal(false);
        setSelectedDebt(null);
    };

    // settlement modal
    const settleDebt = (debtItem) => {
        showSettleOptions(debtItem);
    };

    // render transaction details modal
    const renderModalContent = () => {
        if (!selectedItem) return null;

        const creditorName = getUserName(selectedItem.creditor);
        const amountStr = `Kč ${Number(selectedItem.amount).toFixed(2)}`;

        // calculate share per participant and make array
        const numParticipants = selectedItem.participants.length;
        const individualShare = numParticipants > 0 ? selectedItem.amount / numParticipants : 0;
        const participantShares = selectedItem.participants.map(pid => ({
            name: getUserName(pid),
            share: individualShare
        }));

        const title = selectedItemIsRecurring ? 'Recurring Payment Details' : 'Transaction Details';
        const iconName = selectedItemIsRecurring ? 'repeat-outline' : 'receipt-outline';

        return (
            <View style={styles.modalContent}>
                {/* Header */}
                <View style={[styles.modalHeader, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name={iconName} size={28} color={colors.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.modalTitle}>{title}</Text>
                </View>

                <View style={styles.modalDivider} />

                {/* Creditor */}
                <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Creditor:</Text>
                    <Text style={styles.modalInfoValue}>{creditorName}</Text>
                </View>

                {/* Amount*/}
                <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Amount:</Text>
                    <Text style={styles.modalInfoValue}>{amountStr}</Text>
                </View>

                {/* Participants  */}
                {participantShares.map((p, index) => (
                    <View style={styles.modalInfoRow} key={index}>
                         <Text style={styles.modalInfoLabel}>
                            {index === 0 ? 'Participants:' : ' '} {/* shows label only on first index*/}
                        </Text>
                        <Text style={styles.modalInfoValue}>
                            {p.name} (Kč {p.share.toFixed(2)})
                        </Text>
                    </View>
                ))}

                {/* Description */}
                {selectedItem.description ? (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Description:</Text>
                        <Text style={styles.modalInfoValue}>{selectedItem.description}</Text>
                    </View>
                ) : null}

                {/* Recurring interval */}
                {selectedItemIsRecurring && selectedItem.recurrenceInterval && (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Interval:</Text>
                        <Text style={styles.modalInfoValue}>{selectedItem.recurrenceInterval}</Text>
                    </View>
                )}

                {/* Next payment date */}
                {selectedItemIsRecurring && selectedItem.nextPaymentDate && (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Next Payment:</Text>
                        <Text style={styles.modalInfoValue}>
                            {new Date(selectedItem.nextPaymentDate).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                {/* Timestamp */}
                {!selectedItemIsRecurring && selectedItem.timestamp && (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Date:</Text>
                        <Text style={styles.modalInfoValue}>
                            {new Date(selectedItem.timestamp).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                <View style={[styles.modalDivider, { marginTop: 20 }]} />

                <View style={styles.modalButtonsContainer}>
                    {(!selectedItem.isSettlement || selectedItemIsRecurring) && (
                        <TouchableOpacity
                            style={styles.modalButton}
                            onPress={() => {
                                if (!canEdit) {
                                    Alert.alert('Cannot Edit', cannotEditReason || 'This transaction cannot be edited.');
                                    return;
                                }
                                handleEdit();
                            }}
                        >
                            <Ionicons
                                name="create-outline"
                                size={20}
                                color={canEdit ? colors.primary : 'grey'}
                                style={{ marginRight: 5 }}
                            />
                            <Text style={[styles.modalButtonText, !canEdit && { color: 'grey' }]}>
                                Edit
                            </Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.modalButton} onPress={handleDelete}>
                        <Ionicons name="trash-outline" size={20} color="red" style={{ marginRight: 5 }} />
                        <Text style={[styles.modalButtonText, { color: 'red' }]}>Delete</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                        <Ionicons name="close-circle-outline" size={20} color={colors.primary} style={{ marginRight: 5 }} />
                        <Text style={styles.modalButtonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // render a single transaction item from transactions
    const renderTransactionItem = ({ item }) => {
        const dateObj = new Date(item.timestamp);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const creditorName = getUserName(item.creditor);
        const description = item.description || "No description";

        return (
            <TouchableOpacity onPress={() => onTransactionPress(item)}>
                <View style={styles.transactionItemRow}>
                    <View style={styles.transactionLeft}>
                        <Image
                            source={{ uri: getUserImage(item.creditor) }}
                            style={styles.userImage}
                        />
                        <View style={styles.transactionTextContainer}>
                            <Text style={styles.transactionDescription}>{description}</Text>
                            <Text style={styles.transactionDate}>{dateStr} {timeStr}</Text>
                            <Text style={styles.transactionCreditorLine}>
                                <Text style={{ fontStyle: 'italic' }}>{creditorName}</Text> paid for
                            </Text>
                        </View>
                    </View>

                    <View style={styles.transactionRight}>
                        <Text style={styles.transactionAmount}>Kč {Number(item.amount).toFixed(2)}</Text>
                        <View style={styles.transactionParticipants}>
                            {item.participants.map((pid) => (
                                <Image
                                    key={pid}
                                    source={{ uri: getUserImage(pid) }}
                                    style={styles.transactionParticipantImage}
                                />
                            ))}
                        </View>
                    </View>
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
                <TouchableOpacity style={styles.menuButton} onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.householdName}>{currentHousehold?.name || 'No Household Selected'}</Text>
                    <Text style={styles.itemCounter}>{debts.length} active debts</Text>
                </View>
                <Image
                    source={{
                        uri: currentUser?.profileImage,
                    }}
                    style={styles.profileImage}
                />
            </View>

            <ScrollView
                style={styles.scrollContainer}
                contentContainerStyle={{ paddingBottom: 100 }}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Debts</Text>
                    {debts.length === 0 ? (
                        <Text style={styles.noDataText}>No outstanding debts.</Text>
                    ) : (
                        <FlatList
                            data={debts}
                            keyExtractor={(item) => `${item.debtor}->${item.creditor}`}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => settleDebt(item)}>
                                    <View style={styles.debtItemRow}>
                                        <View style={styles.debtorContainer}>
                                            <Image
                                                source={{ uri: getUserImage(item.debtor) }}
                                                style={styles.userImage}
                                            />
                                            <View style={styles.debtorTextContainer}>
                                                <Text style={styles.debtorName}>{getUserName(item.debtor)}</Text>
                                                <Text style={styles.debtorAmount}>Kč {item.amount.toFixed(2)}</Text>
                                            </View>
                                        </View>

                                        <Ionicons name="arrow-forward-outline" size={20} color="#333" style={{ marginHorizontal:20 }}/>

                                        <View style={styles.creditorContainer}>
                                            <Text style={styles.creditorName}>{getUserName(item.creditor)}</Text>
                                            <Image
                                                source={{ uri: getUserImage(item.creditor) }}
                                                style={styles.userImage}
                                            />
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            )}
                            scrollEnabled={false}
                        />
                    )}
                </View>

                {recurringTransactions.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Upcoming Scheduled Payment</Text>
                        <TouchableOpacity onPress={() => onRecurringPress(recurringTransactions[0])}>
                            <View style={styles.recurringItemRow}>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.recurrenceDate}>
                                        {new Date(recurringTransactions[0].nextPaymentDate).toLocaleDateString()}
                                    </Text>
                                    <Text style={styles.recurrenceDescription}>
                                        "{recurringTransactions[0].description || 'Not described'}"
                                    </Text>
                                </View>
                                <View style={{ justifyContent: 'center', alignItems: 'flex-end' }}>
                                    <Text style={styles.recurrenceAmount}>
                                        Kč {Number(recurringTransactions[0].amount).toFixed(2)}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>

                        {recurringTransactions.length > 1 && (
                            <TouchableOpacity
                                onPress={() => navigation.navigate('DebtScheduled')}
                                style={styles.showMoreButton}
                            >
                                <Text style={styles.showMoreText}>Show More</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                )}

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Recent Transactions</Text>
                    {transactions.length === 0 ? (
                        <Text style={styles.noDataText}>No transactions found.</Text>
                    ) : (
                        <>
                            <FlatList
                                data={transactions.slice(0, 3)}
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

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => navigation.navigate('DebtForm', { mode: 'add' })}
            >
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>

            {/* Transactions info modal */}
            <Modal
                transparent={true}
                visible={showModal}
                animationType="fade"
                onRequestClose={closeModal}
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={closeModal}
                >
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                    >
                        {renderModalContent()}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* Settlemenet Modal */}
            <Modal
                transparent={true}
                visible={showSettleOptionsModal}
                animationType="fade"
                onRequestClose={() => setShowSettleOptionsModal(false)}
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={() => setShowSettleOptionsModal(false)}
                >
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                    >
                        <Text style={styles.modalTitle}>Settle this Debt</Text>
                        <Text style={{textAlign:'center', fontStyle: 'italic', marginTop:10, marginBottom: 2}}>Total owed:</Text>
                        <Text style={styles.modalSettleAmount}>{maxDebtAmount.toFixed(2)} Kč </Text>
                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity style={styles.modalButton} onPress={handleFullSettlement}>
                                <Ionicons name="checkmark-circle-outline" size={20} color='green' style={{ marginRight:5 }}/>
                                <Text style={[styles.modalButtonText, { color: 'green' }]}>Full</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handlePartialSettlementPress}>
                                <Ionicons name="ellipse-outline" size={20} color='orange' style={{ marginRight:5 }}/>
                                <Text style={[styles.modalButtonText, { color: 'orange' }]}>Partial</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={() => setShowSettleOptionsModal(false)}>
                                <Ionicons name="close-circle-outline" size={20} color={colors.primary} style={{ marginRight:5 }}/>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* partial settlement modal */}
            <Modal
                transparent={true}
                visible={showPartialInputModal}
                animationType="fade"
                onRequestClose={handlePartialCancel}
            >
                <TouchableOpacity
                    style={styles.modalBackground}
                    activeOpacity={1}
                    onPress={handlePartialCancel}
                >
                    <TouchableOpacity
                        style={styles.modalContainer}
                        activeOpacity={1}
                    >
                        <Text style={styles.modalTitle}>Partial Settlement</Text>
                        <Text style={{textAlign:'center', marginBottom:10}}>
                            Enter amount (max {maxDebtAmount.toFixed(2)} Kč)
                        </Text>
                        <TextInput
                            style={{
                                borderWidth:1,
                                borderColor:'#ccc',
                                borderRadius:5,
                                padding:15,
                                fontSize:22,
                            }}
                            keyboardType="numeric"
                            value={partialAmount}
                            onChangeText={setPartialAmount}
                        />
                        <View style={styles.modalButtonsContainer}>
                            <TouchableOpacity style={styles.modalButton} onPress={handlePartialConfirm}>
                                <Ionicons name="checkmark-circle-outline" size={20} color='green' style={{ marginRight:5 }}/>
                                <Text style={[styles.modalButtonText, { color: 'green' }]}>Confirm</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalButton} onPress={handlePartialCancel}>
                                <Ionicons name="close-circle-outline" size={20} color={colors.primary} style={{ marginRight:5 }}/>
                                <Text style={styles.modalButtonText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f7f7f7',
    },
    header: {
        backgroundColor: colors.primary,
        padding: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    menuButton: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerContent: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    householdName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: 'white',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        marginHorizontal: 10,
        backgroundColor: "#7292e4",
    },
    itemCounter: {
        fontSize: 16,
        color: 'white',
        marginTop: 5,
    },
    scrollContainer: {
        flex: 1,
    },
    section: {
        marginTop: 20,
        paddingHorizontal: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 0,
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
    },
    showMoreButton: {
        alignItems: 'center',
        paddingVertical: 5,
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
        marginHorizontal: 5,
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
    debtItemRow: {
        backgroundColor: '#e0e0e0',
        padding: 10,
        marginHorizontal: 5,
        marginTop: 5,
        borderRadius: 8,
        elevation: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    userImage: {
        width: 42,
        height: 42,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: "#7292e4",
    },
    debtorContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
    },
    debtorTextContainer: {
        marginLeft: 10,
    },
    debtorName: {
        fontSize: 16,
        //fontWeight: 'bold',
        color: colors.text,
    },
    debtorAmount: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 2,
    },
    creditorContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    creditorName: {
        fontSize: 16,
        color: colors.text,
        marginRight: 8,
    },
    amountText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: colors.primary,
    },
    debtDescription: {
        fontSize: 18,
        color: '#666',
        marginTop: 5,
    },
    settledText: {
        marginTop: 10,
        fontSize: 14,
        color: '#4caf50',
        fontWeight: 'light',
        textAlign: 'center',
    },
    recurringItemRow: {
        backgroundColor: '#e0e0e0',
        padding: 10,
        marginHorizontal: 5,
        marginTop: 10,
        borderRadius: 8,
        elevation: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recurrenceDate: {
        fontSize: 24,
        color: colors.text,
        fontWeight: 'bold'
    },
    recurrenceDescription: {
        fontSize: 16,
        color: colors.text,
        marginTop: 3
    },
    recurrenceAmount: {
        color: colors.primary,
        fontWeight: 'bold',
        fontSize: 16,
    },
    transactionItemRow: {
        flexDirection: 'row',
        backgroundColor: '#e0e0e0',
        padding: 10,
        marginHorizontal: 5,
        marginTop: 5,
        borderRadius: 8,
        elevation: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    transactionLeft: {
        flexDirection: 'row',
        flex: 1,
        alignItems: 'center',
    },
    transactionTextContainer: {
        flexDirection: 'column',
        flex: 1,
        marginLeft: 10,
    },
    transactionDescription: {
        fontSize: 16,
        color: colors.text,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    transactionDate: {
        fontSize: 14,
        color: colors.text,
        marginBottom: 4,
    },
    transactionCreditorLine: {
        fontSize: 14,
        color: colors.text,
    },
    transactionRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    transactionAmount: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.primary,
        marginBottom: 5,
    },
    transactionParticipants: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    transactionParticipantImage: {
        width: 20,
        height: 20,
        borderRadius: 10,
        marginRight: 2,
        backgroundColor: "#7292e4",
    },
    modalBackground: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 10,
        width: '80%',
    },
    modalContent: {
       //
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 10,
        color: colors.primary,
        textAlign: 'center',
    },
    modalLabel: {
        fontSize: 16,
        marginVertical: 5,
        color: '#333',
    },
    modalSettleAmount: {
        textAlign: 'center',
        fontSize: 32,
        fontWeight: 'bold',
        color: colors.secondary,
    },
    modalButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
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
    modalHeader: {
        flexDirection: 'row',
        ///alignItems: 'center',
        //marginBottom: 10,
    },
    modalDivider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 10,
    },
    modalInfoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: 5,
    },
    modalInfoLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
    },
    modalInfoValue: {
        fontSize: 16,
        color: '#333',
        flex: 1,
        textAlign: 'right',
    },
});
