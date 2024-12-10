// frontend/screens/AddChoreScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useAppContext } from '../AppContext';
import api from '../services/api';
import choresStyles from '../styles/ChoresStyles';
import { Picker } from '@react-native-picker/picker';

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

    // State for adding a default chore
    const [choreName, setChoreName] = useState('');

    // States for adding an immediate chore
    const [newChore, setNewChore] = useState('');
    const [assignedUserId, setAssignedUserId] = useState('');
    const [usersList, setUsersList] = useState([]);

    useEffect(() => {
        if (currentHousehold) {
            fetchUsers();
        }
    }, [currentHousehold]);

    async function fetchUsers() {
        try {
            const res = await api.get('/users', {
                params: { householdId: currentHousehold.id }
            });
            const data = res.data;
            setUsersList(data);
            // If we have at least one user, preselect the first one
            if (data.length > 0) {
                setAssignedUserId(data[0].id);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    async function addDefaultChore() {
        if (!choreName.trim()) return;
        try {
            await api.post(`/households/${currentHousehold.id}/defaultChores`, { name: choreName });
            setChoreName('');
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

    return (
        <View style={choresStyles.addChoreContainer}>
            <ScrollView>
            <Text style={[choresStyles.addChoreTitle]}>Add a Chore</Text>
                <View style={choresStyles.form}>
                    <TextInput
                        style={choresStyles.input}
                        placeholder="Chore Name"
                        value={newChore}
                        onChangeText={setNewChore}
                    />

                    {/* Dropdown (Picker) to select user by name */}
                    {usersList.length > 0 ? (
                        <Picker
                            selectedValue={assignedUserId}
                            style={choresStyles.inputpicker}
                            onValueChange={(itemValue) => setAssignedUserId(itemValue)}
                        >
                            {usersList.map(user => (
                                <Picker.Item key={user.id} label={user.name} value={user.id} />
                            ))}
                        </Picker>
                    ) : (
                        <Text>No users found in this household.</Text>
                    )}

                    <TouchableOpacity style={choresStyles.addButton} onPress={addImmediateChore}>
                        <Text style={choresStyles.addButtonText}>Add Chore</Text>
                    </TouchableOpacity>
                </View>
                <Text style={choresStyles.addChoreTitle}>Add a New Scheduled Chore</Text>
                <View style={choresStyles.form}>
                <TextInput
                    style={choresStyles.input}
                    placeholder="Chore Name"
                    value={choreName}
                    onChangeText={setChoreName}
                />
                <TouchableOpacity style={choresStyles.addButton} onPress={addDefaultChore}>
                    <Text style={choresStyles.addButtonText}>Add scheduled chore</Text>
                </TouchableOpacity>
                </View>
                
            </ScrollView>
        </View>
    );
}
