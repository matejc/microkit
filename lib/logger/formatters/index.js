'use strict';

const JSONFormatter = require('./json');

class LogFormatterFactory {
  create(name, options) {
    switch (name) {
      case 'json':
        return new JSONFormatter(options);
      default:
        throw new Error(`Log formatter ${name} does not exist`);
    }
  }
}

module.exports = new LogFormatterFactory();
