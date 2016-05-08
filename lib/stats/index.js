'use strict';

const StatsdStatsReporter = require('./statsd');
const LogStatsReporter = require('./log');
const Factory = require('../factory');

class StatsReporterFactory extends Factory {
  create(name, options) {
    switch (name) {
      case 'statsd':
        return new StatsdStatsReporter(options);
      case 'log':
        return new LogStatsReporter(this.microkit);
      default:
        throw new Error(`Stats reporter with ${name} not found`);
    }
  }
}

module.exports = StatsReporterFactory;
