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

// Mapeo inteligente de palabras clave a categorias existentes
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
    console.log("📂 Cargando respaldo de productos...");
    const dataPath = path.join(__dirname, '../scraped_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error("❌ Error: No existe 'scraped_data.json'. Corre el scraper primero.");
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

        const slug = slugify(p.name) + '-' + Math.floor(Math.random() * 1000);
        
        return `(${escapeSQL(p.name)}, ${p.price}, ${p.price}, ${escapeSQL(p.image)}, true, 10, ${escapeSQL(slug)}, 
        ${catId ? escapeSQL(catId) : '(SELECT id FROM categories WHERE name = ' + escapeSQL(catName) + ' LIMIT 1)'}, ${escapeSQL(catName)},
        ${subcatId ? escapeSQL(subcatId) : (subcatName ? '(SELECT id FROM categories WHERE name = ' + escapeSQL(subcatName) + ' LIMIT 1)' : 'NULL')}, ${escapeSQL(subcatName)})`;
    });

    if (pendingCats.size > 0) {
        sqlContent += "-- NUEVAS CATEGORÍAS DETECTADAS\n";
        pendingCats.forEach(name => {
            sqlContent += `INSERT INTO categories (name, slug, is_active) VALUES (${escapeSQL(name)}, ${escapeSQL(slugify(name))}, true) ON CONFLICT (name) DO NOTHING;\n`;
        });
        sqlContent += "\n";
    }

    sqlContent += "INSERT INTO products (name, price, original_price, image, is_published, stock, slug, category_id, category_name, subcategory, subcategory_name) \nVALUES \n";
    sqlContent += sqlLines.join(",\n") + ";\n\nCOMMIT;";

    fs.writeFileSync('products_mapped_final.sql', sqlContent);
    console.log(`✅ ¡Mapeo completado! Archivo 'products_mapped_final.sql' generado con ${products.length} productos.`);
}

mapCategories();
