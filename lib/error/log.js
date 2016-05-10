'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

class LogErrorReporter {
  constructor(options, context, microkit) {
    this.logger = microkit.logger.create('errors', context);
  }

  capture(err, context) {
    this.logger.error(_.extend(context, {err: err}));
    return Promise.resolve();
  }
}

module.exports = LogErrorReporter;
