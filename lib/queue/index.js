'use strict';

const _ = require('lodash');

const Amqp = require('./amqp');
const LogQueue = require('./log');

const Factory = require('../factory');

class QueueController {
  constructor(queue, options) {
    this.queue = queue;
    this.options = options;
  }

  publish() {
    let key, message, options;

    if (_.has(arguments[0], 'key') && _.has(arguments[0], 'message')) {
      key = arguments[0].key;
      message = arguments[0].message;
      options = arguments[0].options || arguments[1];
    } else {
      key = arguments[0];
      message = arguments[1];
      options = arguments[2];
    }

    if (!key) {
      throw new Error('Event key not provided');
    }

    if (_.isObject(key) && this.options.context) {
      _.extend(key, this.options.context);
    }

    return this.queue.publish(key, message, options);
  }

  subscribe(selector, handler, options) {
    return this.queue.subscribe(selector, handler, options);
  }
}

class QueueFactory extends Factory {
  create(name, options) {
    let queue;

    switch (name) {
      case 'amqp':
        queue = new Amqp(options, this.microkit);
        break;
      case 'log':
        queue = new LogQueue(options, this.microkit);
        break;
      default:
        throw new Error(`Queue class with ${name} not found`);
    }

    return new QueueController(queue, options);
  }
}

module.exports = QueueFactory;
