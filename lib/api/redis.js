'use strict';

const _ = require('lodash');
const Promise = require('bluebird');
const Redis = require('redis');
const JSONPath = require('jsonpath-plus');

const Service = require('../service');
const Cache = require('../cache');

Promise.promisifyAll(Redis.RedisClient.prototype);
Promise.promisifyAll(Redis.Multi.prototype);

class RedisApi extends Service {
  dispose() {
    this.redis.quit();
  }

  get redis() {
    if (this._redis) {
      return this._redis;
    }

    if (this.options.client) {
      this._redis = this.options.client;
    } else {
      this._redis = new Redis.createClient(this.options);
    }

    return this._redis;
  }

  call(methodName, parameters) {
    const client = this.redis;
    const method = _.find(this.options.methods, (v, k) => {
      return k === methodName;
    });
    if (!method) {
      throw new Error('Api method not found');
    }
    if (!client[`${method.method}Async`]) {
      throw new Error('Redis method not found');
    }

    const parsedParameters = _.map(method.args, (argTemplate) => {
      if (argTemplate[0] === '$') {
        return _.first(JSONPath({
          path: argTemplate,
          json: parameters
        }));
      } else {
        return _.template(argTemplate)(parameters);
      }
    });

    return client[`${method.method}Async`].apply(client, parsedParameters).then(result => {
      if (method.parse === 'json') {
        return {data: JSON.parse(result)};
      }
      return {data: result};
    });
  }
}

module.exports = RedisApi;
