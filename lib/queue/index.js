'use strict';

const Amqp = require('./amqp');
const LogQueue = require('./log');

const Factory = require('../factory');

class QueueFactory extends Factory {
  create(name, options) {
    switch (name) {
      case 'amqp':
        return new Amqp(options, this.microkit);
      case 'log':
        return new LogQueue(options, this.microkit);
      default:
        throw new Error(`Queue class with ${name} not found`);
    }
  }
}

module.exports = QueueFactory;
