'use strict';

const _ = require('lodash');

const Factory = require('../factory');
const Controller = require('../controller');

const SwaggerApi = require('./swagger');

/**
 * Controller for api services
 * @class
 */
class ApiController extends Controller {
  /**
   * Calls an api
   * @param {string} service service name
   * @param {string} method method to call
   * @param {string} parame parameters to pass
   * @param {object} options additional options to pass
   */
  call(service, method, parameters, options) {
    const serviceOptions = _.get(this.options, ['services', service]);

    if (serviceOptions.defaultParameters) {
      _.defaults(parameters, serviceOptions.defaultParameters);
    }

    return this.service.call(service, method, parameters, options);
  }

  /**
   * Fetches resource
   */
  fetch(resource, options) {
    return this.call(
      resource.service, resource.method, resource.parameters, options
    ).then(result => result.data);
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
