/**
 * Simple logger implementation
 */
const logger = {};

logger.debugLevel = 'info';
logger.log = (level, message) => {
  const levels = ['debug', 'info', 'warn', 'error'];
  if (levels.indexOf(level) >= levels.indexOf(logger.debugLevel)) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message);
    }
    console.log(`${level}: ${message}`);
  }
}

export default logger;