// frontend/screens/ChoresScreen.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Alert,
    ScrollView,
    Image,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from '@react-navigation/native';
import { useAppContext } from '../AppContext';
import api from '../services/api';

import choresStyles from '../styles/ChoresStyles';
import colors from '../styles/MainStyles';

function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const oneJan = new Date(year,0,1);
    const numberOfDays = Math.floor((now - oneJan)/(24*60*60*1000));
    const week = Math.ceil((numberOfDays + oneJan.getUTCDay()+1)/7);
    return `${year}-W${week}`;
}

const ITEM_HEIGHT = 50;

export default function ChoresScreen({ navigation }) {
    const { currentHousehold, showUserImages, currentUser } = useAppContext();
    const isFocused = useIsFocused();

    const [userChores, setUserChores] = useState([]);
    const [otherUsersChores, setOtherUsersChores] = useState([]);
    const [completedChores, setCompletedChores] = useState([]);
    const [choresCount, setChoresCount] = useState({ done: 0, assigned: 0 });
    const [emailToUserInfo, setEmailToUserInfo] = useState({});

    useEffect(() => {
        if (isFocused && currentHousehold && currentUser) {
            fetchUsers();
        }
    }, [isFocused, currentHousehold, currentUser]);

    useEffect(() => {
        if (currentHousehold && currentUser) {
            fetchChoresData();
        }
    }, [currentHousehold, currentUser]);

    async function fetchUsers() {
        try {
            const res = await api.get('/users', {
                params: { householdId: currentHousehold.id }
            });
            const usersData = res.data;
            const fallbackURL = 'https://www.pngfind.com/pngs/m/488-4887957_facebook-teerasej-profile-ball-circle-circular-profile-picture.png';
            const map = {};
            usersData.forEach(u => {
                map[u.id] = {
                    name: u.name,
                    profileImage: u.profileImage || fallbackURL
                };
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

            let userChoresList = allChores.filter(ch => ch.assignedTo === currentUser.id && !ch.completed);
            let otherChoresList = allChores.filter(ch => ch.assignedTo !== currentUser.id && !ch.completed);
            let completedList = allChores.filter(ch => ch.completed);

            userChoresList = userChoresList.sort((a, b) => {
                const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
                const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
                return aTime - bTime;
            });

            otherChoresList = otherChoresList.sort((a, b) => {
                const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
                const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
                return aTime - bTime;
            });

            completedList = completedList.sort((a, b) => {
                const aTime = a.completedTime?.toDate ? a.completedTime.toDate().getTime() : 0;
                const bTime = b.completedTime?.toDate ? b.completedTime.toDate().getTime() : 0;
                return bTime - aTime;
            });

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

    function renderUserChoreItem(item) {
        let assignedDate = null;
        if (typeof item.timestamp === 'string') {
            assignedDate = new Date(item.timestamp);
        } else if (item.timestamp && item.timestamp._seconds) {
            assignedDate = new Date(item.timestamp._seconds * 1000);
        } else if (item.timestamp && item.timestamp.toDate) {
            assignedDate = item.timestamp.toDate();
        }

        const now = new Date();
        let borderColor = '#DDD';
        if (assignedDate) {
            const daysSinceAssigned = Math.floor((now - assignedDate) / (1000 * 60 * 60 * 24));
            if (daysSinceAssigned >= 3) {
                borderColor = '#C44';
            } else if (daysSinceAssigned >= 2) {
                borderColor = 'orange';
            }
        }

        return (
            <View key={item.id} style={[choresStyles.choreItem, {borderColor}]}>
                <View style={choresStyles.choreTextContainer}>
                    <Text style={[choresStyles.choreText, {borderColor}]}>{item.name}</Text>
                </View>
                {!item.completed && (
                    <TouchableOpacity
                        style={[choresStyles.DoneButton, { backgroundColor: colors.primary }]}
                        onPress={() => completeChore(item.id)}
                    >
                        <Ionicons name="checkmark" size={24} color="white" />
                    </TouchableOpacity>
                )}
            </View>
        );
    }

    function renderOtherChoreItem(item) {
        const userInfo = emailToUserInfo[item.assignedTo] || {};
        const profileUri = userInfo.profileImage;
        return (
            <View key={item.id} style={choresStyles.choreItem}>
                {showUserImages && (
                    <Image
                        source={{ uri: profileUri }}
                        style={choresStyles.profileImage}
                    />
                )}
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
    }

    function renderCompletedChoreItem(item) {
        const assignedUserInfo = emailToUserInfo[item.originalAssignedTo] || {};
        const completerInfo = emailToUserInfo[item.completedBy] || {};
        const completerProfile = completerInfo.profileImage || 'https://www.pngfind.com/pngs/m/488-4887957_facebook-teerasej-profile-ball-circle-circular-profile-picture.png';
        return (
            <View key={item.id} style={choresStyles.choreItem}>
                {showUserImages && (
                    <Image
                        source={{ uri: completerProfile }}
                        style={choresStyles.profileImage}
                    />
                )}
                <View style={choresStyles.choreTextContainer}>
                    <Text style={choresStyles.completedChoreText}>{item.name}</Text>
                    <Text style={choresStyles.choreAssignedTo}>Assigned to: {assignedUserInfo.name || item.originalAssignedTo}</Text>
                    {item.completedBy && (
                        <Text style={choresStyles.choreAssignedTo}>Completed by: {completerInfo.name || item.completedBy}</Text>
                    )}
                </View>
            </View>
        );
    }

    const visibleItems = Math.min(userChores.length, 3);
    const containerHeight = visibleItems * ITEM_HEIGHT;
    const userChoresScrollable = userChores.length > 3;

    return (
        <View style={choresStyles.container}>
            <View style={choresStyles.header}>
                <TouchableOpacity style={choresStyles.menuButton} onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
                <View style={choresStyles.headerContent}>
                    <Text style={choresStyles.householdName}>{currentHousehold?.name || 'No Household Selected'}</Text>
                    <Text style={choresStyles.itemCounter}>{choresCount.done}/{choresCount.assigned} chores done this week</Text>
                </View>
                               {/* Current User Profile Image */}
                               <Image
                    source={{
                        uri: currentUser?.profileImage,
                    }}
                    style={choresStyles.profileImage}
                />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={choresStyles.choreHeader}>
                    <Text style={choresStyles.sectionHeader}>Your tasks:</Text>
                    <View style={choresStyles.choreHeader}>
                    <TouchableOpacity style={choresStyles.iconButton} onPress={() => navigation.navigate('ChoresStats')}>
                        <Ionicons name="stats-chart" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                </View>

                <View style={{ height: containerHeight+30, overflow: 'hidden' }}>
                    <ScrollView
                        nestedScrollEnabled={true}
                        scrollEnabled={userChoresScrollable}
                        showsVerticalScrollIndicator={false}
                    >
                        {userChores.map(renderUserChoreItem)}
                        {userChores.length === 0 && (
                            <Text style={choresStyles.NoChoremainText}>
                                You have completed all the tasks.
                            </Text>
                        )}
                    </ScrollView>
                </View>

                <Text style={choresStyles.sectionHeader}>Other's tasks:</Text>
                {otherUsersChores.length > 0 ? (
                    otherUsersChores.map(renderOtherChoreItem)
                ) : (
                    <Text style={choresStyles.othersChoresMessageText}>
                        Everyone has completed their tasks! Great teamwork makes all the difference!
                    </Text>
                )}

                <Text style={choresStyles.sectionHeader}>Completed this week:</Text>
                {completedChores.length > 0 ? (
                    completedChores.map(renderCompletedChoreItem)
                ) : (
                    <Text style={choresStyles.NoChoreText}>
                        No tasks have been completed this week yet.
                    </Text>
                )}
            </ScrollView>

            {/* Add Button */}
            <TouchableOpacity style={choresStyles.GoToAddButton} onPress={() => navigation.navigate('AddChore')}>
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>
        </View>
    );
}
