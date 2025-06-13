# 🎵 Transcriptor de Audio/Video con Google AI

Un potente transcriptor de archivos de audio y video que utiliza la inteligencia artificial de Google Gemini para generar transcripciones precisas y personalizables.

## 🚀 Características

- ✅ **Múltiples formatos soportados**: MP3, WAV, AAC, OGG, FLAC, MP4, MPEG, MOV, WMV, AVI, MKV
- 🤖 **Modelos Gemini avanzados**: Soporte para múltiples versiones de Gemini
- 📝 **Prompts personalizables**: Define cómo quieres que se procese tu audio/video
- 💾 **Archivos de salida configurables**: Especifica dónde guardar los resultados
- 🔒 **Configuración segura**: Variables de entorno para proteger tu API key
- 📊 **Interfaz clara**: Mensajes informativos y manejo de errores detallado
- 🛠️ **Fácil de usar**: Interfaz de línea de comandos intuitiva

## 📋 Requisitos Previos

- **Node.js** versión 18 o superior
- **API Key de Google AI Studio** ([Obtener aquí](https://makersuite.google.com/app/apikey))
- Archivos de audio o video a transcribir
- Archivo de prompt con instrucciones para la IA

## 🔧 Instalación

1. **Clona o descarga este repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd transcriptor-audio-video
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura tu API Key**
   - Copia el archivo `.env` y edítalo
   - Reemplaza `tu_clave_de_google_ai_aqui` con tu API key real
   ```bash
   # En el archivo .env
   API_KEY=tu_clave_real_de_google_ai
   ```

## 🎯 Uso Básico

### Comando Básico
```bash
node index.js --media archivo.mp4 --prompt instrucciones.md
```

### Opciones Disponibles

| Opción | Alias | Tipo | Obligatorio | Descripción |
|--------|-------|------|-------------|-------------|
| `--media` | `-m` | string | ✅ Sí | Ruta del archivo de audio/video a transcribir |
| `--prompt` | `-p` | string | ✅ Sí | Ruta del archivo de prompt con instrucciones |
| `--output` | `-o` | string | ❌ No | Archivo de salida (por defecto: `transcripcion_output.md`) |
| `--gemini` | `-g` | string | ❌ No | Modelo de Gemini a usar |
| `--help` | `-h` | - | ❌ No | Mostrar ayuda |

### Modelos Gemini Disponibles
- `gemini-2.5-flash-preview-04-17` (por defecto)
- `gemini-2.5-flash-preview-05-20`
- `gemini-1.5-pro`
- `gemini-1.5-flash`

## 📝 Ejemplos de Uso

### 1. Uso Básico
```bash
node index.js -m reunion.mp4 -p prompt_meeting.md
```

### 2. Especificar Archivo de Salida
```bash
node index.js -m conferencia.mp3 -p prompt_meeting.md -o transcripcion_conferencia.md
```

### 3. Usar Modelo Específico
```bash
node index.js -m entrevista.wav -p prompt_meeting.md -g gemini-1.5-pro
```

### 4. Ejemplo Completo
```bash
node index.js \
  --media "videos/reunion_importante.mp4" \
  --prompt "prompts/formato_reunion.md" \
  --output "resultados/reunion_transcrita.md" \
  --gemini "gemini-1.5-pro"
```

## 📄 Estructura de Archivos de Prompt

Los archivos de prompt deben contener instrucciones claras para la IA sobre cómo procesar el audio/video. Ejemplo:

```markdown
# Instrucciones de Transcripción

Transcribe el siguiente audio/video siguiendo estas pautas:

1. **Formato**: Crea una transcripción estructurada
2. **Speakers**: Identifica diferentes participantes como "Participante 1", "Participante 2", etc.
3. **Timestamps**: Incluye marcas de tiempo cada 30 segundos
4. **Resumen**: Al final, incluye un resumen de los puntos principales
5. **Formato de salida**: Usa formato Markdown

## Estructura esperada:
- Introducción
- Transcripción con timestamps
- Resumen ejecutivo
- Puntos de acción (si aplica)
```

## 🗂️ Estructura del Proyecto

```
transcriptor-audio-video/
├── index.js                 # Archivo principal del transcriptor
├── package.json             # Configuración de dependencias
├── .env                     # Variables de entorno (API keys)
├── .gitignore              # Archivos a ignorar en Git
├── README.md               # Este archivo
├── prompt_meeting.md       # Ejemplo de prompt para reuniones
├── transcripcion_output.md # Archivo de salida por defecto
└── debug_response.txt      # Archivo de debug (se genera automáticamente)
```

## ⚙️ Configuración Avanzada

### Variables de Entorno
Puedes configurar las siguientes variables en tu archivo `.env`:

```bash
# API Key de Google AI (obligatorio)
API_KEY=tu_clave_de_google_ai

# Habilitar modo debug (opcional)
DEBUG=true
```

### Modo Debug
Para habilitar información de debug detallada:
```bash
DEBUG=true node index.js -m archivo.mp4 -p prompt.md
```

## 🔍 Solución de Problemas

### ❌ Error: "No se encontró la API_KEY"
**Solución**:
1. Verifica que el archivo `.env` existe
2. Confirma que la línea `API_KEY=tu_clave` está correctamente configurada
3. Obtén una API key válida en [Google AI Studio](https://makersuite.google.com/app/apikey)

### ❌ Error: "El archivo no existe"
**Solución**:
1. Verifica que las rutas sean correctas
2. Usa rutas absolutas si tienes problemas con rutas relativas
3. Confirma que los archivos existen en las ubicaciones especificadas

### ❌ Error: "Tipo de archivo no soportado"
**Solución**:
1. Verifica que tu archivo sea de un formato soportado
2. Consulta la lista de formatos compatibles en la sección de características

### ❌ Error de red o API
**Solución**:
1. Verifica tu conexión a internet
2. Confirma que tu API key es válida y tiene créditos
3. Intenta con un archivo más pequeño para probar

## 📊 Archivos Generados

El transcriptor genera varios archivos durante la ejecución:

- **Archivo principal de salida**: Contiene la transcripción procesada (especificado con `--output`)
- **debug_response.txt**: Respuesta completa de la API para debugging
- **Archivos temporales**: Google AI puede crear archivos temporales durante el procesamiento

## 🤝 Contribuciones

¡Las contribuciones son bienvenidas! Para contribuir:

1. Fork del repositorio
2. Crea una rama para tu feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -am 'Añadir nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Crea un Pull Request

## 📜 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si encuentras problemas o tienes preguntas:

1. **Revisa este README** para soluciones comunes
2. **Consulta los logs** - el transcriptor proporciona información detallada de errores
3. **Usa el modo debug** - configura `DEBUG=true` para más información
4. **Verifica tu configuración** - confirma que tu API key y archivos están correctos

## 🔄 Changelog

### v2.0.0
- ✅ Añadida opción `--output` para especificar archivo de salida
- ✅ Añadida opción `--gemini` para seleccionar modelo
- ✅ Mejorado manejo de errores con sugerencias específicas
- ✅ Añadido soporte para archivos `.env`
- ✅ Documentación completa con JSDoc
- ✅ Interfaz de usuario mejorada con emojis y colores
- ✅ Validación mejorada de archivos y directorios

### v1.0.0
- ✅ Funcionalidad básica de transcripción
- ✅ Soporte para múltiples formatos de audio/video
- ✅ Integración con Google AI Gemini

---

**¿Te gusta este proyecto?** ⭐ ¡Dale una estrella en GitHub!
