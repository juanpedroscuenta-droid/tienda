const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const escapeSQL = (str) => {
    if (!str) return "NULL";
    return "'" + str.toString().replace(/'/g, "''").replace(/\n/g, "\\n") + "'";
};

const slugify = (text) => text?.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase() || 'general';

const domainName = process.argv[2] || 'default';
const mode = process.argv[3] || 'update';
const inputFile = domainName === 'default' ? 'scraped_data.json' : `scraped_data_${domainName}.json`;
const outputFile = domainName === 'default' ? 'products_mapped_final.sql' : `products_mapped_${domainName}.sql`;

// Diccionario de palabras clave para mapeo automático
const keywordMapping = {
    // ELÉCTRICOS
    'bujia': { cat: 'Eléctricos', sub: 'Bujias' },
    'bobina': { cat: 'Eléctricos', sub: 'Bobinas' },
    'sensor': { cat: 'Eléctricos', sub: 'Sensores' },
    'socket': { cat: 'Eléctricos', sub: 'Sensores' },
    'conector': { cat: 'Eléctricos', sub: 'Sensores' },
    'relay': { cat: 'Eléctricos', sub: 'Relay' },
    'rele': { cat: 'Eléctricos', sub: 'Relay' },
    'switch': { cat: 'Eléctricos', sub: 'Switch' },
    'alternador': { cat: 'Eléctricos', sub: 'Alternadoras' },
    'arranque': { cat: 'Eléctricos', sub: 'Motor arranque' },
    'fusible': { cat: 'Eléctricos', sub: 'Fusilera' },
    'cables alta': { cat: 'Eléctricos', sub: 'Cables alta' },
    
    // MOTOR
    'anillo': { cat: 'Motor', sub: 'Anillos motor' },
    'piston': { cat: 'Motor', sub: 'Pistones y bielas' },
    'biela': { cat: 'Motor', sub: 'Pistones y bielas' },
    'culata': { cat: 'Motor', sub: 'Culatas' },
    'inyector': { cat: 'Motor', sub: 'Inyectores' },
    'valvula': { cat: 'Motor', sub: 'Válvulas' },
    'correa': { cat: 'Motor', sub: 'Correas' },
    'distribucion': { cat: 'Motor', sub: 'Kit de distribución para carro' },
    'empaque': { cat: 'Motor', sub: 'Empaques' },
    
    // FRENADO
    'freno': { cat: 'Frenado', sub: 'Bomba freno' },
    'disco': { cat: 'Frenado', sub: 'Discos freno' },
    'pastas': { cat: 'Frenado', sub: 'Pastas freno' },
    'bandas': { cat: 'Frenado', sub: 'Bandas' },
    
    // ACCESORIOS
    'plumilla': { cat: 'Accesorios', sub: 'Plumillas' },
    'ambientador': { cat: 'Accesorios', sub: 'Ambientadores' },
    'pito': { cat: 'Accesorios', sub: 'Pito/bocina' },
    'emblema': { cat: 'Accesorios', sub: 'Emblema' },
};

async function mapCategories() {
    const dataPath = path.join(__dirname, '../', inputFile);
    console.log(`📂 Cargando respaldo de productos de ${dataPath}...`);
    if (!fs.existsSync(dataPath)) {
        console.error(`❌ Error: No se encontró el archivo ${dataPath}. ¡Asegúrate de ejecutar bulk-scrape.js primero!`);
        return;
    }
    const products = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    console.log("📂 Cargando categorías de la DB...");
    const { data: dbCategories } = await supabase.from('categories').select('*');
    
    // Indexar para búsqueda rápida por nombre
    const catMap = {};
    dbCategories.forEach(c => {
        catMap[c.name.toLowerCase().trim()] = c;
    });

    console.log("🧠 Iniciando asignación inteligente...");
    
    let sqlContent = "BEGIN;\n\n";
    const pendingCats = new Set();

    const sqlLines = products.map(p => {
        let catId = null;
        let subcatId = null;
        let catName = 'Accesorios';
        let subcatName = 'Accesorios varios';

        const nameLower = p.name.toLowerCase();
        
        // 1. Intentar mapeo por palabras clave (Prioridad Alta)
        let matched = false;
        for (const [kw, target] of Object.entries(keywordMapping)) {
            if (nameLower.includes(kw)) {
                const mainCat = catMap[target.cat.toLowerCase()];
                const subCat = catMap[target.sub.toLowerCase()];
                if (mainCat) {
                    catId = mainCat.id;
                    catName = mainCat.name;
                    matched = true;
                }
                if (subCat) {
                    subcatId = subCat.id;
                    subcatName = subCat.name;
                }
                break;
            }
        }

        // 2. Si no hubo match por palabra clave, usar la original del scraper
        if (!matched) {
            const originalCat = p.categories[0] || 'Accesorios';
            const dbMatch = catMap[originalCat.toLowerCase()];
            if (dbMatch) {
                catId = dbMatch.id;
                catName = dbMatch.name;
                // Si la categoría DB tiene un padre, invertimos para que sea coherente
                if (dbMatch.parent_id) {
                    subcatId = dbMatch.id;
                    subcatName = dbMatch.name;
                    catId = dbMatch.parent_id;
                    catName = dbMatch.parent_name || 'General';
                }
            } else {
                pendingCats.add(originalCat);
                catName = originalCat;
            }
        }

        let fixedPrice = p.price;
        if (fixedPrice > 0 && fixedPrice < 1000) {
            fixedPrice = Math.floor(fixedPrice) * 1000;
        } else {
            fixedPrice = Math.floor(fixedPrice);
        }

        const slug = slugify(p.name) + '-' + Math.floor(Math.random() * 1000);
        
        if (mode === 'insert') {
            return `(${escapeSQL(p.name)}, ${escapeSQL('')}, ${fixedPrice}, ${fixedPrice}, ${escapeSQL(p.image)}, true, 10, ${escapeSQL(slug)}, false, false, ${escapeSQL(catName)}, 
        ${catId ? escapeSQL(catId) : '(SELECT id FROM categories WHERE name = ' + escapeSQL(catName) + ' LIMIT 1)'}, ${escapeSQL(catName)})`;
        } else {
            return `UPDATE products SET price = ${fixedPrice}, original_price = ${fixedPrice}, category = ${escapeSQL(catName)}, category_id = ${catId ? escapeSQL(catId) : '(SELECT id FROM categories WHERE name = ' + escapeSQL(catName) + ' LIMIT 1)'}, category_name = ${escapeSQL(catName)} WHERE name = ${escapeSQL(p.name)};`;
        }
    });

    if (pendingCats.size > 0) {
        sqlContent += "-- NUEVAS CATEGORÍAS DETECTADAS\n";
        pendingCats.forEach(name => {
            sqlContent += `INSERT INTO categories (name, slug, is_active) VALUES (${escapeSQL(name)}, ${escapeSQL(slugify(name))}, true) ON CONFLICT (name) DO NOTHING;\n`;
        });
        sqlContent += "\n";
    }

    // Mezclar sqlLines aleatoriamente para que los productos no se agrupen por tienda o pagina de forma secuencial
    for (let i = sqlLines.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sqlLines[i], sqlLines[j]] = [sqlLines[j], sqlLines[i]];
    }

    if (mode === 'insert') {
        sqlContent += "INSERT INTO products (name, description, price, original_price, image, is_published, stock, slug, is_offer, featured, category, category_id, category_name, created_at, updated_at) \nVALUES \n";
        sqlContent += sqlLines.join(",\n") + ";\n\nCOMMIT;";
    } else {
        sqlContent += "-- ACTUALIZANDO PRODUCTOS EXISTENTES\n";
        sqlContent += sqlLines.join("\n") + "\n\nCOMMIT;";
    }

    const outPath = path.join(__dirname, '../', outputFile);
    fs.writeFileSync(outPath, sqlContent);
    console.log(`✅ ¡Mapeo completado! Archivo '${outputFile}' generado con ${products.length} productos en la carpeta backend.`);
}

mapCategories();
