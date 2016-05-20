'use strict';

class Controller {
  constructor(service, options) {
    this.service = service;
    this.options = options;
  }

  dispose() {
    return this.service.dispose();
  }

  static wrapType(Controller, Service) {
    return function (options, context) {
      return new Controller(new Service(options, context), options);
    };
  }
}

module.exports = Controller;
