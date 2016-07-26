'use strict';

const JSONFormatter = require('./json');
const PrettyFormatter = require('./pretty');

class LogFormatterFactory {
  create(name, options) {
    switch (name) {
      case 'json':
        return new JSONFormatter(options);
      case 'pretty':
        return new PrettyFormatter(options);
      default:
        throw new Error(`Log formatter ${name} does not exist`);
    }
  }
}

module.exports = new LogFormatterFactory();
