'use strict';

const Promise = require('bluebird');

class LogErrorReporter {
  constructor(options, context) {
    this.logger = context.logger.create('errors', options.context);
  }

  capture(err, context) {
    this.logger.error("captured error", context || {}, err);
    return Promise.resolve();
  }
}

module.exports = LogErrorReporter;
