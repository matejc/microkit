'use strict';

const _ = require('lodash');

class LogQueue {
  constructor(options, microkit) {
    this.logger = microkit.logger.create('queue');
    this.context = options.context || {};
  }

  publish(key, message) {
    _.extend(key, this.context);
    this.logger.info('queue message', {key: key, data: message});
  }

  subscribe(selector) {
    this.logger.info('subscribing to queue', {selector: selector});
    return () => {};
  }
}

module.exports = LogQueue;
