import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { useAppContext } from '../AppContext';
import api from '../services/api';
import choresStyles from '../styles/ChoresStyles';
import colors from '../styles/MainStyles';
import RNPickerSelect from 'react-native-picker-select';
import { Ionicons } from '@expo/vector-icons';

function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const oneJan = new Date(year, 0, 1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((numberOfDays + oneJan.getUTCDay() + 1)/7);
    return `${year}-W${week}`;
}

export default function AddChoreScreen({ navigation }) {
    const { currentHousehold } = useAppContext();

    // State to toggle between immediate and scheduled chore forms
    const [isScheduled, setIsScheduled] = useState(false);

    // State for scheduled (default) chore
    const [choreName, setChoreName] = useState('');
    const [frequencyDays, setFrequencyDays] = useState('');

    // State for immediate chore
    const [newChore, setNewChore] = useState('');
    const [assignedUserId, setAssignedUserId] = useState('');
    const [usersList, setUsersList] = useState([]);

    // State for default chores listing
    const [defaultChores, setDefaultChores] = useState([]);

    useEffect(() => {
        if (currentHousehold) {
            fetchUsers();
            fetchDefaultChores();
        }
    }, [currentHousehold]);

    async function fetchUsers() {
        try {
            const res = await api.get('/users', {
                params: { householdId: currentHousehold.id }
            });
            const data = res.data;
            setUsersList(data);
            if (data.length > 0) {
                setAssignedUserId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    async function fetchDefaultChores() {
        try {
            const res = await api.get(`/households/${currentHousehold.id}/defaultChores`);
            setDefaultChores(res.data);
        } catch (error) {
            console.error('Error fetching default chores:', error);
        }
    }

    async function addDefaultChore() {
        if (!choreName.trim()) return;
        if (!frequencyDays.trim()) return;
        try {
            await api.post(`/households/${currentHousehold.id}/defaultChores`, { 
                name: choreName,
                frequencyDays: parseInt(frequencyDays, 10) || 7
            });
            setChoreName('');
            setFrequencyDays('7');
            fetchDefaultChores(); // Refresh after adding
        } catch (error) {
            console.error('Error adding default chore:', error);
        }
    }

    async function addImmediateChore() {
        if (!newChore.trim() || !assignedUserId.trim()) return;
        try {
            await api.post('/chores', {
                name: newChore,
                assignedTo: assignedUserId,
                householdId: currentHousehold.id,
                weekIdentifier: getCurrentWeekIdentifier()
            });
            setNewChore('');
            setAssignedUserId(usersList.length > 0 ? usersList[0].id : '');
            navigation.goBack();
        } catch (error) {
            console.error('Error adding immediate chore:', error);
        }
    }

    async function deleteDefaultChore(choreId) {
        Alert.alert(
            'Delete Chore',
            'Are you sure you want to delete this scheduled chore?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            await api.delete(`/households/${currentHousehold.id}/defaultChores/${choreId}`);
                            fetchDefaultChores();
                        } catch (error) {
                            console.error('Error deleting default chore:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    }

    return (
        <View style={choresStyles.addChoreContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>

                {/* Two-option toggle (Immediate / Scheduled) */}
                <View style={choresStyles.switchContainer}>
                    <TouchableOpacity
                        style={[choresStyles.toggleOption, !isScheduled && choresStyles.toggleOptionSelected]}
                        onPress={() => setIsScheduled(false)}
                    >
                        <Text style={choresStyles.switchLabel}>Immediate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[choresStyles.toggleOption, isScheduled && choresStyles.toggleOptionSelected]}
                        onPress={() => setIsScheduled(true)}
                    >
                        <Text style={choresStyles.switchLabel}>Scheduled</Text>
                    </TouchableOpacity>
                </View>

                {isScheduled ? (
                    // SCHEDULED CHORE FORM
                    <>
                        <View style={choresStyles.form}>
                            <TextInput
                                style={choresStyles.input}
                                placeholder="Chore Name"
                                value={choreName}
                                onChangeText={setChoreName}
                            />
                            <TextInput
                                style={choresStyles.input}
                                placeholder="Frequency in days (e.g., 7)"
                                value={frequencyDays}
                                onChangeText={setFrequencyDays}
                                keyboardType="numeric"
                            />
                            <TouchableOpacity style={choresStyles.addButton} onPress={addDefaultChore}>
                                <Text style={choresStyles.addButtonText}>Add scheduled chore</Text>
                            </TouchableOpacity>
                        </View>

                        <Text style={[choresStyles.addChoreTitle, {marginTop:20}]}>Scheduled Chores</Text>
                        {defaultChores.length === 0 ? (
                            <Text>No scheduled chores found.</Text>
                        ) : (
                            defaultChores.map(chore => (
                                <View key={chore.id} style={choresStyles.ScheduledChore}>
                                    <Text style={choresStyles.scheduledchoreText}>
                                        {chore.name} ({chore.frequencyDays || 7} days)
                                    </Text>
                                    <TouchableOpacity style={{marginLeft:'auto'}} onPress={() => deleteDefaultChore(chore.id)}>
                                        <Ionicons name="trash-outline" size={24} color="red" />
                                    </TouchableOpacity>
                                </View>
                            ))
                        )}
                    </>
                ) : (
                    // IMMEDIATE CHORE FORM
                    <>
                        <View style={choresStyles.form}>
                            <TextInput
                                style={choresStyles.input}
                                placeholder="Chore Name"
                                value={newChore}
                                onChangeText={setNewChore}
                            />

                            {usersList.length > 0 ? (
                                <RNPickerSelect
                                    onValueChange={(itemValue) => setAssignedUserId(itemValue)}
                                    placeholder={{ label: 'Select a User', value: null }}
                                    items={usersList.map(user => ({ label: user.name, value: user.id }))}
                                    style={pickerSelectStyles}
                                    useNativeAndroidPickerStyle={false}
                                />
                            ) : (
                                <Text>No users found in this household.</Text>
                            )}

                            <TouchableOpacity style={choresStyles.addButton} onPress={addImmediateChore}>
                                <Text style={choresStyles.addButtonText}>Add Chore</Text>
                            </TouchableOpacity>
                        </View>
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const pickerSelectStyles = StyleSheet.create({
    inputIOS: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        color: '#333',
        marginBottom: 15,
    },
    inputAndroid: {
        fontSize: 16,
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor:'#fff',
        borderRadius: 5,
        color: '#555',
        marginBottom: 15,
    },
});
