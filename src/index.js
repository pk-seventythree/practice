require('dotenv').config();
const express = require('express');
const http = require('http');
const { PORT } = require('./config');
const { setupProxy } = require('./proxyServer');
const { backends } = require('./loadBalancer');
const logger = require('./logger');

const app = express();
const server = http.createServer(app);

// REST статус-страница
app.get('/status', (_, res) => res.json({
    status: 'работает',
    port: PORT,
    time: new Date().toISOString(),
    backends: backends.map(b => ({ url: b.url, healthy: b.healthy, connections: b.connections })),
}));
app.get('/health', (_, res) => res.json({ ok: true }));

setupProxy(server);

server.listen(PORT, () => {
    logger.info('Прокси-сервер запущен на порте ' + PORT);
});
process.on('uncaughtException', err => {
    logger.error('Неперехваченная ошибка:', err.message);
    process.exit(1);
});