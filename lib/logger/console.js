'use strict';

const Service = require('../service');
const formatters = require('./formatters');

class ConsoleLogger extends Service {
  constructor(options, context) {
    super(options, context);

    this.formatter = formatters.create(options.formatter);
  }

  log(level, info, msg, context, error) {
    const message = this.formatter.format(level, info, msg, context, error);

    switch (this.options.output) {
      case 'stderr':
        console.error(message);
        break;
      case 'stdout':
      default:
        console.log(message);
    }
  }
}

module.exports = ConsoleLogger;
