import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';

// Obtener __dirname equivalente en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de Firebase - usando la misma configuración que en tu archivo src/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyCI748T09o7MbzOHqbRvk8ay9Ai8v6k-SA",
  authDomain: "tienda-arg.firebaseapp.com",
  projectId: "tienda-arg",
  storageBucket: "tienda-arg.appspot.com",
  messagingSenderId: "607179205513",
  appId: "1:607179205513:web:3512cb3674301b42720f58",
  measurementId: "G-ZF7PYT3MTC"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

// Configuración de rutas
const OLD_PATH = '/imagenes/';
const NEW_PATH = '/imagenesconvertidas/';
const BASE_URL = 'https://regalaalgosrl.com';
const LOG_FILE = path.join(__dirname, `image-webp-update-log-${Date.now()}.txt`);

// Crear archivo de log
fs.writeFileSync(LOG_FILE, `=== Actualización a WebP ${new Date().toISOString()} ===\n`);

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
async function convertImageUrlToWebP(originalUrl) {
  // Si la URL no contiene el path antiguo, no hacemos nada
  if (!originalUrl || typeof originalUrl !== 'string' || !originalUrl.includes(OLD_PATH)) {
    return { newUrl: originalUrl, changed: false };
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

// Estadísticas
const stats = {
  collectionsProcessed: 0,
  documentsProcessed: 0,
  imagesUpdated: 0,
  imagesSkipped: 0,
  errors: [],
};

// Función para actualizar URLs en un documento
async function updateImageUrls(docData, docRef) {
  let updated = false;
  let updatedData = { ...docData };
  
  // Función recursiva para buscar URLs en todos los campos y sub-objetos
  async function processObject(obj) {
    let objectUpdated = false;
    
    for (const key in obj) {
      if (typeof obj[key] === 'string' && obj[key].includes('/imagenes/')) {
        // Intentar convertir la URL a formato WebP
        const { newUrl, changed } = await convertImageUrlToWebP(obj[key]);
        
        if (changed) {
          console.log(`Actualizando: ${obj[key]} -> ${newUrl}`);
          fs.appendFileSync(LOG_FILE, `Actualizando: ${obj[key]} -> ${newUrl}\n`);
          obj[key] = newUrl;
          stats.imagesUpdated++;
          objectUpdated = true;
          updated = true;
        } else {
          stats.imagesSkipped++;
          console.log(`Omitiendo: ${obj[key]} (WebP no disponible)`);
        }
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        const subObjectUpdated = await processObject(obj[key]);
        if (subObjectUpdated) objectUpdated = true;
      }
    }
    
    return objectUpdated;
  }
  
  await processObject(updatedData);
  
  if (updated) {
    try {
      await updateDoc(docRef, updatedData);
      console.log(`✅ Documento actualizado: ${docRef.id}`);
      fs.appendFileSync(LOG_FILE, `✅ Documento actualizado: ${docRef.id}\n`);
      return true;
    } catch (error) {
      stats.errors.push({
        docId: docRef.id,
        error: error.message
      });
      fs.appendFileSync(LOG_FILE, `Error al actualizar documento ${docRef.id}: ${error.message}\n`);
      return false;
    }
  }
  
  return false;
}

// Función para procesar una colección
async function processCollection(collectionName) {
  console.log(`Procesando colección: ${collectionName}`);
  
  try {
    const collectionRef = collection(db, collectionName);
    const snapshot = await getDocs(collectionRef);
    
    if (snapshot.empty) {
      console.log(`La colección ${collectionName} está vacía.`);
      return;
    }
    
    let updatedDocs = 0;
    stats.collectionsProcessed++;
    
    for (const docSnapshot of snapshot.docs) {
      stats.documentsProcessed++;
      const docData = docSnapshot.data();
      const docRef = doc(db, collectionName, docSnapshot.id);
      const wasUpdated = await updateImageUrls(docData, docRef);
      
      if (wasUpdated) {
        updatedDocs++;
        process.stdout.write(`\rDocumentos actualizados: ${updatedDocs}/${snapshot.size}`);
      }
    }
    
    console.log(`\nColección ${collectionName}: ${updatedDocs} documentos actualizados de ${snapshot.size}`);
    
    // Nota: en la versión de Firebase v9, no podemos listar subcollecciones fácilmente desde el cliente
    // Si necesitas procesar subcollecciones específicas, agrégalas manualmente a la lista de colecciones
    
  } catch (error) {
    console.error(`Error al procesar la colección ${collectionName}:`, error);
    stats.errors.push({
      collection: collectionName,
      error: error.message
    });
  }
}

// Función principal
async function main() {
  try {
    console.log('Iniciando actualización de URLs de imágenes en Firestore...');
    console.log(`Buscando URLs con ruta: ${OLD_PATH}`);
    console.log(`Cambiando a: ${NEW_PATH} (con formato WebP)`);
    
    // Lista de colecciones a procesar
    const collections = [
      'products',
      'categories',
      'orders',
      // Agrega aquí más colecciones si es necesario
    ];
    
    console.log(`Se procesarán ${collections.length} colecciones.`);
    
    // Procesar cada colección
    for (const collectionName of collections) {
      await processCollection(collectionName);
    }
    
    // Generar reporte
    console.log('\n===== REPORTE FINAL =====');
    console.log(`Colecciones procesadas: ${stats.collectionsProcessed}`);
    console.log(`Documentos procesados: ${stats.documentsProcessed}`);
    console.log(`URLs de imágenes actualizadas a WebP: ${stats.imagesUpdated}`);
    console.log(`URLs de imágenes omitidas (WebP no disponible): ${stats.imagesSkipped}`);
    console.log(`Errores encontrados: ${stats.errors.length}`);
    console.log(`Log completo guardado en: ${LOG_FILE}`);
    
    if (stats.errors.length > 0) {
      console.log('\n===== ERRORES =====');
      stats.errors.forEach((error, index) => {
        console.log(`${index + 1}. Doc: ${error.docId || error.collection}, Error: ${error.error}`);
      });
    }
    
    // Guardar reporte en un archivo
    const report = {
      date: new Date().toISOString(),
      oldPath: OLD_PATH,
      newPath: NEW_PATH,
      stats: stats
    };
    
    fs.writeFileSync(
      path.join(__dirname, `url-update-report-${Date.now()}.json`), 
      JSON.stringify(report, null, 2)
    );
    
    console.log('\nProceso completado. Se ha guardado un reporte detallado.');
    
  } catch (error) {
    console.error('Error en el proceso principal:', error);
  } finally {
    // Cerrar la conexión de Firebase
    process.exit(0);
  }
}

main();
