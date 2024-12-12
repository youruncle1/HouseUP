import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useAppContext } from '../AppContext';
import api from '../services/api';
import choresStyles from '../styles/ChoresStyles';
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit';

import colors from '../styles/MainStyles';

export default function ChoreStatsScreen({ navigation }) {
    const { currentHousehold, currentUser } = useAppContext();
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState(null);

    useEffect(() => {
        fetchStats();
    }, [currentHousehold, currentUser]);

    async function fetchStats() {
        if (!currentHousehold || !currentUser) return;
        try {
            const res = await api.get('/chores/userStats', {
                params: {
                    householdId: currentHousehold.id,
                    userId: currentUser.id
                }
            });
            setStatsData(res.data);
        } catch (error) {
            console.error('Error fetching user stats:', error);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <View style={[choresStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6200EE" />
            </View>
        );
    }

    if (!statsData) {
        return (
            <View style={[choresStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>No Stats Available</Text>
            </View>
        );
    }

    const { completedCount = 0, takenOverCount = 0, weeklyCompletionHistory = {}, dailyCompletionHistory = {} } = statsData;

    // Convert weeklyCompletionHistory object to array
    const weeklyCompletionHistoryArray = Object.keys(weeklyCompletionHistory).sort().map(week => ({
        weekIdentifier: week,
        completed: weeklyCompletionHistory[week]
    }));

    // Convert dailyCompletionHistory object to array (e.g., last 7 days)
    const allDays = Object.keys(dailyCompletionHistory).sort();
    // For simplicity, let's just take the last 7 days
    const recent7Days = allDays.slice(-7);
    const dailyCompletionArray = recent7Days.map(day => ({
        day,
        count: dailyCompletionHistory[day]
    }));

    const notTakenOverCount = completedCount - takenOverCount;

    // Prepare data for charts
    // Line Chart (weekly)
    const weeks = weeklyCompletionHistoryArray.map(item => item.weekIdentifier);
    const weeklyCounts = weeklyCompletionHistoryArray.map(item => item.completed);

    // Pie Chart (takenOver vs original)
    const pieData = [
        {
            name: "Taken Over",
            population: takenOverCount,
            color: "#f66",
            legendFontColor: "#7F7F7F",
            legendFontSize: 15
        },
        {
            name: "Original",
            population: notTakenOverCount,
            color: "#6f6",
            legendFontColor: "#7F7F7F",
            legendFontSize: 15
        }
    ];

    // Bar Chart (daily)
    const days = dailyCompletionArray.map(d => d.day); // "2024-12-01", etc.
    const dailyCounts = dailyCompletionArray.map(d => d.count);

    const screenWidth = Dimensions.get("window").width;

    return (
        <View style={choresStyles.container}>
            <View style={choresStyles.statsHeader}>
                <Text style={choresStyles.statsHeaderTitle}>{currentHousehold?.name} - Your Stats</Text>
                <View style={{ width: 24 }} />
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                <Text style={choresStyles.statsSectionHeader}>Weekly Completion Over Time</Text>
                {weeklyCompletionHistoryArray.length > 0 ? (
                    <LineChart
                        data={{
                            labels: weeks,
                            datasets: [
                                { data: weeklyCounts }
                            ]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={{
                            backgroundColor: colors.primary,
                            backgroundGradientFrom: '#33B',
                            backgroundGradientTo: colors.secondary,
                            color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                            labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                        }}
                        bezier
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                ) : (
                    <Text>No weekly completion history yet.</Text>
                )}

                <Text style={choresStyles.statsSectionHeader}>Taken Over vs Original</Text>
                <PieChart
                    data={pieData}
                    width={screenWidth - 40}
                    height={220}
                    chartConfig={{
                        color: () => `rgba(0,0,0,1)`
                    }}
                    accessor="population"
                    backgroundColor="transparent"
                    paddingLeft="15"
                    absolute
                    style={{ marginVertical: 8 }}
                />

                <Text style={choresStyles.statsSectionHeader}>Daily Completion (Last 7 Days)</Text>
                {dailyCompletionArray.length > 0 ? (
                    <BarChart
                        data={{
                            labels: days,
                            datasets: [
                                { data: dailyCounts }
                            ]
                        }}
                        width={screenWidth - 40}
                        height={220}
                        chartConfig={{
                            backgroundColor: colors.primary,
                            backgroundGradientFrom: '#22C',
                            backgroundGradientTo: colors.primary,
                            color: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                            labelColor: (opacity = 1) => `rgba(255,255,255,${opacity})`,
                        }}
                        fromZero
                        style={{
                            marginVertical: 8,
                            borderRadius: 16
                        }}
                    />
                ) : (
                    <Text>No daily completion history available.</Text>
                )}
            </ScrollView>
        </View>
    );
}
