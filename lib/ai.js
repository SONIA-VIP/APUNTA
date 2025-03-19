import axios from 'axios';

const API_KEY = process.env.GOOGLE_API_KEY || "CLAVE_DE_PRUEBA";

const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${API_KEY}`;
  

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

  try {
    const prompt = `Por favor, resume la siguiente nota de manera clara y concisa:\n\n"${contenido}"`;

    const response = await axios.post(
      API_URL,
      {
        contents: [{ role: "user", parts: [{ text: prompt }] }]
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    return response.data.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el resumen.";
  } catch (error) {
    console.error('❌ Error al resumir la nota:', error.response?.data || error.message);

    if (error.response?.status === 429) {
      return "⏳ Has superado el límite de peticiones. Intenta de nuevo más tarde.";
    }

    return "Error al resumir la nota.";
  }
}

// 🔹 Función para sugerir una categoría basada en el contenido de la nota
export async function sugerirCategoria(contenido) {
  const prompt = `A qué categoría pertenece esta nota? Opciones: Personal, Trabajo, Ideas, Recordatorios. Solo responde con la categoría:\n\n"${contenido}"`;
  return await generarTexto(prompt);
}

// 🔹 Función para buscar notas con lenguaje natural
export async function buscarNotasIA(consulta, notas) {
    if (notas.length === 0) return 'No hay notas guardadas.';
  
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
  
  
