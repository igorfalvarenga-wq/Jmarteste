const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8000;
const HOST = 'localhost';

const server = http.createServer((req, res) => {
  // Parse da URL para remover query strings (ex: style.css?v=1) que quebram o carregamento
  const parsedUrl = new URL(req.url, 'http://localhost');
  let pathname = parsedUrl.pathname;

  // Decodifica caracteres especiais (ex: %20 para espaços)
  try {
    pathname = decodeURIComponent(pathname);
  } catch (err) {
    pathname = parsedUrl.pathname;
  }

  let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);
  
  // Evita acesso a pastas fora do diretório
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403);
    res.end('Acesso proibido');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404);
      res.end('Arquivo não encontrado');
      return;
    }

    // Define o tipo de conteúdo
    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'text/html';
    if (ext === '.js') contentType = 'application/javascript';
    if (ext === '.css') contentType = 'text/css';
    if (ext === '.json') contentType = 'application/json';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    if (ext === '.svg') contentType = 'image/svg+xml';
    if (ext === '.ico') contentType = 'image/x-icon';

    if (contentType.startsWith('text/') || contentType === 'application/javascript' || contentType === 'application/json') {
      contentType += '; charset=utf-8';
    }

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando em http://${HOST}:${PORT}`);
  console.log(`📝 Pressione Ctrl+C para parar o servidor`);
});
