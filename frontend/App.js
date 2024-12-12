// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity } from 'react-native';
import { AppProvider, useAppContext } from './AppContext';

import Ionicons from 'react-native-vector-icons/Ionicons';

import ChoresScreen from './screens/ChoresScreen';
import AddChoreScreen from './screens/AddChoreScreen';
import ChoresStatsScreen from './screens/ChoresStatsScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import ShoppingListScreen_AddItem from './screens/ShoppingListScreen_AddItem';
import ShoppingListScreen_Settings from './screens/ShoppingListScreen_Settings';
import DebtScreen from './screens/DebtScreen';
import DebtFormScreen from './screens/DebtFormScreen';
import RecurringDebtsScreen from './screens/RecurringDebtsScreen';
import TransactionsScreen from './screens/TransactionsScreen';

import styles from './styles/DrawerStyles';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();
const primaryColor = '#741ded';

// Create a stack navigator for each tab (if you plan to add more screens in each tab)
function ChoresStack() {
    return (
        // In the same stack navigator as ChoresScreen:
        <Stack.Navigator>
            <Stack.Screen name="ChoresHome" component={ChoresScreen} options={{ title: 'Chores' }} />
            <Stack.Screen name="AddChore" component={AddChoreScreen} options={{ title: 'Add Chore' }} />
            <Stack.Screen name="ChoresStats" component={ChoresStatsScreen} options={{ title: 'Stats' }} />
        </Stack.Navigator>

    );
}

function ShoppingListStack() {
    return (
        <Stack.Navigator id={ShoppingListStack}>
            <Stack.Screen name="ShoppingListHome" component={ShoppingListScreen} options={{ title: 'Shopping List' }} />
            {/* Additional screens for Shopping List can go here */}
            <Stack.Screen name="AddItem" component={ShoppingListScreen_AddItem} options={{ title: 'Add Item' }} />
            <Stack.Screen name="ShoppingListSettings" component={ShoppingListScreen_Settings} options={{ title: 'Settings' }} />
        </Stack.Navigator>
    );
}

function DebtStack() {
    return (
        <Stack.Navigator id={DebtStack}>
            <Stack.Screen name="DebtHome" component={DebtScreen} options={{ title: 'Debt' }} />
            <Stack.Screen name="DebtForm" component={DebtFormScreen} options={{ title: 'Debt Form' }} />
            <Stack.Screen name="RecurringDebts" component={RecurringDebtsScreen} />
            <Stack.Screen name="Transactions" component={TransactionsScreen} />
            {/* Additional screens for Debt can go here */}
        </Stack.Navigator>
    );
}

// Main Tab Navigator
function MainTabs() {
    return (
        <Tab.Navigator
            id="MainTabs"
            initialRouteName="ChoresTab"
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

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: primaryColor,
                tabBarInactiveTintColor: 'gray',
            })}
        >
            <Tab.Screen name="ChoresTab" component={ChoresStack} options={{ title: 'Tasks', headerShown: false }} />
            <Tab.Screen
                name="ShoppingListTab"
                component={ShoppingListStack}
                options={{ title: 'Shopping List', headerShown: false }}
            />
            <Tab.Screen name="DebtTab" component={DebtStack} options={{ title: 'Debt', headerShown: false }} />
        </Tab.Navigator>
    );
}

// Drawer Content
function DrawerContent({ closeDrawer }) {
    const { currentUser, setCurrentUser, currentHousehold, setCurrentHousehold } = useAppContext();

    const users = [
        { id: 'user1@gmail.com', name: 'Denis', profileImage: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Paul_Circle.png'},
        { id: 'user2@gmail.com', name: 'Roman', profileImage: 'https://images.rawpixel.com/image_png_800/cHJpdmF0ZS9sci9pbWFnZXMvd2Vic2l0ZS8yMDIyLTA4L2pvYjEwMzQtZWxlbWVudC0wNi0zOTcucG5n.png'},
        { id: 'user3@gmail.com', name: 'Robo',  profileImage: 'https://www.pngfind.com/pngs/m/488-4887957_facebook-teerasej-profile-ball-circle-circular-profile-picture.png'},
    ];

    const households = [
        { id: 'household1', name: 'Household1' },
        { id: 'household2', name: 'Household2' },
    ];

    return (
        <View style={styles.drawerContainer}>
            <Text style={styles.sectionTitle}>Switch User</Text>
            {users.map((user) => (
                <TouchableOpacity
                    key={user.id}
                    style={[
                        styles.menuItem,
                        currentUser.id === user.id && styles.highlightedMenuItem,
                    ]}
                    onPress={() => {
                        setCurrentUser(user); // Update current user with selected user object
                    }}
                >
                    <Text
                        style={[
                            styles.menuText,
                            currentUser.id === user.id && styles.highlightedMenuText,
                        ]}
                    >
                        {user.name}
                    </Text>
                </TouchableOpacity>
            ))}

            <Text style={styles.sectionTitle}>Switch Household</Text>
            {households.map((household) => (
                <TouchableOpacity
                    key={household.id}
                    style={[
                        styles.menuItem,
                        currentHousehold.id === household.id && styles.highlightedMenuItem,
                    ]}
                    onPress={() => {
                        setCurrentHousehold(household); // Update current household with selected household object
                    }}
                >
                    <Text
                        style={[
                            styles.menuText,
                            currentHousehold.id === household.id && styles.highlightedMenuText,
                        ]}
                    >
                        {household.name}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
}

// Drawer Navigator
export default function App() {
    return (
        <AppProvider>
            <NavigationContainer>
                <Drawer.Navigator
                    id="MainDrawer"
                    drawerContent={({ navigation }) => (
                        <DrawerContent closeDrawer={() => navigation.closeDrawer()} />
                    )}
                    screenOptions={{
                        gestureEnabled: false, // Disable gesture to open drawer
                        headerShown: false, // Hide default headers for drawer screens
                    }}
                >
                    {/* Main tabs wrapped in the drawer */}
                    <Drawer.Screen name="Home" component={MainTabs} />
                </Drawer.Navigator>
            </NavigationContainer>
        </AppProvider>
    );
}
