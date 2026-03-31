import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

// Obtener __dirname equivalente en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de rutas
const OLD_PATH = '/imagenes/';
const NEW_PATH = '/imagenes_convertidas/';
const BASE_URL = 'https://regalaalgosrl.com';
const LOG_FILE = path.join(__dirname, `webp-check-log-${Date.now()}.txt`);
const URL_LIST_FILE = path.join(__dirname, 'imagen-urls.txt');

// Crear archivo de log
fs.writeFileSync(LOG_FILE, `=== Verificación de imágenes WebP ${new Date().toISOString()} ===\n`);

// Lista para almacenar las URLs
const imageUrls = [];

// Función para verificar si una URL existe (la imagen existe en el servidor)
async function urlExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Error al verificar la URL ${url}:`, error.message);
    fs.appendFileSync(LOG_FILE, `Error al verificar URL ${url}: ${error.message}\n`);
    return false;
  }
}

// Función para convertir URL de imagen a WebP
async function checkWebpAvailability(originalUrl) {
  // Si la URL no contiene el path antiguo, no hacemos nada
  if (!originalUrl || typeof originalUrl !== 'string' || !originalUrl.includes(OLD_PATH)) {
    return { originalUrl, newUrl: originalUrl, exists: false };
  }

  try {
    // Extraer el nombre del archivo
    const parts = originalUrl.split('/');
    const fileName = parts[parts.length - 1].split('?')[0];
    
    // Obtener el nombre base sin extensión
    const baseName = fileName.split('.')[0];
    
    // Construir la nueva URL
    const newUrl = `${BASE_URL}${NEW_PATH}${baseName}.webp`;
    
    // Verificar si la nueva imagen existe
    const exists = await urlExists(newUrl);
    
    return { originalUrl, newUrl, exists };
  } catch (error) {
    console.error('Error al convertir URL:', error);
    fs.appendFileSync(LOG_FILE, `Error al verificar URL ${originalUrl}: ${error.message}\n`);
    return { originalUrl, newUrl: originalUrl, exists: false };
  }
}

// Procesar un archivo de lista de URLs
async function processUrlFile(filePath) {
  try {
    // Verificar si existe el archivo
    if (!fs.existsSync(filePath)) {
      console.log(`El archivo ${filePath} no existe. Por favor, crea un archivo con la lista de URLs a verificar.`);
      return;
    }

    // Leer el archivo
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const urls = fileContent.split('\n')
      .map(url => url.trim())
      .filter(url => url && url.includes('/imagenes/'));
    
    console.log(`Se encontraron ${urls.length} URLs a verificar.`);
    
    let existsCount = 0;
    let notExistsCount = 0;
    let errorCount = 0;
    
    // Procesar cada URL
    console.log('Verificando disponibilidad de imágenes WebP...');
    for (let i = 0; i < urls.length; i++) {
      process.stdout.write(`\rProcesando: ${i + 1}/${urls.length} URLs`);
      
      const url = urls[i];
      const result = await checkWebpAvailability(url);
      
      if (result.exists) {
        fs.appendFileSync(LOG_FILE, `✅ ${url} -> ${result.newUrl}\n`);
        existsCount++;
      } else {
        fs.appendFileSync(LOG_FILE, `❌ ${url} -> WebP no disponible\n`);
        notExistsCount++;
      }
    }
    
    console.log('\n\n===== REPORTE FINAL =====');
    console.log(`Total de URLs verificadas: ${urls.length}`);
    console.log(`✅ URLs con versión WebP disponible: ${existsCount}`);
    console.log(`❌ URLs sin versión WebP disponible: ${notExistsCount}`);
    console.log(`Log completo guardado en: ${LOG_FILE}`);
    
    // Crear archivo con las URLs disponibles
    const availableFile = path.join(__dirname, `webp-disponibles-${Date.now()}.txt`);
    const notAvailableFile = path.join(__dirname, `webp-no-disponibles-${Date.now()}.txt`);
    
    // Volver a procesar para guardar las listas
    console.log('\nGenerando archivos de resultados...');
    const availableUrls = [];
    const notAvailableUrls = [];
    
    for (const url of urls) {
      const result = await checkWebpAvailability(url);
      if (result.exists) {
        availableUrls.push(`${url}|${result.newUrl}`);
      } else {
        notAvailableUrls.push(url);
      }
    }
    
    fs.writeFileSync(availableFile, availableUrls.join('\n'));
    fs.writeFileSync(notAvailableFile, notAvailableUrls.join('\n'));
    
    console.log(`Archivo con URLs disponibles: ${availableFile}`);
    console.log(`Archivo con URLs no disponibles: ${notAvailableFile}`);
    
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    fs.appendFileSync(LOG_FILE, `Error al procesar el archivo: ${error.message}\n`);
  }
}

// Función principal
async function main() {
  console.log('Iniciando verificación de URLs de imágenes...');
  console.log(`Las URLs a verificar deben estar en: ${URL_LIST_FILE}`);
  console.log(`Si el archivo no existe, créalo con una URL por línea.`);
  
  // Verificar si existe el archivo
  if (!fs.existsSync(URL_LIST_FILE)) {
    fs.writeFileSync(URL_LIST_FILE, 'https://regalaalgosrl.com/imagenes/ejemplo.jpg\n');
    console.log(`Se ha creado un archivo de ejemplo en ${URL_LIST_FILE}`);
    console.log('Por favor, edita este archivo y agrega todas las URLs que quieres verificar.');
    return;
  }
  
  // Procesar el archivo
  await processUrlFile(URL_LIST_FILE);
}

// Ejecutar el script
main().catch(error => {
  console.error('Error en el script principal:', error);
  fs.appendFileSync(LOG_FILE, `Error en el script principal: ${error.message}\n`);
});
