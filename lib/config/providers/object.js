'use strict';

class ObjectConfigProvider {
  constructor(options) {
    this.options = options.config;
  }

  load() {
    return this.options;
  }
}

module.exports = ObjectConfigProvider;
