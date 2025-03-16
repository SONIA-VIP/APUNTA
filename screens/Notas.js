import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { addNota, getNotas, deleteNota, updateNota } from '../lib/database';
import { Picker } from '@react-native-picker/picker';
import { Feather } from '@expo/vector-icons';
import { generarTexto, resumirNota, sugerirCategoria, buscarNotasIA } from '../lib/ai';


// 🔹 Función para generar contenido con IA
const handleGenerarTextoIA = async () => {
  const textoGenerado = await generarTexto('Escribe una nota sobre esta categoría: ' + categoria);
  setContenido(textoGenerado);
};

// 🔹 Función para sugerir una categoría automáticamente
const handleSugerirCategoriaIA = async () => {
  const categoriaSugerida = await sugerirCategoria(contenido);
  setCategoria(categoriaSugerida);
};

export default function NotasScreen() {
  const [categoria, setCategoria] = useState('Personal');
  const [contenido, setContenido] = useState('');
  const [notas, setNotas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [notasFiltradas, setNotasFiltradas] = useState([]);
  const [editando, setEditando] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  
  // Estados para los modales personalizados
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertActions, setAlertActions] = useState([]);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmTitle, setConfirmTitle] = useState('');
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmCallback, setConfirmCallback] = useState(null);

  const categoriasDisponibles = ['Personal', 'Trabajo', 'Ideas', 'Recordatorios'];

  useEffect(() => {
    cargarNotas();
  }, []);

  const cargarNotas = async () => {
    const data = await getNotas();
    setNotas(data);
    setNotasFiltradas(data);
  };

  // Función personalizada para mostrar alertas
  const mostrarAlerta = (titulo, mensaje, acciones = []) => {
    setAlertTitle(titulo);
    setAlertMessage(mensaje);
    setAlertActions(acciones.length > 0 ? acciones : [{ text: 'OK', onPress: () => setAlertModalVisible(false) }]);
    setAlertModalVisible(true);
  };

  // Función personalizada para mostrar diálogos de confirmación
  const mostrarConfirmacion = (titulo, mensaje, callback) => {
    setConfirmTitle(titulo);
    setConfirmMessage(mensaje);
    setConfirmCallback(() => callback);
    setConfirmModalVisible(true);
  };

  const handleGuardarNota = async () => {
    if (contenido.trim() === '') {
      mostrarAlerta('Error', 'El contenido no puede estar vacío.');
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
      mostrarAlerta('Error', 'No se pudo guardar la nota.');
    }
  };
  
  const handleEliminarNota = async (id) => {
    mostrarConfirmacion(
      'Eliminar Nota', 
      '¿Seguro que quieres eliminar esta nota?',
      async () => {
        await deleteNota(id);
        cargarNotas();
        setConfirmModalVisible(false);
      }
    );
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

  const handleBuscarConIA = async () => {
    if (!busqueda.trim()) {
      mostrarAlerta('Error', 'Escribe algo para buscar.');
      return;
    }
  
    const resultadoIA = await buscarNotasIA(busqueda, notas);
    
    if (resultadoIA === "No se encontraron notas relacionadas.") {
      mostrarAlerta('🔎 Búsqueda Inteligente', resultadoIA);
      return;
    }
  
    // 🔹 Mostrar las notas encontradas en la lista
    setNotasFiltradas(notas.filter(nota => resultadoIA.includes(nota.contenido)));
  };

  let puedeResumir = true; // Variable para controlar el tiempo entre solicitudes

  const handleResumirNota = async (nota) => {
    if (!puedeResumir) {
      mostrarAlerta("⏳ Espera un momento", "No puedes hacer otra petición tan rápido.");
      return;
    }

    puedeResumir = false; // Bloquea nuevas solicitudes
    setTimeout(() => (puedeResumir = true), 5000); // 🔹 Espera 5 segundos antes de permitir otra solicitud

    const resumen = await resumirNota(nota.contenido);
    mostrarAlerta("📝 Resumen de la Nota", resumen);
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
        <TouchableOpacity style={styles.botonIA} onPress={handleBuscarConIA}>
          <Text style={styles.botonTexto}>🔎 Búsqueda Inteligente</Text>
        </TouchableOpacity>
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
              <TouchableOpacity onPress={() => handleResumirNota(item)} style={styles.iconoResumir}>
                <Feather name="file-text" size={18} color="#ffc800" />
              </TouchableOpacity>
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
          <TouchableOpacity style={styles.botonIA} onPress={handleGenerarTextoIA}>
            <Text style={styles.botonTexto}>✨ Sugerir Contenido</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.botonIA} onPress={handleSugerirCategoriaIA}>
            <Text style={styles.botonTexto}>🤖 Sugerir Categoría</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Modal personalizado para alertas (sustituto de Alert) */}
      <Modal
        visible={alertModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setAlertModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            <Text style={styles.alertTitle}>{alertTitle}</Text>
            <Text style={styles.alertMessage}>{alertMessage}</Text>
            <View style={styles.alertButtonsContainer}>
              {alertActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.alertButton,
                    action.style === 'cancel' ? styles.alertCancelButton : {}
                  ]}
                  onPress={() => {
                    setAlertModalVisible(false);
                    if (action.onPress) action.onPress();
                  }}
                >
                  <Text style={[
                    styles.alertButtonText,
                    action.style === 'cancel' ? styles.alertCancelButtonText : {}
                  ]}>
                    {action.text}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal personalizado para confirmaciones (sustituto de Alert de confirmación) */}
      <Modal
        visible={confirmModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setConfirmModalVisible(false)}
      >
        <View style={styles.alertModalOverlay}>
          <View style={styles.alertModalContent}>
            <Text style={styles.alertTitle}>{confirmTitle}</Text>
            <Text style={styles.alertMessage}>{confirmMessage}</Text>
            <View style={styles.alertButtonsContainer}>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertCancelButton]}
                onPress={() => setConfirmModalVisible(false)}
              >
                <Text style={styles.alertCancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.alertButton, styles.alertConfirmButton]}
                onPress={confirmCallback}
              >
                <Text style={styles.alertConfirmButtonText}>Eliminar</Text>
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
    backgroundColor: '#F8F9FA',
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 10,
  },
  botonIA: {
    backgroundColor: '#E7E8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
    marginVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonTexto: {
    color: '#6C63FF',
    fontWeight: '600',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#E1E4E8',
    width: '100%',
    marginVertical: 10,
  },
  notaCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 3,
    elevation: 3,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  categoryIndicator: {
    width: 6,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  notaContent: {
    flex: 1,
    padding: 16,
  },
  notaCategoria: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  notaContenido: {
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  iconosContainer: {
    padding: 12,
    flexDirection: 'column',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  iconoResumir: {
    padding: 6,
  },
  iconoEditar: {
    padding: 6,
  },
  iconoEliminar: {
    padding: 6,
  },
  botonAgregar: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 18,
    textAlign: 'center',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    backgroundColor: '#F8F9FA',
  },
  picker: {
    height: 50,
    width: '100%',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E1E4E8',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F8F9FA',
  },
  inputMultiline: {
    height: 150,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  botonCancelar: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#F1F2F6',
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  botonTextoCancelar: {
    color: '#6C6C6C',
    fontWeight: '600',
    fontSize: 16,
  },
  botonGuardar: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  botonTextoGuardar: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  alertModalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#555',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  alertButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  alertButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: '#6C63FF',
    marginHorizontal: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  alertButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  alertCancelButton: {
    backgroundColor: '#F1F2F6',
  },
  alertCancelButtonText: {
    color: '#6C6C6C',
  },
  alertConfirmButton: {
    backgroundColor: '#FF5252',
  },
  alertConfirmButtonText: {
    color: '#FFFFFF',
  },
});
