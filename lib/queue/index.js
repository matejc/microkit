'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
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

    if (_.isObject(key) && this.options.mergeToBody) {
      _.extend(message, key);
    }

    _.extend(message, {
      _time: new Date().toISOString()

      // TODO: add message signatures
    });

    return this.service.publish(key, message, options).catch(err => {
      // if messages cannot be publish report errors
      this.context.error.capture(err);
      this.context.error.capture(new Error('cannot publish message'), {key: key, message: message});

      throw err;
    });
  }

  subscribe(selector, handler, options) {
    const _handler = event => {
      return Promise.try(() => {
        return handler.length === 2 ?
          handler(event.data, event) :
          handler(event);
      }).catch(err => {
        this.context.error.capture(err, {selector: selector});
        throw err;
      });
    };

    return this.service.subscribe(selector, _handler, options);
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
