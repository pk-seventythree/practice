const WebSocket = require('ws');
const logger = require('./logger');
const { getNext } = require('./loadBalancer');

function setupProxy(server) {
    const wss = new WebSocket.Server({ server });

    // Keep-alive ping каждые 25 с
    setInterval(() => {
        wss.clients.forEach(ws => {
            if (!ws.isAlive) { ws.terminate(); return; }
            ws.isAlive = false; ws.ping();
        });
    }, 25000);

    wss.on('connection', (cWs, req) => {
        cWs.isAlive = true;
        cWs.on('pong', () => { cWs.isAlive = true; });
        const ip = req.socket.remoteAddress;

        let backend;
        try { backend = getNext(); }
        catch (e) {
            cWs.send(JSON.stringify({ type: 'ERROR', message: 'Service unavailable' }));
            cWs.close(); return;
        }

        backend.connections++;
        logger.info(Client ${ ip } -> ${ backend.url }(in total: ${ backend.connections }));
        const bWs = new WebSocket(backend.url);

        // Клиент -> Бэкенд
        cWs.on('message', data => {
            logger.info('C->B', data.toString().substring(0, 80));
            if (bWs.readyState === WebSocket.OPEN) bWs.send(data);
        });

        // Бэкенд -> Клиент
        bWs.on('message', data => {
            logger.info('B->C', data.toString().substring(0, 80));
            if (cWs.readyState === WebSocket.OPEN) cWs.send(data);
        });

        bWs.on('open', () => logger.info('Backend connected: ' + backend.url));

        bWs.on('close', () => {
            logger.warn('The backend closed the connection.');
            cWs.send(JSON.stringify({ type: 'ERROR', message: 'The backend went down.' }));
            cWs.close();
        });

        bWs.on('error', err => {
            logger.error('Backend error:', err.message);
            backend.healthy = false; cWs.close();
        });

        cWs.on('close', () => {
            backend.connections = Math.max(0, backend.connections - 1);
            logger.info(Client ${ ip } passed out);
            if (bWs.readyState <= 1) bWs.close();
        });
    });
}

module.exports = { setupProxy };