'use strict';

const _ = require('lodash');

class Formatter {
  constructor(options) {
    this.options = _.defaults(options, this.defaultOptions);
  }

  get defaultOptions() {
    return {};
  }
}

module.exports = Formatter;
