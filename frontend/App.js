// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ChoresScreen from './screens/ChoresScreen';
import ShoppingListScreen from './screens/ShoppingListScreen';
import DebtScreen from './screens/DebtScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Chores">
          <Stack.Screen name="Chores" component={ChoresScreen} />
          <Stack.Screen name="ShoppingList" component={ShoppingListScreen} />
          <Stack.Screen name="Debt" component={DebtScreen} />
        </Stack.Navigator>
      </NavigationContainer>
  );
}
