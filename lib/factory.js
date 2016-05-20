'use strict';

const _ = require('lodash');

class Factory {
  get types() {
    return {};
  }

  create(name, options, context) {
    const constructor = _.get(this.types, name);

    if (!constructor) {
      throw new Error(`Factory can't find ${name}`);
    }

    return new constructor(options, context);
  }
}

module.exports = Factory;
