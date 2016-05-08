'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

class MultyErrorReporter {
  constructor(config, context, factory) {
    this.reporters = _.map(config, (config, name) => {
      return factory.create(name, config, context);
    });
  }

  capture(err) {
    return Promise.all(this.reporters, reporter => {
      reporter.capture(err);
    });
  }
}

module.exports = MultyErrorReporter;
