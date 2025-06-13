import { GoogleAIFileManager, FileState } from "@google/generative-ai/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import dotenv from "dotenv";

// Cargar variables de entorno desde el archivo .env
// Esto permite usar variables como API_KEY sin exponerlas en el código
dotenv.config();

// Obtener el directorio actual donde se ejecuta el script
// Necesario para trabajar con rutas de archivos de forma segura
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Función para obtener la API_KEY desde las variables de entorno
 * Las variables de entorno son una forma segura de almacenar información sensible
 * como claves de API sin incluirlas directamente en el código fuente
 *
 * @returns {string} La API_KEY de Google AI
 * @throws {Error} Si no se encuentra la API_KEY configurada
 */
function getApiKey() {
  // Buscar la API_KEY en las variables de entorno
  // process.env contiene todas las variables de entorno del sistema
  if (process.env.API_KEY) {
    return process.env.API_KEY;
  }

  // Si no se encuentra, lanzar un error explicativo
  throw new Error('No se encontró la API_KEY. Por favor, configúrela en el archivo .env como: API_KEY=tu_clave_aqui');
}

/**
 * Función auxiliar para determinar el tipo MIME de un archivo según su extensión
 * El tipo MIME le dice a Google AI qué tipo de archivo estamos subiendo
 *
 * @param {string} filePath - Ruta del archivo del cual determinar el tipo MIME
 * @returns {string} El tipo MIME correspondiente al archivo
 * @throws {Error} Si el tipo de archivo no está soportado
 */
function getMimeType(filePath) {
  // Extraer la extensión del archivo y convertirla a minúsculas
  // path.extname() devuelve la extensión con el punto incluido (ej: '.mp4')
  const ext = path.extname(filePath).toLowerCase();

  // Usar un switch para mapear extensiones a tipos MIME
  switch (ext) {
    // Formatos de audio soportados
    case '.mp3': return 'audio/mp3';
    case '.wav': return 'audio/wav';
    case '.aac': return 'audio/aac';
    case '.ogg': return 'audio/ogg';
    case '.flac': return 'audio/flac';

    // Formatos de video soportados
    case '.mp4': return 'video/mp4';
    case '.mpeg': return 'video/mpeg';
    case '.mov': return 'video/quicktime';
    case '.wmv': return 'video/x-ms-wmv';
    case '.avi': return 'video/x-msvideo';
    case '.mkv': return 'video/x-matroska';

    // Si la extensión no está soportada, lanzar un error
    default:
      throw new Error(`Tipo de archivo no soportado o desconocido: ${ext}. Por favor, proporcione un archivo de audio o video válido.`);
  }
}

/**
 * Función principal para transcribir archivos de audio/video usando Google AI
 * Esta función maneja todo el proceso: subida del archivo, procesamiento y generación de transcripción
 *
 * @param {string} filePathToTranscribe - Ruta del archivo de audio/video a transcribir
 * @param {string} promptPath - Ruta del archivo que contiene las instrucciones para la IA
 * @param {string} outputPath - Ruta donde guardar el resultado de la transcripción
 * @param {string} geminiModel - Modelo de Gemini a utilizar para la transcripción
 * @returns {Promise<string>} El texto de la transcripción generada
 */
