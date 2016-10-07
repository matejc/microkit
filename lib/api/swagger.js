'use strict';

const _ = require('lodash');
const Swagger = require('swagger-client');

const Service = require('../service');
const Cache = require('../cache');

class SwaggerApi extends Service {
  constructor(options, context) {
    super(options, context);

    this.swagger = new Swagger({
      url: options.url,
      spec: options.spec,
      usePromise: true
    });
  }

  call(methodName, parameters) {
    const api = _.get(this.options, 'api', 'default');

    _.defaults(parameters, this.options.defaultParameters);

    return this.swagger.then((client)=>{
      if (!_.has(client, [api, methodName])) {
        throw new Error('Api method not found');
      }

      return client[api][methodName](parameters).then(result => {
        return {data: result.obj, info: result};
      });
    });
  }
}

module.exports = SwaggerApi;
