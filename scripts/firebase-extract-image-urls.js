/**
 * Script para extraer URLs de imágenes de Firestore
 * 
 * Este script extrae todas las URLs de imágenes que contienen "/imagenes/" de Firestore
 * y las guarda en un archivo de texto para su posterior procesamiento.
 * 
 * Uso: node firebase-extract-image-urls.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configuración
const SEARCH_PATH = '/imagenes/';
const OUTPUT_FILE = path.join(__dirname, `imagen-urls-${Date.now()}.txt`);

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

// Estadísticas
const stats = {
  collectionsProcessed: 0,
  documentsProcessed: 0,
  imagesFound: 0,
  errors: []
};

// Set para almacenar URLs únicas
const imageUrls = new Set();

/**
 * Extrae URLs de imágenes de un objeto recursivamente
 * @param {Object} obj El objeto a procesar
 */
function extractImageUrls(obj) {
  // Si es un array, procesamos cada elemento
  if (Array.isArray(obj)) {
    for (const item of obj) {
      if (typeof item === 'string' && item.includes(SEARCH_PATH)) {
        imageUrls.add(item);
        stats.imagesFound++;
      } else if (typeof item === 'object' && item !== null) {
        extractImageUrls(item);
      }
    }
  } 
  // Si es un objeto, procesamos cada propiedad
  else if (typeof obj === 'object' && obj !== null) {
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].includes(SEARCH_PATH)) {
        imageUrls.add(obj[key]);
        stats.imagesFound++;
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        extractImageUrls(obj[key]);
      }
    }
  }
}

/**
 * Procesa una colección para extraer URLs de imágenes
 * @param {string} collectionPath Ruta de la colección
 * @param {number} depth Profundidad de recursión (para subcollecciones)
 */
async function processCollection(collectionPath, depth = 0) {
  try {
    console.log(`${' '.repeat(depth * 2)}Procesando colección: ${collectionPath}`);
    
    // Obtener todos los documentos de la colección
    const snapshot = await db.collection(collectionPath).get();
    
    if (snapshot.empty) {
      console.log(`${' '.repeat(depth * 2)}La colección ${collectionPath} está vacía.`);
      return;
    }
    
    stats.collectionsProcessed++;
    
    // Procesar cada documento
    for (const doc of snapshot.docs) {
      stats.documentsProcessed++;
      const docData = doc.data();
      
      // Mostrar progreso
      process.stdout.write(`\rProcesando documento ${stats.documentsProcessed} (URLs encontradas: ${stats.imagesFound})`);
      
      // Extraer URLs de imágenes
      extractImageUrls(docData);
      
      // Procesar subcollecciones si existen
      if (depth < 2) { // Limitar a 2 niveles de profundidad para evitar recursión excesiva
        const subCollections = await doc.ref.listCollections();
        
        for (const subCollection of subCollections) {
          const subPath = `${collectionPath}/${doc.id}/${subCollection.id}`;
          await processCollection(subPath, depth + 1);
        }
      }
    }
    
    console.log(`\n${' '.repeat(depth * 2)}Colección ${collectionPath} procesada.`);
  } catch (error) {
    console.error(`❌ Error al procesar colección ${collectionPath}:`, error);
    stats.errors.push({ collection: collectionPath, error: error.message });
  }
}

/**
 * Función principal
 */
async function main() {
  console.log('='.repeat(80));
  console.log('EXTRACCIÓN DE URLS DE IMÁGENES DE FIRESTORE');
  console.log('='.repeat(80));
  
  console.log(`Buscando URLs que contengan: ${SEARCH_PATH}`);
  console.log(`Las URLs encontradas se guardarán en: ${OUTPUT_FILE}`);
  
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
  
  // Procesar cada colección principal
  for (const collectionPath of mainCollections) {
    await processCollection(collectionPath);
  }
  
  // Guardar las URLs en un archivo
  const urlArray = Array.from(imageUrls);
  fs.writeFileSync(OUTPUT_FILE, urlArray.join('\n'));
  
  // Generar informe final
  console.log('\n' + '='.repeat(80));
  console.log('INFORME FINAL');
  console.log('='.repeat(80));
  console.log(`Colecciones procesadas: ${stats.collectionsProcessed}`);
  console.log(`Documentos procesados: ${stats.documentsProcessed}`);
  console.log(`URLs de imágenes únicas encontradas: ${imageUrls.size}`);
  console.log(`URLs de imágenes totales encontradas: ${stats.imagesFound}`);
  console.log(`Errores encontrados: ${stats.errors.length}`);
  
  // Mostrar errores si hay alguno
  if (stats.errors.length > 0) {
    console.log('\n' + '='.repeat(80));
    console.log('ERRORES ENCONTRADOS');
    console.log('='.repeat(80));
    
    stats.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.collection}: ${error.error}`);
    });
  }
  
  console.log('\n' + '='.repeat(80));
  console.log(`URLs guardadas en: ${OUTPUT_FILE}`);
}

// Ejecutar el script
main()
  .then(() => {
    console.log('\nScript completado.');
    process.exit(0);
  })
  .catch(error => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
