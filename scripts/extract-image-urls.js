const admin = require('firebase-admin');
const fs = require('fs');

// Inicializar Firebase Admin SDK
try {
  // Intentar cargar las credenciales desde un archivo
  const serviceAccount = require('../firebase-credentials.json');
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} catch (error) {
  console.error('Error al inicializar Firebase Admin SDK:', error.message);
  console.error('Asegúrate de tener un archivo firebase-credentials.json con las credenciales correctas.');
  process.exit(1);
}

// Colecciones a revisar
const collections = ['products', 'categories', 'testimonios'];

/**
 * Extrae URLs de imágenes de un documento
 * @param {Object} data - Datos del documento
 * @param {String} baseUrl - URL base para filtrar (opcional)
 * @returns {String[]} - Array de URLs encontradas
 */
function extractImageUrls(data, baseUrl = null) {
  const urls = [];

  // Función recursiva para buscar URLs en objetos anidados
  function findUrls(obj, parentKey = '') {
    if (!obj || typeof obj !== 'object') return;

    // Recorrer todas las propiedades del objeto
    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = parentKey ? `${parentKey}.${key}` : key;
      
      // Si es un string y contiene una URL de imagen
      if (typeof value === 'string' && 
          (value.includes('.jpg') || 
           value.includes('.jpeg') || 
           value.includes('.png') || 
           value.includes('.gif') || 
           value.includes('.webp') || 
           value.includes('cloudinary.com'))) {
        
        // Si se especificó un baseUrl, filtrar solo las que coincidan
        if (!baseUrl || value.includes(baseUrl)) {
          urls.push({
            url: value,
            field: fullKey
          });
        }
      }
      // Si es un array
      else if (Array.isArray(value)) {
        // Procesar cada elemento del array
        value.forEach((item, index) => {
          if (typeof item === 'string' && 
              (item.includes('.jpg') || 
               item.includes('.jpeg') || 
               item.includes('.png') || 
               item.includes('.gif') || 
               item.includes('.webp') || 
               item.includes('cloudinary.com'))) {
            
            if (!baseUrl || item.includes(baseUrl)) {
              urls.push({
                url: item,
                field: `${fullKey}[${index}]`
              });
            }
          } else if (typeof item === 'object' && item !== null) {
            findUrls(item, `${fullKey}[${index}]`);
          }
        });
      }
      // Si es un objeto, buscar recursivamente
      else if (typeof value === 'object' && value !== null) {
        findUrls(value, fullKey);
      }
    });
  }

  findUrls(data);
  return urls;
}

/**
 * Función principal que extrae todas las URLs de las colecciones especificadas
 */
async function extractAllImageUrls() {
  const db = admin.firestore();
  const allUrls = [];
  const outputFile = 'image_urls.txt';
  const outputFileDetails = 'image_urls_details.json';

  console.log('Iniciando extracción de URLs de imágenes...');

  try {
    for (const collectionName of collections) {
      console.log(`\nEscaneando colección: ${collectionName}`);
      
      const snapshot = await db.collection(collectionName).get();
      
      if (snapshot.empty) {
        console.log(`  No se encontraron documentos en ${collectionName}`);
        continue;
      }
      
      console.log(`  Encontrados ${snapshot.size} documentos`);
      let collectionUrlCount = 0;
      
      snapshot.forEach(doc => {
        const data = doc.data();
        const docUrls = extractImageUrls(data);
        
        if (docUrls.length > 0) {
          docUrls.forEach(item => {
            allUrls.push({
              url: item.url,
              collection: collectionName,
              documentId: doc.id,
              field: item.field
            });
          });
          
          collectionUrlCount += docUrls.length;
          console.log(`  - Documento ${doc.id}: ${docUrls.length} URLs encontradas`);
        }
      });
      
      console.log(`  Total en ${collectionName}: ${collectionUrlCount} URLs`);
    }

    // Guardar solo las URLs en un archivo de texto
    const urlsOnly = allUrls.map(item => item.url);
    fs.writeFileSync(outputFile, urlsOnly.join('\n'), 'utf8');
    
    // Guardar los detalles completos en un archivo JSON
    fs.writeFileSync(outputFileDetails, JSON.stringify(allUrls, null, 2), 'utf8');
    
    console.log(`\n✅ Se encontraron ${allUrls.length} URLs en total`);
    console.log(`✅ Las URLs se han guardado en ${outputFile}`);
    console.log(`✅ Los detalles se han guardado en ${outputFileDetails}`);

  } catch (error) {
    console.error('Error al extraer URLs:', error);
  } finally {
    process.exit(0);
  }
}

// Ejecutar la función principal
extractAllImageUrls();
