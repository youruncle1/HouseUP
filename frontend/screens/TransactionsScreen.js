/**
 * @file TransactionsScreen.js
 * @brief  Screen to list all household Transactions. Can view detailed info, edit or delete.
 * @author Roman Poliačik <xpolia05@stud.fit.vutbr.cz>
 * @date 13.12.2024
 */
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
    ActivityIndicator,
    Modal,
    Image,
    SectionList
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useAppContext } from '../AppContext';
import { useFocusEffect } from '@react-navigation/native';
import api from '../services/api';
import colors from '../styles/MainStyles';

export default function TransactionsScreen({ navigation }) {
    const { currentHousehold } = useAppContext();

    // states for transactions and household members
    const [transactions, setTransactions] = useState([]);
    const [householdMembers, setHouseholdMembers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalSpent, setTotalSpent] = useState(0);

    // modal state, selected transaction
    const [showModal, setShowModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [selectedItemIsRecurring, setSelectedItemIsRecurring] = useState(false);
    const [canEdit, setCanEdit] = useState(true);
    const [cannotEditReason, setCannotEditReason] = useState('');

    // refetch data when focused
    useFocusEffect(
        React.useCallback(() => {
            if (currentHousehold?.id) {
                fetchData();
            }
        }, [currentHousehold])
    );

    // fetch all transactions and household members
    const fetchData = async () => {
        try {
            setLoading(true);
            const usersRes = await api.get(`/users?householdId=${currentHousehold.id}`);
            const members = usersRes.data;
            setHouseholdMembers(members);

            const transRes = await api.get(`/transactions?householdId=${currentHousehold.id}`);
            let allTransactions = transRes.data;
            // sort by date x descending
            allTransactions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

            // filter out recurring
            const normalTransactions = allTransactions.filter(t => !t.isRecurring);
            setTransactions(normalTransactions);

            const totalAmountSpent = normalTransactions.reduce((sum, t) => sum + t.amount, 0);
            setTotalSpent(totalAmountSpent);
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    // convert userid to username
    const getUserName = (userId) => {
        const member = householdMembers.find(m => m.id === userId);
        return member ? member.name : userId;
    };

    // fetch img on id
    const getUserImage = (userId) => {
        const member = householdMembers.find(m => m.id === userId);
        return member?.profileImage || 'https://upload.wikimedia.org/wikipedia/commons/a/ac/Default_pfp.jpg';
    };

    // close modal and reset states
    const closeModal = () => {
        setShowModal(false);
        setSelectedItem(null);
        setSelectedItemIsRecurring(false);
        setCanEdit(true);
        setCannotEditReason('');
    };

    // edit selected transaction if allowed
    const handleEdit = () => {
        if (!canEdit) {
            Alert.alert('Cannot Edit', cannotEditReason || 'This transaction cannot be edited.');
            return;
        }

        navigation.navigate('DebtForm', { mode: 'edit', transaction: selectedItem });
        closeModal();
    };

    // delete selected transaction
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

    // check if transaction can be edited using api
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

    const renderModalContent = () => {
        if (!selectedItem) return null;
        const creditorName = getUserName(selectedItem.creditor);
        const amountStr = `Kč ${Number(selectedItem.amount).toFixed(2)}`;
        const participantsNames = selectedItem.participants.map(pid => getUserName(pid)).join(', ');

        const title = 'Transaction Details';

        return (
            <View style={styles.modalContent}>
                {/* Header */}
                <View style={[styles.modalHeader, { justifyContent: 'center', alignItems: 'center' }]}>
                    <Ionicons name="receipt-outline" size={28} color={colors.primary} style={{ marginRight: 10 }} />
                    <Text style={styles.modalTitle}>{title}</Text>
                </View>

                <View style={styles.modalDivider} />

                {/* Info */}
                <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Creditor:</Text>
                    <Text style={styles.modalInfoValue}>{creditorName}</Text>
                </View>

                <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Amount:</Text>
                    <Text style={styles.modalInfoValue}>{amountStr}</Text>
                </View>

                <View style={styles.modalInfoRow}>
                    <Text style={styles.modalInfoLabel}>Participants:</Text>
                    <Text style={styles.modalInfoValue}>{participantsNames}</Text>
                </View>

                {selectedItem.description ? (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Description:</Text>
                        <Text style={styles.modalInfoValue}>{selectedItem.description}</Text>
                    </View>
                ) : null}

                {selectedItem.timestamp && (
                    <View style={styles.modalInfoRow}>
                        <Text style={styles.modalInfoLabel}>Date:</Text>
                        <Text style={styles.modalInfoValue}>
                            {new Date(selectedItem.timestamp).toLocaleDateString()}
                        </Text>
                    </View>
                )}

                <View style={[styles.modalDivider, { marginTop: 20 }]} />

                {/* Buttons */}
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

    // when tapping a transaction
    const onTransactionPress = async (item) => {
        setSelectedItem(item);
        setSelectedItemIsRecurring(false);

        if (!item.isSettlement) {
            await fetchCanEdit(item.id);
        } else {
            setCanEdit(false);
            setCannotEditReason('This is a settlement transaction and cannot be edited.');
        }

        setShowModal(true);
    };

    // numeric to string conversion
    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    // group by year-month
    const sections = [];
    const groups = {};
    for (let t of transactions) {
        const d = new Date(t.timestamp);
        const year = d.getFullYear();
        const month = d.getMonth(); // 0-based
        const yearMonth = `${year}-${month}`;
        if (!groups[yearMonth]) {
            groups[yearMonth] = [];
        }
        groups[yearMonth].push(t);
    }

    // sort by year month (descending)
    const sortedYearMonths = Object.keys(groups).sort((a,b) => {
        const [yearA, monthA] = a.split('-').map(Number);
        const [yearB, monthB] = b.split('-').map(Number);
        if (yearB !== yearA) return yearB - yearA; //years first
        return monthB - monthA; //months second
    });

    // create sections month-year
    for (let ym of sortedYearMonths) {
        const [y, m] = ym.split('-').map(Number);
        const title = `${monthNames[m]} ${y}`;
        sections.push({ title, data: groups[ym] });
    }

    // render trans item
    const renderTransactionItem = ({ item }) => {
        const dateObj = new Date(item.timestamp);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const creditorName = getUserName(item.creditor);
        const description = item.description || "No description";

        return (
            <TouchableOpacity onPress={() => onTransactionPress(item)}>
                <View style={styles.transactionItemRow}>
                    {/* Left side - Profile pic desc\n datetime\n creditor */}
                    <View style={styles.transactionLeft}>
                        <Image
                            source={{ uri: getUserImage(item.creditor) }}
                            style={styles.transactionUserImage}
                        />
                        <View style={styles.transactionTextContainer}>
                            <Text style={styles.transactionDescription}>{description}</Text>
                            <Text style={styles.transactionDate}>{dateStr} {timeStr}</Text>
                            <Text style={styles.transactionCreditorLine}>
                                <Text style={{ fontStyle: 'italic' }}>{creditorName}</Text> paid for
                            </Text>
                        </View>
                    </View>

                    {/* Right side - Amount\n participants images */}
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

    {/* month divisor */}
    const renderSectionHeader = ({ section: { title } }) => (
        <Text style={styles.monthHeader}>{title}</Text>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{`Total spent: Kč ${totalSpent.toFixed(2)}`}</Text>
            </View>
            {loading ? (
                <ActivityIndicator style={{ marginTop: 20 }} size="large" color={colors.primary} />
            ) : sections.length === 0 ? (
                <Text style={styles.noDataText}>No transactions found.</Text>
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(item) => item.id}
                    renderItem={renderTransactionItem}
                    renderSectionHeader={renderSectionHeader}
                    contentContainerStyle={{ paddingBottom: 80 }}
                />
            )}

            {/* Modal PopUp */}
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
                        onPress={() => {}} // no closing on tap
                    >
                        {renderModalContent()}
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
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
    noDataText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginTop: 20,
    },
    monthHeader: {
        backgroundColor: 'rgba(240,240,240,0.9)',
        paddingVertical: 5,
        paddingHorizontal: 15,
        fontSize: 18,
        fontWeight: 'bold',
        borderBottomWidth: 1,
        borderTopWidth: 1,
        borderColor: colors.primary,
        color: colors.primary,
    },
    transactionItemRow: {
        flexDirection: 'row',
        backgroundColor: '#e0e0e0',
        padding: 10,
        marginHorizontal: 15,
        marginTop: 10,
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
    transactionUserImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: 'white',
        backgroundColor: "#7292e4",
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
        marginLeft: 10,
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
        // additional styling if needed
    },
    modalTitle: {
        fontSize: 20,
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
    modalHeader: {
        flexDirection: 'row',
        marginBottom: 10,
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
});
