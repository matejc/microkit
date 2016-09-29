'use strict';

const _ = require('lodash');

const Service = require('../service');
const QueueFactory = require('../queue');

const queueFactory = new QueueFactory();

class QueueMetricsProvider extends Service {
  constructor(options, context) {
    super(options, context);

    this.queue = queueFactory.create(this.options.queue.name, _.omit(this.options.queue, 'name'), {
      logger: context.logger,
      error: context.error
    });
  }

  get defaultOptions() {
    return {
      format: 'logstash_influxdb',
      key: 'metrics',
      queue: {
        name: 'log'
      }
    };
  }

  _formatLogstashInfluxdb(name, value, tags, options) {
    return _.extend({
      measurement: name,
      value: value,
      tags: _.keys(tags)
    }, tags);
  }

  send(name, value, tags, options) {
    let data;

    if (this.options.format === 'logstash_influxdb') {
      data = this._formatLogstashInfluxdb(name, value, tags, options);
    } else {
      return this.context.error.capture(new Error('Format not defined'));
    }

    return this.queue.publish(this.options.key, data);
  }
}

module.exports = QueueMetricsProvider;
