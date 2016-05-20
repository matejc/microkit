'use strict';

const moment = require('moment');

class LogStatsReporter {
  constructor(options, context) {
    this.logger = context.logger.create('stats');

    this.counters = {};
    this.gauges = {};
    this.timers = {};
  }

  increment(key, amount) {
    amount = amount || 1;
    this.counters[key] = this.counters[key] ? this.counters[key] + amount : amount;
    this.logger.debug('incrementing counter', {key: key, value: this.counters[key]});
  }

  gauge(key, value) {
    this.gauges[key] = value;
    this.logger.debug('updating gauge', {key: key, value: value});
  }

  timing(key, time) {
    if (this.timers[key]) {
      const difference = moment(time).diff(this.timers[key]);
      this.logger.debug('timer difference', {key: key, difference: difference});
    }

    this.timers[key] = time;
    this.logger.debug('updating timer', {key: key, time: time});
  }
}

module.exports = LogStatsReporter;
