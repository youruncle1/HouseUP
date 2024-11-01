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
} from 'react-native';
import api from '../services/api';

export default function ChoresScreen() {
    const [chores, setChores] = useState([]);
    const [newChore, setNewChore] = useState('');
    const [assignedTo, setAssignedTo] = useState('');

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

    const deleteChore = (id) => {
        Alert.alert(
            'Delete Chore',
            'Are you sure you want to delete this chore?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/chores/${id}`);
                            fetchChores();
                        } catch (error) {
                            console.error('Error deleting chore:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    };

    const renderChoreItem = ({ item }) => (
        <View style={styles.choreItem}>
            <Text
                style={[
                    styles.choreText,
                    item.completed && styles.completedChoreText,
                ]}
            >
                {item.name}
            </Text>
            <Text style={styles.choreAssignedTo}>
                Assigned to: {item.assignedTo || 'Unassigned'}
            </Text>
            <View style={styles.choreActions}>
                {!item.completed && (
                    <TouchableOpacity
                        style={styles.completeButton}
                        onPress={() => completeChore(item.id)}
                    >
                        <Text style={styles.buttonText}>Complete</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteChore(item.id)}
                >
                    <Text style={styles.buttonText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Chores</Text>
            </View>
            <FlatList
                data={chores}
                keyExtractor={(item) => item.id}
                renderItem={renderChoreItem}
                style={styles.list}
            />
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
        </View>
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
    list: {
        flex: 1,
    },
    choreItem: {
        backgroundColor: '#fff',
        padding: 15,
        marginHorizontal: 15,
        marginTop: 10,
        borderRadius: 8,
        elevation: 1,
    },
    choreText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    completedChoreText: {
        textDecorationLine: 'line-through',
        color: '#999',
    },
    choreAssignedTo: {
        fontSize: 14,
        color: '#555',
        marginTop: 5,
    },
    choreActions: {
        flexDirection: 'row',
        marginTop: 10,
        justifyContent: 'flex-end',
    },
    completeButton: {
        backgroundColor: '#03dac5',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
        marginRight: 10,
    },
    deleteButton: {
        backgroundColor: '#dc3545',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 5,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
    },
    form: {
        padding: 15,
        backgroundColor: '#fff',
        borderTopColor: '#ddd',
        borderTopWidth: 1,
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
