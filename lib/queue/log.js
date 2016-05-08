'use strict';

class LogQueue {
  constructor(microkit) {
    this.logger = microkit.logger.create('queue');
  }

  publish(key, message) {
    this.logger.info('queue message', {key: key, data: message});
  }

  subscribe(selector) {
    this.logger.log('subscribing to queue', {selector: selector});
    return () => {};
  }
}

module.exports = LogQueue;