async function transcribeAudio(filePathToTranscribe, promptPath, outputPath, geminiModel) {
  try {
    console.log('=== INICIANDO PROCESO DE TRANSCRIPCIÓN ===');

    // Paso 1: Obtener las credenciales de acceso a Google AI
    console.log('Obteniendo credenciales de Google AI...');
    const apiKey = getApiKey();

    // Paso 2: Crear el administrador de archivos de Google AI
    // Este objeto nos permite subir archivos a los servidores de Google
    console.log('Inicializando administrador de archivos...');
    const fileManager = new GoogleAIFileManager(apiKey);

    // Paso 3: Verificar que todos los archivos necesarios existen
    console.log('Verificando existencia de archivos...');

    if (!fs.existsSync(filePathToTranscribe)) {
      throw new Error(`El archivo a transcribir no existe en la ruta: ${filePathToTranscribe}`);
    }

    if (!fs.existsSync(promptPath)) {
      throw new Error(`El archivo de prompt no existe en la ruta: ${promptPath}`);
    }

    // Paso 4: Obtener información del archivo a transcribir
    const mimeType = getMimeType(filePathToTranscribe);
    const fileName = path.basename(filePathToTranscribe);

    console.log(`Archivo a procesar: '${fileName}' (${mimeType})`);
    console.log(`Modelo Gemini: ${geminiModel}`);
    console.log(`Archivo de salida: ${outputPath}`);

    // Paso 5: Subir el archivo de audio/video a Google AI
    console.log('Subiendo archivo a Google AI...');
    const uploadResult = await fileManager.uploadFile(
      filePathToTranscribe,
      {
        mimeType: mimeType,
        displayName: fileName,
      },
    );

    console.log('Archivo subido correctamente. Leyendo instrucciones...');

    // Paso 6: Leer el archivo de prompt que contiene las instrucciones para la IA
    // Este archivo le dice a la IA cómo debe procesar el audio/video
    let prompt = fs.readFileSync(promptPath, "utf-8");

    // Paso 7: Esperar a que Google AI procese el archivo subido
    console.log('Esperando procesamiento del archivo...');

    let file = await fileManager.getFile(uploadResult.file.name);

    // Mientras el archivo esté siendo procesado, mostrar puntos de progreso
    while (file.state === FileState.PROCESSING) {
      process.stdout.write(".");
      // Esperar 5 segundos antes de verificar nuevamente
      await new Promise((resolve) => setTimeout(resolve, 5000));
      // Volver a consultar el estado del archivo
      file = await fileManager.getFile(uploadResult.file.name);
    }

    console.log('\nArchivo procesado. Verificando estado...');

    // Verificar si el procesamiento falló
    if (file.state === FileState.FAILED) {
      throw new Error("El procesamiento del archivo falló en los servidores de Google AI.");
    }

    // Paso 8: Inicializar el modelo de inteligencia artificial
    console.log('Inicializando modelo de IA...');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: geminiModel, // Usar el modelo especificado por el usuario
      config: {
        // Configuración del modelo
        // max_output_tokens: 10000000, // Máximo número de tokens de salida
        temperature: 0.1 // Nivel de creatividad (0.1 = muy determinista, 1.0 = muy creativo)
      }
    });

    // Paso 9: Generar la transcripción usando el modelo de IA
    console.log('Generando transcripción...');

    const result = await model.generateContent([
      prompt, // Las instrucciones de cómo transcribir
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    // Paso 10: Procesar y guardar la respuesta
    console.log('Procesando respuesta...');

    // Obtener el texto completo de la respuesta
    let responseText = result.response.text();

    // Guardar la respuesta completa en un archivo temporal para debug
    const debugPath = path.join(__dirname, 'debug_response.txt');
    fs.writeFileSync(debugPath, responseText, 'utf-8');

    // Intentar extraer JSON si está presente en la respuesta
    // Buscar el primer '{' y el último '}' para extraer contenido JSON
    const firstBraceIndex = responseText.indexOf('{');
    const lastBraceIndex = responseText.lastIndexOf('}');

    if (firstBraceIndex !== -1 && lastBraceIndex !== -1) {
      // Si se encontraron llaves, extraer solo el contenido JSON
      responseText = responseText.slice(firstBraceIndex, lastBraceIndex + 1).trim();
    }

    // Paso 11: Guardar el resultado final en el archivo de salida especificado
    fs.writeFileSync(outputPath, responseText, 'utf-8');

    console.log(`\n=== TRANSCRIPCIÓN COMPLETADA ===`);
    console.log(`Resultado guardado en: ${outputPath}`);
    console.log(`Archivo de debug: ${debugPath}`);

    return responseText;

  } catch (error) {
    // Si ocurre algún error, mostrarlo claramente
    console.error('❌ Error durante la transcripción:', error.message);
    throw error;
  }
}

/**
 * Función principal que maneja los argumentos de línea de comandos y coordina la ejecución
 * Esta función usa yargs para procesar los argumentos y llamar a la función de transcripción
 */
