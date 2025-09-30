import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import validator from 'html-validator';

const DIST_DIR = path.resolve('dist');

async function collectHtmlFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectHtmlFiles(fullPath));
    } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

async function validateFile(file) {
  const html = await readFile(file, 'utf8');
  const result = await validator({ data: html, format: 'json' });
  const parsed = typeof result === 'string' ? JSON.parse(result) : result;
  const messages = parsed?.messages ?? [];
  const errors = messages.filter((msg) => msg.type === 'error');
  if (!errors.length) return [];
  return errors.map((err) => ({
    file,
    message: err.message || err.msg || 'Unknown validation error',
    extract: err.extract || '',
    lastLine: err.lastLine,
    firstLine: err.firstLine
  }));
}

(async () => {
  try {
    await stat(DIST_DIR);
  } catch {
    console.error('dist/ не найден. Сначала запустите "npm run build".');
    process.exit(1);
  }

  const htmlFiles = await collectHtmlFiles(DIST_DIR);
  if (!htmlFiles.length) {
    console.log('HTML-файлов в dist/ не найдено.');
    return;
  }

  let hasErrors = false;
  for (const file of htmlFiles) {
    const errors = await validateFile(file);
    if (!errors.length) continue;
    if (!hasErrors) {
      console.error('Обнаружены ошибки HTML-валидации:');
    }
    hasErrors = true;
    for (const err of errors) {
      const location = err.firstLine ? `:${err.firstLine}` : '';
      console.error(`\n${path.relative(process.cwd(), err.file)}${location}`);
      console.error(`  ${err.message}`);
      if (err.extract) {
        console.error(`  → ${err.extract.trim()}`);
      }
    }
  }

  if (hasErrors) {
    process.exit(1);
  } else {
    console.log(`HTML-валидация успешно пройдена (${htmlFiles.length} файл(ов)).`);
  }
})();
