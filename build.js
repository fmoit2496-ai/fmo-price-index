const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const distFile = path.join(__dirname, 'dist', 'index.html');

const LIGHT = `:root{
  --bg:#F4F8FC; --card:#FFFFFF; --ink:#0A2647; --muted:#556E8B; --line:#DCE8F4; --line-2:#EAF2FA; --soft:#E3F0FC;
  --primary:#1568B8; --link:#1568B8; --up:#C7392B; --up-soft:#FDE7E4; --down:#0A7F72; --down-soft:#E1F7F3;
  --grid:#E6EEF8; --series-main:#1568B8; --bar-prev:#BFD9F2; --field:#FFFFFF;
  --s1:#2a78d6; --s2:#eb6834; --s3:#1baf7a; --s4:#eda100;
  --tt-bg:#0A2647; --shadow-sm:0 1px 2px rgba(8,34,64,.05),0 10px 28px -14px rgba(8,34,64,.16);
}`;

const DARK = `    --bg:#07142A; --card:#0F2341; --ink:#E8F0FA; --muted:#9DB4CF; --line:#21406A; --line-2:#16335A; --soft:#14335C;
    --primary:#2F76C8; --link:#7DBBF5; --up:#FF9F93; --up-soft:rgba(239,91,75,.18); --down:#5FE0CF; --down-soft:rgba(15,185,167,.16);
    --grid:#1A3760; --series-main:#5AA9F0; --bar-prev:#33557F; --field:#0B1D38;
    --s1:#3987e5; --s2:#d95926; --s3:#199e70; --s4:#c98500;
    --tt-bg:#030B17; --shadow-sm:0 3px 12px -4px rgba(0,0,0,.5);`;

let css = fs.readFileSync(path.join(srcDir, 'style.css'), 'utf-8');
css = css.replaceAll('/*__LIGHT_TOKENS__*/', () => LIGHT).replaceAll('/*__DARK_TOKENS__*/', () => DARK);
css = css.replace(/\.panel\{display:block !important;\}/g, '');

const head = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="description" content="ดัชนีและราคากลางสินค้าสัตว์น้ำ องค์การสะพานปลา เลือกช่วงเวลา ดูราคาย้อนหลัง และเปรียบเทียบราคาได้">
<meta name="theme-color" content="#0A2647">
<title>ดัชนีราคากลางสินค้าสัตว์น้ำ | องค์การสะพานปลา</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&family=Prompt:wght@500;600;700&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
`;

const seedRaw = fs.readFileSync(path.join(srcDir, 'seed_data.json'), 'utf-8');
const seed = JSON.parse(seedRaw);
const seedJson = JSON.stringify(seed);

const logo = fs.readFileSync(path.join(srcDir, 'logo_b64.txt'), 'utf-8').trim();
const chartjs = fs.readFileSync(path.join(srcDir, 'chart.umd.js'), 'utf-8');
const i18n = fs.readFileSync(path.join(srcDir, 'i18n.js'), 'utf-8');
const app = fs.readFileSync(path.join(srcDir, 'app.js'), 'utf-8');
let body = fs.readFileSync(path.join(srcDir, 'body.html'), 'utf-8');

body = body
  .replace('__SEED_JSON__', () => seedJson)
  .replace('__LOGO_B64__', () => logo)
  .replace('__CHARTJS__', () => chartjs)
  .replace('__I18N_JS__', () => i18n)
  .replace('__APP_JS__', () => app);

const fullHtml = head + body;
fs.mkdirSync(path.dirname(distFile), { recursive: true });
fs.writeFileSync(distFile, fullHtml, 'utf-8');

console.log(`[BUILD SUCCESS] Output written to: ${distFile} (${Buffer.byteLength(fullHtml, 'utf-8')} bytes)`);
