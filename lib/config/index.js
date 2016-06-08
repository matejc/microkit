'use strict';

const _ = require('lodash');

const ConfigProviderFactory = require('./providers');

class ConfigService {
  constructor(options) {
    const configProviderFactory = new ConfigProviderFactory();

    const configs = _.map(options.providers, provider => {
      return configProviderFactory.create(
        provider.name,
        _.omit(provider, 'name')
      ).load();
    });

    _.forEach(_.reverse(configs), config => _.defaultsDeep(this, config));
  }

  get(name) {
    if (!_.has(this, name)) {
      throw new Error(`Config option ${name} not found`);
    }

    return _.get(this, name);
  }

  has(name) {
    return _.has(this, name);
  }
}

module.exports = ConfigService;
