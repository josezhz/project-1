import http from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const port = Number(process.env.PORT || 8000);
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };

http.createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return;
    }
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    if (pathname.split('/').some(part => part.startsWith('.'))) throw new Error('Not found');
    let filename = path.resolve(root, `.${pathname}`);
    if (filename !== path.resolve(root) && !filename.startsWith(root)) throw new Error('Not found');
    if ((await stat(filename)).isDirectory()) filename = path.join(filename, 'index.html');
    filename = await realpath(filename);
    if (!filename.startsWith(root)) throw new Error('Not found');
    const contents = await readFile(filename);
    response.writeHead(200, { 'Content-Type': `${mime[path.extname(filename)] || 'application/octet-stream'}${/\.(html|js|css|json)$/.test(filename) ? '; charset=utf-8' : ''}`, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
    response.end(request.method === 'HEAD' ? undefined : contents);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain' }); response.end('Not found');
  }
}).listen(port, '127.0.0.1', () => console.log(`UNISEEK is ready at http://127.0.0.1:${port}`));
