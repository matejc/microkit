'use strict';

const os = require('os');
const util = require('util');
const _ = require('lodash');
const Promise = require('bluebird');

const Factory = require('../factory');

const Controller = require('../controller');
const ConsoleLogger = require('./console');
const LogstashLogger = require('./logstash');
const QueueLogger = require('./queue');

class LoggerController extends Controller {
  get defaultOptions() {
    return {
      level: 'info',
      context: {},
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
      time: new Date().getTime(),
      host: os.hostname()
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
    if (configNumberLevel >= logNumberLevel) {
      const info = _.extend(this._getInfo(), {
        level: level,
        numericLevel: logNumberLevel
      });

      this.service.log(
        info,
        parsedArgs.msg,
        _.extend(parsedArgs.context, this.options.context),
        parsedArgs.error
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
    _.forEach(this.service, logger => logger._log(level, args));
  }

  dispose() {
    return Promise.map(this.service, logger => logger.dispose);
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
      logstash: Controller.wrapType(LoggerController, LogstashLogger),
      queue: Controller.wrapType(LoggerController, QueueLogger),
      multy: function (options, context) {
        const loggers = _.map(options.loggers, (loggerOptions, name) => {
          return factory.create(
            _.get(loggerOptions, 'name', name),
            _.omit(loggerOptions, 'name'), context
          );
        });
        return new MultyLoggerController(loggers, options);
      }
    };
  }
}

module.exports = LoggerFactory;
