'use strict';

const _ = require('lodash');
const util = require('util');

const Factory = require('../factory');

const Controller = require('../controller');
const ConsoleLogger = require('./console');

class LoggerController extends Controller {
  get defaultOptions() {
    return {
      level: 'info',
      levels: {
        trace: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4
      }
    };
  }

  _levelToInteger(level) {
    return this.levels[level];
  }

  _getInfo() {
    return _.extend({
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
      time: new Date().getTime()
    }, this.options.defaultInfo);
  }

  _serializeError(error) {
    return _.has(error, 'toJSON') ? error.toJSON() : error;
  }

  _parseArgs(args) {
    args = Array.apply(null, args);
    if (_.isObject(args[0])) {
      return args[0];
    }

    const msgArgs = _.takeWhile(args, arg => !_.isObject(arg));
    const context = _.takeWhile(
      args.slice(msgArgs.length),
      arg => _.isObject(arg) && !_.isError(arg)
    );
    const error = this._serializeError(
      _.find(
        args.slice(msgArgs.length),
        arg => _.isError(arg)
      )
    );

    return {
      error: error,
      msg: util.format.apply(null, msgArgs),
      context: _.extend.apply(null, context)
    };
  }

  _log(level, args) {
    const parsedArgs = this._parseArgs(args);
    const logNumberLevel = this.options.levels[level];
    const configNumberLevel = this.options.levels[this.options.level];

    // log only if message log level is equal or bigger as config log level
    if (logNumberLevel >= configNumberLevel) {
      const info = _.extend(this._getInfo, {
        level: level,
        numericLevel: logNumberLevel
      });

      this.service.log(
        info,
        parsedArgs.msg, parsedArgs.context, parsedArgs.error
      );
    }
  }

  create(name, options) {
    options = _.extend(_.clone(this.options), options);
    return new this.constructor(this.service, options);
  }

  debug() {
    return this._log('debug', arguments);
  }

  info() {
    return this._log('info', arguments);
  }

  warn() {
    return this._log('warn', arguments);
  }

  error() {
    return this._log('error', arguments);
  }
}

class MultyLoggerController extends LoggerController {
  _log(level, args) {
    const parsedArgs = this._parseArgs(args);
    _.forEach(this.service, logger => {
      logger._log(
        level, this._getInfo(),
        parsedArgs.msg, parsedArgs.context, parsedArgs.error
      );
    });
  }
}

class LoggerFactory extends Factory {
  get controller() {
    return LoggerController;
  }

  get types() {
    const factory = this;

    return {
      console: Controller.wrapType(LoggerController, ConsoleLogger),
      multy: function (options, context) {
        const loggers = _.map(options.loggers, loggerOptions => {
          return factory.create(
            loggerOptions.name, _.omit(loggerOptions, 'name'), context
          );
        });
        return new MultyLoggerController(loggers, options);
      }
    };
  }
}

module.exports = LoggerFactory;
