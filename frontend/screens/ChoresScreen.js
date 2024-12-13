/**
 * @file ChoresScreen.js
 * @brief Screen for managing and displaying chores in the application.
 * @author Robert Zelníček <xzelni06@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */

// Required imports for React components, hooks, and styles
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Alert,
    ScrollView,
    Image,
    TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // Icon library for UI
import { useIsFocused } from '@react-navigation/native';
import { useAppContext } from '../AppContext'; // Custom context for app-wide data
import api from '../services/api'; // API service for backend calls

import choresStyles from '../styles/ChoresStyles'; // Custom styles for chores screen
import colors from '../styles/MainStyles'; //Color scheme for consistent UI styling

// Helper function to calculate the current week identifier (Year-W# format)
function getCurrentWeekIdentifier() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const oneJan = new Date(year,0,1);
    const numberOfDays = Math.floor((now - oneJan)/(24*60*60*1000));
    const week = Math.ceil((numberOfDays + oneJan.getUTCDay()+1)/7);
    return `${year}-W${week}`;
}

// Default height for chore items
const ITEM_HEIGHT = 50;

export default function ChoresScreen({ navigation }) {
    const { currentHousehold, showUserImages, currentUser } = useAppContext(); // Get household, user, and image settings from context
    const isFocused = useIsFocused(); // Check if the screen is currently in focus

    // State variables to manage chores and their data
    const [userChores, setUserChores] = useState([]); // Chores assigned to the current user
    const [otherUsersChores, setOtherUsersChores] = useState([]); // Chores assigned to others
    const [completedChores, setCompletedChores] = useState([]); // Completed chores
    const [choresCount, setChoresCount] = useState({ done: 0, assigned: 0 }); // Count of completed and total chores
    const [emailToUserInfo, setEmailToUserInfo] = useState({}); // Map of user emails to their information (name and profile image)

    // Fetch data when the screen is focused or household/user changes
    useEffect(() => {
        if (isFocused && currentHousehold && currentUser) {
            fetchUsers(); // Fetch users in the household
        }
    }, [isFocused, currentHousehold, currentUser]);

    // Fetch list of users in the household
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
            fetchChoresData();// Fetch chores after fetching user data
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    }

    // Fetch chores data for the current household and week
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

            // Filter chores into categories
            let userChoresList = allChores.filter(ch => ch.assignedTo === currentUser.id && !ch.completed);
            let otherChoresList = allChores.filter(ch => ch.assignedTo !== currentUser.id && !ch.completed);
            let completedList = allChores.filter(ch => ch.completed);
            
            // Sort chores by timestamp (ascending for pending, descending for completed)
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
    // Mark a chore as completed
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

    // Take over a chore assigned to someone else
    async function stealChore(id) {
        try {
            await api.put(`/chores/${id}/assign`, { newUser: currentUser.id });
            fetchChoresData();
        } catch (error) {
            console.error('Error stealing chore:', error);
        }
    }

    // Render a chore assigned to the current user
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
        let borderColor = '#DDD';//default border color
        if (assignedDate) {
            const daysSinceAssigned = Math.floor((now - assignedDate) / (1000 * 60 * 60 * 24));
            if (daysSinceAssigned >= 3) {
                borderColor = '#C44'; //Change border color for "forgotten" task
            } else if (daysSinceAssigned >= 2) {
                borderColor = 'orange'; //Change border color for almost "overdue" task
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

    // Render a chore assigned to another user
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

    // Render a completed chore
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

    // Calculate scrollable container height for user's chores
    const visibleItems = Math.min(userChores.length, 3);
    const containerHeight = visibleItems * ITEM_HEIGHT;
    const userChoresScrollable = userChores.length > 3;

    return (
        /* Header section */
        <View style={choresStyles.container}>
            <View style={choresStyles.header}>
                {/* Menu Button */}
                <TouchableOpacity style={choresStyles.menuButton} onPress={() => navigation.openDrawer()}>
                    <Ionicons name="menu" size={24} color="white" />
                </TouchableOpacity>
                <View style={choresStyles.headerContent}>
                    <Text style={choresStyles.householdName}>{currentHousehold?.name || 'No Household Selected'}</Text>
                    {/* Chore done counter */}
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
                    {/* Stats Button to navigate to statistics */}
                    <TouchableOpacity style={choresStyles.iconButton} onPress={() => navigation.navigate('ChoresStats')}>
                        <Ionicons name="stats-chart" size={24} color="black" />
                    </TouchableOpacity>
                </View>
                </View>
                {/* List of your week's tasks */}
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
                {/* List of other's tasks */}
                <Text style={choresStyles.sectionHeader}>Other's tasks:</Text>
                {otherUsersChores.length > 0 ? (
                    otherUsersChores.map(renderOtherChoreItem)
                ) : (
                    <Text style={choresStyles.othersChoresMessageText}>
                        Everyone has completed their tasks! Great teamwork makes all the difference!
                    </Text>
                )}
                {/* List of completed tasks */}
                <Text style={choresStyles.sectionHeader}>Completed this week:</Text>
                {completedChores.length > 0 ? (
                    completedChores.map(renderCompletedChoreItem)
                ) : (
                    <Text style={choresStyles.NoChoreText}>
                        No tasks have been completed this week yet.
                    </Text>
                )}
                <View style={{height:100}}></View>
            </ScrollView>

            {/* Add Button */}
            <TouchableOpacity style={choresStyles.GoToAddButton} onPress={() => navigation.navigate('AddChore')}>
                <Ionicons name="add" size={36} color="white" />
            </TouchableOpacity>
        </View>
    );
}
