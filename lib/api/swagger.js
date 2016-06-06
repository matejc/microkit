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
    return this.cache(name, () => new Swagger({
      url: options.url,
      spec: options.spec,
      usePromise: true
    }));
  }

  call(service, method, parameters) {
    const api = 'default';
    return this.getService(service).then(client => {
      if (!_.has(client, [api, method])) {
        throw new Error('Api method not found');
      }

      return client[api][method](parameters).then(result => {
        return {data: result.obj, info: result};
      });
    });
  }
}

module.exports = SwaggerApi;
