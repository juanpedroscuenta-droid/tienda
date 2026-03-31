/**
 * Script para actualizar URLs de imágenes en Firestore
 * 
 * Este script actualiza las URLs de imágenes en Firestore, cambiando la ruta de /imagenes/ a /imagenes_convertidas/
 * y el formato de la imagen a WebP, pero solo si la imagen existe en el nuevo formato.
 * 
 * Uso: node firebase-update-image-urls.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

// Configuración
const OLD_PATH = '/imagenes/';
const NEW_PATH = '/imagenes_convertidas/';
const BASE_URL = 'https://regalaalgosrl.com';
const LOG_FILE = path.join(__dirname, `webp-update-log-${Date.now()}.txt`);
const DRY_RUN = false; // Cambiar a false para realizar las actualizaciones reales

// Verificar si hay un archivo de credenciales y cargarlo
let serviceAccount;
try {
  serviceAccount = require('./firebase-credentials.json');
  console.log('✅ Credenciales de Firebase cargadas correctamente');
} catch (error) {
  console.error('❌ Error al cargar las credenciales de Firebase:', error.message);
  console.log('Por favor, asegúrate de que existe el archivo firebase-credentials.json');
  process.exit(1);
}

// Inicializar Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Crear archivo de log
fs.writeFileSync(LOG_FILE, `=== Actualización de URLs a WebP ${new Date().toISOString()} ===\n`);
fs.appendFileSync(LOG_FILE, `Modo de prueba (sin cambios reales): ${DRY_RUN ? 'SÍ' : 'NO'}\n\n`);

// Estadísticas
const stats = {
  collectionsProcessed: 0,
  documentsProcessed: 0,
  imagesFound: 0,
  imagesUpdated: 0,
  imagesSkipped: 0,
  errors: []
};

/**
 * Verifica si una URL existe
 * @param {string} url La URL a verificar
 * @returns {Promise<boolean>} true si la URL existe, false en caso contrario
 */
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

/**
 * Convierte una URL de imagen a WebP si existe
 * @param {string} originalUrl La URL original de la imagen
 * @returns {Promise<{newUrl: string, changed: boolean}>} La nueva URL y si cambió
 */
async function convertImageUrlIfExists(originalUrl) {
  // Si la URL no contiene el path antiguo o no es un string, no hacemos nada
  if (!originalUrl || typeof originalUrl !== 'string' || !originalUrl.includes(OLD_PATH)) {
    return { newUrl: originalUrl, changed: false };
  }

  // Incrementar contador de imágenes encontradas
  stats.imagesFound++;

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
    
    if (exists) {
      return { newUrl, changed: true };
    } else {
      fs.appendFileSync(LOG_FILE, `La imagen WebP no existe: ${newUrl}\n`);
      return { newUrl: originalUrl, changed: false };
    }
  } catch (error) {
    console.error('Error al convertir URL:', error);
    fs.appendFileSync(LOG_FILE, `Error al convertir URL ${originalUrl}: ${error.message}\n`);
    return { newUrl: originalUrl, changed: false };
  }
}

/**
 * Procesa un objeto recursivamente para buscar y actualizar URLs de imágenes
 * @param {Object} obj El objeto a procesar
 * @returns {Promise<{obj: Object, updated: boolean}>} El objeto actualizado y si fue modificado
 */
async function processObjectRecursively(obj) {
  let updated = false;
  
  // Si es un array, procesamos cada elemento
  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      if (typeof obj[i] === 'string' && obj[i].includes(OLD_PATH)) {
        const { newUrl, changed } = await convertImageUrlIfExists(obj[i]);
        
        if (changed) {
          console.log(`Actualizando: ${obj[i]} -> ${newUrl}`);
          fs.appendFileSync(LOG_FILE, `Actualizando: ${obj[i]} -> ${newUrl}\n`);
          
          if (!DRY_RUN) {
            obj[i] = newUrl;
          }
          
          updated = true;
          stats.imagesUpdated++;
        } else {
          stats.imagesSkipped++;
        }
      } else if (typeof obj[i] === 'object' && obj[i] !== null) {
        const { obj: newObj, updated: childUpdated } = await processObjectRecursively(obj[i]);
        
        if (childUpdated) {
          if (!DRY_RUN) {
            obj[i] = newObj;
          }
          updated = true;
        }
      }
    }
  } 
  // Si es un objeto, procesamos cada propiedad
  else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].includes(OLD_PATH)) {
        const { newUrl, changed } = await convertImageUrlIfExists(obj[key]);
        
        if (changed) {
          console.log(`Actualizando: ${obj[key]} -> ${newUrl}`);
          fs.appendFileSync(LOG_FILE, `Actualizando: ${obj[key]} -> ${newUrl}\n`);
          
          if (!DRY_RUN) {
            obj[key] = newUrl;
          }
          
          updated = true;
          stats.imagesUpdated++;
        } else {
          stats.imagesSkipped++;
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const { obj: newObj, updated: childUpdated } = await processObjectRecursively(obj[key]);
        
        if (childUpdated) {
          if (!DRY_RUN) {
            obj[key] = newObj;
          }
          updated = true;
        }
      }
    }
  }
  
  return { obj, updated };
}

