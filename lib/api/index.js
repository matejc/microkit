'use strict';

const _ = require('lodash');

const Factory = require('../factory');
const Controller = require('../controller');

const SwaggerApi = require('./swagger');
const RedisApi = require('./redis');

/**
 * Controller for api services
 * @class
 */
class ApiController extends Controller {
  /**
   * Calls an api
   * @param {string} method method to call
   * @param {object} parame parameters to pass
   * @param {object} options additional options to pass
   */
  call(method, parameters) {
    return this.service.call(method, parameters);
  }

  dispose() {
    this.service.dispose();
  }

}

class MultyApiController extends Controller {
  call(serviceName, methodName, args) {
    const service = _.find(this.service, (v) => {
      return !!v[serviceName];
    });
    if (service[serviceName]) {
      return service[serviceName].service.call(methodName, args);
    } else {
      throw new Error('Service not found');
    }
  }
}

class ApiFactory extends Factory {
  get types() {
    const factory = this;
    return {
      swagger: Controller.wrapType(ApiController, SwaggerApi),
      redis: Controller.wrapType(ApiController, RedisApi),
      multy: function (options, context) {
        const apis = _.map(options.apis, (apiOptions, name) => {
          return {
            [name]: factory.create(
              _.get(apiOptions, 'name', name),
              _.omit(apiOptions, 'name'), context
            )
          };
        });
        return new MultyApiController(apis, options);
      }
    };
  }
}

module.exports = ApiFactory;

