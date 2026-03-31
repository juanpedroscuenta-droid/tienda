// convert-to-webp.js
// Script para descargar imágenes, convertirlas a WebP y subirlas a un servidor

const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');
const admin = require('firebase-admin');
const sharp = require('sharp'); // Necesitarás instalar: npm install sharp
const { createFolderIfNotExists } = require('./helpers');
const FtpClient = require('ftp'); // Para subir por FTP, instala: npm install ftp

// Necesitarás crear un archivo serviceAccountKey.json desde Firebase Console
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Configuración
const TEMP_FOLDER = './temp_images';
const WEBP_FOLDER = './webp_images';
const WEBP_QUALITY = 80; // Calidad de WebP (0-100)
const NEW_BASE_URL = 'https://regalaalgosrl.com/imagenes/webp/';

// Configuración de FTP (reemplaza con tus datos)
const FTP_CONFIG = {
  host: 'regalaalgosrl.com',
  user: 'tu-usuario',
  password: 'tu-contraseña',
  secure: true // Usa FTPS
};

// Crear carpetas necesarias
createFolderIfNotExists(TEMP_FOLDER);
createFolderIfNotExists(WEBP_FOLDER);
createFolderIfNotExists(path.join(WEBP_FOLDER, 'products'));
createFolderIfNotExists(path.join(WEBP_FOLDER, 'categories'));
createFolderIfNotExists(path.join(WEBP_FOLDER, 'testimonials'));

