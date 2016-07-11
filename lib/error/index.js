'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const Factory = require('../factory');
const Controller = require('../controller');

const RavenErrorReporter = require('./raven');
const LogErrorReporter = require('./log');

class ErrorReporterController extends Controller {
  capture(error, context, options) {
    options = options || {};

    _.extend(context, this.options.context);

    const reported = this.service.capture(error, context, options).catch(err => {
      this.context.logger.error('cannot report error', err);
      this.context.logger.error('logging error', error, context);
    });

    if (options.wait) {
      return reported;
    }

    return Promise.resolve();
  }
}

class MultyErrorReporterController extends ErrorReporterController {
  capture(error, context, options) {
    _.extend(context, this.options.context);
    return Promise.map(this.services, service => {
      return service.capture(error, context, options);
    });
  }
}

class ErrorReporterFactory extends Factory {
  get types() {
    const factory = this;

    return {
      raven: Controller.wrapType(ErrorReporterController, RavenErrorReporter),
      log: Controller.wrapType(ErrorReporterController, LogErrorReporter),
      multy: function (options, context) {
        const errorReporters = _.map(options, options => factory.create(
          options.name, _.omit(options, 'name'), context
        ));
        return new MultyErrorReporterController(errorReporters, options);
      }
    };
  }
}

module.exports = ErrorReporterFactory;
