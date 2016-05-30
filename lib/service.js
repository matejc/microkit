'use strict';

const _ = require('lodash');

class Service {
  constructor(options, context) {
    this.options = _.defaults(options || {}, this.defaultOptions);
    this.context = context || {};
  }

  get defaultOptions() {
    return {};
  }

  dispose() {
    return Promise.resolve();
  }
}

module.exports = Service;
