'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const Cache = require('./cache');
const Logger = require('./logger');

const QueueFactory = require('./queue');
const ErrorReporterFactory = require('./error');
const StatsReporterFactory = require('./stats');

class MicroKit {
  constructor(options) {
    this.options = _.defaultsDeep(options, {
      queue: {name: 'log'},
      stats: {name: 'log'},
      error: {name: 'log'},
      logLevel: 'debug',
      catchGlobal: true,
      catchSigint: true
    });

    if (!this.options.name) {
      throw new Error('application name not specified');
    }

    this.queueFactory = new QueueFactory(this);
    this.errorReporterFactory = new ErrorReporterFactory(this);
    this.statsReporterFactory = new StatsReporterFactory(this);

    this.cache = new Cache();
    this.runOnExit = [];
    this.runOnExitInternal = [];

    if (this.options.catchGlobal) {
      process.on('uncaughtException', err => {
        this.logger.error('uncaughtException', {err: err});

        return this.error.capture(err, {}, {wait: true}).finally(err => {
          return this.exit().then(() => process.exit(1));
        });
      });

      process.on('unhandledRejection', err => {
        this.logger.error('unhandledRejection', {err: err});

        return this.error.capture(err, {}, {wait: true}).finally(() => {
          return this.exit().then(() => process.exit(1));
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

  get queue() {
    return this.cache('queue', () => this.queueFactory.create(
      this.options.queue.name,
      _.omit(this.options.queue, 'name')
    ));
  }

  get logger() {
    return this.cache('logger', () => {
      return new Logger({
        level: this.options.logLevel
      }, {
        name: this.options.name
      });
    });
  }

  get error() {
    const context = _.defaults(this.options.error.context, {
      name: this.options.name
    });

    return this.cache('error', () => this.errorReporterFactory.create(
      this.options.error.name,
      _.omit(this.options.error, 'name'),
      context
    ));
  }

  get stats() {
    return this.cache('stats', () => this.statsReporterFactory.create(
      this.options.stats.name,
      _.omit(this.options.stats, 'name')
    ));
  }

  onExit(handler, internal) {
    if (internal) {
      return this.runOnExitInternal.push(handler);
    }

    this.runOnExit.push(handler);
  }
}

module.exports = MicroKit;
