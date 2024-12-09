// frontend/screens/AddChoreScreen.js
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useAppContext } from '../AppContext';
import api from '../services/api';

export default function AddChoreScreen({ navigation }) {
    const { currentHousehold } = useAppContext();
    const [choreName, setChoreName] = useState('');

    async function addDefaultChore() {
        if (!choreName.trim()) return;

        try {
            await api.post(`/households/${currentHousehold.id}/defaultChores`, {
                name: choreName
            });
            setChoreName('');
            navigation.goBack();
        } catch (error) {
            console.error('Error adding default chore:', error);
        }
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add a New Default Chore</Text>
            <TextInput
                style={styles.input}
                placeholder="Chore Name"
                value={choreName}
                onChangeText={setChoreName}
            />
            <TouchableOpacity style={styles.addButton} onPress={addDefaultChore}>
                <Text style={styles.addButtonText}>Add Default Chore</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container:{ flex:1, backgroundColor:'#fff', justifyContent:'center', padding:20 },
    title:{ fontSize:20, fontWeight:'bold', marginBottom:20 },
    input:{
        borderWidth:1,
        borderColor:'#ccc',
        borderRadius:5,
        padding:10,
        marginBottom:20
    },
    addButton:{
        backgroundColor:'#6200EE',
        padding:15,
        borderRadius:5,
        alignItems:'center'
    },
    addButtonText:{color:'#fff', fontWeight:'bold'}
});
