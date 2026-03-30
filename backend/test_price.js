const puppeteer = require('puppeteer-core');
const fs = require('fs');

const getChromePath = () => {
    const paths = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'];
    for (const p of paths) if (fs.existsSync(p)) return p;
    return null;
};

async function test() {
    const browser = await puppeteer.launch({ executablePath: getChromePath(), headless: 'new' });
    const page = await browser.newPage();
    await page.goto('https://www.totus.com.co/tienda/', { waitUntil: 'networkidle2' });
    const res = await page.evaluate(() => {
        const item = document.querySelector('.product');
        if(!item) return 'NOT FOUND';
        // Buscamos cualquier cosa que parezca una categoria
        const cat = item.querySelector('.category, .posted_in, [class*="category"], [class*="cat"]')?.innerText;
        return { cat, html: item.innerHTML.substring(0, 1000) };
    });
    console.log(JSON.stringify(res, null, 2));
    await browser.close();
}
test();
