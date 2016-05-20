'use strict';

/**
 * Logger interface
 * @interface
 */
class Logger {
  /**
   * Logs error
   */
  error() {}
  warn() {}
  info() {}
  debug() {}
}

module.exports = {
  Logger: Logger
};
