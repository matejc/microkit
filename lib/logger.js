'use strict';

const bunyan = require('bunyan');
const _ = require('lodash');

class Logger {
  constructor(options, context) {
    if (options.logger) {
      this.logger = options.logger.child(context);
    } else {
      context = _.extend(context, {
        level: options.level,
        serializers: bunyan.stdSerializers
      });

      this.logger = bunyan.createLogger(context);
    }
  }

  create(component, context) {
    context = _.extend(_.omit(context, 'name'), {component: component});
    return new Logger({logger: this.logger}, context);
  }

  _reverseParams(params) {
    const textParams = [];
    const contextParams = [];

    _.forEach(params, param => {
      if (_.isObject(param) || _.isArray(param)) {
        return contextParams.push(param);
      }

      textParams.push(param);
    });

    return contextParams.concat(textParams);
  }

  debug() {
    this.logger.debug.apply(this.logger, this._reverseParams(arguments));
  }

  info() {
    this.logger.info.apply(this.logger, this._reverseParams(arguments));
  }

  warn() {
    this.logger.warn.apply(this.logger, this._reverseParams(arguments));
  }

  error() {
    this.logger.error.apply(this.logger, this._reverseParams(arguments));
  }

  fatal() {
    this.logger.fatal.apply(this.logger, this._reverseParams(arguments));
  }
}

module.exports = Logger;
