import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as SQLite from 'expo-sqlite';


let SQLite;
if (Platform.OS !== 'web') {
  SQLite = require('expo-sqlite'); // 🔹 Cargar SQLite dinámicamente solo en móvil
}

// 🔹 Abrir la base de datos según la plataforma
export async function openDB() {
  if (Platform.OS === 'web') {
    console.log('📌 Modo Web: Usando AsyncStorage en lugar de SQLite');
    return null; // SQLite no funciona en la web
  }
  return await SQLite.openDatabaseAsync('notas.db');
}

// 🔹 Agregar una nota con categoría
export async function addNota(categoria, contenido) {
  if (Platform.OS === 'web') {
    const notas = JSON.parse(await AsyncStorage.getItem('notas')) || [];
    notas.push({ id: Date.now(), categoria, contenido });
    await AsyncStorage.setItem('notas', JSON.stringify(notas));
    return;
  }
  const db = await openDB();
  await db.runAsync('INSERT INTO notas (categoria, contenido) VALUES (?, ?)', categoria, contenido);
}

// 🔹 Obtener todas las notas
export async function getNotas() {
  if (Platform.OS === 'web') {
    return JSON.parse(await AsyncStorage.getItem('notas')) || [];
  }
  const db = await openDB();
  return await db.getAllAsync('SELECT * FROM notas');
}

// 🔹 Eliminar una nota
export async function deleteNota(id) {
  if (Platform.OS === 'web') {
    const notas = JSON.parse(await AsyncStorage.getItem('notas')) || [];
    const nuevasNotas = notas.filter(nota => nota.id !== id);
    await AsyncStorage.setItem('notas', JSON.stringify(nuevasNotas));
    return;
  }
  const db = await openDB();
  await db.runAsync('DELETE FROM notas WHERE id = ?', id);
}

// 🔹 Actualizar una nota con categoría
export async function updateNota(id, categoria, contenido) {
  if (Platform.OS === 'web') {
    const notas = JSON.parse(await AsyncStorage.getItem('notas')) || [];
    const index = notas.findIndex(nota => nota.id === id);
    if (index !== -1) {
      notas[index] = { id, categoria, contenido };
      await AsyncStorage.setItem('notas', JSON.stringify(notas));
    }
    return;
  }
  const db = await openDB();
  await db.runAsync('UPDATE notas SET categoria = ?, contenido = ? WHERE id = ?', categoria, contenido, id);
}
