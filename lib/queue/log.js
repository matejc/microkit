'use strict';

const _ = require('lodash');

const Service = require('../service');

class LogQueue extends Service {
  publish(key, message) {
    this.context.logger.info('queue message', {key: key, data: message});
  }

  subscribe(selector) {
    this.context.logger.info('subscribing to queue', {selector: selector});
    return () => {};
  }
}

module.exports = LogQueue;