async function main() {
  // Configurar yargs para manejar los argumentos de línea de comandos
  const argv = yargs(hideBin(process.argv))
    // Opción para especificar el archivo de media (obligatoria)
    .option('media', {
      alias: 'm',
      type: 'string',
      demandOption: true,
      describe: 'Ruta del archivo de audio o video a transcribir'
    })
    // Opción para especificar el archivo de prompt (obligatoria)
    .option('prompt', {
      alias: 'p',
      type: 'string',
      demandOption: true,
      describe: 'Ruta del archivo de prompt con las instrucciones para la IA'
    })
    // Opción para especificar el archivo de salida (opcional)
    .option('output', {
      alias: 'o',
      type: 'string',
      describe: 'Ruta del archivo donde guardar la transcripción',
      default: 'transcripcion_output.md' // Valor por defecto si no se especifica
    })
    // Opción para especificar el modelo de Gemini (opcional)
    .option('gemini', {
      alias: 'g',
      type: 'string',
      describe: 'Modelo de Gemini a utilizar',
      choices: [
        'gemini-2.5-flash-preview-04-17',
        'gemini-2.5-flash-preview-05-20',
        'gemini-1.5-pro',
        'gemini-1.5-flash'
      ],
      default: 'gemini-2.5-flash-preview-04-17' // Modelo por defecto
    })
    // Configurar la ayuda
    .help('help')
    .alias('help', 'h')
    .usage('Uso: $0 --media <archivo> --prompt <prompt> [--output <salida>] [--gemini <modelo>]')
    // Añadir ejemplos de uso
    .example('$0 -m video.mp4 -p prompt.md', 'Transcribir video.mp4 con configuración básica')
    .example('$0 -m audio.mp3 -p prompt.md -o mi_transcripcion.md', 'Especificar archivo de salida')
    .example('$0 -m video.mp4 -p prompt.md -g gemini-1.5-pro', 'Usar modelo Gemini específico')
    .example('$0 --media reunion.mp4 --prompt instrucciones.md --output transcripcion_reunion.md --gemini gemini-1.5-flash', 'Ejemplo completo con todas las opciones')
    .version(false) // No mostrar versión automática
    .strict() // Solo permitir opciones definidas
    .argv;

  // Extraer los valores de los argumentos
  const mediaPath = argv.media;
  const promptPath = argv.prompt;
  const outputPath = argv.output;
  const geminiModel = argv.gemini;

  console.log('🚀 TRANSCRIPTOR DE AUDIO/VIDEO CON GOOGLE AI');
  console.log('='.repeat(50));

  // Validación previa: verificar que los archivos de entrada existen
  console.log('Verificando archivos de entrada...');

  if (!fs.existsSync(mediaPath)) {
    console.error(`❌ Error: El archivo de medio no existe: ${mediaPath}`);
    console.error('💡 Verifique que la ruta sea correcta y que el archivo exista.');
    process.exit(1);
  }

  if (!fs.existsSync(promptPath)) {
    console.error(`❌ Error: El archivo de prompt no existe: ${promptPath}`);
    console.error('💡 Verifique que la ruta sea correcta y que el archivo exista.');
    process.exit(1);
  }

  // Crear el directorio de salida si no existe
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    console.log(`Creando directorio de salida: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }

  console.log('✅ Archivos verificados correctamente');
  console.log('');

  try {
    // Ejecutar la transcripción
    console.log(`📁 Archivo de entrada: ${mediaPath}`);
    console.log(`📋 Archivo de prompt: ${promptPath}`);
    console.log(`💾 Archivo de salida: ${outputPath}`);
    console.log(`🤖 Modelo: ${geminiModel}`);
    console.log('');

    await transcribeAudio(mediaPath, promptPath, outputPath, geminiModel);

    console.log('');
    console.log('🎉 ¡Proceso completado exitosamente!');
    console.log('💡 Puede revisar el archivo de salida para ver los resultados.');

  } catch (error) {
    // Manejo de errores con información útil para el usuario
    console.error('');
    console.error('❌ ERROR EN EL PROCESO DE TRANSCRIPCIÓN');
    console.error('='.repeat(50));

    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Mensaje: ${errorMessage}`);

    // Mostrar sugerencias según el tipo de error
    if (errorMessage.includes('API_KEY')) {
      console.error('');
      console.error('💡 SOLUCIÓN: Configure su API_KEY en el archivo .env');
      console.error('   1. Cree un archivo llamado .env en este directorio');
      console.error('   2. Añada la línea: API_KEY=su_clave_de_google_ai');
      console.error('   3. Obtenga su clave en: https://makersuite.google.com/app/apikey');
    } else if (errorMessage.includes('no existe')) {
      console.error('');
      console.error('💡 SOLUCIÓN: Verifique las rutas de los archivos');
      console.error('   - Use rutas absolutas o relativas correctas');
      console.error('   - Verifique que los archivos existan');
    }

    // Mostrar stack trace solo en modo debug
    if (process.env.DEBUG) {
      console.error('');
      console.error('Stack trace (modo debug):');
      console.error(error.stack);
    }

    process.exit(1);
  }
}

// Ejecutar la función principal
// Esta línea inicia todo el proceso cuando se ejecuta el script
main();
