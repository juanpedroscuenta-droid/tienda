const fs = require('fs');
const path = require('path');

const sqlPath = path.join(__dirname, 'products_import.sql');
const outputPath = path.join(__dirname, 'products_FINAL_ORDENADO.sql');

if (!fs.existsSync(sqlPath)) {
    console.error("No se encontró el archivo products_import.sql");
    process.exit(1);
}

const content = fs.readFileSync(sqlPath, 'utf8');

// Diccionario de asignación inteligente (Según la jerarquía del usuario)
const keywordMapping = {
    'bujia': { cat: 'Eléctricos', sub: 'Bujias' },
    'bobina': { cat: 'Eléctricos', sub: 'Bobinas' },
    'sensor': { cat: 'Eléctricos', sub: 'Sensores' },
    'socket': { cat: 'Eléctricos', sub: 'Sensores' }, // Socket suele ser conector de sensor/luces
    'conector': { cat: 'Eléctricos', sub: 'Sensores' },
    'relay': { cat: 'Eléctricos', sub: 'Relay' },
    'rele': { cat: 'Eléctricos', sub: 'Relay' },
    'switch': { cat: 'Eléctricos', sub: 'Switch' },
    'alternador': { cat: 'Eléctricos', sub: 'Alternadoras' },
    'arranque': { cat: 'Eléctricos', sub: 'Motor arranque' },
    'fusible': { cat: 'Eléctricos', sub: 'Fusilera' },
    'portafusible': { cat: 'Eléctricos', sub: 'Fusilera' },
    'bombillo': { cat: 'Eléctricos', sub: 'Iluminación', ter: 'Bombillos' },
    'stop': { cat: 'Eléctricos', sub: 'Iluminación', ter: 'Stop' },
    'farola': { cat: 'Eléctricos', sub: 'Iluminación', ter: 'Farolas' },
    'anillo': { cat: 'Motor', sub: 'Anillos motor' },
    'piston': { cat: 'Motor', sub: 'Pistones y bielas' },
    'biela': { cat: 'Motor', sub: 'Pistones y bielas' },
    'culata': { cat: 'Motor', sub: 'Culatas' },
    'inyector': { cat: 'Motor', sub: 'Inyectores' },
    'valvula': { cat: 'Motor', sub: 'Válvulas' },
    'correa': { cat: 'Motor', sub: 'Correas' },
    'clutch': { cat: 'Clutch', sub: 'Kit clutch' },
    'amortiguador': { cat: 'Dirección y suspensión', sub: 'Amortiguadores' },
    'freno': { cat: 'Frenado', sub: 'Bomba freno' },
    'disco': { cat: 'Frenado', sub: 'Discos freno' },
    'pastas': { cat: 'Frenado', sub: 'Pastas freno' },
    'plumilla': { cat: 'Accesorios', sub: 'Plumillas' },
    'pito': { cat: 'Accesorios', sub: 'Pito/bocina' },
};

console.log("🛠️ Procesando productos de products_import.sql...");

// Regex para extraer los valores de cada INSERT
// Ejemplo: ('Nombre', NULL, 9400, 9400, 'img_url', true, 10, 'slug', false, false, 'CAT_ORI', (SELECT...), 'CAT_ORI')
const insertRegex = /\(('[^']*'), (NULL|'[^']*'), (\d+\.?\d*), (\d+\.?\d*), ('[^']*'), (true|false), (\d+), ('[^']*'), (true|false), (true|false), ('[^']*'), (\([^)]*\)), ('[^']*')\)/g;

let match;
const products = [];

while ((match = insertRegex.exec(content)) !== null) {
    const [full, name, desc, price, origPrice, image, published, stock, slug, isOffer, featured, catOri, catIdSub, catNameOri] = match;
    products.push({ name, desc, price, origPrice, image, published, stock, slug, isOffer, featured, catOri });
}

console.log(`✅ ${products.length} productos detectados. Aplicando jerarquía...`);

let finalSql = "-- IMPORTACION FINAL ORDENADA POR ANTIGRAVITY\nBEGIN;\n\n";

const sqlLines = products.map(p => {
    const nameClean = p.name.replace(/'/g, '').toLowerCase();
    let cat = 'Accesorios';
    let sub = 'Accesorios varios';
    let ter = 'NULL';

    // Algoritmo de decisión inteligente
    let found = false;
    for (const [kw, target] of Object.entries(keywordMapping)) {
        if (nameClean.includes(kw)) {
            cat = target.cat;
            sub = target.sub;
            ter = target.ter ? `'${target.ter}'` : 'NULL';
            found = true;
            break;
        }
    }

    // Si no hay palabra clave, mantenemos la original de Totus pero saneada
    if (!found) {
        cat = p.catOri.replace(/'/g, '');
        sub = 'General';
    }

    return `(${p.name}, ${p.desc}, ${p.price}, ${p.origPrice}, ${p.image}, ${p.published}, ${p.stock}, ${p.slug}, ${p.isOffer}, ${p.featured}, '${cat}', (SELECT id FROM categories WHERE name = '${cat}' LIMIT 1), '${cat}', (SELECT id FROM categories WHERE name = '${sub}' LIMIT 1), '${sub}', ${ter})`;
});

// ASEGURAR QUE LAS CATEGORIAS PADRE EXISTAN
const coreCategories = ['Eléctricos', 'Motor', 'Dirección y suspensión', 'Refrigeración', 'Carrocería', 'Frenado', 'Accesorios', 'Clutch', 'Filtración', 'Aceites'];
const subCategories = ['Sensores', 'Switch', 'Alternadoras', 'Motor arranque', 'Fusilera', 'Iluminación', 'Anillos motor', 'Pistones y bielas', 'Inyectores', 'Válvulas', 'Correas', 'Bomba freno', 'Pastas freno', 'Discos freno', 'Plumillas', 'Pito/bocina'];

let categorySql = "-- CREACION DE CATEGORIAS BASE SI NO EXISTEN (FORMA ROBUSTA)\n";
coreCategories.forEach(c => {
    categorySql += `INSERT INTO categories (name, slug, is_active) SELECT '${c}', '${c.toLowerCase().replace(/ /g, '-')}', true WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '${c}');\n`;
});
subCategories.forEach(s => {
    categorySql += `INSERT INTO categories (name, slug, is_active) SELECT '${s}', '${s.toLowerCase().replace(/ /g, '-')}', true WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '${s}');\n`;
});

finalSql += categorySql + "\n";
finalSql += "INSERT INTO products (name, description, price, original_price, image, is_published, stock, slug, is_offer, featured, category, category_id, category_name, subcategory, subcategory_name, tercera_categoria_name) \nVALUES \n";
finalSql += sqlLines.join(",\n") + ";\n\nCOMMIT;";

fs.writeFileSync(outputPath, finalSql);
console.log(`🎉 ¡LISTO! El archivo definitivo es: products_FINAL_ORDENADO.sql`);
