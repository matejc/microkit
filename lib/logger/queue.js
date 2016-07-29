'use strict';

const _ = require('lodash');

const Service = require('../service');
const QueueFactory = require('../queue');

const queueFactory = new QueueFactory();

class QueueLogger extends Service {
  constructor(options, context) {
    super(options, context);

    this.queue = queueFactory.create(this.options.queue.name, _.omit(this.options.queue, 'name'), {
      logger: context.logger,
      error: context.error
    });
  }

  get defaultOptions() {
    return {
      queue: {
        name: 'log',
        context: {type: 'log'}
      }
    };
  }

  log(info, msg, context, error) {
    const data = {};

    if (msg) {
      data.msg = msg;
    }

    if (error) {
      data.error = error.toString();
      data.stack = error.stack;
    }

    _.extend(data, info);
    _.extend(data, context);

    this.queue.publish(this.options.context, data);
  }
}

module.exports = QueueLogger;
