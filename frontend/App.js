// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import ChoresScreen from './screens/ChoresScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import DebtScreen from './screens/DebtScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Create a stack navigator for each tab (if you plan to add more screens in each tab)
function ChoresStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="ChoresHome" component={ChoresScreen} options={{ title: 'Chores' }} />
            {/* Additional screens for Chores can go here */}
        </Stack.Navigator>
    );
}

function ShoppingListStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="ShoppingListHome" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
            {/* Additional screens for Shopping List can go here */}
        </Stack.Navigator>
    );
}

function DebtStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="DebtHome" component={DebtScreen} options={{ title: 'Debt' }} />
            {/* Additional screens for Debt can go here */}
        </Stack.Navigator>
    );
}

// Tab Navigator that holds each main stack
export default function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator initialRouteName="ChoresTab">
                <Tab.Screen name="ChoresTab" component={ChoresStack} options={{ title: 'HOUSEHOLD PORNO', headerShown: false }} />
                <Tab.Screen name="ShoppingListTab" component={ShoppingListStack} options={{ title: 'Shopping List', headerShown: false }} />
                <Tab.Screen name="DebtTab" component={DebtStack} options={{ title: 'Debt', headerShown: false }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
