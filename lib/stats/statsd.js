'use strict';

const StatsdClient = require('statsd-client');

class StatsdStatsReporter {
  constructor(options) {
    this.client = new StatsdClient(options);
  }

  increment(key, amount) {
    return this.client.increment(key, amount);
  }

  gauge(key, value) {
    return this.client.gauge(key, value);
  }

  timing(key, time) {
    return this.client.timing(key, time);
  }
}

module.exports = StatsdStatsReporter;
