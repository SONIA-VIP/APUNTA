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
        <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar notas..."
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
      <View style={{ flex: 1 }}>
        <Text style={styles.notaCategoria}>{item.categoria}</Text>
        <Text style={styles.notaContenido}>{item.contenido}</Text>
      </View>
      <View style={styles.iconosContainer}>
        <TouchableOpacity onPress={() => handleEditarNota(item)} style={styles.iconoEditar}>
          <Feather name="edit" size={20} color="black" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleEliminarNota(item.id)} style={styles.iconoEliminar}>
          <Feather name="trash-2" size={20} color="red" />
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
  onRequestClose={() => setModalVisible(false)} // Cerrar con botón atrás en Android
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
        >
          {categoriasDisponibles.map((cat) => (
            <Picker.Item key={cat} label={cat} value={cat} />
          ))}
        </Picker>
      </View>

      {/* Área de contenido */}
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="Escribe aquí tu nota..."
        value={contenido}
        onChangeText={setContenido}
        multiline
      />

      {/* Botones del modal */}
      <View style={styles.modalButtons}>
        <TouchableOpacity style={styles.botonCancelar} onPress={() => setModalVisible(false)}>
          <Text style={styles.botonTexto}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.botonGuardar} onPress={handleGuardarNota}>
          <Text style={styles.botonTexto}>Guardar</Text>
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
  Personal: '#00C2FF',  // Azul
  Trabajo: '#FFBB00',   // Amarillo
  Ideas: '#828c8a',     // Gris Medio
  Recordatorios: '#e4e4e4', // Extra Gris
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#313e3b', // Fondo oscuro
    padding: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter',
  },
  separator: {
    height: 1,
    backgroundColor: '#e4e4e4',
    marginVertical: 10,
  },
  notaCard: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  notaCategoria: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Quicksand',
    color: '#fff',
  },
  notaContenido: {
    fontSize: 14,
    fontFamily: 'Inter',
    color: '#fff',
  },
  pickerContainer: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#e4e4e4',
  },
  picker: {
    height: 50,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    width: '85%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Quicksand',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f8f8f8',
    fontFamily: 'Inter',
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 15,
  },
  botonCancelar: {
    backgroundColor: 'gray',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginRight: 5,
  },
  botonGuardar: {
    backgroundColor: '#FFBB00',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    alignItems: 'center',
    marginLeft: 5,
  },
  botonTexto: {
    color: 'white',
    fontWeight: 'bold',
  },
  botonAgregar: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#00C2FF',
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
});
