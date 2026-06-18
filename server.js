const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.json': 'application/json'
};

const server = http.createServer((req, res) => {
    // Prevent directory traversal attacks
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') safeUrl = '/index.html';

    const filePath = path.join(PUBLIC_DIR, safeUrl);

    // Check if path is within public dir
    if (!filePath.startsWith(PUBLIC_DIR)) {
        res.statusCode = 403;
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.end('Acesso proibido');
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Página não encontrada');
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.statusCode = 200;
        res.setHeader('Content-Type', contentType);

        // Read stream to be memory efficient
        const stream = fs.createReadStream(filePath);
        stream.on('error', (streamErr) => {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.end('Erro interno do servidor');
        });
        stream.pipe(res);
    });
});

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;
    console.log(`Servidor local rodando com sucesso!`);
    console.log(`Acesse: ${url}`);
    console.log(`Pressione Ctrl+C para encerrar o servidor.`);

    // Automatically open the website in the default browser based on OS
    const openCommand = process.platform === 'win32' ? `start ${url}` 
                      : process.platform === 'darwin' ? `open ${url}` 
                      : `xdg-open ${url}`;
    
    exec(openCommand, (err) => {
        if (err) {
            console.log(`Nota: Não foi possível abrir o navegador automaticamente, por favor abra manualmente: ${url}`);
        }
    });
});
