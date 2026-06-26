const fs = require('fs');
const path = require('path');
const { LOG_PATH } = require('./config');

fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });

function log(level, msg, extra = '') {
    const line = ` [${ new Date().toISOString() }][${ level }]${ msg } ${ extra }`;
    console.log(line);
    fs.appendFile(LOG_PATH, line + '\n', () => { });
}

module.exports = {
    info: (m, e = '') => log('INFO ', m, e),
    warn: (m, e = '') => log('WARN ', m, e),
    error: (m, e = '') => log('ERROR', m, e),
};