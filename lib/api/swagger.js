'use strict';

const _ = require('lodash');
const Swagger = require('swagger-client');

const Service = require('../service');
const Cache = require('../cache');

class SwaggerApi extends Service {
  constructor(options, context) {
    super(options, context);

    this.cache = new Cache();
  }

  getService(name) {
    const options = _.get(this.options, ['services', name]);
    return this.cache('client', () => new Swagger({
      url: options.url,
      spec: options.spec,
      usePromise: true
    }));
  }

  call(service, api, method, parameters) {
    return this.getService(service).then(client => {
      debugger
      return client[api][method](parameters);
    });
  }
}

module.exports = SwaggerApi;
