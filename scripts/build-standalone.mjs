// Собирает игру в ОДИН html-файл: скрипт, стили и шрифты вшиты внутрь.
// Такой файл открывается двойным кликом, без сервера и без npm.
//   npm run build:standalone  ->  dist-standalone/love-quest.html
import { build } from 'vite';
import { readFileSync, writeFileSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'dist-standalone');

await build({
  root,
  build: { outDir, emptyOutDir: true, assetsInlineLimit: 0 },
  logLevel: 'warn',
});

const assetsDir = join(outDir, 'assets');
const assets = readdirSync(assetsDir);
const jsFile = assets.find((f) => f.endsWith('.js'));
const cssFile = assets.find((f) => f.endsWith('.css'));

let css = readFileSync(join(assetsDir, cssFile), 'utf8');

// Шрифты превращаем в data-URI, иначе одиночный файл потеряет их.
css = css.replace(/url\(([^)]*?([\w-]+\.woff2))\)/g, (_, __, name) => {
  const base64 = readFileSync(join(root, 'public', 'fonts', name)).toString('base64');
  return `url(data:font/woff2;base64,${base64})`;
});

const js = readFileSync(join(assetsDir, jsFile), 'utf8').replace(/<\/script/gi, '<\\/script');

// Замены делаются функцией, а не строкой: иначе $$ и $& внутри бандла
// (например, React-овский $$typeof) будут разобраны как спецсимволы и код сломается.
const html = readFileSync(join(outDir, 'index.html'), 'utf8')
  .replace(new RegExp(`<link[^>]*href="[^"]*${cssFile}"[^>]*>`), () => `<style>${css}</style>`)
  .replace(
    new RegExp(`<script[^>]*src="[^"]*${jsFile}"[^>]*></script>`),
    () => `<script type="module">${js}</script>`,
  );

if (html.includes(jsFile) || html.includes(cssFile) || html.includes('<script src')) {
  throw new Error('Не удалось вшить ресурсы в html — проверь шаблон index.html');
}

const target = join(outDir, 'love-quest.html');
writeFileSync(target, html);

// убираем всё лишнее — остаётся ровно один файл
rmSync(assetsDir, { recursive: true, force: true });
rmSync(join(outDir, 'fonts'), { recursive: true, force: true });
rmSync(join(outDir, 'index.html'), { force: true });

console.log(`Готово: dist-standalone/love-quest.html (${(html.length / 1024).toFixed(0)} КБ)`);
