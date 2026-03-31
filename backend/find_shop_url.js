const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function testUrl() {
    const paths = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'];
    let chromePath = null;
    for (const p of paths) if (fs.existsSync(p)) { chromePath = p; break; }

    const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
    const page = await browser.newPage();
    
    const urls = ['https://repuesto.co/shop/', 'https://repuesto.co/tienda/', 'https://repuesto.co/productos/'];
    
    for (const url of urls) {
        console.log(`Probando ${url}...`);
        const response = await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => null);
        if (response && response.ok()) {
            console.log(`✅ URL Encontrada: ${url}`);
            const products = await page.evaluate(() => document.querySelectorAll('li.product, .product-inner').length);
            console.log(`📦 Productos detectados: ${products}`);
            if (products > 0) break;
        }
    }
    await browser.close();
}
testUrl();
