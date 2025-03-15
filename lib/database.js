import * as SQLite from 'expo-sqlite';

// 🔹 Abre la base de datos y asegura que la tabla tiene la columna "categoria"
export async function openDB() {
  const db = await SQLite.openDatabaseAsync('notas.db');
   
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS notas (
      id INTEGER PRIMARY KEY AUTOINCREMENT, 
      categoria TEXT NOT NULL, 
      contenido TEXT NOT NULL
    );
  `);
  return db;
}

// 🔹 Agregar una nota con categoría
export async function addNota(categoria, contenido) {
  const db = await openDB();
  await db.runAsync('INSERT INTO notas (categoria, contenido) VALUES (?, ?)', categoria, contenido);
}

// 🔹 Obtener todas las notas
export async function getNotas() {
  const db = await openDB();
  return await db.getAllAsync('SELECT * FROM notas');
}

// 🔹 Eliminar una nota
export async function deleteNota(id) {
  const db = await openDB();
  await db.runAsync('DELETE FROM notas WHERE id = ?', id);
}

// 🔹 Actualizar una nota con categoría
export async function updateNota(id, categoria, contenido) {
  const db = await openDB();
  await db.runAsync('UPDATE notas SET categoria = ?, contenido = ? WHERE id = ?', categoria, contenido, id);
}
