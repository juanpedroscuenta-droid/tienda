const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function debugRepuesto() {
    const paths = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'];
    let chromePath = null;
    for (const p of paths) if (fs.existsSync(p)) { chromePath = p; break; }

    const browser = await puppeteer.launch({ executablePath: chromePath, headless: true });
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto('https://repuesto.co/tienda/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    
    const html = await page.evaluate(() => {
        const firstProd = document.querySelector('.product, .product-grid-item, div[class*="product"]');
        return firstProd ? firstProd.outerHTML : 'NO PRODUCT FOUND';
    });
    
    console.log(html);
    await browser.close();
}
debugRepuesto();
