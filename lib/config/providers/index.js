'use strict';

const FileConfigProvider = require('./file');
const EnvConfigProvider = require('./env');
const ObjectConfigProvider = require('./object');

class ConfigProviderFactory {
  create(name, options) {
    switch (name) {
      case 'file':
        return new FileConfigProvider(options);
      case 'env':
        return new EnvConfigProvider(options);
      case 'object':
        return new ObjectConfigProvider(options);
      default:
        throw new Error(`Config provider ${name} does not exist`);
    }
  }
}

module.exports = ConfigProviderFactory;
