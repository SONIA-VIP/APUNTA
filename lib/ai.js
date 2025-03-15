import axios from 'axios';

// 🔹 API Key de Google Gemini AI (cámbiala por tu propia clave)
const API_KEY = 'AIzaSyDS5eCNEZAKULPdEBRr1fv1WH5_6vZ9jHE'; 

// 🔹 Función para generar texto con IA
export async function generarTexto(prompt) {
  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`,
      {
        prompt: { text: prompt },
        maxOutputTokens: 200, // Número máximo de palabras en la respuesta
      }
    );

    return response.data.candidates[0].output;
  } catch (error) {
    console.error('❌ Error al generar texto con IA:', error);
    return 'Error al generar texto.';
  }
}

// 🔹 Función para resumir una nota con IA
export async function resumirNota(contenido) {
  const prompt = `Resume esta nota en una versión más corta:\n\n"${contenido}"`;
  return await generarTexto(prompt);
}

// 🔹 Función para sugerir una categoría basada en el contenido de la nota
export async function sugerirCategoria(contenido) {
  const prompt = `A qué categoría pertenece esta nota? Opciones: Personal, Trabajo, Ideas, Recordatorios. Solo responde con la categoría:\n\n"${contenido}"`;
  return await generarTexto(prompt);
}

// 🔹 Función para buscar notas con lenguaje natural
export async function buscarNotasIA(consulta, notas) {
    if (notas.length === 0) return 'No hay notas guardadas.';
  
   
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;
  
    try {
      const prompt = `Tengo las siguientes notas:\n${notas
        .map((n) => `- ${n.categoria}: ${n.contenido}`)
        .join('\n')}\n\nEncuentra las notas más relacionadas con:\n"${consulta}"`;
  
      const response = await axios.post(
        API_URL,
        {
          contents: [{ role: "user", parts: [{ text: prompt }] }] // 📌 Formato correcto para Gemini AI
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
  
      return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No se encontraron notas relacionadas.";
    } catch (error) {
      console.error('❌ Error en la búsqueda con IA:', error.response?.data || error.message);
      return "Error al buscar notas.";
    }
  }
  
  
