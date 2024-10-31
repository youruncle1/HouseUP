// screens/ChoresScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TextInput, Button, StyleSheet } from 'react-native';
import api from '../services/api';

export default function ChoresScreen() {
    const [chores, setChores] = useState([]);
    const [newChore, setNewChore] = useState('');

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
            await api.post('/chores', { name: newChore });
            setNewChore('');
            fetchChores();
        } catch (error) {
            console.error('Error adding chore:', error);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Chores</Text>
            <FlatList
                data={chores}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <Text style={styles.choreItem}>{item.name}</Text>}
            />
            <TextInput
                style={styles.input}
                placeholder="Add a new chore"
                value={newChore}
                onChangeText={setNewChore}
            />
            <Button title="Add Chore" onPress={addChore} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 20, flex: 1 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 10 },
    choreItem: { fontSize: 18, marginVertical: 5 },
    input: { borderColor: '#ccc', borderWidth: 1, padding: 10, marginBottom: 10 },
});