/**
 * Procesa un documento para actualizar URLs de imágenes
 * @param {Object} docData Los datos del documento
 * @param {FirebaseFirestore.DocumentReference} docRef Referencia al documento
 * @returns {Promise<boolean>} true si el documento fue actualizado, false en caso contrario
 */
async function processDocument(docData, docRef) {
  try {
    // Procesar objeto recursivamente
    const { obj: updatedData, updated } = await processObjectRecursively(docData);
    
    // Si se actualizó el documento y no estamos en modo de prueba, guardarlo
    if (updated && !DRY_RUN) {
      await docRef.update(updatedData);
      console.log(`✅ Documento actualizado: ${docRef.path}`);
      fs.appendFileSync(LOG_FILE, `✅ Documento actualizado: ${docRef.path}\n`);
    }
    
    return updated;
  } catch (error) {
    console.error(`❌ Error al procesar documento ${docRef.path}:`, error);
    fs.appendFileSync(LOG_FILE, `❌ Error al procesar documento ${docRef.path}: ${error.message}\n`);
    stats.errors.push({ docId: docRef.path, error: error.message });
    return false;
  }
}

/**
 * Procesa una colección para actualizar URLs de imágenes
 * @param {string} collectionPath Ruta de la colección
 * @param {number} depth Profundidad de recursión (para subcollecciones)
 * @returns {Promise<number>} Número de documentos actualizados
 */
