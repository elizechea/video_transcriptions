import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función para obtener la API_KEY desde las variables de entorno
function getApiKey() {
  // Intentar leer desde las variables de entorno
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }
  throw new Error('No se encontró la API_KEY. Por favor, configúrela como variable de entorno o en el archivo secrets.env.secret');
}

// Helper function to determine MIME type from file extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.mp3': return 'audio/mp3';
    case '.wav': return 'audio/wav';
    case '.aac': return 'audio/aac';
    case '.ogg': return 'audio/ogg';
    case '.flac': return 'audio/flac';
    case '.mp4': return 'video/mp4';
    case '.mpeg': return 'video/mpeg';
    case '.mov': return 'video/quicktime';
    case '.wmv': return 'video/x-ms-wmv';
    case '.avi': return 'video/x-msvideo';
    case '.mkv': return 'video/x-matroska';
    default:
      throw new Error(`Tipo de archivo no soportado o desconocido: ${ext}. Por favor, proporcione un archivo de audio o video válido.`);
  }
}

// Función principal para transcribir el audio/video
async function transcribeAudio(filePathToTranscribe) {
  try {
    // Obtener la API_KEY
    const apiKey = getApiKey();

    // Inicializar el administrador de archivos de Google AI
    const fileManager = new GoogleAIFileManager(apiKey);

    // Ruta del archivo de prompt
    const promptPath = path.join(__dirname, 'prueba.md');

    // Verificar que el archivo a transcribir y el prompt existen
    if (!fs.existsSync(filePathToTranscribe)) {
      throw new Error(`El archivo a transcribir no existe en la ruta: ${filePathToTranscribe}`);
    }

    if (!fs.existsSync(promptPath)) {
      throw new Error(`El archivo de prompt no existe en la ruta: ${promptPath}`);
    }

    const mimeType = getMimeType(filePathToTranscribe);
    const fileName = path.basename(filePathToTranscribe);

    console.log(`Subiendo archivo '${fileName}' (${mimeType})...`);

    // Subir el archivo de audio/video
    const uploadResult = await fileManager.uploadFile(
      filePathToTranscribe,
      {
        mimeType: mimeType,
        displayName: fileName,
      },
    );

    console.log(`Archivo '${fileName}' subido correctamente. Leyendo prompt...`);

    // Leer el prompt
    let prompt = fs.readFileSync(promptPath, "utf-8");

    // Obtener la fecha actual en formato legible
    const currentDate = new Date();
    const stringDate = currentDate.toISOString().replace(/[:.]/g, '-').slice(0, 19);

    console.log('Esperando a que el archivo se procese...');

    // Obtener el estado del archivo subido
    let file = await fileManager.getFile(uploadResult.file.name);
    while (file.state === FileState.PROCESSING) {
      process.stdout.write(".");
      // Esperar 5 segundos
      await new Promise((resolve) => setTimeout(resolve, 5000));
      // Volver a obtener el archivo desde la API
      file = await fileManager.getFile(uploadResult.file.name);
    }

    console.log('\nArchivo procesado. Verificando estado...');

    // Verificar si el procesamiento del archivo falló
    if (file.state === FileState.FAILED) {
      throw new Error("El procesamiento del audio falló.");
    }

    console.log('Inicializando modelo de IA...');

    // Inicializar Google Generative AI
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash-preview-04-17",
      //  model: "gemini-2.5-flash-preview-05-20",
      config: {
        // max_output_tokens: 10000000,
        temperature: 0.1
      }
    });

    console.log('Generando transcripción...');

    // Generar contenido usando el modelo de AI
    const result = await model.generateContent([
      prompt,
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    console.log('Procesando respuesta...');

    fs.writeFileSync(path.join(__dirname, 'prueba.txt'), result.response.text(), 'utf-8');

    // Procesar la respuesta del modelo
    let responseText = result.response.text();
    const firstBraceIndex = responseText.indexOf('{');
    const lastBraceIndex = responseText.lastIndexOf('}');
    if (firstBraceIndex !== -1 && lastBraceIndex !== -1) {
      responseText = responseText.slice(firstBraceIndex, lastBraceIndex + 1).trim();
    }

    // Guardar la respuesta en un archivo
    const outputPath = path.join(__dirname, 'prueba_output.md');
    fs.writeFileSync(outputPath, responseText, 'utf-8');

    console.log(`\nTranscripción completada con éxito. Resultado guardado en: ${outputPath}`);
    return responseText;
  } catch (error) {
    console.error('Error durante la transcripción:', error);
    throw error;
  }
}

// Función principal para ejecutar el script
async function main() {
  const args = process.argv.slice(2); // Obtener argumentos de línea de comandos

  if (args.length === 0) {
    console.error('Error: Se requiere la ruta del archivo a transcribir como argumento.');
    console.error('Uso: node src/prueba.js <ruta_al_archivo_audio_o_video>');
    process.exit(1);
  }

  const filePath = args[0];

  // Validar que el archivo existe antes de pasarlo a la función de transcripción.
  // Aunque transcribeAudio también lo valida, es buena práctica hacerlo aquí también.
  if (!fs.existsSync(filePath)) {
    console.error(`Error: El archivo especificado no existe en la ruta: ${filePath}`);
    process.exit(1);
  }


  try {
    console.log(`Iniciando transcripción para el archivo: ${filePath}`);
    await transcribeAudio(filePath);
    console.log('Proceso de transcripción completado exitosamente.');
  } catch (error) {
    // Asegurarse de que el mensaje de error se muestra correctamente
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Error en el proceso principal de transcripción:', errorMessage);
    if (error.stack) {
      console.error(error.stack); // Para más detalles en depuración
    }
    process.exit(1);
  }
}

// Ejecutar la función principal
main();
