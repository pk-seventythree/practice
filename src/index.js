require('dotenv').config();
const { PORT } = require('./config');
const logger = require('./logger');

logger.info('The proxy starts on the port ' + PORT);