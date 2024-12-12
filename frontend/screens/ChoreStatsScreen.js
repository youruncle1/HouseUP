/**
 * @file ChoreStatsScreen.js
 * @brief Screen for displaying statistics related to chores completion and history.
 * @author Robert Zelníček <xzelni06@stud.fit.vutbr.cz>
 * @date 12.12.2024
 */

// Required imports for components, hooks, styles, and charting libraries
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, ScrollView, Dimensions, TouchableOpacity } from 'react-native';
import { useAppContext } from '../AppContext'; // Custom context for app-wide data
import api from '../services/api'; // API service for backend calls
import { LineChart, PieChart, BarChart } from 'react-native-chart-kit'; // Chart components for visualizing data

import choresStyles from '../styles/ChoresStyles'; // Custom styles for chores
import colors from '../styles/MainStyles'; // Color scheme for consistent UI styling

export default function ChoreStatsScreen({ navigation }) {
    const { currentHousehold, currentUser } = useAppContext(); // Get the current household and user from context
    const [loading, setLoading] = useState(true);
    const [statsData, setStatsData] = useState(null);

    // Fetch stats data when the component mounts or the household/user changes
    useEffect(() => {
        fetchStats();
    }, [currentHousehold, currentUser]);

    // Function to fetch statistics data for the current user in the current household
    async function fetchStats() {
        if (!currentHousehold || !currentUser) return; // Ensure both household and user exist
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

    // Display a loading spinner while data is being fetched
    if (loading) {
        return (
            <View style={[choresStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#6200EE" />
            </View>
        );
    }

    // Display a message if no stats data is available
    if (!statsData) {
        return (
            <View style={[choresStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <Text>No Stats Available</Text>
            </View>
        );
    }

    // Extract data from the stats response, providing defaults where necessary
    const { completedCount = 0, takenOverCount = 0, weeklyCompletionHistory = {}, dailyCompletionHistory = {} } = statsData;

    // Convert weeklyCompletionHistory object to array
    const weeklyCompletionHistoryArray = Object.keys(weeklyCompletionHistory).sort().map(week => ({
        weekIdentifier: week,
        completed: weeklyCompletionHistory[week]
    }));

    // Convert dailyCompletionHistory object to array (e.g., last 7 days)
    const allDays = Object.keys(dailyCompletionHistory).sort();
    const recent7Days = allDays.slice(-7);
    const dailyCompletionArray = recent7Days.map(day => ({
        day,
        count: dailyCompletionHistory[day]
    }));

    // Calculate the number of original (not taken over) chores
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

    // Render the main screen
    return (
        <View style={choresStyles.container}>
            <ScrollView contentContainerStyle={{ padding: 20 }}>
                {/* Line char showing how many chores you completed each week */}
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
                {/* Pie chart showing percentage of tasks original assigned to you & tasks you took over */}
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

                {/* Bar chart showing how many tasks you completed each day for the last 7 days */}
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
