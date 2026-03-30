const puppeteer = require('puppeteer-core');
const fs = require('fs');

const getChromePath = () => {
    const paths = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe', process.env.CHROME_PATH];
    for (const p of paths) if (p && fs.existsSync(p)) return p;
    return null;
};

/**
 * Scraper Integral de Alto Rendimiento
 * Mueve la potencia de la terminal directamente al Panel
 */
async function scrapeProducts(url) {
    let browser;
    try {
        const chromePath = getChromePath();
        if (!chromePath) throw new Error('Chrome no encontrado.');

        let targetUrl = url.trim();
        if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;
        const urlObj = new URL(targetUrl);
        const isDomainOnly = urlObj.pathname === '/' || urlObj.pathname === '';

        browser = await puppeteer.launch({
            executablePath: chromePath,
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        
        const allProductsFound = [];

        // --- SISTEMA DE DESCUBRIMIENTO DE TIENDA ---
        let shopBaseUrl = targetUrl;
        if (isDomainOnly) {
            const bases = [`${urlObj.origin}/tienda/`, `${urlObj.origin}/productos/`, `${urlObj.origin}/shop/`];
            for (const b of bases) {
                console.log(`[SCAN] Probando: ${b}`);
                const r = await page.goto(b, { waitUntil: 'domcontentloaded', timeout: 10000 }).catch(() => null);
                if (r && r.ok()) {
                    const count = await page.evaluate(() => document.querySelectorAll('.product, [class*="product-item"]').length).catch(() => 0);
                    if (count > 2) {
                        shopBaseUrl = b;
                        break;
                    }
                }
            }
        }

        // --- ESCANEO MULTI-PAGINA (Como en la terminal) ---
        // Escaneamos las primeras 10 paginas en el panel para no bloquear el servidor demasiado tiempo
        // Si el usuario quiere mas, puede usar el script de la terminal
        console.log(`[SCAN] Iniciando escaneo masivo desde: ${shopBaseUrl}`);

        for (let i = 1; i <= 30; i++) { // Ahora traemos hasta 30 paginas en el panel
            const currentUrl = i === 1 ? shopBaseUrl : `${shopBaseUrl}page/${i}/`;
            console.log(`[SCAN] Pagina ${i}: ${currentUrl}`);
            
            const r = await page.goto(currentUrl, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => null);
            if (!r || !r.ok()) break;

            // Scroll para cargar imagenes
            await page.evaluate(async () => {
                window.scrollBy(0, 1000);
                await new Promise(res => setTimeout(res, 500));
                window.scrollBy(0, 2000);
            });

            const pageProducts = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('.product, .product-grid-item, [class*="product-item"]')).map(item => {
                    const name = item.querySelector('h1, h2, h3, .title, .name, [class*="title"]')?.innerText?.trim();
                    const priceText = item.querySelector('.price, .amount, [class*="price"]')?.innerText?.replace(/[^\d.,]/g, '');
                    const imgElem = item.querySelector('img[class*="wp-post-image"], img[class*="attachment-woocommerce_thumbnail"], img');
                    const img = imgElem?.getAttribute('data-src') || imgElem?.getAttribute('srcset')?.split(' ')[0] || imgElem?.src;
                    const link = item.querySelector('a')?.href;
                    if (name && link) {
                        return { 
                            name, 
                            price: priceText || 0, 
                            image: img && !img.includes('data:image') ? img : (imgElem?.src || null), 
                            url: link,
                            source: 'Panel-Bulk-Scan'
                        };
                    }
                    return null;
                }).filter(Boolean);
            });

            if (pageProducts.length === 0) break;
            allProductsFound.push(...pageProducts);
            
            // Si ya tenemos suficientes productos para mostrar algo "masivo"
            if (allProductsFound.length > 500) break; 
        }

        // --- EMERGENCIA: SITEMAP ---
        if (allProductsFound.length === 0) {
            console.log("[SCAN] ⚠️ Fallo visual. Usando Sitemap...");
            const sres = await fetch(`${urlObj.origin}/wp-sitemap-posts-product-1.xml`).catch(() => null);
            if (sres && sres.ok) {
                const xml = await sres.text();
                const locs = xml.match(/<loc>(.*?)<\/loc>/g) || [];
                return locs.map(l => ({
                    name: l.replace(/<\/?loc>/g, '').split('/').pop().replace(/-/g, ' '),
                    url: l.replace(/<\/?loc>/g, ''),
                    source: 'Sitemap-Panel'
                }));
            }
        }

        return allProductsFound;

    } catch (error) {
        console.error("[SCRAPER] Error:", error);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { scrapeProducts };