async function processCollection(collectionPath, depth = 0) {
  try {
    console.log(`${' '.repeat(depth * 2)}Procesando colección: ${collectionPath}`);
    fs.appendFileSync(LOG_FILE, `Procesando colección: ${collectionPath}\n`);
    
    // Obtener todos los documentos de la colección
    const snapshot = await db.collection(collectionPath).get();
    
    if (snapshot.empty) {
      console.log(`${' '.repeat(depth * 2)}La colección ${collectionPath} está vacía.`);
      fs.appendFileSync(LOG_FILE, `La colección ${collectionPath} está vacía.\n`);
      return 0;
    }
    
    let updatedDocs = 0;
    stats.collectionsProcessed++;
    
    // Procesar cada documento
    for (const doc of snapshot.docs) {
      stats.documentsProcessed++;
      const docData = doc.data();
      
      // Mostrar progreso
      process.stdout.write(`\rProcesando documento ${stats.documentsProcessed}/${snapshot.size} en ${collectionPath}`);
      
      // Actualizar el documento
      const updated = await processDocument(docData, doc.ref);
      
      if (updated) {
        updatedDocs++;
      }
      
      // Procesar subcollecciones si existen
      if (depth < 2) { // Limitar a 2 niveles de profundidad para evitar recursión excesiva
        const subCollections = await doc.ref.listCollections();
        
        for (const subCollection of subCollections) {
          const subPath = `${collectionPath}/${doc.id}/${subCollection.id}`;
          const subUpdated = await processCollection(subPath, depth + 1);
          updatedDocs += subUpdated;
        }
      }
    }
    
    console.log(`\n${' '.repeat(depth * 2)}Colección ${collectionPath}: ${updatedDocs} documentos actualizados de ${snapshot.size}`);
    fs.appendFileSync(LOG_FILE, `Colección ${collectionPath}: ${updatedDocs} documentos actualizados de ${snapshot.size}\n`);
    
    return updatedDocs;
  } catch (error) {
    console.error(`❌ Error al procesar colección ${collectionPath}:`, error);
    fs.appendFileSync(LOG_FILE, `❌ Error al procesar colección ${collectionPath}: ${error.message}\n`);
    stats.errors.push({ collection: collectionPath, error: error.message });
    return 0;
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('='.repeat(80));
  console.log('ACTUALIZACIÓN DE URLS DE IMÁGENES EN FIRESTORE');
  console.log('='.repeat(80));
  
  if (DRY_RUN) {
    console.log('\n⚠️ MODO DE PRUEBA ACTIVADO - No se realizarán cambios reales ⚠️\n');
  } else {
    console.log('\n⚠️ MODO REAL - Se realizarán cambios en la base de datos ⚠️\n');
  }
  
  console.log(`Buscando URLs con ruta: ${OLD_PATH}`);
  console.log(`Cambiando a: ${NEW_PATH} (con formato WebP)`);
  console.log(`Log completo se guardará en: ${LOG_FILE}`);
  
  // Colecciones principales a procesar
  const mainCollections = [
    'products',
    'categories',
    'orders',
    'banners',
    'settings',
    'promos',
    'users'
  ];
  
  console.log(`\nSe procesarán ${mainCollections.length} colecciones principales.`);
  console.log('='.repeat(80));
  
  let totalUpdated = 0;
  
  // Procesar cada colección principal
  for (const collectionPath of mainCollections) {
    const updated = await processCollection(collectionPath);
    totalUpdated += updated;
  }
  
  // Generar informe final
  console.log('\n' + '='.repeat(80));
  console.log('INFORME FINAL');
  console.log('='.repeat(80));
  console.log(`Colecciones procesadas: ${stats.collectionsProcessed}`);
  console.log(`Documentos procesados: ${stats.documentsProcessed}`);
  console.log(`URLs de imágenes encontradas: ${stats.imagesFound}`);
  console.log(`URLs de imágenes actualizadas: ${stats.imagesUpdated}`);
  console.log(`URLs de imágenes omitidas (WebP no disponible): ${stats.imagesSkipped}`);
  console.log(`Errores encontrados: ${stats.errors.length}`);
  
  // Guardar estadísticas en el archivo de log
  fs.appendFileSync(LOG_FILE, '\n=== INFORME FINAL ===\n');
  fs.appendFileSync(LOG_FILE, `Colecciones procesadas: ${stats.collectionsProcessed}\n`);
  fs.appendFileSync(LOG_FILE, `Documentos procesados: ${stats.documentsProcessed}\n`);
  fs.appendFileSync(LOG_FILE, `URLs de imágenes encontradas: ${stats.imagesFound}\n`);
  fs.appendFileSync(LOG_FILE, `URLs de imágenes actualizadas: ${stats.imagesUpdated}\n`);
  fs.appendFileSync(LOG_FILE, `URLs de imágenes omitidas (WebP no disponible): ${stats.imagesSkipped}\n`);
  fs.appendFileSync(LOG_FILE, `Errores encontrados: ${stats.errors.length}\n`);
  
  // Mostrar errores si hay alguno
  if (stats.errors.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('ERRORES ENCONTRADOS');
    console.log('='.repeat(80));
    
    stats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.docId || error.collection}: ${error.error}`);
      fs.appendFileSync(LOG_FILE, `Error ${index + 1}: ${error.docId || error.collection}: ${error.error}\n`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`Log completo guardado en: ${LOG_FILE}`);
  
  if (DRY_RUN) {
    console.log('\n⚠️ ESTE FUE UN MODO DE PRUEBA - No se realizaron cambios reales ⚠️');
    console.log('Para realizar cambios reales, cambia DRY_RUN = false en el script.');
  }
  
  // Guardar reporte en un archivo JSON
  const reportFile = path.join(__dirname, `webp-update-report-${Date.now()}.json`);
  const report = {
    timestamp: new Date().toISOString(),
    config: {
      oldPath: OLD_PATH,
      newPath: NEW_PATH,
      baseUrl: BASE_URL,
      dryRun: DRY_RUN
    },
    stats: stats
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`Reporte JSON guardado en: ${reportFile}`);
}

// Ejecutar el script
main()
  .then(() => {
    console.log('\nScript completado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    fs.appendFileSync(LOG_FILE, `Error fatal: ${error.message}\n`);
    process.exit(1);
  });
