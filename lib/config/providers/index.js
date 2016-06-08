'use strict';

const FileConfigProvider = require('./file');
const EnvConfigProvider = require('./env');

class ConfigProviderFactory {
  create(name, options) {
    switch (name) {
      case 'file':
        return new FileConfigProvider(options);
      case 'env':
        return new EnvConfigProvider(options);
      default:
        throw new Error(`Config provider ${name} does not exist`);
    }
  }
}

module.exports = ConfigProviderFactory;
