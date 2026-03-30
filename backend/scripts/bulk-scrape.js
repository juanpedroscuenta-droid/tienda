const puppeteer = require('puppeteer-core');
const fs = require('fs');

const getChromePath = () => {
    const paths = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'];
    for (const p of paths) if (fs.existsSync(p)) return p;
    return null;
};

const escapeSQL = (str) => {
    if (!str) return "NULL";
    return "'" + str.toString().replace(/'/g, "''").replace(/\n/g, "\\n") + "'";
};

const slugify = (text) => text?.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-').toLowerCase() || 'general';

async function bulkScrape(baseUrl) {
    const chromePath = getChromePath();
    const browser = await puppeteer.launch({ 
        executablePath: chromePath, 
        headless: 'new', 
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const cleanBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
    let storeSlug = 'tienda/';
    if (baseUrl.includes('repuesto.co')) storeSlug = 'comprar/';
    else if (baseUrl.includes('autoplanet.com.co')) storeSlug = 'shop/';
    const shopUrl = `${cleanBase}${storeSlug}`;
    
    let domainName = 'default';
    try { domainName = new URL(baseUrl).hostname.replace('www.', ''); } catch (e) {}
    const jsonFile = `scraped_data_${domainName}.json`;
    const sqlFile = `products_import_${domainName}.sql`;
    
    const allProducts = [];
    const uniqueCategories = new Set();
    
    console.log(`🚀 REVERTIDO: Extracción total de ${shopUrl}`);

    try {
        for (let i = 1; i <= 200; i++) {
            const pagUrl = i === 1 ? shopUrl : `${shopUrl}page/${i}/`;
            console.log(`🔎 Escaneando página ${i}: ${pagUrl}...`);
            
            let response = null;
            for (let retries = 0; retries < 3; retries++) {
                response = await page.goto(pagUrl, { waitUntil: 'domcontentloaded', timeout: 90000 }).catch(e => {
                    console.log(`[Reintento ${retries+1}/3] Error navegando a ${pagUrl}: ${e.message}`);
                    return null;
                });
                if (response && response.ok()) break;
                if (response && response.status() === 404) break;
                await new Promise(r => setTimeout(r, 8000));
            }
            
            if (!response || !response.ok()) {
                console.log(`Aviso repetido de error en ${pagUrl} - status: ${response ? response.status() : 'TIMEOUT'}`);
                if (response && response.status() === 404) {
                    console.log("Detectado 404, fin del catálogo.");
                    break;
                }
                continue; // Saltamos la pág accidentada pero seguimos con la siguiente
            }
            await new Promise(r => setTimeout(r, 2000));

            await page.evaluate(async () => {
                window.scrollBy(0, 1500);
                await new Promise(r => setTimeout(r, 600));
            });

            const pageProducts = await page.evaluate(() => {
                const results = [];
                const items = document.querySelectorAll('li.product, [class*="product-type-"], .product-inner');
                items.forEach(item => {
                    const name = item.querySelector('h1, h2, h3, .title, .name, [class*="title"]')?.innerText?.trim();
                    const catElem = item.querySelector('.category, .posted_in, .product-categories, [class*="category"]');
                    const cats = catElem ? catElem.innerText.split(',').map(c => c.trim()) : ['Accesorios'];

                    const rawPrice = item.querySelector('.price, .amount')?.innerText || '0';
                    let cleanP = rawPrice.replace(/[^\d.,]/g, '');
                    if (/\d[.,]\d{3}$/.test(cleanP)) {
                        cleanP = cleanP.replace(/[.,]/, '');
                    } else {
                        cleanP = cleanP.replace(',', '.');
                    }
                    const price = parseFloat(cleanP) || 0;

                    const imgElem = item.querySelector('img[class*="wp-post-image"], img[class*="attachment-woocommerce_thumbnail"], img');
                    const img = imgElem?.getAttribute('data-src') || imgElem?.getAttribute('srcset')?.split(' ')[0] || imgElem?.src;
                    const link = item.querySelector('a')?.href;
                    if (name && link) {
                        results.push({ name, price, image: img, categories: cats, url: link });
                    }
                });
                return results;
            });

            if (pageProducts.length === 0) {
                console.log("Tomando screenshot para depurar...");
                await page.screenshot({ path: `debug_page_${i}.png`, fullPage: true });
                break;
            }
            allProducts.push(...pageProducts);
            pageProducts.forEach(p => p.categories.forEach(c => uniqueCategories.add(c)));
            
            console.log(`✅ Página ${i} terminada. Total: ${allProducts.length} productos.`);
            
            // Guardamos respaldo en cada página para que map-categories.js siempre tenga datos
            fs.writeFileSync(jsonFile, JSON.stringify(allProducts, null, 2));
        }

        console.log(`\n🎉 EXTRACCIÓN EXITOSA: ${allProducts.length} productos encontrados.`);

        let sqlContent = "BEGIN;\n";
        uniqueCategories.forEach(catName => {
            sqlContent += `INSERT INTO categories (name, slug, is_active) VALUES (${escapeSQL(catName)}, ${escapeSQL(slugify(catName))}, true) ON CONFLICT (name) DO NOTHING;\n`;
        });
        sqlContent += "\n";

        sqlContent += "INSERT INTO products (name, description, price, original_price, image, is_published, stock, slug, is_offer, featured, category, category_id, category_name) \nVALUES \n";

        const sqlLines = allProducts.map(p => {
            const catName = p.categories[0] || 'Accesorios';
            const prodSlug = slugify(p.name) + '-' + Math.floor(Math.random() * 10000);
            return `(${escapeSQL(p.name)}, ${escapeSQL('')}, ${p.price}, ${p.price}, ${escapeSQL(p.image)}, true, 10, ${escapeSQL(prodSlug)}, false, false, ${escapeSQL(catName)}, (SELECT id FROM categories WHERE name = ${escapeSQL(catName)} LIMIT 1), ${escapeSQL(catName)})`;
        });

        sqlContent += sqlLines.join(",\n") + ";\n";
        sqlContent += "COMMIT;";

        fs.writeFileSync(sqlFile, sqlContent);
        console.log(`💾 Archivo '${sqlFile}' regenerado.`);

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await browser.close();
    }
}

bulkScrape(process.argv[2] || 'https://www.totus.com.co/');
