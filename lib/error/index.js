'use strict';

const Factory = require('../factory');

const RavenErrorReporter = require('./raven');
const MultyErrorReporter = require('./multy');
const LogErrorReporter = require('./log');

class ErrorReporterFactory extends Factory {
  create(name, options, context) {
    switch (name) {
      case 'raven':
        return new RavenErrorReporter(options, context, this.microkit);
      case 'multy':
        return new MultyErrorReporter(options, context, this);
      case 'log':
        return new LogErrorReporter(options, context, this.microkit);
      default:
        throw new Error(`Queue class with ${name} not found`);
    }
  }
}

module.exports = ErrorReporterFactory;
