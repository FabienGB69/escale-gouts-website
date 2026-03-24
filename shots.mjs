import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { mkdirSync } from 'fs';
const DEST = '/sessions/zen-intelligent-hopper/mnt/Projet Site Conciergerie "Escale et Gout"/screenshots';
mkdirSync(DEST, { recursive: true });
const pages = [
  { name: '01-homepage-v2', url: 'http://localhost:4321/' },
  { name: '07-logements-airbnb', url: 'http://localhost:4321/logements-geres/' },
  { name: '08-footer-v2', url: 'http://localhost:4321/a-propos/' },
];
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
for (const p of pages) {
  const page = await ctx.newPage();
  await page.goto(p.url, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${DEST}/${p.name}.png`, fullPage: true });
  console.log('✅', p.name);
  await page.close();
}
await browser.close();
