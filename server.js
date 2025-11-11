const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 8000;

const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

function sanitizeUrl(urlPath) {
  try {
    let safePath = decodeURIComponent(urlPath.split('?')[0]);
    safePath = safePath.replace(/\\/g, '/');
    if (safePath.includes('..')) return null;
    if (safePath === '/' || safePath === '') return 'index.html';
    return safePath.replace(/^\//, '');
  } catch {
    return null;
  }
}

const server = http.createServer((req, res) => {
  const urlPath = sanitizeUrl(req.url);
  if (!urlPath) {
    res.writeHead(400);
    return res.end('Bad Request');
  }

  const filePath = path.join(root, urlPath);
  fs.stat(filePath, (err, stat) => {
    if (err) {
      res.writeHead(404);
      return res.end('Not Found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    const readStream = fs.createReadStream(filePath);
    readStream.pipe(res);
  });
});

server.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}/`);
});