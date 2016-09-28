'use strict';

const _ = require('lodash');

const Service = require('../service');

class LogMetricsProvider extends Service {
  send(name, value, tags, options) {
    let msg = name;

    if (options.increment) {
      value = `+${value}`;
    } else if (options.decrement) {
      value = `-${value}`;
    }

    if (options.unit) {
      value = `${value}${options.unit}`;
    }

    this.context.logger.info(name, _.extend({value: value}, tags));
  }
}

module.exports = LogMetricsProvider;
