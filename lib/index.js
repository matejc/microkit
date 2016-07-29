'use strict';

const path = require('path');
const _ = require('lodash');
const Promise = require('bluebird');
const EventEmitter = require('events');

const Cache = require('./cache');

const errors = require('./errors');
const QueueFactory = require('./queue');
const ErrorReporterFactory = require('./error');
const StatsReporterFactory = require('./stats');
const LoggerFactory = require('./logger');
const ApiFactory = require('./api');
const Express = require('./express');
const Config = require('./config');

class MicroKit {
  constructor(options) {
    const configDir = path.join(process.env.NODE_CONFIG_DIR || process.cwd(), 'config');
    const env = process.env.NODE_ENV;
    const defaultOptions = {
      queue: {name: 'log'},
      stats: {name: 'log'},
      error: {name: 'log'},
      logger: {name: 'console', formatter: 'json'},
      api: {name: 'swagger'},
      config: {
        providers: [{
          name: 'file',
          file: path.join(configDir, 'default.json'),
          ignoreMissing: true
        }, {
          name: 'file',
          file: path.join(configDir, 'default.yaml'),
          ignoreMissing: true
        }, {
          name: 'file',
          file: path.join(configDir, 'default.js'),
          ignoreMissing: true
        }, {
          name: 'file',
          file: path.join(configDir, `${env}.json`),
          ignoreMissing: true
        }, {
          name: 'file',
          file: path.join(configDir, `${env}.yaml`),
          ignoreMissing: true
        }, {
          name: 'file',
          file: path.join(configDir, `${env}.js`),
          ignoreMissing: true
        }, {
          name: 'env',
          file: path.join(configDir, 'custom-environment-variables.json'),
          ignoreMissing: true
        }, {
          name: 'env',
          file: path.join(configDir, 'custom-environment-variables.yaml'),
          ignoreMissing: true
        }]
      },
      catchGlobal: true,
      catchSigint: true,
      restartOnException: false // automatic restart can cause errors
    };

    this.queueFactory = new QueueFactory();
    this.errorReporterFactory = new ErrorReporterFactory();
    this.statsReporterFactory = new StatsReporterFactory();
    this.loggerFactory = new LoggerFactory();
    this.apiFactory = new ApiFactory();

    this.cache = new Cache();
    this.runOnExit = [];
    this.runOnExitInternal = [];

    this.options = _.defaultsDeep(options || {}, defaultOptions);
    if (this.options.loadConfig) {
      this.options = _.defaultsDeep(this.config.microkit, this.options);
    }

    if (!this.options.name) {
      throw new Error('application name not specified');
    }

    if (this.options.catchGlobal) {
      process.once('uncaughtException', err => {
        this.logger.error('uncaughtException', err);

        return this.error.capture(err, {}, {wait: true}).finally(() => {
          if (this.options.restartOnException) {
            return this.exit().then(() => {
              process.exit(1);
            });
          }
        });
      });

      process.once('unhandledRejection', err => {
        this.logger.error('unhandledRejection', err);

        return this.error.capture(err, {}, {wait: true}).finally(() => {
          if (this.options.restartOnException) {
            return this.exit().then(() => {
              process.exit(1);
            });
          }
        });
      });
    }

    if (this.options.catchSigint) {
      process.on('SIGINT', () => {
        this.exit().then(() => process.exit());
      });
    }

    process.on('exit', sig => {
      this.logger.info('exit', {signal: sig});
    });

    this.systemLogger = this.loggerFactory.create('console');
  }

  get name() {
    return this.options.name;
  }

  exit() {
    return Promise.map(this.runOnExitInternal, handler => handler()).then(
      () => {
        return Promise.map(this.runOnExit, handler => handler());
      }
    );
  }

  _toDisposal(service) {
    this.onExit(() => service.dispose(), true);
    return service;
  }

  get queue() {
    return this.cache('queue', () => this._toDisposal(
      this.queueFactory.create(
        this.options.queue.name,
        _.omit(this.options.queue, 'name'),
        {
          events: new EventEmitter(),
          logger: this.logger.create('queue'),
          error: this.error
        }
      )
    ));
  }

  get logger() {
    return this.cache('logger', () => this._toDisposal(
      this.loggerFactory.create(
        this.options.logger.name,
        _.defaultsDeep(_.omit(this.options.logger, 'name'), {
          context: {service: this.options.name}
        }),
        {
          error: this.error,
          logger: this.systemLogger
        }
      )
    ));
  }

  get error() {
    const context = _.defaults(this.options.error.context, {
      name: this.options.name,
      logger: this.systemLogger
    });

    return this.cache('error', () => this.errorReporterFactory.create(
      this.options.error.name,
      _.omit(this.options.error, 'name'),
      context
    ));
  }

  get errors() {
    return errors;
  }

  get stats() {
    return this.cache('stats', () => this.statsReporterFactory.create(
      this.options.stats.name,
      _.omit(this.options.stats, 'name'),
      {logger: this.logger.create('stats')}
    ));
  }

  get api() {
    return this.cache('api', () => this.apiFactory.create(
      this.options.api.name,
      _.omit(this.options.api, 'name'),
      {logger: this.logger.create('api')}
    ));
  }

  get express() {
    return this.cache('express', () => this._toDisposal(
      new Express(this.options.express, {
        error: this.error,
        logger: this.logger.create('express')
      })
    ));
  }

  get config() {
    return this.cache('config', () => new Config(this.options.config));
  }

  onExit(handler, internal) {
    if (internal) {
      return this.runOnExitInternal.push(handler);
    }

    this.runOnExit.push(handler);
  }
}

module.exports = function (options) {
  // load microkit options from config
  if (options.optionsModule) {
    let extraOptions;
    const optionsModule = require(options.optionsModule);

    if (_.isFunction(optionsModule)) {
      extraOptions = optionsModule(options);
    } else {
      extraOptions = optionsModule;
    }

    _.defaultsDeep(options, extraOptions);
  }

  return new MicroKit(options);
};
