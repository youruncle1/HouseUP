// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import Ionicons from 'react-native-vector-icons/Ionicons';

import ChoresScreen from './screens/ChoresScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import ShoppingListScreen_AddItem from './screens/ShoppingListScreen_AddItem';
import DebtScreen from './screens/DebtScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const primaryColor = '#741ded';

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
            <Stack.Screen name="AddItem" component={ShoppingListScreen_AddItem} options={{ title: 'Add Item' }} />
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
            <Tab.Navigator initialRouteName="ChoresTab"
                           screenOptions={({ route }) => ({
                               tabBarIcon: ({ focused, color, size }) => {
                                   let iconName;

                                   if (route.name === 'ChoresTab') {
                                       iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
                                   } else if (route.name === 'ShoppingListTab') {
                                       iconName = focused ? 'cart' : 'cart-outline';
                                   } else if (route.name === 'DebtTab') {
                                       iconName = focused ? 'wallet' : 'wallet-outline';
                                   }

                                   // Return the icon component
                                   return <Ionicons name={iconName} size={size} color={color} />;
                               },
                               tabBarActiveTintColor: primaryColor, // Set active color
                               tabBarInactiveTintColor: 'gray', // Set inactive color
                           })}
            >
                <Tab.Screen name="ChoresTab" component={ChoresStack} options={{ title: 'Tasks', headerShown: false }} />
                <Tab.Screen name="ShoppingListTab" component={ShoppingListStack} options={{ title: 'Shopping List', headerShown: false }} />
                <Tab.Screen name="DebtTab" component={DebtStack} options={{ title: 'Debt', headerShown: false }} />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
