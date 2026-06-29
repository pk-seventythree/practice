const WebSocket = require('ws');
const logger = require('./logger');
const { BACKENDS } = require('./config');

let idx = 0;
const backends = BACKENDS.map(url => ({ url, healthy: true, connections: 0 }));

// Получить следующий здоровый бэкенд (Round-Robin)
function getNext() {
    const ok = backends.filter(b => b.healthy);
    if (!ok.length) throw new Error('No available backends');
    const b = ok[idx % ok.length]; idx++;
    return b;
}

// Health-check каждые 15 секунд
setInterval(() => {
    backends.forEach(b => {
        const ws = new WebSocket(b.url);
        const t = setTimeout(() => { b.healthy = false; ws.terminate(); }, 3000);
        ws.on('open', () => { clearTimeout(t); b.healthy = true; ws.close(); });
        ws.on('error', () => {
            clearTimeout(t); b.healthy = false;
            logger.warn('Backend unavailable: ' + b.url);
        });
    });
}, 15000);

module.exports = { getNext, backends };