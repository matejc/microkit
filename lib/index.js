'use strict';

const _ = require('lodash');

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
      catchGlobal: false
    });

    if (!this.options.name) {
      throw new Error('application name not specified');
    }

    this.queueFactory = new QueueFactory(this);
    this.errorReporterFactory = new ErrorReporterFactory(this);
    this.statsReporterFactory = new StatsReporterFactory(this);

    this.cache = new Cache();

    if (this.options.catchGlobal) {
      process.on('uncaughtException', err => {
        this.error.capture(err, {}, {wait: true}).finally(() => {
          this.logger.error(err);
          process.exit(1);
        });
      });

      process.on('unhandledRejection', (reason, promise) => {
        this.error.capture(reason, {}, {wait: true}).finally(() => {
          this.logger.error(reason);
          process.exit(1);
        });
      });
    }
  }

  get queue() {
    return this.cache('queue', () => this.queueFactory.create(
      this.options.queue.name,
      this.options.queue
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
      this.options.error,
      context
    ));
  }

  get stats() {
    return this.cache('stats', () => this.statsReporterFactory.create(
      this.options.stats.name,
      this.options.stats
    ));
  }
}

module.exports = MicroKit;
