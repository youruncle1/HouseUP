// frontend/screens/ChoreStatsScreen.js
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../AppContext';
import api from '../services/api';
import choresStyles from '../styles/ChoresStyles';

function msToReadableTime(ms) {
    if (!ms) return 'N/A';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const leftoverSeconds = seconds % 60;
    const leftoverMinutes = minutes % 60;
    const leftoverHours = hours % 24;
    return `${days}d ${leftoverHours}h ${leftoverMinutes}m ${leftoverSeconds}s`;
}

export default function ChoreStatsScreen({ navigation }) {
    const { currentHousehold } = useAppContext();
    const [stats, setStats] = useState([]);
    const [usersMap, setUsersMap] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentHousehold) {
            fetchData();
        }
    }, [currentHousehold]);

    async function fetchData() {
        try {
            setLoading(true);
            const statsRes = await api.get('/chores/stats', {
                params: { householdId: currentHousehold.id }
            });
            const statsData = statsRes.data;

            const usersRes = await api.get('/users', { params: { householdId: currentHousehold.id } });
            const usersData = usersRes.data;
            const map = {};
            usersData.forEach(u => {
                map[u.id] = { name: u.name, id: u.id };
            });

            setUsersMap(map);
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={choresStyles.container}>
            <View style={choresStyles.statsHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color="white" />
                </TouchableOpacity>
                <Text style={choresStyles.statsHeaderTitle}>{currentHousehold?.name} - All-Time Stats</Text>
                <View style={{width:24}}></View>
            </View>

            {loading ? (
                <View style={choresStyles.statsLoadingContainer}>
                    <ActivityIndicator size="large" color="#6200EE" />
                </View>
            ) : (
                <ScrollView style={choresStyles.statsContent}>
                    <Text style={choresStyles.statsSectionHeader}>User Statistics</Text>
                    {stats.length === 0 ? (
                        <Text>No data available.</Text>
                    ) : (
                        stats.map((userStat) => {
                            const userInfo = usersMap[userStat.userId] || { name: userStat.userId };
                            return (
                                <View key={userStat.userId} style={choresStyles.statsItem}>
                                    <Text style={choresStyles.statsUserName}>{userInfo.name || userStat.userId}</Text>
                                    <Text style={choresStyles.statsText}>Completed: {userStat.completedCount}</Text>
                                    <Text style={choresStyles.statsText}>Taken Over: {userStat.takenOverCount}</Text>
                                    <Text style={choresStyles.statsText}>
                                        Avg. Completion Time: {msToReadableTime(userStat.averageCompletionTimeMS)}
                                    </Text>
                                </View>
                            );
                        })
                    )}
                </ScrollView>
            )}
        </View>
    );
}
