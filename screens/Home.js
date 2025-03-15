import React from 'react';
import { View, Text, Button } from 'react-native';

export default function HomeScreen({ navigation }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 24 }}>Bienvenido a MiNotasApp</Text>
      <Button title="Ir a Notas" onPress={() => navigation.navigate('Notas')} />
    </View>
  );
}
