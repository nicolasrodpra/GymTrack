import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const root = resolve('.');
const port = Number(process.env.PORT || 3000);
const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
};

createServer(async (request, response) => {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;
    const requestPath = pathname === '/' ? '/login/login.html' : pathname;
    const filePath = normalize(join(root, requestPath));
    if (!filePath.startsWith(root)) {
        response.writeHead(403);
        response.end('Access denied');
        return;
    }
    try {
        const file = await readFile(filePath);
        response.writeHead(200, { 'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream' });
        response.end(file);
    } catch {
        response.writeHead(404);
        response.end('Not found');
    }
}).listen(port, () => {
    console.log(`GymTrack disponible en http://127.0.0.1:${port}`);
});
