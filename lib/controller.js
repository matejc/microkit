'use strict';

const _ = require('lodash');

class Controller {
  constructor(service, options, context) {
    this.service = service;
    this.options = _.defaults(options, this.defaultOptions);
    this.context = context;
  }

  get defaultOptions() {
    return {};
  }

  dispose() {
    return this.service.dispose();
  }

  static wrapType(Controller, Service) {
    return function (options, context) {
      return new Controller(new Service(options, context), options, context);
    };
  }
}

module.exports = Controller;
