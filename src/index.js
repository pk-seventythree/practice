require('dotenv').config();
const { PORT } = require('./config');
const logger = require('./logger');
const { backends } = require('./loadBalancer'); // ← добавить
const { setupProxy } = require('./proxyServer');
const express = require('express');
const http = require('http');
const app = express();
const server = http.createServer(app);

// показываем состояние бэкендов
app.get('/status', (_, res) => res.json({
    status: 'работает',
    port: PORT,
    time: new Date().toISOString(),
    backends: backends.map(b => ({
        url: b.url,
        healthy: b.healthy,
        connections: b.connections
    })),
}));

app.get('/health', (_, res) => res.json({ ok: true }));

setupProxy(server);

server.listen(PORT, () => {
    logger.info('The proxy starts on the port ' + PORT);
});

process.on('uncaughtException', err => {
    logger.error('Неперехваченная ошибка:', err.message);
    process.exit(1);
});