// Función para descargar una imagen
async function downloadImage(url, destinationPath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Error al descargar ${url}: ${response.status} ${response.statusText}`);
    }
    
    const buffer = await response.buffer();
    fs.writeFileSync(destinationPath, buffer);
    return true;
  } catch (error) {
    console.error(`Error descargando ${url}:`, error);
    return false;
  }
}

// Función para convertir una imagen a WebP
async function convertToWebP(inputPath, outputPath, quality = WEBP_QUALITY) {
  try {
    await sharp(inputPath)
      .webp({ quality: quality })
      .toFile(outputPath);
    return true;
  } catch (error) {
    console.error(`Error convirtiendo ${inputPath} a WebP:`, error);
    return false;
  }
}

// Función para extraer el nombre del archivo de una URL
function getFilenameFromUrl(url) {
  if (!url) return null;
  
  try {
    // Extraer el nombre del archivo al final de la ruta
    const parts = url.split('/');
    const filename = parts[parts.length - 1].split('?')[0];
    return filename;
  } catch (error) {
    console.error(`Error obteniendo nombre de archivo para ${url}:`, error);
    return `image-${Date.now()}.jpg`;
  }
}

// Función para subir archivo por FTP
function uploadFileToFtp(localFilePath, remoteFilePath) {
  return new Promise((resolve, reject) => {
    const client = new FtpClient();
    
    client.on('ready', () => {
      client.put(localFilePath, remoteFilePath, (err) => {
        client.end();
        
        if (err) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
    
    client.on('error', (err) => {
      reject(err);
    });
    
    client.connect(FTP_CONFIG);
  });
}

// Función principal para procesar y actualizar una colección
async function processCollection(collectionName) {
  console.log(`\nProcesando colección: ${collectionName}...`);
  
  const snapshot = await db.collection(collectionName).get();
  if (snapshot.empty) {
    console.log(`Colección ${collectionName} está vacía.`);
    return [];
  }
  
  const updates = [];
  let processed = 0;
  
  for (const doc of snapshot.docs) {
    const data = doc.data();
    
    // Procesar diferentes tipos de documentos
    let imageUrls = [];
    
    if (collectionName === 'products') {
      if (data.image) imageUrls.push({ field: 'image', value: data.image });
      
      // Imágenes adicionales
      if (data.additionalImages && Array.isArray(data.additionalImages)) {
        data.additionalImages.forEach((url, index) => {
          if (url) imageUrls.push({ field: `additionalImages[${index}]`, value: url });
        });
      }
      
      // Imágenes de colores
      if (data.colors && Array.isArray(data.colors)) {
        data.colors.forEach((color, index) => {
          if (color.image) imageUrls.push({ field: `colors[${index}].image`, value: color.image });
        });
      }
    } else if (collectionName === 'categories') {
      if (data.image) imageUrls.push({ field: 'image', value: data.image });
    } else if (collectionName === 'testimonios') {
      if (data.imagenUrl) imageUrls.push({ field: 'imagenUrl', value: data.imagenUrl });
    }
    
    // Procesar cada imagen
    for (const imageInfo of imageUrls) {
      if (!imageInfo.value.includes('cloudinary.com')) continue;
      
      const originalFilename = getFilenameFromUrl(imageInfo.value);
      const filenameWithoutExt = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
      
      const tempFilePath = path.join(TEMP_FOLDER, originalFilename);
      const webpFilePath = path.join(WEBP_FOLDER, collectionName === 'testimonios' ? 'testimonials' : collectionName, `${filenameWithoutExt}.webp`);
      const webpRemotePath = `imagenes/webp/${collectionName === 'testimonios' ? 'testimonials' : collectionName}/${filenameWithoutExt}.webp`;
      
      console.log(`Procesando imagen: ${imageInfo.value}`);
      
      // 1. Descargar la imagen original
      const downloaded = await downloadImage(imageInfo.value, tempFilePath);
      if (!downloaded) continue;
      
      // 2. Convertir a WebP
      const converted = await convertToWebP(tempFilePath, webpFilePath);
      if (!converted) {
        fs.unlinkSync(tempFilePath); // Limpiar archivo temporal
        continue;
      }
      
      // 3. Subir por FTP (comentado por ahora - necesita configuración)
      try {
        // Descomentar esto cuando tengas la configuración FTP lista
        // await uploadFileToFtp(webpFilePath, webpRemotePath);
        console.log(`✓ Imagen convertida y lista para subir: ${webpFilePath}`);
      } catch (error) {
        console.error(`Error al subir ${webpFilePath}:`, error);
        continue;
      }
      
      // 4. Preparar actualización de URL en Firestore
      const newWebpUrl = `${NEW_BASE_URL}${collectionName === 'testimonios' ? 'testimonials' : collectionName}/${filenameWithoutExt}.webp`;
      
      updates.push({
        docId: doc.id,
        collection: collectionName,
        field: imageInfo.field,
        oldUrl: imageInfo.value,
        newUrl: newWebpUrl
      });
      
      processed++;
    }
    
    fs.unlinkSync(tempFilePath); // Limpiar archivo temporal
  }
  
  console.log(`✓ Procesadas ${processed} imágenes de la colección ${collectionName}`);
  return updates;
}

// Función para aplicar las actualizaciones a Firestore
async function applyUpdatesToFirestore(updates, dryRun = true) {
  console.log(`\nAplicando ${updates.length} actualizaciones a Firestore (Modo: ${dryRun ? 'Simulación' : 'Real'})...`);
  
  const results = {
    success: 0,
    errors: []
  };
  
  for (const update of updates) {
    try {
      console.log(`Actualizando: ${update.collection}/${update.docId} - Campo: ${update.field}`);
      console.log(`  De: ${update.oldUrl}`);
      console.log(`  A:  ${update.newUrl}`);
      
      if (!dryRun) {
        const docRef = db.collection(update.collection).doc(update.docId);
        const doc = await docRef.get();
        if (!doc.exists) {
          throw new Error('Documento no encontrado');
        }
        
        const data = doc.data();
        
        // Aplicar la actualización según el tipo de campo (puede ser anidado)
        if (update.field.includes('[')) {
          // Campo dentro de un array
          const fieldParts = update.field.match(/([^\[]+)\[(\d+)\](?:\.(.+))?/);
          if (fieldParts) {
            const [, arrayName, index, subField] = fieldParts;
            const idx = parseInt(index, 10);
            
            if (subField) {
              // Es un campo dentro de un objeto dentro de un array
              const subFields = subField.split('.');
              let current = data[arrayName][idx];
              for (let i = 0; i < subFields.length - 1; i++) {
                current = current[subFields[i]];
              }
              current[subFields[subFields.length - 1]] = update.newUrl;
            } else {
              // Es un elemento directo del array
              data[arrayName][idx] = update.newUrl;
            }
          }
        } else {
          // Campo normal
          data[update.field] = update.newUrl;
        }
        
        await docRef.update(data);
      }
      
      results.success++;
    } catch (error) {
      console.error(`Error actualizando ${update.collection}/${update.docId}:`, error);
      results.errors.push({
        update,
        error: error.message
      });
    }
  }
  
  return results;
}

// Función principal
async function main() {
  try {
    console.log('Iniciando proceso de conversión de imágenes a WebP y actualización de URLs...');
    
    // Procesar cada colección y recopilar todas las actualizaciones
    const productUpdates = await processCollection('products');
    const categoryUpdates = await processCollection('categories');
    const testimonioUpdates = await processCollection('testimonios');
    
    const allUpdates = [
      ...productUpdates,
      ...categoryUpdates,
      ...testimonioUpdates
    ];
    
    console.log(`\nResumen de conversiones:`);
    console.log(`- Productos: ${productUpdates.length} imágenes`);
    console.log(`- Categorías: ${categoryUpdates.length} imágenes`);
    console.log(`- Testimonios: ${testimonioUpdates.length} imágenes`);
    console.log(`- Total: ${allUpdates.length} imágenes`);
    
    // Modo de ejecución: simulación o real
    const DRY_RUN = true; // Cambiar a false para aplicar realmente las actualizaciones
    
    // Aplicar actualizaciones a Firestore
    if (allUpdates.length > 0) {
      const results = await applyUpdatesToFirestore(allUpdates, DRY_RUN);
      
      console.log(`\nResultados de la actualización:`);
      console.log(`- Exitosas: ${results.success}`);
      console.log(`- Errores: ${results.errors.length}`);
      
      if (DRY_RUN) {
        console.log('\n⚠️ MODO SIMULACIÓN: No se realizaron cambios reales en Firestore.');
        console.log('Para realizar los cambios, cambia DRY_RUN a false y ejecuta nuevamente.');
      }
    }
    
    console.log('\nProceso completado.');
    
    // Guardar información de las actualizaciones en un archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    fs.writeFileSync(
      `webp-conversion-${timestamp}.json`,
      JSON.stringify({
        updates: allUpdates,
        timestamp: new Date().toISOString()
      }, null, 2)
    );
    
    console.log(`Se ha guardado un registro de las actualizaciones en webp-conversion-${timestamp}.json`);
    
  } catch (error) {
    console.error('Error en el proceso principal:', error);
  } finally {
    process.exit(0);
  }
}

// Función auxiliar para crear carpetas si no existen
function createFolderIfNotExists(folder) {
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, { recursive: true });
  }
}

main();
