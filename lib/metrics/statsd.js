'use strict';

const StatsdClient = require('statsd-client');

const Service = require('../service');

class StatsdMetricsProvider extends Service {
  constructor(options, context) {
    super(options, context);

    this.client = new StatsdClient(this.options.client);

    this.mappings = _.mapValues(
      this.options.mappings,
      mapping => _.template(mapping)
    );
  }

  get defaultOptions() {
    return {
      mappings: {}
    };
  }

  send(name, value, tags, options) {
    if (!_.has(this.mappings, name)) {
      return this.context.error.capture(new Error('Mapping not defined'));
    }

    const key = this.options.mappings[name](_.extend({name: name}, tags));

    if (options.unit == 'ms') {
      return this.client.timer(key, value);
    } else if (options.increment) {
      return this.client.increment(key, value);
    } else if (options.decrement) {
      return this.client.decrement(key, value);
    } else {
      return this.client.gauge(key, value);
    }
  }
}

module.exports = StatsdMetricsProvider;
