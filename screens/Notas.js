import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, Modal, StyleSheet } from 'react-native';
import { addNota, getNotas, deleteNota, updateNota } from '../lib/database';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';

export default function NotasScreen() {
  const [categoria, setCategoria] = useState('Personal');
  const [contenido, setContenido] = useState('');
  const [notas, setNotas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [notasFiltradas, setNotasFiltradas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  const categoriasDisponibles = ['Personal', 'Trabajo', 'Ideas', 'Recordatorios'];

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    const data = await getNotas();
    setNotas(data);
    setNotasFiltradas(data);
  };

  const handleGuardarNota = async () => {
    if (contenido.trim() === '') {
      Alert.alert('Error', 'El contenido no puede estar vacío.');
      return;
    }
  
    try {
      if (editando !== null) {
        await updateNota(editando, categoria, contenido);
        setEditando(null);
      } else {
        await addNota(categoria, contenido);
      }
  
      setContenido('');
      setCategoria('Personal');
      setModalVisible(false); // Cierra el modal después de guardar
  
      await cargarNotas(); // 🔹 Recargar la lista de notas
    } catch (error) {
      console.error('Error al guardar la nota:', error);
    }
  };
  
  const handleEliminarNota = async (id) => {
    Alert.alert('Eliminar Nota', '¿Seguro que quieres eliminar esta nota?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', onPress: async () => {
          await deleteNota(id);
          cargarNotas();
        } 
      }
    ]);
  };

  const handleEditarNota = (nota) => {
    setCategoria(nota.categoria);
    setContenido(nota.contenido);
    setEditando(nota.id);
    setModalVisible(true);
  };

  const abrirModalAgregar = () => {
    setCategoria('Personal');
    setContenido('');
    setEditando(null);
    setModalVisible(true);
  };

  const buscarNotas = (texto) => {
    setBusqueda(texto);
    if (texto === '') {
      setNotasFiltradas(notas);
    } else {
      setNotasFiltradas(notas.filter(nota => nota.categoria.toLowerCase().includes(texto.toLowerCase())));
    }
  };

  return (
    <View style={styles.container}>
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <Feather name="search" size={20} color="#6C63FF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar notas..."
          placeholderTextColor="#9E9E9E"
          value={busqueda}
          onChangeText={buscarNotas}
        />
      </View>

      {/* Separador */}
      <View style={styles.separator} />

      {/* Lista de notas con tarjetas estilizadas */}
      <FlatList
        data={notasFiltradas}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => (
          <View style={[styles.notaCard, { backgroundColor: categoryColors[item.categoria] || '#828c8a' }]}>
            <View style={styles.categoryIndicator} />
            <View style={styles.notaContent}>
              <Text style={styles.notaCategoria}>{item.categoria}</Text>
              <Text style={styles.notaContenido}>{item.contenido}</Text>
            </View>
            <View style={styles.iconosContainer}>
              <TouchableOpacity onPress={() => handleEditarNota(item)} style={styles.iconoEditar}>
                <Feather name="edit-2" size={18} color="#555" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleEliminarNota(item.id)} style={styles.iconoEliminar}>
                <Feather name="trash-2" size={18} color="#FF5252" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* Modal para agregar/editar notas */}
      <Modal 
        visible={modalVisible} 
        animationType="slide" 
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editando !== null ? "Editar Nota" : "Nueva Nota"}
            </Text>

            {/* Selector de categoría estilizado */}
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={categoria}
                onValueChange={(itemValue) => setCategoria(itemValue)}
                style={styles.picker}
                dropdownIconColor="#6C63FF"
              >
                {categoriasDisponibles.map((cat) => (
                  <Picker.Item key={cat} label={cat} value={cat} color="#333" />
                ))}
              </Picker>
            </View>

            {/* Área de contenido */}
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Escribe aquí tu nota..."
              placeholderTextColor="#9E9E9E"
              value={contenido}
              onChangeText={setContenido}
              multiline
            />

            {/* Botones del modal */}
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.botonCancelar} onPress={() => setModalVisible(false)}>
                <Text style={styles.botonTextoCancelar}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardarNota}>
                <Text style={styles.botonTextoGuardar}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Botón flotante para abrir el modal de agregar */}
      <TouchableOpacity style={styles.botonAgregar} onPress={abrirModalAgregar}>
        <Feather name="plus" size={30} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const categoryColors = {
  Personal: '#6C63FF',  // Púrpura violeta
  Trabajo: '#FF9D4D',   // Naranja melocotón
  Ideas: '#4ECDC4',     // Turquesa
  Recordatorios: '#FB6376', // Rosa coral
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA', // Fondo gris muy claro
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#333',
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E5EC',
    marginVertical: 15,
  },
  notaCard: {
    borderRadius: 16,
    marginBottom: 15,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  categoryIndicator: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  notaContent: {
    flex: 1,
    padding: 16,
  },
  notaCategoria: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'Quicksand',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 1,
  },
  notaContenido: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#fff',
    lineHeight: 20,
  },
  iconosContainer: {
    padding: 12,
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  iconoEditar: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  iconoEliminar: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E5EC',
    borderRadius: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 20,
    width: '90%',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 10 },
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Quicksand',
    color: '#333',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E0E5EC',
    borderRadius: 12,
    padding: 15,
    backgroundColor: '#fff',
    fontFamily: 'Inter',
    color: '#333',
    fontSize: 16,
  },
  inputMultiline: {
    height: 120,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 20,
  },
  botonCancelar: {
    backgroundColor: '#F5F7FA',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#E0E5EC',
  },
  botonGuardar: {
    backgroundColor: '#6C63FF',
    padding: 15,
    borderRadius: 12,
    flex: 1,
    alignItems: 'center',
    marginLeft: 10,
    elevation: 2,
    shadowColor: '#6C63FF',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  botonTextoCancelar: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  botonTextoGuardar: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  botonAgregar: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    backgroundColor: '#6C63FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6C63FF',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
});
