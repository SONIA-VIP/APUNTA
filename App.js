import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './screens/Home';
import NotasScreen from './screens/Notas';
import './lib/ai.js';


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
        <Stack.Screen name="Notas" component={NotasScreen} options={{ title: 'Mis Notas' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
