require('dotenv').config();
module.exports = {
    PORT: parseInt(process.env.PORT || '4000'),
    BACKENDS: (process.env.BACKENDS || 'ws://localhost:3000').split(',').map(s => s.trim()),
    LOG_PATH: process.env.LOG_PATH || './logs/proxy.log',
};