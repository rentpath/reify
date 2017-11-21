/**
 * Simple logger implementation
 */
const logger = {}

logger.debugLevel = 'info'
logger.log = (level, message) => {
  const levels = ['debug', 'info', 'warn', 'error']

  if (levels.indexOf(level) >= levels.indexOf(logger.debugLevel)) {
    console.log(
      `${level}: ${typeof message !== 'string' ? JSON.stringify(message) : message}`
    )
  }
}

export default logger
