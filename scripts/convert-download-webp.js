import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

// Obtener __dirname equivalente en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración
const PROJECT_ROOT = path.resolve(__dirname, '..');
const DOWNLOAD_DIR = path.resolve(PROJECT_ROOT, 'webp-downloads');
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.bmp'];

// Crear directorio de descargas si no existe
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
  console.log(`📁 Directorio de descargas creado en: ${DOWNLOAD_DIR}`);
}

// Función para verificar si un archivo es una imagen
function isImageFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return IMAGE_EXTENSIONS.includes(ext);
}

// Función para encontrar todas las imágenes recursivamente
function findAllImages(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('.git')) {
      findAllImages(filePath, fileList);
    } else if (stat.isFile() && isImageFile(filePath)) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

// Función para convertir una imagen a WebP
async function convertToWebP(imagePath) {
  try {
    // Obtener el nombre del archivo sin extensión
    const fileName = path.basename(imagePath, path.extname(imagePath));
    const webpPath = path.join(DOWNLOAD_DIR, `${fileName}.webp`);
    
    // Convertir la imagen a WebP con Sharp
    await sharp(imagePath)
      .webp({ quality: 80 }) // Puedes ajustar la calidad según necesites
      .toFile(webpPath);
    
    console.log(`✅ Convertido: ${path.basename(imagePath)} → ${fileName}.webp`);
    return webpPath;
  } catch (error) {
    console.error(`❌ Error al convertir ${imagePath}:`, error.message);
    return null;
  }
}

// Función principal
async function main() {
  console.log('🔍 Buscando todas las imágenes en el proyecto...');
  
  // Encontrar todas las imágenes en el proyecto
  const images = findAllImages(PROJECT_ROOT);
  console.log(`🖼️ Se encontraron ${images.length} imágenes.`);
  
  // Convertir todas las imágenes a WebP
  console.log('🔄 Iniciando conversión a WebP...');
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const image of images) {
    const result = await convertToWebP(image);
    if (result) {
      successCount++;
    } else {
      errorCount++;
    }
  }
  
  console.log('\n📊 Resumen:');
  console.log(`✅ ${successCount} imágenes convertidas exitosamente`);
  console.log(`❌ ${errorCount} imágenes con errores`);
  console.log(`📁 Todas las imágenes WebP se han guardado en: ${DOWNLOAD_DIR}`);
}

// Ejecutar el script
main().catch(error => {
  console.error('Error en el script principal:', error);
});
