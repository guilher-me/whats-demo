const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const MIME = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.gif': 'image/gif' };

function localFile(root, name) {
  const resolved = path.resolve(root, name);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('O build só aceita arquivos dentro do projeto: ' + name);
  }
  return resolved;
}

function inlineAssets(source, root) {
  return source.replace(/(['"])(assets\/[^'"]+)\1/g, (_, quote, name) => {
    const filename = localFile(root, name);
    const mime = MIME[path.extname(filename).toLowerCase()];
    if (!mime) throw new Error('Tipo de imagem não suportado: ' + name);
    return JSON.stringify('data:' + mime + ';base64,' + fs.readFileSync(filename).toString('base64'));
  });
}

function build({ root = ROOT, output = path.join(root, 'dist', 'whatsapp-fake-flows.html') } = {}) {
  const sources = [];
  let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  html = html.replace(/<link\s+rel="stylesheet"\s+href="([^"]+)"\s*>/g, (_, name) => {
    let css = fs.readFileSync(localFile(root, name), 'utf8');
    if (/<\/style/i.test(css)) throw new Error('Conteúdo CSS inválido para HTML independente.');
    sources.push(name);
    return '<style>\n' + css + '\n</style>';
  });
  html = html.replace(/<script\s+src="([^"]+)"\s*><\/script>/g, (_, name) => {
    const js = inlineAssets(fs.readFileSync(localFile(root, name), 'utf8'), root);
    sources.push(name);
    // Prevent source strings from terminating the inline script element.
    return '<script>\n// Source: ' + name + '\n' + js.replace(/<\/script/gi, '<\\/script') + '\n</script>';
  });
  if (/<script\b[^>]*\bsrc\s*=/i.test(html) || /<link\b[^>]*\brel="stylesheet"/i.test(html)) {
    throw new Error('Ainda existem dependências de CSS/JS externas ao HTML.');
  }
  html = html.replace(/\r\n/g, '\n');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, html, 'utf8');
  return { output, bytes: Buffer.byteLength(html), sources };
}

function cli() {
  try {
    const result = build();
    console.log('HTML independente gerado: ' + result.output);
    console.log(Math.ceil(result.bytes / 1024) + ' KB · CSS, JavaScript e imagem incorporados · sem dependências externas');
  } catch (error) {
    console.error('Falha no build: ' + error.message);
    process.exitCode = 1;
  }
}

if (require.main === module) cli();

module.exports = { build, inlineAssets, localFile, cli };
