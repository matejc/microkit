'use strict';

const SwaggerApi = require('./swagger');

const Factory = require('../factory');
const Controller = require('../controller');

class ApiController extends Controller {
  call(service, api, method, parameters, options) {
    return this.service.call(service, api, method, parameters, options);
  }
}

class ApiFactory extends Factory {
  get types() {
    return {
      swagger: Controller.wrapType(ApiController, SwaggerApi)
    };
  }
}

module.exports = ApiFactory;
