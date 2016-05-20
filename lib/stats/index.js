'use strict';

const StatsdStatsReporter = require('./statsd');
const LogStatsReporter = require('./log');
const Factory = require('../factory');

class StatsReporterFactory extends Factory {
  get types() {
    return {
      statsd: StatsdStatsReporter,
      log: LogStatsReporter
    };
  }
}

module.exports = StatsReporterFactory;
