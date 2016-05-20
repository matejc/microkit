'use strict';

const Service = require('../service');
const formatters = require('./formatters');

class ConsoleLogger extends Service {
  constructor(options, context) {
    super(options, context);

    this.formatter = formatters.create(this.options.formatter);
  }

  get defaultOptions() {
    return {
      formatter: 'json',
      output: 'stdout'
    };
  }

  log(level, info, msg, context, error) {
    const message = this.formatter.format(level, info, msg, context, error);

    switch (this.options.output) {
      case 'stderr':
        console.error(message);
        break;
      case 'stdout':
        console.log(message);
        break;
      default:
        throw new Error(`Output ${this.options.output} does not exist`);
    }
  }
}

module.exports = ConsoleLogger;
