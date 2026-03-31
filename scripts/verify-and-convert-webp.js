const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const fetch = require('node-fetch');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);

// Configuración
const BASE_URL = 'https://regalaalgosrl.com/imagenes/'; // URL base donde están las imágenes originales
const OUTPUT_DIR = './imagenes_webp'; // Directorio donde se guardarán las imágenes convertidas
const ERROR_LOG = 'error_log.txt';
const SUCCESS_LOG = 'success_log.txt';

// Asegurar que el directorio de salida exista
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Inicializar archivos de log
fs.writeFileSync(ERROR_LOG, 'Errores de conversión:\n', 'utf8');
fs.writeFileSync(SUCCESS_LOG, 'Conversiones exitosas:\n', 'utf8');

/**
 * Verifica si una URL es accesible
 * @param {string} url - URL a verificar
 * @returns {Promise<boolean>} - true si la URL es accesible, false si no
 */
async function checkUrlExists(url) {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    return false;
  }
}

/**
 * Descarga una imagen desde una URL
 * @param {string} url - URL de la imagen a descargar
 * @param {string} outputPath - Ruta donde guardar la imagen
 * @returns {Promise<boolean>} - true si la descarga fue exitosa, false si no
 */
async function downloadImage(url, outputPath) {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Error al descargar: ${response.statusText}`);
    }
    
    await streamPipeline(response.body, fs.createWriteStream(outputPath));
    return true;
  } catch (error) {
    console.error(`Error descargando ${url}:`, error.message);
    return false;
  }
}

/**
 * Convierte una imagen a formato WebP
 * @param {string} inputPath - Ruta de la imagen original
 * @param {string} outputPath - Ruta donde guardar la imagen convertida
 * @returns {Promise<boolean>} - true si la conversión fue exitosa, false si no
 */
async function convertToWebP(inputPath, outputPath) {
  try {
    await sharp(inputPath)
      .webp({ quality: 80 }) // Ajusta la calidad según necesites
      .toFile(outputPath);
    
    // Eliminar el archivo temporal si existe
    if (fs.existsSync(inputPath) && inputPath !== outputPath) {
      fs.unlinkSync(inputPath);
    }
    
    return true;
  } catch (error) {
    console.error(`Error convirtiendo ${inputPath}:`, error.message);
    return false;
  }
}

/**
 * Procesa una lista de URLs de imágenes
 * @param {string[]} urls - Lista de URLs a procesar
 */
async function processImageUrls(urls) {
  console.log(`Procesando ${urls.length} imágenes...`);
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const filename = path.basename(new URL(url).pathname);
    const fileWithoutExt = path.parse(filename).name;
    const webpFilename = `${fileWithoutExt}.webp`;
    
    const tempPath = path.join(OUTPUT_DIR, filename);
    const webpPath = path.join(OUTPUT_DIR, webpFilename);
    
    console.log(`[${i+1}/${urls.length}] Procesando: ${filename}`);
    
    // Verificar si la URL original existe
    const exists = await checkUrlExists(url);
    if (!exists) {
      console.error(`  ❌ URL no encontrada: ${url}`);
      fs.appendFileSync(ERROR_LOG, `URL no encontrada: ${url}\n`, 'utf8');
      errorCount++;
      continue;
    }
    
    // Descargar la imagen
    console.log(`  📥 Descargando...`);
    const downloaded = await downloadImage(url, tempPath);
    if (!downloaded) {
      console.error(`  ❌ Error al descargar: ${url}`);
      fs.appendFileSync(ERROR_LOG, `Error al descargar: ${url}\n`, 'utf8');
      errorCount++;
      continue;
    }
    
    // Convertir a WebP
    console.log(`  🔄 Convirtiendo a WebP...`);
    const converted = await convertToWebP(tempPath, webpPath);
    if (!converted) {
      console.error(`  ❌ Error al convertir: ${tempPath}`);
      fs.appendFileSync(ERROR_LOG, `Error al convertir: ${url}\n`, 'utf8');
      errorCount++;
      continue;
    }
    
    console.log(`  ✅ Conversión exitosa: ${webpFilename}`);
    fs.appendFileSync(SUCCESS_LOG, `${url} -> ${webpFilename}\n`, 'utf8');
    successCount++;
  }
  
  console.log('\n===== RESUMEN =====');
  console.log(`Total procesadas: ${urls.length}`);
  console.log(`Conversiones exitosas: ${successCount}`);
  console.log(`Errores: ${errorCount}`);
  console.log('===================\n');
}

/**
 * Función principal
 */
async function main() {
  // Verificar si se proporcionó una lista de URLs
  const args = process.argv.slice(2);
  const urlListFile = args[0];
  
  if (!urlListFile) {
    console.error('Debes proporcionar un archivo con la lista de URLs.');
    console.error('Uso: node verify-and-convert-webp.js urls.txt');
    process.exit(1);
  }
  
  // Leer el archivo con las URLs
  try {
    const fileContent = fs.readFileSync(urlListFile, 'utf8');
    const urls = fileContent
      .split('\n')
      .map(line => line.trim())
      .filter(line => line && line.startsWith('http'));
    
    if (urls.length === 0) {
      console.error('No se encontraron URLs válidas en el archivo.');
      process.exit(1);
    }
    
    console.log(`Se encontraron ${urls.length} URLs en ${urlListFile}`);
    await processImageUrls(urls);
    
  } catch (error) {
    console.error(`Error leyendo el archivo de URLs:`, error.message);
    process.exit(1);
  }
}

// Iniciar el script
main().catch(error => {
  console.error('Error general:', error);
  process.exit(1);
});
