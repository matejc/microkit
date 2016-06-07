'use strict';

const _ = require('lodash');
const EventEmitter = require('events');

const Amqp = require('./amqp');
const LogQueue = require('./log');

const Factory = require('../factory');
const Controller = require('../controller');

class QueueController extends Controller {
  publish() {
    let key;
    let message;
    let options;

    if (_.has(arguments[0], 'key') && _.has(arguments[0], 'message')) {
      key = arguments[0].key;
      message = arguments[0].message || {};
      options = arguments[0].options || arguments[1];
    } else {
      key = arguments[0];
      message = arguments[1] || {};
      options = arguments[2];
    }

    if (!key) {
      throw new Error('Event key not provided');
    }

    if (_.isObject(key) && this.options.context) {
      _.extend(key, this.options.context);
    }

    return this.service.publish(key, message, options);
  }

  subscribe(selector, handler, options) {
    return this.service.subscribe(selector, handler, options);
  }
}

class QueueFactory extends Factory {
  get types() {
    return {
      amqp: Controller.wrapType(QueueController, Amqp),
      log: Controller.wrapType(QueueController, LogQueue)
    };
  }
}

module.exports = QueueFactory;
