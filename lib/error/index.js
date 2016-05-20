'use strict';

const _ = require('lodash');
const Promise = require('bluebird');

const Factory = require('../factory');
const Controller = require('../controller');

const RavenErrorReporter = require('./raven');
const LogErrorReporter = require('./log');

class ErrorReporterController extends Controller {
  capture(error, context, options) {
    _.extend(context, this.options.context);
    return this.service.capture(error, context, options);
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
    return {
      raven: Controller.wrapType(ErrorReporterController, RavenErrorReporter),
      log: Controller.wrapType(ErrorReporterController, LogErrorReporter),
      multy: (options, context) => {
        const errorReporters = _.map(options, options => this.create(
          options.name, _.omit(options, 'name'), context
        ));
        return new MultyErrorReporterController(errorReporters, options);
      }
    };
  }
}

module.exports = ErrorReporterFactory;
