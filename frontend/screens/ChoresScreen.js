import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Alert,
    ScrollView,
    Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import api from '../services/api';

import choresStyles from '../styles/ChoresStyles';
import shoppingListStyles from '../styles/ShoppingListStyles';

function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const oneJan = new Date(year,0,1);
    const numberOfDays = Math.floor((now - oneJan) / (24 * 60 * 60 * 1000));
    const week = Math.ceil((numberOfDays + oneJan.getUTCDay() + 1)/7);
    return `${year}-W${week}`;
}

export default function ChoresScreen({ navigation }) {
    const { currentHousehold, currentUser } = useAppContext();
    const isFocused = useIsFocused();

    const [userChores, setUserChores] = useState([]);
    const [otherUsersChores, setOtherUsersChores] = useState([]);
    const [completedChores, setCompletedChores] = useState([]);
    const [choresCount, setChoresCount] = useState({ done: 0, assigned: 0 });
    const [showForm, setShowForm] = useState(false);
    const [newChore, setNewChore] = useState('');
    const [showOnlyMyTasks, setShowOnlyMyTasks] = useState(false);

    const [emailToUserInfo, setEmailToUserInfo] = useState({});
    const [showMoreUserTasks, setShowMoreUserTasks] = useState(false);

    useEffect(() => {
        if (isFocused && currentHousehold && currentUser) {
            fetchUsers();
        }
    }, [isFocused, currentHousehold, currentUser]);

    useEffect(() => {
        if (currentHousehold && currentUser) {
            fetchChoresData();
        }
    }, [currentHousehold, currentUser, showOnlyMyTasks]);

    async function fetchUsers() {
        try {
            const res = await api.get('/users', {
                params: { householdId: currentHousehold.id }
            });
            const usersData = res.data;
            const map = {};
            usersData.forEach(u => {
                map[u.id] = { name: u.name, profileImage:'https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png' };
            });
            setEmailToUserInfo(map);
            fetchChoresData();
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    async function fetchChoresData() {
        try {
            const weekId = getCurrentWeekIdentifier();
            const response = await api.get('/chores', {
                params: {
                    householdId: currentHousehold.id,
                    weekIdentifier: weekId
                }
            });
            const allChores = response.data;

            const userChoresList = allChores.filter(ch => ch.assignedTo === currentUser.id && !ch.completed);
            const otherChoresList = allChores.filter(ch => ch.assignedTo !== currentUser.id && !ch.completed);
            const completedList = allChores.filter(ch => ch.completed);

            setUserChores(userChoresList);
            setOtherUsersChores(otherChoresList);
            setCompletedChores(completedList);

            setChoresCount({
                done: completedList.length,
                assigned: allChores.length
            });
        } catch (error) {
            console.error('Error fetching chores data:', error);
        }
    }

    async function completeChore(id) {
        Alert.alert(
            'Complete Chore',
            'Mark this chore as completed?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Yes',
                    onPress: async () => {
                        try {
                            await api.put(`/chores/${id}/complete`, { completedBy: currentUser.id });
                            fetchChoresData();
                        } catch (error) {
                            console.error('Error completing chore:', error);
                        }
                    },
                },
            ],
            { cancelable: false }
        );
    }

    async function stealChore(id) {
        try {
            await api.put(`/chores/${id}/assign`, { newUser: currentUser.id });
            fetchChoresData();
        } catch (error) {
            console.error('Error stealing chore:', error);
        }
    }

    async function addChore() {
        if (newChore.trim() === '') return;
        try {
            await api.post('/chores', {
                name: newChore,
                assignedTo: currentUser.id,
                householdId: currentHousehold.id,
                weekIdentifier: getCurrentWeekIdentifier()
            });
            setNewChore('');
            setShowForm(false);
            fetchChoresData();
        } catch (error) {
            console.error('Error adding chore:', error);
        }
    }

    const renderUserChoreItem = (item) => (
        <View key={item.id} style={choresStyles.choreItem}>
            <View style={choresStyles.choreTextContainer}>
                <Text style={choresStyles.choreText}>{item.name}</Text>
            </View>
            {!item.completed && (
                <TouchableOpacity
                    style={choresStyles.completeButton}
                    onPress={() => completeChore(item.id)}
                >
                    <Text style={choresStyles.buttonText}>Done</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    const renderOtherChoreItem = (item) => {
        const userInfo = emailToUserInfo[item.assignedTo] || {};
        return (
            <View key={item.id} style={choresStyles.choreItem}>
                <Image
                    source={{ uri:'https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png' }}
                    style={choresStyles.profileImage}
                />
                <View style={choresStyles.choreTextContainer}>
                    <Text style={choresStyles.choreAssignedTo}>Assigned to: {userInfo.name || item.assignedTo}</Text>
                    <Text style={choresStyles.choreText}>{item.name}</Text>
                </View>
                <TouchableOpacity
                    style={choresStyles.takeOverButton}
                    onPress={() => stealChore(item.id)}
                >
                    <Text style={choresStyles.buttonText}>Take Over</Text>
                </TouchableOpacity>
            </View>
        );
    };

    const renderCompletedChoreItem = (item) => {
        const assignedUserInfo = emailToUserInfo[item.originalAssignedTo] || {};
        const completerInfo = emailToUserInfo[item.completedBy] || {};
        return (
            <View key={item.id} style={choresStyles.choreItem}>
                <Image
                    source={{ uri:'https://static.vecteezy.com/system/resources/previews/019/879/186/non_2x/user-icon-on-transparent-background-free-png.png' }}
                    style={choresStyles.profileImage}
                />
                <View style={choresStyles.choreTextContainer}>
                    <Text style={choresStyles.completedChoreText}>{item.name}</Text>
                    <Text style={choresStyles.choreAssignedTo}>Assigned to: {assignedUserInfo.name || item.originalAssignedTo}</Text>
                    {item.completedBy && (
                        <Text style={choresStyles.choreAssignedTo}>Completed by: {completerInfo.name || item.completedBy}</Text>
                    )}
                </View>
            </View>
        );
    };

    const displayedUserChores = showOnlyMyTasks
        ? userChores 
        : (showMoreUserTasks ? userChores : userChores.slice(0,2));

    return (
        <View style={choresStyles.container}>
            <View style={shoppingListStyles.header}>
                <TouchableOpacity style={shoppingListStyles.menuButton} onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
                <View style={shoppingListStyles.headerContent}>
                    <Text style={shoppingListStyles.householdName}>{currentHousehold?.name || 'No Household Selected'}</Text>
                    <Text style={shoppingListStyles.itemCounter}>{choresCount.done}/{choresCount.assigned} chores done this week</Text>
                </View>
            </View>

            <ScrollView style={{flex:1}}>
                <View style={choresStyles.choreHeader}>
                    <Text style={shoppingListStyles.listTitle}>Your week's tasks:</Text>
                    <TouchableOpacity style={shoppingListStyles.listSettings} onPress={() => setShowOnlyMyTasks(!showOnlyMyTasks)}>
                        <Ionicons name={showOnlyMyTasks ? "contract" : "expand"} size={24} color="black" />
                    </TouchableOpacity>
                    {/* New Stats Button */}
                    <TouchableOpacity style={choresStyles.iconButton} onPress={() => navigation.navigate('ChoresStats')}>
                        <Ionicons name="stats-chart" size={24} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity style={{marginRight:10}} onPress={() => navigation.navigate('AddChore')}>
                        <Ionicons name="add-circle-outline" size={24} color="black" />
                    </TouchableOpacity>
                </View>

                {displayedUserChores.map(renderUserChoreItem)}

                {!showOnlyMyTasks && (
                    <>
                        <Text style={choresStyles.sectionHeader}>Other users' tasks:</Text>
                        {otherUsersChores.map(renderOtherChoreItem)}

                        <Text style={choresStyles.sectionHeader}>Completed this week:</Text>
                        {completedChores.map(renderCompletedChoreItem)}
                    </>
                )}
            </ScrollView>
        </View>
    );
}
