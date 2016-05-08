'use strict';

const _ = require('lodash');

class LogErrorReporter {
  constructor(options, context, microkit) {
    this.logger = microkit.logger.create('errors', context);
  }

  capture(err, context) {
    this.logger.error(_.extend(context, {err: err}));
  }
}

module.exports = LogErrorReporter;
