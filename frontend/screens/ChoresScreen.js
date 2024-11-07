import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TextInput,
    TouchableOpacity,
    Alert,
    Button,
    StyleSheet,
    Image,
} from 'react-native';
import api from '../services/api';
import styles from '../styles/ChoresStyles';
import colors from '../styles/MainStyles';
import { Ionicons } from '@expo/vector-icons';

export default function ChoresScreen() {
    const [chores, setChores] = useState([]);
    const [newChore, setNewChore] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        fetchChores();
    }, []);

    const fetchChores = async () => {
        try {
            const response = await api.get('/chores');
            setChores(response.data);
        } catch (error) {
            console.error('Error fetching chores:', error);
        }
    };

    const addChore = async () => {
        if (newChore.trim() === '') return;
        try {
            await api.post('/chores', { name: newChore, assignedTo });
            setNewChore('');
            setAssignedTo('');
            fetchChores();
        } catch (error) {
            console.error('Error adding chore:', error);
        }
    };

    const completeChore = (id) => {
        Alert.alert(
            'Complete Chore',
            'Mark this chore as completed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            await api.put(`/chores/${id}/complete`);
                            await api.delete(`/chores/${id}`);
                            fetchChores();
                        } catch (error) {
                            console.error('Error completing chore:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };


    const renderChoreItem = ({ item }) => (
        <View style={styles.choreItem}>
                        <Image
                source={{ uri: item.userImage || 'https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png' }}
                style={styles.profileImage}
            />
            <View style={styles.choreTextContainer}>
            <Text style={styles.choreAssignedTo}>
                {item.assignedTo || 'Unassigned'}
                </Text>
                <Text
                    style={[
                        styles.choreText,
                        item.completed && styles.completedChoreText,
                    ]}
                >
                    {item.name}
                </Text>

            </View>
            {!item.completed && (
                <TouchableOpacity
                    style={styles.completeButton}
                    onPress={() => completeChore(item.id)}
                >
                    <Text style={styles.buttonText}>Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.HHname}>HouseHold123</Text>
                <Text style={styles.choresDone}>2/3 chores done</Text>
            </View>
            <View style={styles.choresheader}>
                <Text style={styles.headertext}>Chores Managment</Text>
                <TouchableOpacity style={styles.listSettings} onPress={() => setShowForm(!showForm)}>
                    <Ionicons name="settings-outline" size={24} style={styles.settingsIcon} />
                </TouchableOpacity>
            </View>
            <FlatList
            
                data={chores}
                keyExtractor={(item) => item.id}
                
                renderItem={renderChoreItem}
                style={styles.list}

            />

            {showForm&&(//Pridavani dalsich chores 
                <View style={styles.form}>
                <TextInput
                    style={styles.input}
                    placeholder="Add a new chore"
                    value={newChore}
                    onChangeText={setNewChore}
                />
                <TextInput
                    style={styles.input}
                    placeholder="Assign to (Optional)"
                    value={assignedTo}
                    onChangeText={setAssignedTo}
                />
                <TouchableOpacity style={styles.addButton} onPress={addChore}>
                    <Text style={styles.addButtonText}>Add Chore</Text>
                </TouchableOpacity>
            </View>
            )}
        </View>
    );
}


